---
title: "A Century of Drought and Deluge"
date: 2026-04-18
lede: "Annual precipitation anomalies for the contiguous United States, 1895–2024. Each stripe is one year against the 20th-century mean. Brown for drier than average, blue for wetter — the drought record of the century in one ribbon."
weight: 40
draft: false
viz: chart
themes: [climate, dust-bowl, farm-crisis]
regions: [national]
chart:
  src: /data/conus-precipitation.json
  type: stripes
  field: anomaly_in
  xfield: year
  datapath: data
  palette: precip
  domain: [-5.0, 5.0]
  title: "Contiguous US annual precipitation anomaly, 1895–2024"
  unitshort: "in"
  infotitle: "US annual precipitation"
  infoprompt: "Hover a stripe for that year's anomaly against the 1901–2000 mean."
  annotations:
    - { year: 1910, label: "Driest year on record" }
    - { year: 1934, label: "Dust Bowl" }
---

## What the chart shows

Each vertical stripe is one year. Color encodes that year's total precipitation across the contiguous United States, compared to the 1901–2000 average — **brown** for drier than the baseline, **cream** for near-normal, **blue** for wetter. Read left to right, the chart is the drought record of the twentieth and early twenty-first centuries.

Three features matter for this project:

- **The driest single year** in the CONUS series was not 1934 or 1936 but **1910**, a cluster of dry years running through the 1910s that the popular memory has largely lost. The original Sagebrush Rebellion — the first one — was the National Forest litigation and graze-reduction fights of the 1910s, and this chart is part of why.
- **The 1930s Dust Bowl** reads as a band of brown across the early 1930s, with 1934 and 1936 especially prominent. The Taylor Grazing Act (1934) and the Bankhead-Jones Farm Tenant Act (1937) were drafted inside this visible dry spell.
- **Two later Plains droughts**, 1953–1957 (the "forgotten drought" that drove the designation of the National Grasslands in 1960) and 1988, are equally severe. The mid-1950s drought was pivotal for the next round of federal land-acquisition politics.
- **The 2000s and 2010s Western megadrought** is visible as a more uneven brown pattern — the CONUS average washes out some of the severity because the Pacific Northwest and the Southeast were often wet while the Intermountain West was not. A regional Plains/West breakout would make the aridification story sharper.

## Paired with the temperature record

This chart is meant to be read alongside the [temperature-anomaly chart](../temperature-history/). Temperature tells a warming story. Precipitation tells a variability story — punctuated droughts and wet periods without a strong long-term trend at the CONUS level. Together they describe **aridification**: warmer *and* (regionally) drier. A year like 2012 was a Plains–Intermountain catastrophe in both registers, even though the CONUS precipitation anomaly that year is only moderate.

Every sagebrush rebellion coincides with a specific tilt on both charts:

| Event | Temperature anomaly | Precipitation anomaly |
|---|---|---|
| Taylor Grazing Act (1934) | +2.08 °F | −4.15 in |
| Bankhead-Jones Act (1937) | +0.55 °F | −0.89 in |
| National Grasslands designation (1960) | +0.37 °F | +0.05 in |
| Sagebrush Rebellion (1979) | −0.63 °F | +1.11 in |
| Bundy standoff (2014) | +0.50 °F | +2.19 in |
| Malheur occupation (2016) | +2.61 °F | +1.72 in |

The 1979 Rebellion, interestingly, arose not in a drought but in a cool, wet year. The grievance was not precipitation — it was BLM administrative policy. That's a small but useful corrective: climate shapes politics, but it does not determine them.

## Data and method

- **Source**: NOAA NCEI Climate at a Glance, national monthly precipitation series (contiguous U.S., region code 110), 1895 through 2024.
- **Aggregation**: monthly values **summed** to annual totals (note — temperature uses a mean, precipitation uses a sum); anomalies computed against the 1901–2000 baseline (standard NOAA convention).
- **Color scale**: diverging scale from rust-brown (−5.0 in) through cream (0) to navy (+5.0 in). The ±5 inch domain matches the actual historical extremes — 1910 at −5.02 in, 1973 at +5.02 in.

Regional breakouts — the Northern Plains, the Intermountain West, individual states — require the NOAA Climate Divisional Database (nClimDiv) rather than the national time series. Adding those regions is the obvious next step.
