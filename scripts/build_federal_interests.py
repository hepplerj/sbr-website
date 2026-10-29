#!/usr/bin/env python3
"""Build the *federal interests* overlay layers for the alt federal-lands map.

The published "US Federal Lands by Agency" map shows federal **fee title**
only: land the United States owns outright, colored by managing agency.
That map makes the Great Plains look empty. It isn't — the federal interest
there mostly takes forms fee title can't show. This script assembles the two
layers that make the point most directly:

  trust  — BIA American Indian / Alaska Native Land Area Representations
           (LAR). Land held *in trust by* the United States for tribes and
           individual Indians. Categorically not "public land," and wrongly
           collapsed into an agency color on a fee map.

  easements — US Fish & Wildlife Service National Realty tracts filtered to
           easement interest (``INTTYPE1 = 'E'``). A permanent federal
           property interest in land whose surface stays in private
           ownership and production. ~43,000 tracts, overwhelmingly
           Waterfowl Production Area wetland and grassland easements across
           the Prairie Pothole region (ND, SD, MT, MN, NE).

Sources (ArcGIS REST, no key required):
  https://services.arcgis.com/QVENGdaPbd4LUkLV/ArcGIS/rest/services/FWS_National_Realty_Tracts_View_Test/FeatureServer/0
  https://biamaps.geoplatform.gov/server/rest/services/DivLTR/BIA_AIAN_National_LAR/FeatureServer/0

Output (both EPSG:4326 — the renderer projects to AlbersUSA at draw time):
  static/data/federal-interests-trust.json      GeoJSON polygons
  static/data/federal-interests-easements.json  tract centroids + attributes

Easements ship as centroids, not polygons. Individual easement tracts are
40-160 acres; at national zoom their true outlines are sub-pixel, and 43,000
polygons would be a payload and rendering problem for no visual gain. One
dot per tract is both lighter and more honest about what's legible at this
scale. The renderer draws them as a stipple.

Run: ``/usr/bin/python3 scripts/build_federal_interests.py``
(Homebrew Python lacks a working expat; use the system interpreter.)
"""

from __future__ import annotations

import json
import sys
import time
import urllib.parse
import urllib.request

from _common import DATA_DIR, UA, write_json

FWS_URL = (
    "https://services.arcgis.com/QVENGdaPbd4LUkLV/ArcGIS/rest/services/"
    "FWS_National_Realty_Tracts_View_Test/FeatureServer/0/query"
)
BIA_URL = (
    "https://biamaps.geoplatform.gov/server/rest/services/DivLTR/"
    "BIA_AIAN_National_LAR/FeatureServer/0/query"
)

PAGE = 2000

# FWS RSL_TYPE -> the program the easement was bought under. Only the codes
# that carry meaningful acreage are named; the rest fall through to "other".
RSL_LABELS = {
    "WPA": "Waterfowl Production Area easement",
    "NWR": "National Wildlife Refuge easement",
    "WMA": "Wildlife Management Area easement",
    "CA":  "Conservation Area easement",
    "FSA": "Farm Service Agency (FmHA) easement",
    "NFH": "National Fish Hatchery easement",
    "MNM": "National Monument easement",
}

# LAR CLASSIFICATION domain: 1 = reservation/trust tract, 3 = off-reservation
# trust land. Kept distinct because they are different legal animals.
LAR_LABELS = {"1": "Reservation or trust tract", "3": "Off-reservation trust land"}


def query(url: str, params: dict, *, attempts: int = 5) -> dict:
    """POST an ArcGIS REST query and return the decoded JSON.

    POST rather than GET: the ``where`` clauses and field lists here are long
    enough that some of these endpoints truncate a query string.
    """
    body = urllib.parse.urlencode(params).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=body,
        headers={"User-Agent": UA, "Content-Type": "application/x-www-form-urlencoded"},
    )
    last = None
    for i in range(attempts):
        try:
            with urllib.request.urlopen(req, timeout=180) as r:
                payload = json.loads(r.read().decode("utf-8"))
            if "error" in payload:
                raise RuntimeError(payload["error"])
            return payload
        except Exception as exc:  # noqa: BLE001 — retry anything transient
            last = exc
            if i < attempts - 1:
                time.sleep(2 ** i)
    raise RuntimeError(f"query failed after {attempts} attempts: {last}")


def paged(url: str, params: dict, *, label: str):
    """Yield features page by page, following ``exceededTransferLimit``."""
    offset = 0
    while True:
        page = dict(params, resultOffset=offset, resultRecordCount=PAGE, f="json")
        payload = query(url, page)
        feats = payload.get("features", [])
        if not feats:
            return
        yield from feats
        offset += len(feats)
        print(f"  {label}: {offset:,}", file=sys.stderr)
        if not payload.get("exceededTransferLimit") and len(feats) < PAGE:
            return


