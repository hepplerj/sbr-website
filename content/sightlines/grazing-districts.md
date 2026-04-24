---
title: "Taylor Grazing Districts"
date: 2026-04-20
lede: "The ninety-three BLM grazing districts established under the Taylor Grazing Act of 1934: the administrative geography of the federal range."
weight: 18
draft: false
viz: map
themes: [public-lands, rural-economy]
regions: [great-plains, intermountain-west, pacific, national]
map:
  center: [41.0, -110.0]
  zoom: 5
  legendtitle: "Effective year"
  infotitle: "Taylor Grazing districts"
  infoprompt: "Hover a district for name, state, and the year it was organized under the 1934 Taylor Grazing Act."
  layers:
    - src: /data/grazing-districts.geojson
      style: sage
      label: "Grazing districts"
      choropleth: true
      valuefield: effective_year
      labelfield: tga_name
      domain: [1934, 1975]
      popupnote: "Taylor Grazing Act district · BLM-administered"
---

This map illustrates the 93 Taylor Grazing Act districts, colored by the year it was organized. The Taylor Grazing Act of 1934 divided the remaining public domain into administrative districts to manage grazing permits, stocking-rate decisions, and allotment boundaries. 


These districts provide an overview; a closer frame can be viewed in the [BLM allotments by state](../grazing-allotments/) since individual district contains anywhere from dozens to hundreds of individual allotments.

The Taylor Grazing Act notably prompts a major conflict between ranchers and federal land management. Before 1934, ranchers grazed federal land under informal custom---"first in time, first in right." The Act instituted permits and fees, creating an administrative relationship between rancher and federal agency. What we might consider the first Sagebrush Rebellion emerged in the wake of the TGA when, between 1946 and 1948 Senator Pat McCarran's hearings into grazing fees and Bernard DeVoto's *Harper's* essays represented the poles of the debate. 

## Data and method

- **Source**: Bureau of Land Management, National Taylor Grazing Act District Boundaries Polygons. Published as a free ArcGIS FeatureServer via BLM Egis; no API key required.
- **Fields used**: `TGA_NAME` (district name), `TGA_NR` (district number), `ADMIN_ST` (state), `BLM_ACRES` (populated for some), `TGA_EFF_DT` (effective date — year normalized into the displayed `effective_year` property).
- **Geometry**: simplified to ~0.01° for web delivery (240 KB GeoJSON). Full-fidelity boundaries available by removing the `maxAllowableOffset` parameter in [`scripts/build_grazing_districts.py`](https://github.com/hepplerj/sbr-website/blob/main/scripts/build_grazing_districts.py).

