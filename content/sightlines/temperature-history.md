---
title: "A Century of Warming"
date: 2026-04-18
lede: "Annual temperature anomalies for the contiguous United States, 1895–2024, against the 20th-century mean. Each stripe is one year. The Dust Bowl was not an aberration — it was a preview."
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
    - { year: 1934, label: "Dust Bowl",      side: "above" }
    - { year: 1954, label: "Plains drought", side: "above" }
    - { year: 1988, label: "Heat + drought", side: "above" }
    - { year: 2012, label: "Megadrought",    side: "above" }
    - { year: 2024, label: "Record warm",    side: "above" }
---

## What the chart shows

Each vertical stripe is one year. The color encodes that year's mean temperature across the contiguous United States, compared to the 1901–2000 average — blue for cooler than the baseline, cream for near-normal, gold and rust for warmer. Read left to right, the chart is a compressed climate history of the country: a variable early twentieth century, the **Dust Bowl spike** of 1934, a cooler mid-century, and then the continuous warming trend of the last four decades.

## Why it matters for the sagebrush rebellions

Every episode of federal-lands conflict sits in a climate moment.

- **1934** — The Taylor Grazing Act passes in the same year as the hottest year on record to that point. The Act's premise that the federal government must actively manage the range is inseparable from the crisis that year's weather produced.
- **1954** — A multi-year Plains drought stretches from the 1930s pattern into the postwar years, driving the next wave of federal-farm-acquisition politics and setting up the Bankhead-Jones Act's National Grassland designations in 1960.
- **Late 1970s** — The original Sagebrush Rebellion ignites during a relatively cool decade on this chart, but a severe drought in the Intermountain West gave ranchers specific grievances about federal grazing cuts.
- **2012** — The Megadrought year, when the American West entered the worst aridification episode in a millennium. The Bundy family's 2014 standoff at Bunkerville unfolds against BLM grazing restrictions tightened precisely because of this drought.
- **2024** — A new record warm year. The climate context for the next sagebrush rebellion, whenever it arrives.

The chart doesn't *explain* the politics. But the color bars remind us that when federal land agencies have made their most politically costly decisions — cutting grazing allocations, closing allotments, declaring wilderness, prosecuting trespass — they have frequently done so under environmental pressure that the rhetoric of "federal overreach" rarely acknowledges.

## Data and method

- **Source**: NOAA NCEI Climate at a Glance, national monthly temperature series (contiguous U.S., region code 110), 1895 through 2024.
- **Aggregation**: monthly values averaged to annual means; anomalies computed against the 1901–2000 baseline (standard NOAA convention).
- **Color scale**: diverging scale from navy (−3.5 °F) through cream (0) to rust (+3.5 °F). Cream sits at zero so the eye distinguishes warming and cooling decades at a glance.

Real regional breakouts — the Northern Plains, the Intermountain West, individual states — are the obvious next layer. This chart establishes the method; subsequent pages will narrow the geography.

## Paired with the precipitation record

This chart is meant to be read alongside the [precipitation anomaly chart](../precipitation-history/). Temperature tells a warming story — a clear trend after 1980. Precipitation tells a variability story — punctuated droughts and wet periods without a strong long-term trend at the national scale. Together they describe **aridification**: warmer *and* (regionally) drier. The sagebrush rebellions live in the space where those two patterns intersect.