def build_easements() -> dict:
    """FWS easement tracts as centroids with program, acreage, and year."""
    params = {
        "where": "INTTYPE1 = 'E'",
        "outFields": "RSL_TYPE,GISACRES,DOCACRES,UNITNAME,ACQUISITION_DATE",
        "returnGeometry": "false",
        "returnCentroid": "true",
        "outSR": "4326",
        "orderByFields": "OBJECTID",
    }
    rows, skipped = [], 0
    by_program: dict[str, dict] = {}
    # Tracts are stored as arrays, not objects, and the two high-cardinality
    # string columns are interned — 43k records of {"p":...,"u":...} spends
    # more bytes on repeated keys and unit names than on coordinates.
    codes: list[str] = []
    units: list[str] = []
    code_ix: dict[str, int] = {}
    unit_ix: dict[str, int] = {}

    def intern(value: str, table: list[str], index: dict[str, int]) -> int:
        if value not in index:
            index[value] = len(table)
            table.append(value)
        return index[value]

    for feat in paged(FWS_URL, params, label="easement tracts"):
        c = feat.get("centroid") or {}
        lon, lat = c.get("x"), c.get("y")
        if lon is None or lat is None:
            skipped += 1
            continue
        a = feat["attributes"]
        code = (a.get("RSL_TYPE") or "").strip().upper() or "OTHER"
        # GISACRES is 0 on many easement tracts (the polygon is the servient
        # estate, not a fee parcel); DOCACRES carries the deeded figure.
        acres = max(a.get("GISACRES") or 0.0, a.get("DOCACRES") or 0.0)
        ms = a.get("ACQUISITION_DATE")
        year = time.gmtime(ms / 1000).tm_year if ms else None

        rows.append(
            [
                intern(code, codes, code_ix),
                # 3 decimals ~ 110 m. The dot this draws is several km wide at
                # national zoom; more precision would be storage, not accuracy.
                round(lon, 3),
                round(lat, 3),
                round(acres),
                intern((a.get("UNITNAME") or "").strip(), units, unit_ix),
                year,
            ]
        )
        agg = by_program.setdefault(code, {"tracts": 0, "acres": 0.0})
        agg["tracts"] += 1
        agg["acres"] += acres

    if skipped:
        print(f"  note: {skipped} easement tracts had no centroid", file=sys.stderr)

    programs = {
        k: {
            "label": RSL_LABELS.get(k, "Other easement interest"),
            "tracts": v["tracts"],
            "acres": round(v["acres"]),
        }
        for k, v in sorted(by_program.items(), key=lambda kv: -kv[1]["acres"])
    }
    return {
        "source": "US Fish & Wildlife Service, National Realty Tracts (INTTYPE1 = E)",
        "retrieved": time.strftime("%Y-%m-%d", time.gmtime()),
        "note": (
            "Permanent federal easement interests. Surface ownership remains "
            "private; the United States holds a perpetual property right."
        ),
        "programs": programs,
        "fields": ["program", "lon", "lat", "acres", "unit", "year"],
        "codes": codes,
        "units": units,
        "tracts": rows,
    }


def _ring_area(ring: list) -> float:
    """Twice the signed planar area of a ring; positive means counterclockwise."""
    total = 0.0
    for i in range(len(ring) - 1):
        x1, y1 = ring[i][0], ring[i][1]
        x2, y2 = ring[i + 1][0], ring[i + 1][1]
        total += x1 * y2 - x2 * y1
    return total


def _bbox(ring: list) -> tuple:
    xs = [p[0] for p in ring]
    ys = [p[1] for p in ring]
    return (min(xs), min(ys), max(xs), max(ys))


def _point_in_ring(pt: tuple, ring: list) -> bool:
    x, y = pt
    inside = False
    n = len(ring)
    for i in range(n - 1):
        x1, y1 = ring[i][0], ring[i][1]
        x2, y2 = ring[i + 1][0], ring[i + 1][1]
        if (y1 > y) != (y2 > y):
            xi = x1 + (y - y1) / (y2 - y1) * (x2 - x1)
            if x < xi:
                inside = not inside
    return inside


