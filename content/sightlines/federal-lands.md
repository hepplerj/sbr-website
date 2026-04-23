---
title: "Federal Lands in the American West"
date: 2026-04-17
lede: "Federal ownership as a share of total land area, from the Intermountain West across the Northern Plains. The checkerboard in context."
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

## What the map shows

Federal land ownership in the West spans a dramatic range. In Nevada, the federal government owns roughly 80 percent of all land; in Utah, nearly two-thirds; in Idaho and Oregon, more than half. Across the Northern Plains — Nebraska, the Dakotas, and the eastern portions of Montana and Wyoming — federal ownership falls to a few percentage points. The fourteen states on this map run from just over 1 percent (Nebraska) to more than 80 percent (Nevada): a distribution with no analogue east of the Mississippi and the geographic backdrop against which every sagebrush rebellion unfolded.

## Data and method

State-level federal ownership shares are drawn from publicly reported BLM, USFS, NPS, FWS, and DoD holdings (all-agency totals, compiled by the Congressional Research Service). Shading uses a cream-to-rust ramp with seven bins chosen to resolve both the Plains (1–6 %) and the high-federal Intermountain West (60–80 %). State polygons are simplified boundaries from a public US-states GeoJSON.

This is a **starter dataset** — intended to convey the broad geography, not archival precision. It will be replaced with PAD-US county-level data in a forthcoming iteration.

## Reading the map

The visual argument of the map is a gradient. The **Intermountain interior** — Nevada, Utah, Idaho, Oregon — is the deepest rust: places where the federal government owns more land than it doesn't, and where transfer arguments have shaped state politics for a century. The **Rocky Mountain middle** — Wyoming, Colorado, Montana, New Mexico — sits in the middle of the ramp. The **Pacific states** (California, Washington) split the middle. And the **Northern Plains** — Nebraska, the Dakotas — shade to near cream.

That Plains lightness matters for this project. It is the direct visual consequence of the Bankhead-Jones-era federal retreat from the Great Plains: the government bought submarginal farmland, held a fraction of it as National Grasslands and Land Utilization Projects, and returned the rest to private hands. Where the federal presence on the Plains remains, it is concentrated in those retained parcels — which is why the [Bankhead-Jones Act Lands](../bankhead-jones/) map is a necessary companion to this one.
