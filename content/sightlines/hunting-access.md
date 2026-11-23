---
title: "Private Land Open to Hunting"
date: 2026-11-23
lede: "Easements keep private land closed. Walk-in leases open it. Where the two instruments fall on the Plains."
weight: 17
draft: true
viz: map
themes: [public-lands]
regions: [northern-plains, southern-plains]
map:
  renderer: d3
  src: /data/fedland.topojson
  statesobject: states
  dataobject: fedland
  colorfield: type
  alignsrc: /data/states.json
  infotitle: "Access and interest in land"
  infoprompt: "Hover anywhere. The panel reports federal fee title, federal easements, and state walk-in leases at that point."
  floatinfo: true
  probetitle: "At this point"
  feelabel: "Fee title, by agency"
  feenone: "None — private, state, or tribal fee"
  layerstitle: "Layers"
  legendtitle: "Managing agency"
  legendorder: [FS, BLM, FWS, NPS, BOR, DOD, BIA, TVA, DOE, NASA, VA, USDA, DOJ, DOT, HHS, MWAA]
  layers:
    - id: access
      kind: polygons
      label: "State walk-in hunting leases (ND, KS, NE, MT, WY, CO)"
      probelabel: "Walk-in"
      src: /data/hunting-access.json
      color: "#b5651d"
      namefield: name
      on: true
    - id: easements
      kind: points
      label: "Federal easements on private land (no public access)"
      probelabel: "Easement"
      src: /data/federal-interests-easements.json
      color: "#1f6b66"
      dotradius: 0.85
      hitradius: 3
      opacity: 0.6
      on: true
      yearfilter: false
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

<!-- EXPLORATORY DRAFT (branch explore/hunting-access). Prose is the author's.
Editorial cues:
- Easement ≠ access. FWS/DU easements restrict drainage and plowing; the land stays private and closed.
- Walk-in leases are the access instrument: ND PLOTS (1997), KS WIHA (1995), funded partly by USDA VPA-HIP since the 2008 Farm Bill.
- NGO co-funding is visible in the data: ND units labeled "PLOTS - Ducks Unlimited" (5 areas, ~5k ac) and "PLOTS - Mule Deer Foundation" (23 areas, ~67k ac).
- Snapshot, 2026–27 season: ND 3,854 areas / ~938k ac; KS 3,591 areas / ~963k ac (KS 2018: ~1.16M ac).
- Counterpoint to transfer politics: the state pays private owners for public access.
-->
