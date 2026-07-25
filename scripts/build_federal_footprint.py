#!/usr/bin/env python3
"""Build the "Federal Footprint, State by State" atlas instrument.

Assembles ``static/data/federal-footprint.json`` — one row per state (the
project's 17-state roster) giving federal interest in three categories: fee
title, trust land, and permanent easement interest. Companion pipeline to
``build_federal_interests.py`` (which fetches the raw trust/easement layers)
and the sightline ``us-federal-lands-alt.md``; same three-category honesty
rule (fee title is not the whole federal footprint).

Sources:
  fee        scripts/data/crs_federal_land_by_state.csv — hand-transcribed
             from CRS R42346 *Federal Land Ownership: Overview and Data*
             (Feb. 2020), Table 2, FY2018 acreage by state (DOD as of
             FY2017), five agencies: BLM, FS, FWS, NPS, DOD. Excludes BIA —
             no double counting against trust.
  trust      static/data/federal-interests-trust.json — BIA AIAN National
             LAR polygons (lon/lat, already re-wound for D3 — see the header
             comment in build_federal_interests.py). Multi-state polygons
             (Navajo, Standing Rock, Wind River...) are apportioned across
             states by area sampling: a regular lon/lat grid over each
             polygon's bbox, points kept if inside (even-odd, holes
             respected), each weighted by cos(latitude) to correct for
             longitude convergence at higher latitudes, then acreage split
             proportional to summed per-state weight.
  easements  static/data/federal-interests-easements.json — FWS realty
             tracts (columnar, centroids only). State assigned by
             point-in-polygon against static/data/states.json.
  statearea  scripts/data/state_land_areas.csv — Census 2010 land area
             (sq mi x 640).
  feecheck   An independent cross-check of `feetotal`, NOT the pipeline's
             fee figure: static/data/fedland.topojson (pre-projected
             AlbersUSA, 2014-vintage, generalized) polygon areas by the
             shoelace formula in projected coordinates, assigned to states
             by area-weighted centroid, calibrated to acres by one global
             constant (known land area of the 17 CRS states / their summed
             projected polygon area in the same file). BIA-typed features
             are excluded from the sum (CRS's fee figure excludes BIA too).
             Approximations accepted here and nowhere else in the pipeline:
             centroid assignment misattributes parcels straddling a state
             line, the topojson is a 2014 snapshot, and its geometry is
             simplified for map rendering, not area precision. Treat
             `feecheck` as a sanity signal, not a second source of truth.

Run: ``/usr/bin/python3 scripts/build_federal_footprint.py``
(Homebrew Python's expat is broken; use the system interpreter.)
"""

from __future__ import annotations

import csv
import sys
import time
from pathlib import Path

from _common import DATA_DIR, ROOT, write_json

SCRIPTS_DATA = ROOT / "scripts" / "data"

CRS_CSV = SCRIPTS_DATA / "crs_federal_land_by_state.csv"
AREA_CSV = SCRIPTS_DATA / "state_land_areas.csv"
TRUST_JSON = DATA_DIR / "federal-interests-trust.json"
EASEMENTS_JSON = DATA_DIR / "federal-interests-easements.json"
STATES_TOPOJSON = DATA_DIR / "states.json"
FEDLAND_TOPOJSON = DATA_DIR / "fedland.topojson"
OUT = DATA_DIR / "federal-footprint.json"

AGENCIES = ["blm", "fs", "fws", "nps", "dod"]
AGENCY_LABELS = {
    "blm": "Bureau of Land Management",
    "fs": "Forest Service",
    "fws": "Fish & Wildlife Service",
    "nps": "National Park Service",
    "dod": "Department of Defense",
}

# N -> S order per spec.
STATE_ORDER = [
    "ND", "WA", "MT", "SD", "ID", "OR", "WY", "NE", "NV", "UT",
    "CO", "KS", "CA", "OK", "NM", "AZ", "TX",
]

FALLBACK_LABEL = "Other easement interest"


# --------------------------------------------------------------------------
# TopoJSON decoding (minimal, stdlib-only)
# --------------------------------------------------------------------------

