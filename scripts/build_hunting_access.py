#!/usr/bin/env python3
"""Build the *private land open to public hunting* layer (exploratory).

Conservation easements keep land private *and closed*: a WPA easement or a
Ducks Unlimited easement buys the right to stop drainage or plowing, not a
right of entry. Public access to private land comes through a different
instrument — the state walk-in lease, often paid for since 2008 by USDA's
Voluntary Public Access and Habitat Incentive Program (VPA-HIP). This script
pulls one season of each Plains/Rocky Mountain program it can reach:

  ND  PLOTS — Private Land Open To Sportsmen (ND Game & Fish, 1997). Some
        units name an NGO co-funder in ``Unit_Name`` ("PLOTS - Ducks
        Unlimited", "PLOTS - Mule Deer Foundation").
  KS  WIHA — Walk-In Hunting Access (KDWP, 1995). KDWP leaves each season's
        layer up as its own service (24_25_7_29 is titled "2026-2027 WIHA
        Access" in their web map); seasons back to 2018 are recoverable.
  NE  Open Fields and Waters (NGPC), 2026-27. Fishing-only contracts dropped.
  MT  Block Management (FWP), 2026 season. Active BMA boundaries only; inner
        safety/no-trespass zones dropped. Some BMAs enclose state or federal
        land, so this is not purely private ground.
  WY  Walk-In Areas and Hunter Management Areas (WGFD). ``Type = Boundary``
        only; the other types are restriction zones inside an area. HMAs
        need a free permission slip and can include public land.
  CO  Walk-In Access (CPW).

  SD  **missing.** SD GFP's Walk-In Area layer sits behind an access-
        controlled ArcGIS proxy; the data has to be requested from the agency.

Sources (ArcGIS REST, no key required): see SOURCES below.

All are *leases*: enrollment turns over yearly, so this is one season's
snapshot, not a stock of land. ND redistribution requests go to ND Game &
Fish (701-328-6369) — clear that, and the other agencies' terms, before
publishing.

Acreage is computed from each polygon's (generalized) geometry, for every
state alike. Several sources carry agreement- or contract-level acreage
repeated on every polygon the agreement spans (ND ``Total_Acres``, NE
``ContractLandAcres``), and MT and CO carry none; summing attributes would
double count or come up empty.

Output: static/data/hunting-access.json  GeoJSON polygons, EPSG:4326, wound
for D3 by build_federal_interests.rewind().

Run: ``/usr/bin/python3 scripts/build_hunting_access.py``
"""

from __future__ import annotations

import math
import sys
import time

from _common import DATA_DIR, write_json
from build_federal_interests import query, rewind

AGOL = "https://services{}.arcgis.com/{}/ArcGIS/rest/services/{}/FeatureServer/{}/query"
PAGE = 1000  # smallest maxRecordCount among the sources

# ND Unit_Type: the habitat program the access agreement rides on.
ND_TYPES = {
    "WLP": "Working Lands",
    "CRP": "CRP access",
    "CREP": "CREP access",
    "CREP II": "CREP access",
    "WRP": "WRP access",
    "HAB": "Habitat",
    "HAB-LT": "Habitat (long-term)",
}

# KS LEGENDID is a season code: start (S = Sept. 1, N = Nov. 1), end
# (J = Jan. 31, MR = Mar. 31, MY = May 31), AM = Apr. 1–May 31 spring
# window, ASO = archery only. Decoded against the 2018 layer's ACCESS field.
KS_START = {"S": "Sept. 1", "N": "Nov. 1"}
KS_END = {"J": "Jan. 31", "MR": "Mar. 31", "MY": "May 31"}


def ks_season(code: str) -> str:
    code = (code or "").upper()
    archery = "ASO" in code
    spring = code.endswith("AM")
    core = code.replace("ASO", "").removesuffix("AM")
    parts = []
    if core[:1] in KS_START and core[1:] in KS_END:
        parts.append(f"{KS_START[core[:1]]}–{KS_END[core[1:]]}")
    if spring:
        parts.append("Apr. 1–May 31")
    s = " / ".join(parts) or code
    return s + (" · archery only" if archery else "")


def _s(v) -> str:
    return str(v or "").strip()


def nd(p):
    partner = _s(p.get("Unit_Name")).partition(" - ")[2]
    kind = ND_TYPES.get(_s(p.get("Unit_Type")), "Other agreement")
    return f"PLOTS · {_s(p.get('County_Name'))} County", kind + (f" · with {partner}" if partner else "")


