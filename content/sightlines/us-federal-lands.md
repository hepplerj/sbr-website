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

## What the map shows

Roughly 28 percent of the United States — about 640 million acres — is owned and managed by the federal government. This map renders every federal parcel in the lower 48 plus Alaska and Hawaii, colored by the agency that holds it.

Four agencies own the overwhelming majority of the acreage: the **US Forest Service** (green), the **Bureau of Land Management** (gold), the **Fish & Wildlife Service** (olive), and the **National Park Service** (navy). Together they manage most of what the public thinks of as "public lands" — the national forests, the BLM grazing districts, the wildlife refuges, the national parks and monuments. The rest — Defense installations, Bureau of Reclamation water projects, tribal trust lands through the BIA, and a long tail of smaller agencies — account for a minority of acres but often a disproportionate share of local politics.

## Why the agency distinction matters

The "federal government owns the land" framing of the sagebrush rebellions flattens a crucial distinction: federal agencies hold their lands under very different statutory regimes and serve very different purposes. BLM lands are explicitly *multiple-use* — grazing, mineral leasing, recreation, wildlife habitat — and most of the rancher grievances that drove the 1979 movement were specifically about BLM administration. Forest Service lands share some of that multiple-use logic but are tilted toward timber and watershed protection. Park Service and Fish & Wildlife lands are designated for preservation and are much more difficult to unwind. When Sagebrush rebels talked about "the federal lands," they often meant BLM specifically; transferring those acres was plausible in a way that transferring Yellowstone was not.

The color argument of the map is this: the yellow (BLM) dominates the Great Basin and Intermountain interior; the green (Forest Service) traces the continental Rockies and Cascades; the olive (FWS) scatters along the flyways; the navy (Park Service) concentrates in a handful of large units. The sagebrush rebellions are, in large part, a BLM-territory phenomenon.

## Data and method

Source: US federal land polygons compiled from the Protected Areas Database of the United States (PAD-US), simplified and converted to TopoJSON. State boundaries from the US Census cartographic files. Projection: Albers equal-area (AlbersUsa), which insets Alaska and Hawaii so the full federal estate appears at a single scale.

This dataset is a **2014-vintage snapshot** — it represents the picture at the time the file was assembled for an earlier version of this project. Agency boundaries shift (land is added, transferred, or sold) and a current-year update will replace it in a future iteration.

## Reading alongside the other maps

- The [state-level Federal Lands map](../federal-lands/) shows ownership *share* by state — the aggregate argument for where federal presence is concentrated.
- This map shows ownership *distribution* by agency — which bureau is where.
- The [Bankhead-Jones Act Lands map](../bankhead-jones/) zooms into one specific slice — the submarginal-farmland parcels acquired under Title III of the 1937 Act, which the Forest Service manages as National Grasslands and Land Utilization Projects.

Together they describe the legal and spatial architecture the sagebrush rebellions have argued against for nearly a century.
