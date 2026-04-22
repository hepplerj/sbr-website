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
      popupnote: "BLM grazing allotment"
      popupfields:
        - field: allot_no
          label: "Allotment no."
        - field: acres
          label: "Acres"
          format: int
        - field: adm_ofc_cd
          label: "BLM office"
        - field: adm_unit_cd
          label: "Admin unit"
        - field: admin_st
          label: "State"
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

## What the map shows

Every BLM grazing allotment in the selected state. Each allotment is a named permit area: a parcel of federal range on which a specific rancher (or grazing association) holds a federal permit to graze a specific class and number of livestock for a specific season. The allotment is the administrative atom of federal-range politics — every decision that matters (stocking cuts for drought, closures for sage-grouse habitat, permit renewals or suspensions) happens at this scale.

The [Taylor Grazing Act districts](../grazing-districts/) are the coarse frame; this is the fine weave inside ten states. Use the **state selector** above the map to explore each state's permit geography. Click any allotment to see its allotment number, acreage, and BLM office.

**State-by-state counts** (approximate):

| State | Allotments | Notes |
|-------|-----------:|-------|
| Montana | 5,700 | Largest allotment inventory. Cattle-dominant; mix with private land extensive. |
| Wyoming | 3,600 | Second largest. Includes contested Bridger-Teton and Bighorn Basin areas. |
| Colorado | 2,400 | Western Slope concentration. |
| New Mexico | 2,300 | Chihuahuan Desert range, heavy Navajo Nation adjacency. |
| Idaho | 2,100 | Includes Owyhee Canyonlands — a perennial legal battleground. |
| Oregon | 1,900 | Includes the Harney County allotments surrounding Malheur NWR. |
| Utah | 1,400 | Includes Grand Staircase-Escalante allotments. |
| Arizona | 920 | Strip-country and Sonoran Desert allotments. |
| Nevada | 759 | **Bundy country** — Bunkerville, Gold Butte, Elko-area allotments. |
| California | 694 | Great Basin side of the state plus the Carrizo Plain. |

## Why this scale matters

Sagebrush-rebellion politics lives at the allotment level. When a rancher says "the federal government took my ranch," what they usually mean is "my allotment was closed or my stocking rate was cut." When an environmental group sues the BLM, it usually asks the court to order closure, reduced AUMs (animal-unit-months), or new NEPA analysis on a specific allotment. Every famous standoff in the movement — Cliven Bundy's 1993 permit fight, the 2014 Bunkerville confrontation, the 2016 Malheur occupation (rooted in the Hammond family's Steens Mountain allotment prosecution) — was fundamentally an allotment-scale dispute.

The state view foregrounds this scale. Zoomed in, you can trace where checkerboard patterns from the railroad land grants still dictate allotment boundaries; where wilderness study areas carve allotments into active and inactive portions; where one allotment of a few hundred acres sits inside another of several hundred thousand.

## Landmarks worth finding

- **Bunkerville and Gold Butte** (Nevada, southeast corner). Cliven Bundy's allotments sit in a checkerboard with Gold Butte National Monument (2016) and the desert-tortoise critical-habitat area whose protection underpinned the 1993 permit non-renewal that began the Bundy standoff.
- **Elko County** (Nevada, northeast). Birthplace of the 1979 Sagebrush Rebellion. Dense cattle allotments and ongoing Jarbidge and Ruby Mountain disputes.
- **Owyhee Canyonlands** (Idaho/Oregon border). Complex mosaic of wilderness, wilderness study areas, and grazing permits; persistent litigation.
- **Harney County** (Oregon, southeast). The 2016 Malheur NWR occupation occurred adjacent to these allotments; the Hammond family's Steens Mountain allotment was the proximate cause.
- **Grand Staircase-Escalante** (Utah, south-central). The Clinton-Trump-Biden monument redesignations directly affected allotment management.

## Data and method

- **Source**: BLM National Grazing Allotment Polygons FeatureServer, filtered per state by `ADMIN_ST`. Free, no API key required.
- **Fields shown**: `ALLOT_NAME`, `ALLOT_NO`, `ADMIN_ST`, `ADM_OFC_CD` (BLM office code), `ADM_UNIT_CD`, `GIS_ACRES`.
- **Geometry**: simplified to ~0.002° per state.
- **Pre-built per-state files**: ten `grazing-allotments-<state>.geojson` files at `/data/`. The state selector swaps which file is loaded without reloading the page.
- **Coverage**: ten Taylor-Grazing-Act states. North Dakota, South Dakota, Washington, and Nebraska are nominal TGA states but hold no allotments in the current BLM inventory.

## Companion views

- **[Taylor Grazing Districts](../grazing-districts/)** — the state-scale frame above these polygons.
- **[USFS Range Allotments](../usfs-range-allotments/)** — the Forest Service's parallel network on the higher country.
- **[Federal Lands in the American West](../federal-lands/)** — the state-level context for federal ownership patterns.
