---
title: "West & Plains Farm Bankruptcies, by State, 1996–2024"
date: 2026-04-18
lede: "Chapter 12 bankruptcy filings for the fifteen Western and Plains states."
weight: 50
draft: false
viz: chart
themes: [farm-crisis, rural-economy]
regions: [northern-plains, southern-plains, intermountain-west, rocky-mountain, southwest, pacific-northwest, pacific-southwest]
chart:
  src: /data/farm-bankruptcies.json
  type: stripes-stacked
  datapath: by_state
  serieslabel: label
  seriesdata: data
  field: count
  xfield: year
  palette: rust
  scale: sequential
  domain: [0, 80]
  title: "Chapter 12 filings by state, 1996–2024"
  unitshort: ""
  legendtitle: "Filings per year"
  infotitle: "Farm bankruptcies"
  infoprompt: "Hover a stripe for a state's Chapter 12 filings that year."
  periods:
    - { start: 1996, end: 1999, label: "Late-1990s commodity crash",
        description: "Asian financial crisis + grain glut depressed crop prices through the late 1990s; the 1998 trough hit Plains row-crop states hardest." }
    - { start: 2007, end: 2010, label: "Great Recession",
        description: "Credit contraction and the 2008 financial crisis squeezed farm credit access; bankruptcy filings climbed across most states for two to three years." }
---

This chart, reading top to bottom, shows state filing-volume from most to least. Reading left to right is the filing-intensity history of that state across three decades.

The highest bankrupcies across California, Nebraska, and Kansas represent very different agricultural economies all filing at the highest sustained rates: dairy and specialty crops in California, corn and cattle in Nebraska, wheat and cattle in Kansas. Each of these states has filed more than 550 Chapter 12 cases over the 29-year window. Idaho, South Dakota, Washington, and North Dakota concentrate where row-crop and dairy farms have been most exposed to commodity price swings and land-value compression.

This view covers only 1996 onward because the Administrative Office of the US Courts only publishes Chapter 12 by judicial district beginning in 1995. The [national farm-bankruptcies chart](../farm-bankruptcies/) provides a longer history but cannot be easily disaggregated to states.


## Data and method

- **Source**: Dinterman, `historical-bankruptcies`, file `1-tidy/bankruptcy/district_quarterly.csv`. Chapter 12 filings by federal judicial district, aggregated to states and to annual totals.
- **Coverage**: 1996 through 2024. 1995 Q4 only (partial year) and 2025 partials are excluded.
