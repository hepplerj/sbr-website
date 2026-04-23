---
title: "Regional Precipitation: Plains, Southwest, Northwest, West"
date: 2026-04-18
lede: "Annual precipitation anomalies for the four NOAA climate regions covering the American West and Plains, 1895–2024. Stacked to reveal the regional drought story that the CONUS average conceals."
weight: 45
draft: false
viz: chart
themes: [climate, dust-bowl, farm-crisis]
regions: [national, northern-plains, southern-plains, intermountain-west, pacific-northwest]
chart:
  src: /data/regions-precipitation.json
  type: stripes-stacked
  datapath: regions
  serieslabel: label
  seriesdata: data
  field: anomaly
  xfield: year
  palette: precip
  domain: [-10, 10]
  title: "Regional annual precipitation anomaly, 1895–2024"
  unitshort: "in"
  infotitle: "Regional precipitation"
  infoprompt: "Hover a stripe for a region's year-over-year anomaly."
  annotations:
    - { year: 1934, label: "Dust Bowl" }
---

## What the chart shows

Four NOAA climate regions, each one year of precipitation per vertical stripe, color-encoded by anomaly against a 1901–2000 baseline — **brown for drier**, **blue for wetter**. Stacked on a shared 130-year x-axis so the West's drought history is legible at a glance.

**The regions are very different places climatologically.** The Northwest averages 32 inches of precipitation a year; the Southwest averages 15. Anomalies — each region against its own baseline — are the right comparison, and the chart surfaces two things the CONUS-average chart cannot:

1. **Regional phase shifts.** Years that read as moderately dry at the national level are often severe drought in one region while the others are wet. 2012 is the clearest case: the Plains and Southwest were at −4 inches, the Northwest was at +6.6 inches, the West was near-normal. The Pacific rains masked the interior collapse.
2. **Region-specific record years.** California's driest single year on record is **2013 (−9.7 in)**, not visible in the CONUS chart because the rest of the country was at or above normal that year. The Southwest's driest is **1956 (−6.1 in)**, not 1934 — a distinction that matters because the Southwest's 1950s drought drove a specific federal-land politics (Utah and Arizona water compacts) that the Dust Bowl did not.

## What to look for

- **The 1920s dryness in the Plains** — a band of brown across the Northern Rockies & Plains row in the 1920s. This is the climate half of the 1920s agricultural depression visible in the [farm-bankruptcies chart](../farm-bankruptcies/).
- **The 1934–1940 Dust Bowl** shows strongest in the Northern Rockies & Plains and Southwest. The Pacific states were not in drought.
- **The 1950s Plains drought** (1953–1957) is as severe in the Southwest as the 1930s were. This is the backdrop for the 1960 designation of the National Grasslands.
- **The 1977 drought** is a Western event — severe in the West and Northwest, moderate in the Plains. It is rarely remembered at the national scale but shapes the water-rights politics of the late 1970s, including the original Sagebrush Rebellion.
- **The 2000s–2010s Western megadrought** reads as sustained brown in the Southwest and West, with the Northern Rockies & Plains joining from 2012 onward. This is the climate context for the Bundy standoffs at Bunkerville (2014) and Malheur (2016).

## Why it matters for the sagebrush rebellions

The rebellions are regional phenomena, not national ones, and the CONUS precipitation chart erases that. Every specific episode is better understood against its regional climate than against the country as a whole:

| Rebellion / event | Region(s) in drought | CONUS picture |
|---|---|---|
| Taylor Grazing Act (1934) | Plains + Southwest | Also dry |
| Nat'l Grasslands designation (1960) | Southwest still recovering from 1950s | Normal |
| Sagebrush Rebellion (1979) | West + Northwest | Wet |
| Wise Use / 1988 drought | Plains | Dry |
| Bundy Ranch (2014) | West + Southwest | Moderate |
| Malheur (2016) | Northwest (reversed) | Wet |

The table makes a narrow point: **drought conditions are a necessary but not sufficient cause**. The West in 1979 was *wet*, and the Rebellion happened anyway — because the grievance was administrative, not environmental. Malheur 2016 occurred during a wet year in the Northwest; the occupation was animated by federal-authority politics, not immediate rancher-survival pressure. But the deeper pattern — 1920s, 1930s, 1950s, 2012-onward — is unmistakable.

## Data and method

- **Source**: NOAA NCEI Climate at a Glance, regional time series (nClimDiv), annual totals computed by summing monthly precipitation values (January–December).
- **Regions**: code 105 Northern Rockies & Plains (MT, WY, NE, ND, SD); 107 Southwest (AZ, CO, NM, UT); 108 Northwest (ID, OR, WA); 109 West (CA, NV). These are NOAA-defined aggregations, not project-custom ones.
- **Anomalies**: year total minus the region's own 1901–2000 mean. Each region's baseline differs substantially (Northwest 32.1 in, Southwest 14.6 in), so anomalies — not absolute totals — are the right comparison.
- **Color scale**: shared diverging scale from rust-brown (−10 in) through cream (0) to navy (+10 in). The domain matches the largest observed regional extremes (California 2013: −9.7; Northwest 1996: +12.8). A few extreme Pacific-states wet years saturate at the right edge of the ramp.

Individual-state breakouts — Nebraska, Montana, Nevada, the full fifteen-state panel — are a natural next step, using the same NOAA endpoints with state codes instead of region codes.