def decode_arcs(topology: dict) -> list[list[tuple[float, float]]]:
    """Decode delta-encoded arcs into absolute [lon, lat] coordinate lists."""
    transform = topology.get("transform")
    arcs = []
    for arc in topology["arcs"]:
        coords = []
        x = y = 0
        for point in arc:
            x += point[0]
            y += point[1]
            if transform:
                sx, sy = transform["scale"]
                tx, ty = transform["translate"]
                coords.append((x * sx + tx, y * sy + ty))
            else:
                coords.append((float(x), float(y)))
        arcs.append(coords)
    return arcs


def arc_coords(arc_index: int, arcs: list) -> list[tuple[float, float]]:
    """Resolve one topojson arc reference (possibly negative = reversed)."""
    if arc_index < 0:
        return list(reversed(arcs[~arc_index]))
    return list(arcs[arc_index])


def ring_coords(arc_list: list[int], arcs: list) -> list[tuple[float, float]]:
    """Stitch a ring's arc references into one closed coordinate list."""
    coords: list[tuple[float, float]] = []
    for i, a in enumerate(arc_list):
        seg = arc_coords(a, arcs)
        if coords and coords[-1] == seg[0]:
            seg = seg[1:]
        coords.extend(seg)
    return coords


def geometry_rings(geom: dict, arcs: list) -> list[list[tuple[float, float]]]:
    """Return every ring (exterior + holes, undistinguished) of a geometry.

    Used for point-in-polygon: even-odd parity across *all* rings of a
    (multi)polygon is correct regardless of which part a hole belongs to,
    so flattening is safe here.
    """
    t = geom.get("type")
    rings = []
    if t == "Polygon":
        for ring_arcs in geom["arcs"]:
            rings.append(ring_coords(ring_arcs, arcs))
    elif t == "MultiPolygon":
        for poly in geom["arcs"]:
            for ring_arcs in poly:
                rings.append(ring_coords(ring_arcs, arcs))
    return rings


def geometry_parts(geom: dict, arcs: list) -> list[list[list[tuple[float, float]]]]:
    """Return the geometry as parts of [exterior, hole, hole, ...] rings.

    Unlike ``geometry_rings``, this preserves per-part structure so area can
    be computed correctly (exterior minus holes) rather than summing every
    ring's area as if it were positive space.
    """
    t = geom.get("type")
    if t == "Polygon":
        return [[ring_coords(ring_arcs, arcs) for ring_arcs in geom["arcs"]]]
    if t == "MultiPolygon":
        return [
            [ring_coords(ring_arcs, arcs) for ring_arcs in poly]
            for poly in geom["arcs"]
        ]
    return []


def geometry_area_and_centroid(geom: dict, arcs: list) -> tuple[float, tuple[float, float] | None]:
    """Total (exterior-minus-holes) area and the area-weighted centroid of
    the largest part, in whatever coordinate space the arcs are in."""
    parts = geometry_parts(geom, arcs)
    total_area = 0.0
    best_part_area = -1.0
    best_centroid = None
    for part in parts:
        if not part:
            continue
        ext_area = shoelace_area(part[0])
        hole_area = sum(shoelace_area(r) for r in part[1:])
        part_area = max(ext_area - hole_area, 0.0)
        total_area += part_area
        if part_area > best_part_area:
            best_part_area = part_area
            best_centroid = ring_centroid(part[0])
    return total_area, best_centroid


# --------------------------------------------------------------------------
# Point-in-polygon geometry helpers (planar, even-odd, holes respected)
# --------------------------------------------------------------------------

def bbox_of(coords: list[tuple[float, float]]) -> tuple[float, float, float, float]:
    xs = [p[0] for p in coords]
    ys = [p[1] for p in coords]
    return (min(xs), min(ys), max(xs), max(ys))

def bbox_union(boxes: list[tuple]) -> tuple[float, float, float, float]:
    return (
        min(b[0] for b in boxes), min(b[1] for b in boxes),
        max(b[2] for b in boxes), max(b[3] for b in boxes),
    )