SOURCES = [
    # state, url, where, outFields, order field, (props -> (name, kind))
    ("ND", AGOL.format(1, "GOcSXpzwBHyk2nog", "NDGISHUB_PLOTS_Lands", 0), "1=1",
     "ObjectID,Unit_Type,Unit_Name,County_Name", "ObjectID", nd),
    ("KS", AGOL.format(1, "q2CglofYX6ACNEeu", "24_25_7_29", 0), "1=1",
     "FID,COUNTY,LEGENDID", "FID",
     lambda p: (f"WIHA · {_s(p.get('COUNTY'))} County", ks_season(p.get("LEGENDID")))),
    ("NE", AGOL.format(5, "IOshH1zLrIieqrNk", "OFW_2026_2027_QA_Web_Map_View", 0),
     "ProgramBou IS NOT NULL AND ProgramBou NOT LIKE '%Fishing Only%'",
     "OBJECTID,County,ProgramBou", "OBJECTID",
     lambda p: (f"Open Fields and Waters · {_s(p.get('County'))} County",
                _s(p.get("ProgramBou")).removeprefix("OFW ") or "Open Fields and Waters")),
    ("MT", AGOL.format(3, "Cdxz8r11hT0MGzg1", "FWPLND_BMA_BOUNDARY", 0),
     "STATUS = 'Active' AND CLASS = 'BMA Boundary'",
     "OBJECTID,BMANAME,ENDDATE", "OBJECTID",
     lambda p: (f"Block Management · {_s(p.get('BMANAME'))}",
                f"Block Management Area · through {_s(p.get('ENDDATE'))}")),
    ("WY", AGOL.format(6, "cWzdqIyxbijuhPLw", "WalkInHuntingBoundaries", 0), "Type = 'Boundary'",
     "OBJECTID,Label,AccessDates,Species", "OBJECTID",
     lambda p: (f"Walk-In Area · {_s(p.get('Label'))}",
                " · ".join(x for x in (_s(p.get("Species")), _s(p.get("AccessDates"))) if x))),
    ("WY", AGOL.format(6, "cWzdqIyxbijuhPLw", "HunterManagementAreaBoundaries", 0), "Type = 'Boundary'",
     "OBJECTID,HMA_NAME", "OBJECTID",
     lambda p: (f"Hunter Management Area · {_s(p.get('HMA_NAME'))}", "Permission slip required")),
    ("CO", AGOL.format(5, "ttNGmDvKQA7oeDQ3", "CPWAdminData", 12), "1=1",
     "FID,COVER,CLOSEDATE", "FID",
     lambda p: ("Walk-In Access", f"{_s(p.get('COVER'))} · closes {_s(p.get('CLOSEDATE'))}")),
]


def acres(geom: dict) -> float:
    """Area of a lon/lat polygon, equirectangular about each ring's mean
    latitude. ponytail: planar approximation, ~0.1% off at quarter-section
    scale; swap for a spherical-excess formula if parcels get state-sized."""
    polys = [geom["coordinates"]] if geom["type"] == "Polygon" else geom["coordinates"]
    m2 = 0.0
    for poly in polys:
        signed = 0.0
        for ring in poly:
            k = math.cos(math.radians(sum(p[1] for p in ring) / len(ring)))
            signed += sum(
                ring[i][0] * ring[i + 1][1] - ring[i + 1][0] * ring[i][1]
                for i in range(len(ring) - 1)
            ) / 2 * k
        m2 += abs(signed)  # exterior and holes are wound oppositely
    return m2 * 111_320 ** 2 / 4046.856


def fetch(url: str, where: str, fields: str, order: str, label: str) -> list:
    """All matching features as GeoJSON, generalized for regional display."""
    feats, offset = [], 0
    while True:
        page = query(url, {
            "where": where,
            "outFields": fields,
            "returnGeometry": "true",
            "outSR": "4326",
            # ~100 m: a quarter-section (800 m on a side) keeps its shape.
            "maxAllowableOffset": "0.001",
            "geometryPrecision": "4",
            "orderByFields": order,
            "resultOffset": offset,
            "resultRecordCount": PAGE,
            "f": "geojson",
        }).get("features", [])
        feats += page
        offset += len(page)
        print(f"  {label}: {offset:,}", file=sys.stderr)
        if len(page) < PAGE:
            return feats


def build() -> dict:
    out, totals = [], {}
    for state, url, where, fields, order, describe in SOURCES:
        for f in fetch(url, where, fields, order, state):
            if not rewind(f.get("geometry")):
                continue
            name, kind = describe(f.get("properties") or {})
            a = acres(f["geometry"])
            f["properties"] = {"name": name, "kind": kind, "state": state, "acres": round(a)}
            out.append(f)
            t = totals.setdefault(state, {"areas": 0, "acres": 0.0})
            t["areas"] += 1
            t["acres"] += a

    for k, t in totals.items():
        print(f"  {k}: {t['areas']:,} areas, {t['acres']:,.0f} acres", file=sys.stderr)
    return {
        "type": "FeatureCollection",
        "source": (
            "ND Game & Fish PLOTS; KDWP WIHA; NGPC Open Fields and Waters; MT FWP "
            "Block Management; WGFD Walk-In and Hunter Management Areas; CPW Walk-In Access"
        ),
        "retrieved": time.strftime("%Y-%m-%d", time.gmtime()),
        "note": (
            "Private land leased by the state for public walk-in hunting. "
            "Annual agreements: one season's snapshot. South Dakota not included."
        ),
        "totals": {k: {"areas": t["areas"], "acres": round(t["acres"])} for k, t in totals.items()},
        "features": out,
    }


if __name__ == "__main__":
    assert ks_season("SJ") == "Sept. 1–Jan. 31"
    assert ks_season("NJASOAM") == "Nov. 1–Jan. 31 / Apr. 1–May 31 · archery only"
    assert ks_season("AM") == "Apr. 1–May 31"
    # One square mile at 45°N (1/69.1 deg lat × 1/48.9 deg lon) ≈ 640 acres.
    sq = [[0, 45], [0, 45 + 1 / 69.05], [1 / 48.85, 45 + 1 / 69.05], [1 / 48.85, 45], [0, 45]]
    assert abs(acres({"type": "Polygon", "coordinates": [sq]}) - 640) < 5
    write_json(DATA_DIR / "hunting-access.json", build())
