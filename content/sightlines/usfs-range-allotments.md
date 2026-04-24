---
title: "Forest Service Range Allotments"
date: 2026-04-20
lede: "The 8,440 grazing allotments administered by the US Forest Service. Where the BLM governs Taylor Grazing districts, the Forest Service governs forests and grasses."
weight: 19
draft: false
viz: map
themes: [public-lands, rural-economy]
regions: [great-plains, intermountain-west, pacific, national]
map:
  center: [42.0, -110.0]
  zoom: 4
  infotitle: "USFS range allotments"
  infoprompt: "Hover an allotment for name and ranger district."
  layers:
    - src: /data/usfs-allotments.geojson
      style: sage
      label: "Range allotments"
      choropleth: false 
      valuefield: nepa_year
      labelfield: allot_name
      domain: [1980, 2025]
      popupnote: "USFS range allotment"
---

This map illustrates every range allotment on the National Forest System representing roughly 95 million acres. 

About 7,256 allotments are active; another 1,100+ are vacant or vacant-unavailable: withdrawn from grazing, often because of conflicts with endangered species, watershed concerns, or lack of permittee interest. Vacant allotments are federal range that is legally grazing land on paper but empty on the ground. 5,891 allotments are cattle-only; 323 are sheep-only; 828 have multiple classes. The sheep allotments cluster in the Great Basin and northern Rockies.

## Data and method

- **Source**: USDA Forest Service, Enterprise Data Warehouse, `EDW_RangeManagement_01` MapServer (Range_Allotment layer). Free, no API key required.
- **Fields used**: `ALLOT_NAME`, `ADMIN_ORG_NAME` (ranger district), `ALLOT_STATUS`, `CATTLE`/`SHEEP`/`GOATS`/`HORSES`/`BISON` (yes/no flags, collapsed to a single `livestock` label for coloring), `GIS_ACRES`, `NEPA_DEC_APPROVED_FY`.
- **Geometry**: simplified to ~0.003° for web delivery; paginated in 2,000-polygon batches (the service caps per-query).