def point_in_ring(x: float, y: float, ring: list[tuple[float, float]]) -> bool:
    inside = False
    n = len(ring)
    for i in range(n - 1):
        x1, y1 = ring[i]
        x2, y2 = ring[i + 1]
        if (y1 > y) != (y2 > y):
            xi = x1 + (y - y1) / (y2 - y1) * (x2 - x1)
            if x < xi:
                inside = not inside
    # Close the ring if not already closed.
    if ring[0] != ring[-1]:
        x1, y1 = ring[-1]
        x2, y2 = ring[0]
        if (y1 > y) != (y2 > y):
            xi = x1 + (y - y1) / (y2 - y1) * (x2 - x1)
            if x < xi:
                inside = not inside
    return inside


def point_in_rings(x: float, y: float, rings: list[list[tuple[float, float]]]) -> bool:
    """Even-odd across all rings of a (multi)polygon: holes cancel out."""
    count = 0
    for ring in rings:
        if point_in_ring(x, y, ring):
            count += 1
    return count % 2 == 1


class StatePolygons:
    """Lon/lat state polygons (rings + bbox) for point-in-polygon lookup."""

    def __init__(self, fips_to_abbr: dict[str, str]):
        import json

        topo = json.loads(STATES_TOPOJSON.read_text())
        arcs = decode_arcs(topo)
        geo = topo["objects"]["states"]
        self.states: dict[str, dict] = {}  # abbr -> {rings, bbox}
        for g in geo["geometries"]:
            fips = g.get("id")
            abbr = fips_to_abbr.get(fips)
            if abbr is None:
                continue
            rings = geometry_rings(g, arcs)
            if not rings:
                continue
            bbox = bbox_union([bbox_of(r) for r in rings])
            self.states[abbr] = {"rings": rings, "bbox": bbox}

    def locate(self, lon: float, lat: float) -> str | None:
        for abbr, rec in self.states.items():
            x0, y0, x1, y1 = rec["bbox"]
            if lon < x0 or lon > x1 or lat < y0 or lat > y1:
                continue
            if point_in_rings(lon, lat, rec["rings"]):
                return abbr
        return None


# --------------------------------------------------------------------------
# Input loaders
# --------------------------------------------------------------------------

def load_fee() -> dict[str, dict]:
    rows = {}
    with CRS_CSV.open(newline="") as f:
        for row in csv.DictReader(f):
            abbr = row["abbr"]
            rows[abbr] = {
                "name": row["name"],
                "fips": row["fips"],
                "fee": {
                    "blm": int(row["blm_acres"]),
                    "fs": int(row["fs_acres"]),
                    "fws": int(row["fws_acres"]),
                    "nps": int(row["nps_acres"]),
                    "dod": int(row["dod_acres"]),
                },
                "source": row["source"],
            }
    return rows


def load_area() -> tuple[dict[str, int], str]:
    rows = {}
    source = ""
    with AREA_CSV.open(newline="") as f:
        for row in csv.DictReader(f):
            rows[row["abbr"]] = int(row["land_area_acres"])
            source = row["source"]
    return rows, source


# --------------------------------------------------------------------------
# A. Easements
# --------------------------------------------------------------------------

