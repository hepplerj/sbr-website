---
title: "Bankhead-Jones Act Lands"
date: 2026-04-17
lede: "National Grasslands and Land Utilization Projects — the federal lands acquired under Title III of the Bankhead-Jones Farm Tenant Act of 1937."
weight: 20
draft: false
viz: map
themes: [public-lands, bankhead-jones, dust-bowl]
regions: [northern-plains, southern-plains]
map:
  center: [44.08, -103.23]
  zoom: 7
  legendtitle: "Bankhead-Jones Lands"
  infotitle: "Bankhead-Jones Lands"
  infoprompt: "Hover a unit for name and acreage."
  layers:
    - src: /data/federal_lands.geojson
      style: context
      label: "All federal lands"
    - src: /data/land_utilization_projects.geojson
      style: gold
      label: "Land Utilization Projects"
      labelfield: LUP_NAME
      fallbacklabel: "Land Utilization Project"
      valuefield: GIS_ACRES
      valueunit: " acres"
      popupnote: "Bankhead-Jones Title III · USDA Forest Service"
    - src: /data/national_grasslands.geojson
      style: green
      label: "National Grasslands"
      labelfield: GRASSLANDNAME
      valuefield: GIS_ACRES
      valueunit: " acres"
      popupnote: "National Grassland · USDA Forest Service"
---

The Bankhead-Jones Farm Tenant Act, signed into law on July 22, 1937, was one of the New Deal's major responses to the Dust Bowl. Title III of the act authorized the federal government to acquire "submarginal" farmland (land unable to sustain productive agriculture) and repurpose it. Through the program, the government ultimately acquired approximately 11.3 million acres across the Great Plains. Managed initially by the Soil Conservation Service, these lands were eventually transferred to the Forest Service in 1954. In 1960, Secretary of Agriculture Ezra Taft Benson designated 3.8 million of those acres as National Grasslands. Those are visible in green on this map.

All federal lands are shown in the purple shading on the map to give a sense of context where the grasslands are in relation to all other federal public land.

## Sources

- National Grasslands boundaries: USDA Forest Service, [EDW ArcGIS REST Services](https://apps.fs.usda.gov/arcx/rest/services/EDW/EDW_ProclaimedForestsAndGrasslands_01/MapServer/1) (EDW_ProclaimedForestsAndGrasslands_01/MapServer/1).
- Land Utilization Projects: USDA Forest Service, [EDW ArcGIS REST Services](https://apps.fs.usda.gov/arcx/rest/services/EDW/EDW_LandUtilizationProject_01/MapServer/0) (EDW_LandUtilizationProject_01/MapServer/0).
- All Federal Lands (context layer): USDA Forest Service Enterprise Data Warehouse.
- General administrative history: 36 CFR Part 213, [Administration of Lands Under Title III of the Bankhead-Jones Farm Tenant Act](https://www.ecfr.gov/current/title-36/chapter-II/part-213).
- U.S. Forest Service, [National Grasslands overview](https://www.fs.usda.gov/managing-land/national-forests-grasslands/national-grasslands).
