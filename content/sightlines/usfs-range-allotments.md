---
title: "USFS Range Allotments"
date: 2026-04-20
lede: "The 8,440 grazing allotments administered by the US Forest Service — the other half of the federal-range picture. Where the BLM governs Taylor Grazing districts, the Forest Service governs the mountains above them."
weight: 19
draft: false
viz: map
themes: [public-lands, rural-economy]
regions: [great-plains, intermountain-west, pacific, national]
map:
  center: [42.0, -110.0]
  zoom: 4
  legendtitle: "Most recent NEPA decision (FY)"
  infotitle: "USFS range allotments"
  infoprompt: "Hover an allotment for name, ranger district, and the fiscal year of its most recent NEPA decision."
  layers:
    - src: /data/usfs-allotments.geojson
      style: sage
      label: "Range allotments"
      choropleth: true
      valuefield: nepa_year
      labelfield: allot_name
      domain: [1980, 2025]
      popupnote: "USFS range allotment"
---

## What the map shows

Every range allotment on the National Forest System — 8,440 polygons covering roughly 95 million acres, administered by individual ranger districts across 154 national forests and grasslands. Each polygon is colored by the fiscal year of its **most recent NEPA decision** (the legal document authorizing continued grazing). Large swaths of the map are pale: many allotments haven't been reauthorized since the 1990s or 2000s, and the Forest Service is chronically behind on the ten-year renewal cycle its own regulations contemplate.

**What to look for:**

- **Active vs. vacant.** About 7,256 allotments are active; another 1,100+ are vacant or vacant-unavailable — withdrawn from grazing, often because of conflicts with endangered species, watershed concerns, or lack of permittee interest. Vacant allotments are federal range that is legally grazing land on paper but empty on the ground.
- **Livestock mix.** 5,891 allotments are cattle-only; 323 are sheep-only; 828 have multiple classes. The sheep allotments cluster in the Great Basin and northern Rockies — the historic transhumance geography of Basque and Peruvian herders working the summer range.
- **The NEPA backlog.** The paler the polygon, the longer since the last decision. When an allotment hasn't cleared NEPA in twenty years, its grazing is running on appropriations riders that exempt it from the normal review — a persistent source of litigation from environmental groups.

## Why this map matters

The Taylor Grazing Act districts (see the [companion map](../grazing-districts/)) cover the BLM estate — roughly 155 million acres of the driest western range. National Forest System range sits *above* that geography, on the higher, wetter, forested slopes where cattle and sheep summer after wintering on BLM or private land. A working ranch in the West usually braids both: a BLM winter allotment, a USFS summer allotment, and deeded base property. Sagebrush-rebellion politics has targeted both agencies, but the dynamics are distinct. USFS grazing sits inside a multiple-use mandate (the Multiple-Use Sustained-Yield Act of 1960) that explicitly weighs recreation, timber, wildlife, and wilderness against grazing — and has done so longer than FLPMA (1976) required the same of the BLM.

Two patterns worth reading:

- **The federal-forest gap in the Great Basin.** Compare this map to the BLM grazing districts: where the BLM is dense (Nevada, southern Utah, southern Idaho), the USFS is sparse. The Forest Service administers the mountain islands; the BLM administers the basin floors. This vertical division is the administrative echo of the ecological one.
- **Region 1 and Region 4.** The Northern Region (Montana, northern Idaho) and the Intermountain Region (southern Idaho, Utah, Nevada, western Wyoming) hold the densest allotment geography. These are the regions where the Forest Service's grazing caseload — and the political pressure around it — concentrates.

## Data and method

- **Source**: USDA Forest Service, Enterprise Data Warehouse, `EDW_RangeManagement_01` MapServer (Range_Allotment layer). Free, no API key required.
- **Fields used**: `ALLOT_NAME`, `ADMIN_ORG_NAME` (ranger district), `ALLOT_STATUS`, `CATTLE`/`SHEEP`/`GOATS`/`HORSES`/`BISON` (yes/no flags, collapsed to a single `livestock` label for coloring), `GIS_ACRES`, `NEPA_DEC_APPROVED_FY`.
- **Geometry**: simplified to ~0.003° for web delivery; paginated in 2,000-polygon batches (the service caps per-query).
- **Count**: 8,440 allotments nationwide.

## Companion views

- **[Taylor Grazing Districts](../grazing-districts/)** — the BLM side of the federal-range map.
- **[BLM Grazing Allotments by State](../grazing-allotments/)** — the fine-scale BLM allotment geography, with a state-picker.
- **[US Federal Lands by Agency](../us-federal-lands/)** — the broader map of who administers what.