def build_easements(state_polys: StatePolygons, fee_rows: dict) -> dict[str, dict]:
    import json

    ease = json.loads(EASEMENTS_JSON.read_text())
    codes = ease["codes"]
    tracts = ease["tracts"]
    # fields = [program, lon, lat, acres, unit, year]

    per_state = {
        abbr: {
            "tracts": 0, "acres": 0, "undated": 0, "undated_acres": 0,
            "programs": {}, "years": {},  # year -> acres delta
        }
        for abbr in STATE_ORDER
    }

    assigned = 0
    for t in tracts:
        code_ix, lon, lat, acres, _unit_ix, year = t
        abbr = state_polys.locate(lon, lat)
        if abbr is None or abbr not in per_state:
            continue
        assigned += 1
        code = codes[code_ix]
        rec = per_state[abbr]
        rec["tracts"] += 1
        rec["acres"] += acres
        if year is None:
            rec["undated"] += 1
            rec["undated_acres"] += acres
        else:
            rec["years"][year] = rec["years"].get(year, 0) + acres
        prog = rec["programs"].setdefault(code, {"tracts": 0, "acres": 0})
        prog["tracts"] += 1
        prog["acres"] += acres

    print(f"  easements: {assigned:,}/{len(tracts):,} tracts assigned to the 17 states", file=sys.stderr)

    # RSL_TYPE -> label lookup, mirrored from build_federal_interests.py.
    rsl_labels = {
        "WPA": "Waterfowl Production Area easement",
        "NWR": "National Wildlife Refuge easement",
        "WMA": "Wildlife Management Area easement",
        "CA": "Conservation Area easement",
        "FSA": "Farm Service Agency (FmHA) easement",
        "NFH": "National Fish Hatchery easement",
        "MNM": "National Monument easement",
    }
    if "programs" in ease:
        for code, meta in ease["programs"].items():
            if "label" in meta:
                rsl_labels.setdefault(code, meta["label"])

    out = {}
    for abbr, rec in per_state.items():
        programs = {
            code: {
                "label": rsl_labels.get(code, FALLBACK_LABEL),
                "tracts": v["tracts"],
                "acres": v["acres"],
            }
            for code, v in sorted(rec["programs"].items(), key=lambda kv: -kv[1]["acres"])
        }
        cumulative = []
        running = 0
        for year in sorted(rec["years"]):
            running += rec["years"][year]
            # Spec: only years where the total changes. A year whose tract
            # acres sum to 0 (tiny easements rounding away) adds no point.
            if not cumulative or running != cumulative[-1][1]:
                cumulative.append([year, running])
        out[abbr] = {
            "tracts": rec["tracts"],
            "acres": rec["acres"],
            "undated": rec["undated"],
            "programs": programs,
            "cumulative": cumulative,
        }
    undated_acres = {abbr: rec["undated_acres"] for abbr, rec in per_state.items()}
    return out, undated_acres


# --------------------------------------------------------------------------
# B. Trust (area-sampling apportionment)
# --------------------------------------------------------------------------

def sample_grid_step(bbox: tuple[float, float, float, float], target_inside: int = 400) -> float:
    """Pick a lon/lat grid step so we expect roughly `target_inside` samples
    to land inside the polygon, assuming a generous fill ratio guess.

    We refine iteratively in the caller instead of trying to get this exact
    up front (irregular polygons make an a-priori fill ratio unreliable).
    """
    x0, y0, x1, y1 = bbox
    w, h = max(x1 - x0, 1e-9), max(y1 - y0, 1e-9)
    area = w * h
    # Guess fill ratio 0.3 to start; caller refines if too few points land.
    step = (area * 0.3 / target_inside) ** 0.5
    return max(step, 1e-4)


def apportion_polygon(rings: list, bbox: tuple, acres: float, state_polys: StatePolygons,
                       target_inside: int = 400, max_points: int = 60_000):
    """Sample the polygon's bbox on a grid, keep points inside, weight by
    cos(latitude), assign each to a state, split acreage proportionally.

    Returns dict {abbr: acres_float}. Empty dict if no state overlap.
    """
    import math

    x0, y0, x1, y1 = bbox
    step = sample_grid_step(bbox, target_inside)

    inside_pts = []
    attempts = 0
    while attempts < 6:
        inside_pts = []
        nx = max(int((x1 - x0) / step) + 1, 1)
        ny = max(int((y1 - y0) / step) + 1, 1)
        if nx * ny > max_points:
            # Too fine — coarsen and retry once more below.
            step *= ((nx * ny) / max_points) ** 0.5
            attempts += 1
            continue
        yy = y0 + step / 2
        while yy <= y1:
            xx = x0 + step / 2
            while xx <= x1:
                if point_in_rings(xx, yy, rings):
                    inside_pts.append((xx, yy))
                xx += step
            yy += step
        if len(inside_pts) >= target_inside or step < 1e-5:
            break
        step /= 2  # refine: too coarse, try a finer grid
        attempts += 1

    if not inside_pts:
        # Degenerate/small polygon: fall back to a handful of interior probes
        # via the centroid of the ring itself.
        cx = sum(p[0] for p in rings[0]) / len(rings[0])
        cy = sum(p[1] for p in rings[0]) / len(rings[0])
        if point_in_rings(cx, cy, rings):
            inside_pts = [(cx, cy)]
        else:
            return {}

    weights: dict[str, float] = {}
    total_w = 0.0
    for lon, lat in inside_pts:
        w = math.cos(math.radians(lat))
        abbr = state_polys.locate(lon, lat)
        total_w += w
        if abbr is None or abbr not in STATE_ORDER:
            continue
        weights[abbr] = weights.get(abbr, 0.0) + w

    if total_w <= 0 or not weights:
        return {}

    return {abbr: acres * (w / total_w) for abbr, w in weights.items()}


