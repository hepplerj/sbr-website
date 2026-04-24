---
title: "BLM Grazing Allotments by State"
date: 2026-04-20
lede: "The ~21,700 BLM grazing allotments across ten western states — the fine-scale geography where permit decisions, stocking rates, and endangered-species closures actually land. Pick a state to explore."
weight: 20
draft: false
viz: map
themes: [public-lands, rural-economy]
regions: [great-plains, intermountain-west, pacific, national]
map:
  center: [39.0, -117.0]
  zoom: 6
  legendtitle: "BLM grazing allotments"
  infotitle: "BLM grazing allotments"
  infoprompt: "Hover an allotment for its name; click for permit-office and acreage detail."
  layers:
    - src: /data/grazing-allotments-nv.geojson
      style: sage
      label: "Allotments"
      labelfield: allot_name
      hidefromcontrol: true
      popupnote: "BLM grazing allotment"
      popupfields:
        - field: acres
          label: "Acres"
          format: int
        - field: allot_no
          label: "Allotment no."
        - field: adm_ofc_cd
          label: "BLM office code"
    - src: /data/grazing-landmarks.geojson
      style: rust
      label: "Landmarks"
      labelfield: name
      pointradius: 9
      popupbodyfield: blurb
  stateselector:
    label: "State"
    default: "NV"
    layerindex: 0
    srctemplate: "/data/grazing-allotments-{state}.geojson"
    options:
      - { code: "AZ", name: "Arizona" }
      - { code: "CA", name: "California" }
      - { code: "CO", name: "Colorado" }
      - { code: "ID", name: "Idaho" }
      - { code: "MT", name: "Montana" }
      - { code: "NV", name: "Nevada" }
      - { code: "NM", name: "New Mexico" }
      - { code: "OR", name: "Oregon" }
      - { code: "UT", name: "Utah" }
      - { code: "WY", name: "Wyoming" }
    centers:
      AZ: [34.3, -111.7, 7]
      CA: [37.0, -119.5, 6]
      CO: [39.0, -105.5, 7]
      ID: [44.3, -114.5, 6]
      MT: [47.0, -109.5, 6]
      NV: [39.0, -117.0, 6]
      NM: [34.5, -106.0, 7]
      OR: [43.8, -120.0, 7]
      UT: [39.3, -111.7, 7]
      WY: [43.0, -107.5, 7]
---

This map illustrates the current (2026) Bureau of Land Management grazing allotments in each state. These lands are federal parcels on which specific ranchers (or grazing association) holds a federal permit to graze a set number of livestock for a season. Many federal land management decisions---from stock cuts to drought relief to sage-grouse habitat protection, to permit renewals---happen at this scale. 

The broader grazing scale can be see in the [Taylor Grazing Act districts](../grazing-districts/). 

Use the state selector on the map to explore each state's permit geography. Click any allotment to see its allotment number, acreage, and BLM office.

**State-by-state counts** (approximate as of 2026):

| State | Allotments |
|-------|------------|
| Montana | 5,700 |
| Wyoming | 3,600 |
| Colorado | 2,400 |
| New Mexico | 2,300 |
| Idaho | 2,100 |
| Oregon | 1,900 |
| Utah | 1,400 |
| Arizona | 920 |
| Nevada | 759 |
| California | 694 |

The grazing allotments are where the politics live: stock reductions that may upend a rancher's cattle business or a lawsuit brought against the BLM by an environmental group happens at the allotment level. The map also illustrates the checkerboard battern of grazing allotment boundaries. 

## Data and method

- **Source**: BLM National Grazing Allotment Polygons FeatureServer, filtered per state by `ADMIN_ST`.
- **Fields shown**: `ALLOT_NAME`, `ALLOT_NO`, `ADMIN_ST`, `ADM_OFC_CD` (BLM office code), `ADM_UNIT_CD`, `GIS_ACRES`.
- **Geometry**: simplified to ~0.002° per state.

