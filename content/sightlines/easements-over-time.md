---
title: "Federal Easements on the Northern Plains"
date: 2026-10-28
lede: "Fish & Wildlife Service easement tracts on private land across the Dakotas, Montana, Wyoming, and Colorado, by the year the United States acquired them."
weight: 17
draft: true
viz: map
themes: [public-lands]
regions: [northern-plains, rocky-mountain]
map:
  renderer: d3
  mode: timeline
  src: /data/federal-interests-easements.json
  statessrc: /data/states.json
  focus: ["38", "46", "30", "56", "08"]   # ND, SD, MT, WY, CO
  focuslabel: "ND, SD, MT, WY, and CO"
  start: 1930
  color: "#1f6b66"
  infotitle: "Federal easements over time"
---

<!--
PROSE SCAFFOLD — Jason writes the prose.

§1 — What the map shows: perpetual federal easements on land that stays
     private. Fee-title maps leave the Dakotas nearly blank; this one doesn't.
§2 — The timing: press play. Almost nothing before 1960; the Small Wetlands
     Acquisition Program (1958 Duck Stamp Act amendment) fills the Prairie
     Pothole Region through the 1960s–70s. Use the "Acquired in last 10
     years" window to watch the wave move rather than accumulate.
§3 — Tie to the politics: easement acquisition and the state-consent fights
     in North Dakota (gubernatorial approval requirement — verify date).
-->

## Data and method

Tract centroids from the US Fish & Wildlife Service National Realty Tracts
service, filtered to easement interests (`INTTYPE1 = E`), retrieved July 2026
by `scripts/build_federal_interests.py`. Each dot is one tract, placed at its
centroid and sized by deeded acres; the year is the acquisition date on the
realty record. Easements are perpetual, so in the cumulative view nothing
leaves the map; the windowed views show only tracts acquired in the trailing
period. Tallies count tracts whose centroid falls inside the five highlighted
states. About 1,500 tracts nationwide carry no acquisition date and are left off.
