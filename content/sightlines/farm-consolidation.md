---
title: "A Century of Consolidation"
date: 2026-04-20
lede: "Since 1950, the number of US farms has fallen by two-thirds while the average farm size has more than doubled."
weight: 36
draft: false
viz: chart
themes: [farm-crisis, rural-economy]
regions: [national, great-plains]
chart:
  src: /data/farm-consolidation.json
  type: small-multiples
  datapath: data
  xfield: year
  title: "U.S. number of farms and average farm size, 1910–2025"
  infotitle: "Consolidation"
  infoprompt: "Hover to see both values at a year."
  panels:
    - field: farms
      label: "Number of farms"
      color: rust
      unit: " million"
      scale: 1000000
      format: "1f"
    - field: avg_size
      label: "Average farm size"
      color: sage
      unit: " acres"
      scale: 1
      format: "int"
---

Read together, the two panels illustrate the consolidation of farming: fewer farms but larger acreages that speak to the consolidation of agricultural activity under the guise of mechanization, commodity production, and federal credits and taxes that favored large and corporate farming.

Farm sizes were relatively stable before the 1950s, aided in part by the Homestead Act that uniformly distributed farmland to settlers. Land consolidation began to rapidly take off in the late 1940s. The average size is calculated (total acres ÷ number of farms) for 1950–1978, while the open data takes up average farm size in its own data in 1979.

The Farm Crisis of the 1980s decimated family farms across the country, (visually represented in the [farm-bankruptcies chart](../farm-bankruptcies/) chart and [regional bankruptcies](../west-plains-bankruptcies/) chart). An estimated 250,000 farms were lost between 1981 and 1987, causing the collapse of local communities that supported agricultural production and markets.  

## Data and method

- **Source**: USDA National Agricultural Statistics Service (NASS) via the QuickStats API. Farm count from `FARM OPERATIONS - NUMBER OF OPERATIONS` (national total, Census years preferred over Survey interpolations). Average farm size from `FARM OPERATIONS - AREA OPERATED, MEASURED IN ACRES / OPERATION` where reported (1979+), computed as total acres operated ÷ farm count for 1950–1978.
- **Units**: farms in raw millions; average size in raw acres. Both panels on linear scales, independent Y-axes.
- **Pipeline script**: [`scripts/build_farm_consolidation.py`](https://github.com/hepplerj/sbr-website/blob/main/scripts/build_farm_consolidation.py). Requires a free NASS QuickStats API key in the `NASS_API_KEY` environment variable.
