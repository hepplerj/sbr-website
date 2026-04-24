---
title: "Federal Lands in the American West"
date: 2026-04-17
lede: "Federal ownership as a share of total land area, from the Far West across the Northern Plains."
weight: 10
draft: false
viz: map
themes: [public-lands]
regions: [northern-plains, intermountain-west, rocky-mountain, southwest]
map:
  center: [43.0, -104.0]
  zoom: 5
  legendtitle: "Federal ownership"
  infotitle: "Western states"
  infoprompt: "Hover a state for federal-ownership share."
  layers:
    - src: /data/federal-lands.geojson
      style: sage
      label: "Federal share"
      choropleth: true
      valuefield: federal_pct
      labelfield: name
      valueunit: "%"
      popupnote: "Federal share of total state area."
---

Federal land ownership in the West spans a dramatic range. In Nevada, the federal government owns over 80 percent of all land; in Utah, nearly two-thirds; in Idaho and Oregon, more than half. Across the Northern Plains these numbers dwindle considerably: Nebraska, the Dakotas, and the eastern portions of Montana and Wyoming fall to small percentages. The fourteen states on this map run from just over 1 percent (Nebraska) to more than 80 percent (Nevada).

Visually, the map conveys the degree of federal land ownership in the region. Throughout the Great Basin---Nevada, Utah, Idaho---the federal government manages a lot of land. That ownership and management influences where transfer arguments have shaped state politics for a century.

Part of my argument, however, is that this representation of federal presence on the land in actual numbers occludes the influence of sagebrush-style politics across the Great Plains. Part of this is a reflection of recreation: the Interior and Far Western states have larger land management areas for grazing, fewer privatized tracts of land, and far more National Parks. Yet the federal presence on the Plains is still evident, more specifically in the [Bankhead-Jones Act lands](../bankhead-jones/).

## Data and method

State-level federal ownership shares are drawn from publicly reported BLM, USFS, NPS, FWS, and DoD holdings (all-agency totals, compiled by the Congressional Research Service). Shading uses a cream-to-rust ramp with seven bins chosen to resolve both the Plains (1–6 %) and the high-federal Intermountain West (60–80 %). State polygons are simplified boundaries from a public US-states GeoJSON.


