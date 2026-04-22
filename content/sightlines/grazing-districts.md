---
title: "Taylor Grazing Districts"
date: 2026-04-20
lede: "The ninety-three BLM grazing districts established under the Taylor Grazing Act of 1934 — the administrative geography of the federal range. Where federal-rancher disputes have lived for ninety years."
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

## What the map shows

Ninety-three Taylor Grazing Act districts, each a polygon colored by the year it was organized. The Taylor Grazing Act of 1934 ended the open-range era and divided the remaining public domain into administrative districts — containers for the grazing permits, stocking-rate decisions, and allotment boundaries that the BLM would spend the next ninety years deciding on and defending.

**Read the year-coloring as a two-wave story:**

- **1934–1945** (cream through light gold): forty districts organized in the decade after the Act. Most of what the BLM still administers today as grazing land was marked out during this first wave.
- **1946–1959**: a slow trickle as the newly merged Bureau of Land Management (1946) inherited the Grazing Service's administrative map largely intact.
- **1960s** (rust): a second wave of twenty-four districts, largely consolidation and re-organization that anticipated FLPMA (1976). Some of these are new boundaries; most are administrative renumbering of previously-extant territory.

Districts are the coarse-grained view. Each district contains anywhere from dozens to hundreds of individual **allotments** (21,718 BLM allotments nationally), and the allotment is where the politics actually lives — that's where a specific rancher holds a specific permit to graze a specific number of cattle for a specific number of months. Disputes over stocking cuts, permit renewals, allotment closures, and sage-grouse / endangered-species-driven restrictions all play out at the allotment level. This map is the frame within which those fights happen.

## Why this map matters

The Taylor Grazing Act is where the sagebrush-rebellion grievance begins. Before 1934, ranchers grazed federal land under informal custom — the "first in time, first in right" logic of the open range. The Act replaced custom with permits and fees, creating an administrative relationship between rancher and federal agency that every subsequent sagebrush rebellion has contested. The 1946–48 "first Sagebrush Rebellion" (Senator Pat McCarran's hearings, Bernard DeVoto's *Harper's* essays) was fought over grazing cuts in these districts. The 1979 Rebellion was fought over them. Cliven Bundy's ranch lies inside the **Las Vegas District** (NV 0001); his accumulated unpaid fees are for grazing on a specific allotment within it.

Two visible patterns worth calling out:

- **The eleven-state geography**. The districts cluster exactly where the federal-land checkerboard is densest: Nevada, Utah, Idaho, Oregon, Wyoming, Montana, and the Colorado Plateau. The 14-state [federal lands choropleth](../federal-lands/) is the context; this map is the administrative overlay.
- **The national-forest gap**. National Forest System land is not represented here — those ~100 million acres are administered by the USDA Forest Service under different authority (the Granger-Thye Act of 1950 and its amendments), with its own allotment system. A parallel map of USFS range allotments would complete the federal-grazing picture.

## Data and method

- **Source**: Bureau of Land Management, National Taylor Grazing Act District Boundaries Polygons. Published as a free ArcGIS FeatureServer via BLM Egis; no API key required.
- **Fields used**: `TGA_NAME` (district name), `TGA_NR` (district number), `ADMIN_ST` (state), `BLM_ACRES` (populated for some), `TGA_EFF_DT` (effective date — year normalized into the displayed `effective_year` property).
- **Geometry**: simplified to ~0.01° for web delivery (240 KB GeoJSON). Full-fidelity boundaries available by removing the `maxAllowableOffset` parameter in [`scripts/build_grazing_districts.py`](https://github.com/hepplerj/sbr-website/blob/main/scripts/build_grazing_districts.py).
- **Count**: 93 active districts. The Act has organized a few more historically; this set reflects currently-administered boundaries.

## Extensions

- **USFS range allotments** (via USDA Forest Service EDW) — the other half of the federal-grazing picture. The National Forest system administers grazing on roughly 100 million acres under distinct statutes.
- **BLM grazing allotments**, 21,718 polygons at the fine scale. Available from the same BLM hub. Too dense for a national view but compelling for a regional zoom — e.g., the Gold Butte / Bunkerville allotments, or the Malheur-adjacent Harney County allotments.
- **Grazing fees over time** — the AUM (animal-unit-month) fee history, 1934–present. The fee has been below private-market grazing rates since its inception; this is a persistent rancher-side frustration and a persistent environmentalist-side one in the opposite direction.

## Companion views

- **[Federal Lands in the American West](../federal-lands/)** — the state-level context for where federal grazing land sits.
- **[US Federal Lands by Agency](../us-federal-lands/)** — the broader map of *which* federal bureau manages *what*; BLM's polygons are what this page administratively subdivides.
- **[A Federal Public-Lands Timeline, 1872–2024](../timeline/)** — the Taylor Grazing Act and its aftermath in the four-lane chronology.