def rewind(geom: dict) -> bool:
    """Re-nest a polygon's rings by containment and wind them the way D3 wants.

    Two separate problems, both fatal to rendering:

    1. **Winding.** D3 treats GeoJSON polygons as *spherical*, so the winding
       order decides which side of the ring is the inside — and its convention
       is the reverse of RFC 7946: exterior rings run **clockwise** in planar
       lon/lat, holes counterclockwise. Get it backwards and a ring is read as
       enclosing the rest of the globe, flooding the whole map. (Verified with
       d3.geoPath: a counterclockwise Crow Creek projects to a 974x509 bbox —
       the entire canvas — and its reverse to the correct 11x7.)

    2. **Nesting.** ArcGIS stores a polygon as a flat list of rings and infers
       holes from winding; the server's GeoJSON conversion re-nests them badly
       on fragmented features. Wind River came back as 82 "parts", one of them
       a 4-point exterior owning 90 holes. So the source nesting can't be
       trusted at all: every ring is re-classified here by testing containment
       against the larger rings, which is what the nesting was supposed to
       encode. A ring inside an exterior is a hole; a ring inside a hole is an
       island, and becomes an exterior again.

    Rings that generalization collapsed to zero area are dropped. Returns False
    when nothing renderable survives.
    """
    if not geom:
        return False
    t = geom.get("type")
    if t == "Polygon":
        parts = [geom["coordinates"]]
    elif t == "MultiPolygon":
        parts = geom["coordinates"]
    else:
        return False

    # Flatten: the incoming grouping is exactly what we don't trust.
    rings = []
    for part in parts:
        for ring in part:
            if len(ring) < 4:
                continue
            a = _ring_area(ring)
            if a == 0:
                continue
            rings.append({"ring": ring, "area": abs(a), "bbox": _bbox(ring)})

    if not rings:
        return False

    # Largest first, so any ring's container is already classified.
    rings.sort(key=lambda r: -r["area"])
    placed = []          # (record, is_hole, exterior_index)
    exteriors = []       # list of [outer_ring, hole, hole, ...]

    for rec in rings:
        pt = rec["ring"][0]
        rx0, ry0, rx1, ry1 = rec["bbox"]
        container = None
        # Smallest enclosing ring wins; `placed` is in descending area order,
        # so the last match is the tightest.
        for other, is_hole, ext_ix in placed:
            bx0, by0, bx1, by1 = other["bbox"]
            if rx0 < bx0 or ry0 < by0 or rx1 > bx1 or ry1 > by1:
                continue
            if _point_in_ring(pt, other["ring"]):
                container = (is_hole, ext_ix)
        if container is None or container[0]:
            # No container, or sitting inside a hole -> it's an exterior.
            exteriors.append([rec["ring"]])
            placed.append((rec, False, len(exteriors) - 1))
        else:
            exteriors[container[1]].append(rec["ring"])
            placed.append((rec, True, container[1]))

    for poly in exteriors:
        for i, ring in enumerate(poly):
            cw = _ring_area(ring) < 0
            want_cw = i == 0
            if cw != want_cw:
                ring.reverse()

    if len(exteriors) == 1:
        geom["type"] = "Polygon"
        geom["coordinates"] = exteriors[0]
    else:
        geom["type"] = "MultiPolygon"
        geom["coordinates"] = exteriors
    return True


def build_trust() -> dict:
    """BIA LAR polygons, generalized for national-scale display."""
    params = {
        "where": "1=1",
        "outFields": "LARNAME,CLASSIFICATION,GISACRES,REGION",
        "returnGeometry": "true",
        "outSR": "4326",
        # ~0.002 deg (roughly 200 m) — under a pixel at national zoom, and
        # loose enough that the smallest rancherias still survive as polygons.
        "maxAllowableOffset": "0.002",
        "geometryPrecision": "4",
        "orderByFields": "OBJECTID",
        "f": "geojson",
    }
    payload = query(BIA_URL, dict(params))
    raw = payload.get("features", [])
    feats, dropped, acres = [], 0, 0.0
    for f in raw:
        if not rewind(f.get("geometry")):
            dropped += 1
            continue
        p = f.get("properties", {}) or {}
        cls = str(p.get("CLASSIFICATION") or "").strip()
        acres += p.get("GISACRES") or 0.0
        f["properties"] = {
            "name": (p.get("LARNAME") or "").strip(),
            "kind": LAR_LABELS.get(cls, "Trust land"),
            "acres": round(p.get("GISACRES") or 0.0),
        }
        feats.append(f)
    if dropped:
        print(f"  note: {dropped} LAR polygons collapsed under generalization", file=sys.stderr)
    print(f"  trust: {len(feats):,} polygons, {acres:,.0f} acres", file=sys.stderr)
    return {
        "type": "FeatureCollection",
        "source": "Bureau of Indian Affairs, AIAN National Land Area Representations",
        "retrieved": time.strftime("%Y-%m-%d", time.gmtime()),
        "note": (
            "Land held in trust by the United States for tribes and individual "
            "Indians. Not public land, and not the property of the managing agency."
        ),
        "features": feats,
    }


def main() -> None:
    print("BIA trust lands (LAR)...", file=sys.stderr)
    write_json(DATA_DIR / "federal-interests-trust.json", build_trust())

    print("FWS easement tracts...", file=sys.stderr)
    ease = build_easements()
    write_json(DATA_DIR / "federal-interests-easements.json", ease)
    total = sum(v["acres"] for v in ease["programs"].values())
    print(f"  {len(ease['tracts']):,} tracts, {total:,} deeded acres", file=sys.stderr)


if __name__ == "__main__":
    main()