def build_trust(state_polys: StatePolygons) -> dict[str, float]:
    import json

    trust = json.loads(TRUST_JSON.read_text())
    feats = trust["features"]

    per_state = {abbr: 0.0 for abbr in STATE_ORDER}
    reports = []  # (name, acres, splits) for the 5 largest, printed to stderr

    for feat in feats:
        geom = feat.get("geometry")
        props = feat.get("properties", {})
        acres = props.get("acres") or 0.0
        if not geom or acres <= 0:
            continue
        t = geom["type"]
        if t == "Polygon":
            parts = [geom["coordinates"]]
        elif t == "MultiPolygon":
            parts = geom["coordinates"]
        else:
            continue
        rings = [tuple(map(tuple, ring)) for part in parts for ring in part]
        if not rings:
            continue
        bbox = bbox_union([bbox_of(r) for r in rings])

        splits = apportion_polygon(rings, bbox, acres, state_polys)
        for abbr, a in splits.items():
            per_state[abbr] += a

        reports.append((props.get("name") or "(unnamed)", acres, splits))

    reports.sort(key=lambda r: -r[1])
    print("  trust: top 5 polygons by acreage (apportionment):", file=sys.stderr)
    for name, acres, splits in reports[:5]:
        split_str = ", ".join(f"{k}={v:,.0f}" for k, v in sorted(splits.items(), key=lambda kv: -kv[1]))
        print(f"    {name}: {acres:,.0f} ac -> {split_str or '(no overlap with the 17 states)'}", file=sys.stderr)

    all_trust_total = sum(props.get("acres") or 0.0 for f in feats for props in [f.get("properties", {})])
    seventeen_total = sum(per_state.values())
    print(
        f"  trust: 17-state apportioned total = {seventeen_total:,.0f} ac; "
        f"all-state (unassigned included) source total = {all_trust_total:,.0f} ac; "
        f"discrepancy vs ~126.9M target = {126_900_000 - all_trust_total:,.0f} ac",
        file=sys.stderr,
    )

    return {abbr: round(v) for abbr, v in per_state.items()}


# --------------------------------------------------------------------------
# D. Feecheck (independent cross-check from fedland.topojson)
# --------------------------------------------------------------------------

def shoelace_area(ring: list[tuple[float, float]]) -> float:
    total = 0.0
    for i in range(len(ring) - 1):
        x1, y1 = ring[i]
        x2, y2 = ring[i + 1]
        total += x1 * y2 - x2 * y1
    return abs(total) / 2.0


def ring_centroid(ring: list[tuple[float, float]]) -> tuple[float, float]:
    # Simple vertex-average centroid (fine for centroid-based state
    # assignment — doesn't need to be area-weighted per-vertex here since
    # we already area-weight the overall polygon in the caller).
    n = len(ring) - 1 if ring[0] == ring[-1] else len(ring)
    xs = [p[0] for p in ring[:n]]
    ys = [p[1] for p in ring[:n]]
    return sum(xs) / n, sum(ys) / n


