#!/usr/bin/env python3
"""Fetch the three Bankhead-Jones Act GeoJSONs into ``static/data/``.

Re-hosts the GeoJSON extracts published alongside the author's earlier
project *Lands Subject to the Bankhead-Jones Farm Tenant Act (1937)*
(https://jasonheppler.org/projects/bankhead/). The underlying boundaries
originate from the USDA Forest Service Enterprise Data Warehouse (EDW):

  - National Grasslands:
      EDW_ProclaimedForestsAndGrasslands_01/MapServer/1
  - Land Utilization Projects:
      EDW_LandUtilizationProject_01/MapServer/0
  - Federal lands context layer:
      USDA Forest Service EDW aggregate

Three files, no transformation: this script exists so the provenance is
documented and the files can be refreshed without leaving the repo.

Run: ``python scripts/build_bankhead_jones.py``
"""

from __future__ import annotations

from _common import DATA_DIR, fetch

BASE = "https://jasonheppler.org/projects/bankhead/data"

FILES = [
    "national_grasslands.geojson",
    "land_utilization_projects.geojson",
    "federal_lands.geojson",
]


def main() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    for name in FILES:
        dest = DATA_DIR / name
        body = fetch(f"{BASE}/{name}", dest=dest, binary=True)
        print(f"wrote {dest.relative_to(DATA_DIR.parent.parent)} ({len(body):,} bytes)")


if __name__ == "__main__":
    main()
