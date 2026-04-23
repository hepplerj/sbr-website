---
title: "West & Plains Farm Bankruptcies, by State, 1996–2024"
date: 2026-04-18
lede: "Chapter 12 (family farmer) bankruptcy filings for the fifteen Western and Plains states, each state a row, each year a stripe."
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
  annotations:
    - { year: 1998, label: "Late-1990s commodity crash" }
    - { year: 2009, label: "Great Recession" }
---

## What the chart shows

Fifteen rows, one per state, sorted by total Chapter 12 (family farmer) bankruptcy filings between 1996 and 2024. Reading top to bottom is reading state filing-volume from most to least. Reading left to right is the filing-intensity history of that state across three decades.

The **top tier** — California, Nebraska, Kansas — is three very different agricultural economies all filing at the highest sustained rates: dairy and specialty crops in California, corn and cattle in Nebraska, wheat and cattle in Kansas. Each of these states has filed more than 550 Chapter 12 cases over the 29-year window.

The **middle tier** — Idaho, South Dakota, Washington, North Dakota — concentrates where row-crop and dairy farms have been most exposed to commodity price swings and land-value compression.

The **low tier** — Wyoming, Nevada, Colorado, Utah — includes the states with the *loudest* sagebrush-rebellion politics. Wyoming has filed 26 Chapter 12 cases in 29 years. Nevada has filed 28. This matters: the rhetoric of federal-lands rebellion has not been loudest where family-farm bankruptcy has been most severe. The Bundys were Nevada ranchers filing essentially no Chapter 12 paperwork, because they weren't filing — they were grazing without permits, contesting the federal claim to the range at all. The political-economic mechanisms are very different.

## What to look for

- **The late-1990s commodity crash** (1996–1999) shows as a rust-heavy band across the top rows. Low commodity prices after the 1996 Freedom to Farm Act deregulation drove a wave of filings, especially in the Plains.
- **The 2009–2011 Great Recession** shows a spike in California (67 filings in 2011, the state's record year).
- **The 2019 trade-war spike** appears in Kansas and several Plains states — tariffs and retaliatory blocking of soybean and corn exports.
- **The quieter 2020s.** After 2020, filings collapse almost everywhere — pandemic subsidies, high commodity prices, and the Paycheck Protection Program stabilized farm finances in the short term.

## Reading alongside the national chart

This view covers only **1996 onward** because the Administrative Office of the US Courts only publishes Chapter 12 by judicial district beginning in 1995. The [national farm-bankruptcies chart](../farm-bankruptcies/) stretches back to 1899 but cannot be disaggregated to states before the mid-1990s without archival work.

The two charts have complementary lessons:

- **The national chart** makes the long historical point: farm bankruptcy has three major peaks (1920s, 1987 post-Crisis, 2019 trade war) and a prominent data gap in the 1980s Farm Crisis itself.
- **This by-state chart** makes the regional point: the West and Plains states where the sagebrush-rebellion politics is loudest (Wyoming, Nevada, Utah) are *not* the states where family-farm bankruptcy is most severe. Where the Rebellion is most active, farm finance is not the proximate driver.

## Data and method

- **Source**: Dinterman, `historical-bankruptcies`, file `1-tidy/bankruptcy/district_quarterly.csv`. Chapter 12 filings by federal judicial district, aggregated here to states and to annual totals.
- **Coverage**: 1996 through 2024. 1995 Q4 only (partial year) and 2025 partials are excluded.
- **Color scale**: sequential cream → rust, domain 0 to 80 filings per state-year. The saturation point (80 filings) is set just above the historical maximum (Nebraska 1999: 83) so the chart reserves the deepest rust for genuine extremes.
- **Row order**: states sorted by cumulative 1996–2024 filings, descending. The ordering is meant to be legible at a glance; reordering alphabetically would make the "top tier / middle tier / low tier" reading harder.

Rate-normalized filings — per thousand farms, from the USDA Census of Agriculture — would be a stronger measure but require additional data. That's an obvious next step.
