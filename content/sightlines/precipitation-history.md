---
title: "A Century of Drought"
date: 2026-04-18
lede: "Annual precipitation anomalies for the contiguous United States, 1895–2024. Each stripe is one year against the 20th-century mean. Brown for drier than average, blue for wetter."
weight: 40
draft: false
viz: chart
themes: [climate, dust-bowl]
regions: [national]
chart:
  src: /data/conus-precipitation.json
  type: stripes
  field: anomaly_in
  xfield: year
  datapath: data
  palette: precip
  domain: [-5.0, 5.0]
  title: "Contiguous US annual precipitation anomalies, 1895–2024"
  unitshort: "in"
  infotitle: "US annual precipitation"
  infoprompt: "Hover a stripe for that year's anomaly against the 1901–2000 mean."
  annotations:
    - { year: 1910, label: "Driest year on record" }
    - { year: 1934, label: "Dust Bowl" }
---

Each vertical stripe in the graph represents a single year, color indicating the year's total precipitation across the country compared to the 1901-2000 average. Brown indicates drier years, cream for near average, and blue for wetter years. The data is drawn from the [U.S. Geological Survey](https://www.usgs.gov/special-topics/lcmap/lcmap-conus-reference-data). This chart can be read alongside the [temperature-anomaly chart](../temperature-history/), which illustrates the warming climate story. Taken together the two charts describe the drying West: warmer *and* (regionally) drier.


| Event | Temperature anomaly | Precipitation anomaly |
|---|---|---|
| Taylor Grazing Act (1934) | +2.08 °F | −4.15 in |
| Bankhead-Jones Act (1937) | +0.55 °F | −0.89 in |
| National Grasslands designation (1960) | +0.37 °F | +0.05 in |
| Sagebrush Rebellion (1979) | −0.63 °F | +1.11 in |

## Data and method

- **Source**: NOAA NCEI Climate at a Glance, national monthly precipitation series (contiguous U.S., region code 110), 1895 through 2024.
- **Aggregation**: monthly values **summed** to annual totals (note — temperature uses a mean, precipitation uses a sum); anomalies computed against the 1901–2000 baseline (standard NOAA convention).
- **Color scale**: diverging scale from rust-brown (−5.0 in) through cream (0) to navy (+5.0 in). The ±5 inch domain matches the actual historical extremes — 1910 at −5.02 in, 1973 at +5.02 in.
