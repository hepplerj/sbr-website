---
title: "A Drying West"
date: 2026-04-18
lede: "Annual precipitation anomalies for the eleven western public-land states, 1895–2024. Each stripe is one year against the 20th-century mean. Brown for drier than average, blue for wetter."
weight: 40
draft: false
viz: chart
themes: [climate, dust-bowl]
regions: [rocky-mountain, intermountain-west, southwest, pacific-northwest, pacific-southwest]
chart:
  src: /data/west-precipitation.json
  type: stripes
  field: anomaly_in
  xfield: year
  datapath: data
  palette: precip
  domain: [-7.0, 7.0]
  title: "Western US annual precipitation anomalies, 1895–2024 (AZ, CA, CO, ID, MT, NV, NM, OR, UT, WA, WY)"
  unitshort: "in"
  infotitle: "Western annual precipitation"
  infoprompt: "Hover a stripe for that year's anomaly against the 1901–2000 mean."
  hideidlecard: true
  annotations:
    - { year: 2020, label: "Driest year on record" }
  periods:
    - { start: 1930, end: 1940, label: "Dust Bowl",
        description: "A decade of severe drought and topsoil erosion across the southern Plains, accelerated by sodbuster farming on marginal grasslands." }
    - { start: 2000, end: 2024, label: "Megadrought",
        description: "The driest stretch in the western record: precipitation averaged 0.8 inches below the 20th-century mean, and 2020 was the driest year since 1895." }
---

Each vertical stripe in the graph represents a single year, color indicating the year's total precipitation across the country compared to the 1901-2000 average. Brown indicates drier years, cream for near average, and blue for wetter years. The data is drawn from the [U.S. Geological Survey](https://www.usgs.gov/special-topics/lcmap/lcmap-conus-reference-data). This chart can be read alongside the [temperature-anomaly chart](../temperature-history/), which illustrates the warming climate story. Taken together the two charts describe the drying West: warmer *and* (regionally) drier.


| Event | Temperature anomaly | Precipitation anomaly |
|---|---|---|
| Taylor Grazing Act (1934) | +3.20 °F | −3.68 in |
| Bankhead-Jones Act (1937) | −0.53 °F | +1.48 in |
| National Grasslands designation (1960) | +0.09 °F | −1.73 in |
| Sagebrush Rebellion (1979) | −0.42 °F | −1.09 in |

## Data and method

- **Source**: NOAA NCEI Climate at a Glance, statewide annual precipitation for the eleven western public-land states (Arizona, California, Colorado, Idaho, Montana, Nevada, New Mexico, Oregon, Utah, Washington, Wyoming), 1895 through 2024.
- **Aggregation**: state totals averaged with each state weighted by its land area (Census 2010); anomalies computed against the 1901–2000 baseline (standard NOAA convention). The table's temperature column uses the same eleven states and weights.
- **Why not the national series**: since 2000 the contiguous-US total runs about an inch *above* the baseline, because the Northeast, Upper Midwest and Ohio Valley have been 8–10% wetter. That masks the West, where the same years ran 0.8 inches (4%) below it.
