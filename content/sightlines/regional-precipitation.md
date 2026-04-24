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
    - { year: 1981, label: "Farm Crisis" }
---

This chart uses the four NOAA climate regions to visualize each year of precipitation per vertical stripe, color-encoded by anomaly against a 1901–2000 baseline: brown for drier, blue for wetter. 

Notably, these regions are very different places climatologically: the Northwest averages 32 inches of precipitation a year while the Southwest averages 15. Each region's anomalies are compared their own baselines to surface things the overall American West chart at the bottom cannot: Years that read as moderately dry at the national level are often severe drought in one region while the others are wet. In 2012, the Plains and Southwest were at −4 inches while the Northwest was at +6 while the West as a whole was near-normal. The Pacific rains mask a drying interior.

| Rebellion / event | Region(s) in drought | Climate picture |
|---|---|---|
| Taylor Grazing Act (1934) | Plains + Southwest | Dry |
| Nat'l Grasslands designation (1960) | Southwest | Average |
| Sagebrush Rebellion (1979) | West + Northwest | Wet |
| Wise Use | Plains | Dry |

## Data and method

- **Source**: NOAA NCEI Climate at a Glance, regional time series (nClimDiv), annual totals computed by summing monthly precipitation values (January–December).
- **Regions**: code `105` Northern Rockies & Plains (MT, WY, NE, ND, SD); `107` Southwest (AZ, CO, NM, UT); `108` Northwest (ID, OR, WA); `109` West (CA, NV). These are NOAA-defined aggregations, not project-specific ones.
- **Anomalies**: year total minus the region's own 1901–2000 mean. Each region's baseline differs substantially, so anomalies---not absolute totals---are the appropriate comparison.

