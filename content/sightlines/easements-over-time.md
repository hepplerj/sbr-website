---
title: "Federal Easements on the Northern Plains"
date: 2026-10-28
lede: "Fish & Wildlife Service easement tracts on private land across the Dakotas, Montana, Wyoming, and Colorado, by the year the United States acquired them."
weight: 17
draft: false
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

This map charts perpetual federal easements on private land. Despite the lack of what is commonly understood as "public lands" in the Great Plains, the federal interest in the region is nevertheless widespread and active. The Small Wetlands Acquisition Program, begun under the 1958 Duck Stamp amendment, led to increasing federal acquisitions of the prairie pothole region for waterfowl habitat restoration. 

## Data and method

Tract centroids from the US Fish & Wildlife Service National Realty Tracts service, filtered to easement interests (`INTTYPE1 = E`), retrieved July 2026 by `scripts/build_federal_interests.py`. Each dot is one tract, placed at its centroid and sized by deeded acres; the year is the acquisition date on the realty record. Easements are perpetual, so in the cumulative view nothing leaves the map; the windowed views show only tracts acquired in the trailing period. Tallies count tracts whose centroid falls inside the five highlighted states. About 1,500 tracts nationwide carry no acquisition date and are left off.
