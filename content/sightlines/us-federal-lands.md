---
title: "US Federal Lands by Agency"
date: 2026-04-17
lede: "Every federally owned parcel in the United States, colored by the agency that manages it — Forest Service, BLM, Fish & Wildlife, Park Service, and the rest."
weight: 15
draft: false
viz: map
themes: [public-lands]
regions: [national]
map:
  renderer: d3
  src: /data/fedland.topojson
  statesobject: states
  dataobject: fedland
  colorfield: type
  infotitle: "US federal lands"
  infoprompt: "Hover a parcel for the managing agency."
  legendtitle: "Managing agency"
  legendorder: [FS, BLM, FWS, NPS, BOR, DOD, BIA, TVA, DOE, NASA, VA, USDA, DOJ, DOT, HHS, MWAA]
  palette:
    FS:   "#4a9e5c"   # forest green
    BLM:  "#c9a978"   # rangeland gold
    FWS:  "#8aa07c"   # refuge olive
    NPS:  "#3a5982"   # park navy
    BOR:  "#6b8cab"   # reclamation blue-gray
    DOD:  "#7a7367"   # military gray-brown
    BIA:  "#a94b2b"   # rust
    TVA:  "#a8915a"   # dun
    DOE:  "#d9b84a"   # yellow
    NASA: "#3a3a3a"   # near-black
    VA:   "#9a6da0"   # plum
    USDA: "#6b7a3a"   # olive-dark
    DOJ:  "#555"
    DOT:  "#777"
    HHS:  "#999"
    MWAA: "#bbb"
    default: "#c4b8e0"
  labels:
    FS:   "Forest Service"
    BLM:  "Bureau of Land Management"
    FWS:  "Fish & Wildlife Service"
    NPS:  "National Park Service"
    BOR:  "Bureau of Reclamation"
    DOD:  "Department of Defense"
    BIA:  "Bureau of Indian Affairs"
    TVA:  "Tennessee Valley Authority"
    DOE:  "Department of Energy"
    NASA: "NASA"
    VA:   "Veterans Affairs"
    USDA: "USDA (other)"
    DOJ:  "Department of Justice"
    DOT:  "Department of Transportation"
    HHS:  "Health & Human Services"
    MWAA: "Metropolitan Washington Airports"
---

Roughly 28 percent of the United States---about 640 million acres---is owned and managed by the federal government. This map renders every federal parcel and the agency that manages it.

Four agencies manage the overwhelming majority of the acreage: the **US Forest Service** (green), the **Bureau of Land Management** (gold), the **Fish & Wildlife Service** (olive), and the **National Park Service** (navy). Together they manage most of what the public thinks of as "public lands": the National Forests, the BLM grazing districts, the wildlife refuges, the National Parks and historic monuments. Federal agencies hold their lands under very different statutory regimes and serve very different purposes.


Hover over a polygon to learn more about the land's management, or click an agency on the legend to filter down to just that agency's lands.

## Data and method

Source: US federal land polygons compiled from the Protected Areas Database of the United States (PAD-US), simplified and converted to TopoJSON. State boundaries from the US Census cartographic files. Projection: Albers equal-area (AlbersUsa), which insets Alaska and Hawaii so the full federal estate appears at a single scale.

