---
title: "Easements and Access on the Plains"
date: 2026-11-23
lede: "Federal easements keep Plains land private and closed. State walk-in leases open some of it to the public. Where the two instruments stand today."
weight: 18
draft: true
viz: map
themes: [public-lands]
regions: [northern-plains, southern-plains, rocky-mountain]
map:
  renderer: d3
  mode: timeline
  snapshot: true
  src: /data/federal-interests-easements.json
  statessrc: /data/states.json
  focus: ["38", "46", "31", "20", "30", "56", "08"]   # ND, SD, NE, KS, MT, WY, CO
  focuslabel: "ND, SD, NE, KS, MT, WY, and CO"
  color: "#1f6b66"
  infotitle: "Closed and open: the present"
  dotlabel: "Federal easements (closed to the public)"
  areas:
    src: /data/hunting-access.json
    color: "#d4a017"
    label: "State walk-in leases, 2026–27 (open to the public; SD data not available)"
---

<!-- EXPLORATORY DRAFT (branch explore/hunting-access). Prose is the author's.
Editorial cues:
- Base map is "Federal Easements on the Northern Plains" with the frame widened to NE and KS.
- Present-day snapshot, no slider. Dots = every FWS easement tract to date. Gold = state walk-in
  leases for the 2026–27 season: ND PLOTS, KS WIHA, NE Open Fields and Waters, MT Block Management,
  WY Walk-In Areas + Hunter Management Areas, CO Walk-In Access.
- SD Walk-In Areas are MISSING: SD GFP's layer is behind an access-controlled proxy. Request the
  data from SD Game, Fish & Parks before publishing — SD's blank is a data gap, not an absence.
- MT Block Management includes some enclosed state/federal land, not only private ground.
- Scale: at this zoom a 160-acre tract is ~half a pixel; its dot stands for ~6 km of ground, and
  small walk-in parcels get a hairline outline. The map shows pattern, not extent — easements are
  ~4% of the Dakotas' land. Use the panel acreage, not the ink, for "how much."
- Easement ≠ access: the teal dots are private and closed; the gold is private and open.
-->