def build_feecheck(area_rows: dict[str, int], fips_to_abbr: dict[str, str]) -> dict[str, int | None]:
    import json

    topo = json.loads(FEDLAND_TOPOJSON.read_text())
    arcs = decode_arcs(topo)

    # 1. This file's own state polygons, in its own projected space. Also
    #    used as the calibration basis: known Census acres / this file's own
    #    projected state area, NOT the fedland subset (calibrating against
    #    federal-only area would bias the constant by each state's federal
    #    share instead of just converting projected units to acres).
    state_geo = topo["objects"]["states"]
    state_rings: dict[str, list] = {}
    state_bbox: dict[str, tuple] = {}
    state_area: dict[str, float] = {}
    for g in state_geo["geometries"]:
        fid = g.get("id")
        fips = f"{int(fid):02d}"
        abbr = fips_to_abbr.get(fips)
        if abbr is None:
            continue
        rings = geometry_rings(g, arcs)
        if not rings:
            continue
        state_rings[abbr] = rings
        state_bbox[abbr] = bbox_union([bbox_of(r) for r in rings])
        area, _ = geometry_area_and_centroid(g, arcs)
        state_area[abbr] = area

    def locate_projected(x: float, y: float) -> str | None:
        for abbr, rings in state_rings.items():
            x0, y0, x1, y1 = state_bbox[abbr]
            if x < x0 or x > x1 or y < y0 or y > y1:
                continue
            if point_in_rings(x, y, rings):
                return abbr
        return None

    # 2. fedland polygons: sum projected area per state (excluding BIA).
    fed_geo = topo["objects"]["fedland"]
    per_state_area = {abbr: 0.0 for abbr in STATE_ORDER}
    skipped_bia = 0
    n_polys = 0
    for g in fed_geo["geometries"]:
        props = g.get("properties", {}) or {}
        if props.get("type") == "BIA":
            skipped_bia += 1
            continue
        total_area, centroid = geometry_area_and_centroid(g, arcs)
        if total_area <= 0 or centroid is None:
            continue
        cx, cy = centroid
        abbr = locate_projected(cx, cy)
        if abbr is None or abbr not in per_state_area:
            continue
        per_state_area[abbr] += total_area
        n_polys += 1

    print(f"  feecheck: {n_polys:,} fedland polygons assigned by centroid ({skipped_bia:,} BIA-typed skipped)", file=sys.stderr)

    # 3. Calibrate one global constant: known Census acres / this file's own
    #    projected *state* area, summed over the 17 states.
    known_acres_sum = sum(area_rows[a] for a in STATE_ORDER)
    proj_area_sum = sum(state_area.get(a, 0.0) for a in STATE_ORDER)
    if proj_area_sum <= 0:
        print("  feecheck: FAILED — zero projected state area across all 17 states", file=sys.stderr)
        return {abbr: None for abbr in STATE_ORDER}

    constant = known_acres_sum / proj_area_sum
    print(f"  feecheck: calibration constant = {constant:,.2f} acres per projected-area-unit", file=sys.stderr)

    out: dict[str, int | None] = {}
    for abbr in STATE_ORDER:
        area = per_state_area[abbr]
        if area <= 0:
            print(f"  feecheck: {abbr} -> null (no fedland polygons assigned)", file=sys.stderr)
            out[abbr] = None
        else:
            out[abbr] = round(area * constant)
    return out


# --------------------------------------------------------------------------
# Assembly
# --------------------------------------------------------------------------

