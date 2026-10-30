---
title: "US Federal Lands by Agency"
date: 2026-09-24
lede: "Federal ownership as a share of total land area, from the Far West across the Northern Plains."
weight: 16
draft: false
viz: map
themes: [public-lands]
regions: [northern-plains, rocky-mountain, intermountain-west, southwest]
map:
  renderer: d3
  src: /data/fedland.topojson
  statesobject: states
  dataobject: fedland
  colorfield: type
  alignsrc: /data/states.json
  infotitle: "Federal interests in land"
  infoprompt: "Turn on a layer, then hover anywhere. The panel reports every federal interest at that point."
  floatinfo: true
  probetitle: "Federal interests here"
  feelabel: "Fee title, by agency"
  feenone: "None — private, state, or tribal fee"
  layerstitle: "Layers"
  legendtitle: "Managing agency"
  legendorder: [FS, BLM, FWS, NPS, BOR, DOD, BIA, TVA, DOE, NASA, VA, USDA, DOJ, DOT, HHS, MWAA]
  layers:
    - id: trust
      kind: polygons
      label: "Land held in trust"
      probelabel: "Trust"
      src: /data/federal-interests-trust.json
      color: "#a94b2b"
      texture: hatch
      namefield: name
      on: false
    - id: easements
      kind: points
      label: "Federal easements on private land"
      probelabel: "Easement"
      src: /data/federal-interests-easements.json
      # A hue outside the agency palette on purpose: an easement is a
      # different kind of interest, not one more agency.
      color: "#1f6b66"
      dotradius: 0.85
      hitradius: 3
      opacity: 0.6
      on: false
      yearfilter:  false
      yearlabel: "Acquired"
    - id: greatplains
      kind: outline
      label: "Great Plains (Fenneman, 1928)"
      src: /data/physio-great-plains.geojson
      color: "#5a3a28"
      width: 2.2
      on: false
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

Federal land management in the West spans a dramatic range. In Nevada, the federal government owns over 80 percent of all land; in Utah, nearly two-thirds; in Idaho and Oregon, more than half. Across the Northern Plains these numbers dwindle considerably: Nebraska, the Dakotas, and the eastern portions of Montana and Wyoming fall to small percentages. The fourteen states on this map run from just over 1 percent (Nebraska) to more than 80 percent (Nevada). Yet the federal footprint still remains, especially in places where land is never quite public and never quite private.

Visually, the map conveys the degree of federal land ownership in the region. Throughout the Great Basin---Nevada, Utah, Idaho---the federal government manages a lot of land. That ownership and management influences where transfer arguments have shaped state politics for a century. Importantly, there's another layer: the federal easements on private lands for conservation. The blue swath across the Dakotas illustrates another part of the story: just what is public, and what is private?

**Northern Plains Easements**

| State | Tracts | Acres | Percentage of State |
| ----- | ------ | ----- | ------------------- |
| South Dakota | 16,165 tracts |   1,922,632 ac | 35.4% |
| North Dakota | 18,266 tracts | 1,805,448 ac | 33.3% |
| Montana | 870 tracts | 616,667 ac | 11.4% |
| Minnesota | 4,418 tracts | 384,920 ac | 7.1% |

The Dakotas alone account for 34,431 tracts and 3,728,080 acres --- 68.7% of the national total. The five Prairie Pothole states comprise 93.0% of tracts, 87.2% of acreage; 38,888 of these are Waterfowl Production Area easements (4,390,109 ac).

**Cumulative Federal Easements**

| Year | Tracts | Cumulative |
| ---- | ------ | ---------- |
| pre-1960 | 391 tracts |  1.0% |
| 1960s | 11,006 tracts | 27.6% |
| 1970s | 7,579 tracts | 46.0% |
| 1980s | 3,414 tracts | 54.3% |
| 1990s | 5,871 tracts | 68.5% |
| 2000s | 4,640 tracts | 79.7% |
| 2010s | 5,082 tracts | 92.0% |
| 2020s | 3,285 tracts | 100.0% |

## Data and method

**Fee lands** are federal parcels compiled from the Protected Areas Database of the United States (PAD-US), pre-projected to an Albers equal-area (AlbersUsa) canvas that insets Alaska and Hawaii.

**Trust lands** are the Bureau of Indian Affairs' American Indian and Alaska Native Land Area Representations (LAR)---335 polygons, about 126.9 million acres, generalized to roughly 400 m for national-scale display. LAR distinguishes reservation and trust tracts from off-reservation trust land. 

**Easements** are US Fish & Wildlife Service National Realty tracts filtered to easement interest (`INTTYPE1 = 'E'`): 42,755 tracts totaling 5,429,148 deeded acres, of which 38,888 tracts and 4,390,109 acres are Waterfowl Production Area wetland and grassland easements. Each tract is drawn as a single dot at its centroid rather than as its outline. Easement tracts run 40–160 acres.

Both federal-interest overlays are drawn in the browser from EPSG:4326 source data. Because the fee layer arrives with its projection already baked into the file, the renderer recovers that projection's parameters by fitting a live AlbersUsa to the file's own state outlines, then reuses it for the overlays.

Sources: BIA Branch of Geospatial Support, AIAN National LAR; US Fish & Wildlife Service, National Realty Tracts. Both retrieved 2026-07-24.
