#!/usr/bin/env python3
"""Fetch the pre-projected US federal-lands TopoJSON into ``static/data/``.

Re-hosts the TopoJSON assembled for the author's earlier project
*US Federal Lands* (https://jasonheppler.org/projects/western-lands/).
The file contains four object layers — fedland, counties, states, land —
and is already pre-projected to AlbersUSA screen coordinates for a
960x500 canvas (see its ``transform`` block). The D3 renderer in
``themes/sagebrush/assets/js/d3-maps.js`` treats it with a null/identity
path because of that pre-projection.

Underlying data: Protected Areas Database of the US (PAD-US), compiled
circa 2014, with each feature tagged by managing agency (FS, BLM, FWS,
NPS, BOR, DOD, BIA, …). A refresh is tracked in TODO.md.

Run: ``python scripts/build_us_federal_lands.py``
"""

from __future__ import annotations

from _common import DATA_DIR, fetch

URL = "https://jasonheppler.org/projects/western-lands/fedland.json"


def main() -> None:
    dest = DATA_DIR / "fedland.topojson"
    body = fetch(URL, dest=dest, binary=True)
    print(f"wrote {dest.name} ({len(body):,} bytes)")


if __name__ == "__main__":
    main()