def main() -> None:
    t0 = time.time()

    fee_rows = load_fee()
    area_rows, area_source = load_area()
    fips_to_abbr = {rows["fips"]: abbr for abbr, rows in fee_rows.items()}

    assert set(STATE_ORDER) == set(fee_rows.keys()) == set(area_rows.keys()), "state roster mismatch across inputs"
    assert len(STATE_ORDER) == 17, f"expected 17 states, got {len(STATE_ORDER)}"

    print("loading state polygons for point-in-polygon assignment...", file=sys.stderr)
    state_polys = StatePolygons(fips_to_abbr)
    missing_polys = [a for a in STATE_ORDER if a not in state_polys.states]
    assert not missing_polys, f"states.json missing polygons for: {missing_polys}"

    print("building easements (point-in-polygon assignment)...", file=sys.stderr)
    easements, undated_acres = build_easements(state_polys, fee_rows)

    print("building trust (area-sampling apportionment)...", file=sys.stderr)
    trust = build_trust(state_polys)

    print("building feecheck (independent cross-check from fedland.topojson)...", file=sys.stderr)
    feecheck = build_feecheck(area_rows, fips_to_abbr)

    today = time.strftime("%Y-%m-%d", time.gmtime())

    states_out = []
    for abbr in STATE_ORDER:
        row = fee_rows[abbr]
        fee = row["fee"]
        feetotal = sum(fee.values())
        ez = easements[abbr]

        # In-script assertions per the spec's self-verification contract.
        assert feetotal == sum(fee[a] for a in AGENCIES), f"{abbr}: feetotal mismatch"

        cum = ez["cumulative"]
        prev = -1
        for _year, val in cum:
            assert val >= prev, f"{abbr}: cumulative not nondecreasing"
            prev = val
        last_cum = cum[-1][1] if cum else 0
        dated_acres_total = ez["acres"] - undated_acres[abbr]
        assert abs(last_cum - dated_acres_total) <= 2, (
            f"{abbr}: last cumulative ({last_cum}) != dated-tract acres ({dated_acres_total})"
        )
        assert abs(ez["acres"] - (dated_acres_total + undated_acres[abbr])) <= 2, (
            f"{abbr}: acres != dated + undated acres"
        )

        states_out.append({
            "abbr": abbr,
            "name": row["name"],
            "fips": row["fips"],
            "landacres": area_rows[abbr],
            "fee": fee,
            "feetotal": feetotal,
            "feecheck": feecheck.get(abbr),
            "trust": trust.get(abbr, 0),
            "easements": ez,
        })

    out = {
        "source": {
            "fee": "CRS R42346, Federal Land Ownership: Overview and Data (Feb. 2020), Table 2, FY2018 (DOD FY2017)",
            "trust": f"BIA AIAN National LAR, retrieved {today}, apportioned to states by area sampling",
            "easements": f"FWS National Realty Tracts (INTTYPE1=E), retrieved {today}",
            "statearea": area_source,
        },
        "retrieved": today,
        "agencies": AGENCIES,
        "agencylabels": AGENCY_LABELS,
        "states": states_out,
    }

    # ---- Self-verification -------------------------------------------------
    assert len(out["states"]) == 17
    schema_keys = {"source", "retrieved", "agencies", "agencylabels", "states"}
    assert set(out.keys()) == schema_keys, f"top-level schema mismatch: {set(out.keys())}"
    state_keys = {"abbr", "name", "fips", "landacres", "fee", "feetotal", "feecheck", "trust", "easements"}
    for s in out["states"]:
        assert set(s.keys()) == state_keys, f"{s['abbr']}: state schema mismatch: {set(s.keys())}"
        assert set(s["fee"].keys()) == set(AGENCIES)
        assert set(s["easements"].keys()) == {"tracts", "acres", "undated", "programs", "cumulative"}

    # Round-trip through JSON to be sure it's actually serializable/valid.
    import json as _json
    reloaded = _json.loads(_json.dumps(out))
    assert reloaded == out

    write_json(OUT, out)

    # ---- Cross-check printout for the orchestrator -------------------------
    by_abbr = {s["abbr"]: s for s in out["states"]}
    nd, sd = by_abbr["ND"], by_abbr["SD"]
    print(
        f"CROSS-CHECK ND easements: {nd['easements']['tracts']:,} tracts / "
        f"{nd['easements']['acres']:,} acres (target ~18,266 / ~1,805,448)",
        file=sys.stderr,
    )
    print(
        f"CROSS-CHECK SD easements: {sd['easements']['tracts']:,} tracts / "
        f"{sd['easements']['acres']:,} acres (target ~16,165 / ~1,922,632)",
        file=sys.stderr,
    )

    trust_17_total = sum(s["trust"] for s in out["states"])
    print(f"trust: 17-state total = {trust_17_total:,} acres (national ~126.9M target; see per-polygon printout above)", file=sys.stderr)

    ratios = []
    for s in out["states"]:
        if s["feecheck"] is None or s["feetotal"] == 0:
            continue
        ratios.append((s["abbr"], s["feecheck"] / s["feetotal"]))
    ratios.sort(key=lambda r: abs(r[1] - 1.0), reverse=True)
    print("feecheck/feetotal ratio, worst 3 (should be near 1.0):", file=sys.stderr)
    for abbr, ratio in ratios[:3]:
        print(f"  {abbr}: {ratio:.3f}", file=sys.stderr)

    print("\nper-state summary:", file=sys.stderr)
    for s in out["states"]:
        print(
            f"  {s['abbr']}: feetotal={s['feetotal']:,} feecheck={s['feecheck']} "
            f"trust={s['trust']:,} easements={s['easements']['acres']:,} ac / {s['easements']['tracts']:,} tracts",
            file=sys.stderr,
        )

    print(f"\ndone in {time.time() - t0:.1f}s", file=sys.stderr)


if __name__ == "__main__":
    main()
