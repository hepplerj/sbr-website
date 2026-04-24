---
title: "A Century of Warming"
date: 2026-04-18
lede: "Annual temperature anomalies for the contiguous United States, 1895–2024, against the 20th-century mean."
weight: 30
draft: false
viz: chart
themes: [climate, dust-bowl]
regions: [national]
chart:
  src: /data/conus-temperature.json
  type: stripes
  field: anomaly_f
  xfield: year
  datapath: data
  domain: [-3.5, 3.5]
  title: "Contiguous US annual temperature anomaly, 1895–2024"
  unitshort: "°F"
  infotitle: "US annual temperature"
  infoprompt: "Hover a stripe for that year's anomaly against the 1901–2000 mean."
  annotations:
    - { year: 1936, label: "Taylor Grazing Act",      side: "above" }
    - { year: 1976, label: "FLMPA",      side: "above" }
    - { year: 1981, label: "Farm Crisis",      side: "above" }
    - { year: 2012, label: "Megadrought",    side: "above" }
---

Each vertical stripe in the chart indicates a single year, with color representing the year's mean temperature across the United States compared to the 1901-2000 average. Blue indicates cooler than baseline, cream for near-average, and rust for warmer. Read from left to right the chart shows a warming climate. 

The history of agriculture cannot be separated from the history of climate. Although people of the time may not have recognized climate change as a factor,  it has shaped their liveihoods and responses to political, cultural, economic, and social change. 

This chart can be read alongside the [precipitation anomaly chart](../precipitation-history/).

## Data and method

- **Source**: NOAA NCEI Climate at a Glance, national monthly temperature series (contiguous U.S., region code 110), 1895 through 2024.
- **Aggregation**: monthly values averaged to annual means; anomalies computed against the 1901–2000 baseline (standard NOAA convention).
