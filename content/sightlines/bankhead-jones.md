---
title: "Bankhead-Jones Act Lands"
date: 2026-04-17
lede: "National Grasslands and Land Utilization Projects — the federal lands acquired under Title III of the Bankhead-Jones Farm Tenant Act of 1937."
weight: 20
draft: false
viz: map
themes: [public-lands, bankhead-jones, dust-bowl]
regions: [great-plains]
map:
  center: [44.87, -104.11]
  zoom: 6
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

## The Bankhead-Jones Farm Tenant Act

The **Bankhead-Jones Farm Tenant Act**, signed into law on July 22, 1937, was one of the New Deal's major responses to the Dust Bowl crisis. Title III of the act authorized the federal government to acquire "submarginal" farmland — land that could not sustain productive agriculture — and repurpose it for conservation, recreation, and managed grazing.

Through the Land Utilization Program, the government ultimately acquired approximately **11.3 million acres** across the Great Plains and elsewhere. These lands were initially managed by the Soil Conservation Service, then transferred between several agencies before roughly 5.5 million acres came under the USDA Forest Service in 1954. In 1960, Secretary of Agriculture Ezra Taft Benson designated 3.8 million of those acres as **National Grasslands** — the 20 units shown in green on this map.

The remaining Forest Service lands not designated as National Grasslands persist as **Land Utilization Projects**, shown in gold. Other Bankhead-Jones lands were transferred to the Bureau of Land Management, Fish and Wildlife Service, Bureau of Indian Affairs, and National Park Service, and are not depicted here.

## Why this map matters to the sagebrush rebellions

The Bankhead-Jones lands are not usually framed as a sagebrush-rebellion story, but they are central to it. They are the most visible surviving result of the federal government's Dust Bowl-era claim that it could buy out failing agriculture and keep the land in permanent public trust. Every subsequent argument about whether the federal government *should* own the Western range — in 1934, in 1979, in 2016 — runs in part against the precedent this acreage established.

## Sources

- National Grasslands boundaries: USDA Forest Service, [EDW ArcGIS REST Services](https://apps.fs.usda.gov/arcx/rest/services/EDW/EDW_ProclaimedForestsAndGrasslands_01/MapServer/1) (EDW_ProclaimedForestsAndGrasslands_01/MapServer/1).
- Land Utilization Projects: USDA Forest Service, [EDW ArcGIS REST Services](https://apps.fs.usda.gov/arcx/rest/services/EDW/EDW_LandUtilizationProject_01/MapServer/0) (EDW_LandUtilizationProject_01/MapServer/0).
- All Federal Lands (context layer): USDA Forest Service Enterprise Data Warehouse.
- General administrative history: 36 CFR Part 213, [Administration of Lands Under Title III of the Bankhead-Jones Farm Tenant Act](https://www.ecfr.gov/current/title-36/chapter-II/part-213).
- U.S. Forest Service, [National Grasslands overview](https://www.fs.usda.gov/managing-land/national-forests-grasslands/national-grasslands).
