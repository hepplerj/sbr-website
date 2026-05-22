---
title: "Regional Temperature: Plains, Southwest, Northwest, West"
date: 2026-05-21
lede: "Annual temperature anomalies for the four NOAA climate regions covering the American West and Plains, 1895–2024. Stacked to show how unevenly the warming has landed across the region."
weight: 32
draft: false
viz: chart
themes: [climate, dust-bowl, farm-crisis]
regions: [national, northern-plains, southern-plains, intermountain-west, pacific-northwest]
chart:
  src: /data/regions-temperature.json
  type: stripes-stacked
  datapath: regions
  serieslabel: label
  seriesdata: data
  field: anomaly
  xfield: year
  palette: temp
  domain: [-4, 4]
  title: "Regional annual temperature anomaly, 1895–2024"
  unitshort: "°F"
  infotitle: "Regional temperature"
  infoprompt: "Hover a stripe for a region's year-over-year anomaly."
  periods:
    - { start: 1930, end: 1940, label: "Dust Bowl",
        description: "The 1930s registered as a genuine heat anomaly across the Plains — visible here as a rust band — compounding the drought and erosion of the period." }
    - { start: 2000, end: 2024, label: "Western megadrought",
        description: "The driest two-decade stretch in the West since at least 800 CE per tree-ring reconstruction. Sustained warming intensifies it: hotter air pulls more moisture from soil and snowpack." }
---

This chart uses the four NOAA climate regions to render each year of mean temperature as a vertical stripe, color-encoded by anomaly against a 1901–2000 baseline: blue for cooler, rust for warmer. Read alongside the [regional-precipitation chart](../regional-precipitation/), it completes the picture of a warming, drying West.

The four regions read as a single story told four times. Every region's right edge is rust — the warming is universal — but the *pace* differs. The Northern Rockies & Plains has warmed the most in absolute terms, posting the largest single-year anomalies of the four. The Southwest and West rows show the cleaner, more monotonic march: cool blues through the early twentieth century, a near-unbroken wall of rust since the 1980s.

The mid-century is the interesting exception. The 1930s burn rust on the Plains row — the Dust Bowl was a real heat event, not only a drought — while the 1960s and 1970s show a band of cooler years across all four regions before the modern warming resumes. Anyone reading the chart left to right sees the same shape the [CONUS temperature stripes](../temperature-history/) show nationally, but the regional version makes plain that the West has warmed faster than the country as a whole.

## Why this matters

Temperature is the quieter half of the aridification story. Precipitation gets the attention — drought is legible, dramatic, countable in reservoir levels — but sustained warming is what turns a dry year into a crisis. Hotter air pulls more moisture out of soil, snowpack, and vegetation; the same precipitation deficit does more damage at +3 °F than at baseline. The post-2000 "megadrought" in the Southwest is as much a *temperature* event as a precipitation one, which is why it sits on this chart as a period band.

For the public-lands politics this project tracks, the regional unevenness is the point. Federal range-management decisions — stocking rates, drought deferments, allotment closures — are made against local conditions, not national averages. A rancher in the Northern Rockies experiences a different climate trajectory than one in the desert Southwest, and the warming signal here helps explain why range conflict intensifies in some regions and decades more than others.

## Data and method

- **Source**: NOAA NCEI Climate at a Glance, regional time series (nClimDiv), annual mean temperature computed by averaging monthly values (January–December).
- **Regions**: code `105` Northern Rockies & Plains (MT, WY, NE, ND, SD); `107` Southwest (AZ, CO, NM, UT); `108` Northwest (ID, OR, WA); `109` West (CA, NV). These are NOAA-defined aggregations, not project-specific ones.
- **Anomalies**: year mean minus the region's own 1901–2000 mean. Each region's baseline differs (the Southwest averages far warmer than the Northern Plains), so anomalies — not absolute temperatures — are the appropriate comparison.

## Companion views

- **[Regional Precipitation](../regional-precipitation/)** — the same four regions, the moisture half of the story.
- **[A Century of Warming](../temperature-history/)** — the contiguous-US temperature stripes, the national-scale version of this chart.
- **[A Drying West](../precipitation-history/)** — national precipitation anomalies.
