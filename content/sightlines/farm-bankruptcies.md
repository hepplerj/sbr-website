---
title: "Farm Bankruptcies, 1899–2024"
date: 2026-04-18
lede: "Annual farmer bankruptcy filings across the United States over 126 years."
weight: 35
draft: false
viz: chart
themes: [farm-crisis, rural-economy]
regions: [national, northern-plains, southern-plains]
chart:
  src: /data/farm-bankruptcies.json
  type: bars
  field: count
  xfield: year
  datapath: national_annual
  title: "US farmer bankruptcy filings, 1899–2024"
  ylabel: "Filings"
  unitshort: ""
  infotitle: "Farmer bankruptcies"
  infoprompt: "Hover a bar for that year's filing count. Grey bands mark data gaps."
  annotations:
    - { year: 1934, label: "Dust Bowl" }
    - { year: 1987, label: "Chapter 12 enacted" }
---

Each bar is one year's count of farmer bankruptcy filings in the United States. Notably:

- **The 1920s agricultural depression**, 1921–1929. is the peak of farm bankruptces after the collapse in commodity prices after World War I.
- **The 1934 Dust Bowl**, at a lower but still elevated level. The Taylor Grazing Act and Bankhead-Jones Act passed in this same period, framed explicitly as a responses to unregulated range management.
- **The 1987 Chapter 12 surge**, when Congress enacted a farmer-specific bankruptcy chapter in direct response to the 1980s Farm Crisis. The 6,535 filings of 1987 are a backlog of farmers who had been waiting for a usable bankruptcy option.

A subtler feature is the low baseline of 1945–1975, when American agriculture [consolidated](../farm-consolidation/) into fewer, larger, and subsidized farms. Consolidation, not bankruptcy, drove farmers exiting agriculture.

The grey band represents farmer-specific bankrupcies that were not separately tabulated before Chapter 12's enactment in October 1986.Until Chapter 12's existence farmers filed under Chapter 7 (liquidation) or Chapter 11 (business reorganization), and their filings were counted alongside all other small-business cases. The 1980s Farm Crisis, however, was the most severe rural-economic downturn since the 1930s: an estimated 250,000 family farms were lost between 1981 and 1987.

Notably, farm bankruptcy data is not simply economic background. Each visible spike maps closely to political mobilization:

- The 1920s spike fueled affiliations with the Non-Partisan League in the Northern Plains and the early legislative campaigns for farm credit reform.
- The 1930s spike motivated the **Taylor Grazing Act** and the **Bankhead-Jones Act**, undertaking a new federal land-management regime.
- The 1987 spike occurred amongst the **Wise Use Movement** in the late 1980s and the **county-supremacy** campaigns of the 1990s.

Bankruptcy-driven rural distress creates conditions in which land transfer arguments find an audience.

See the companion [state-by-state chart for 1996–2024](../west-plains-bankruptcies/). In the years where state-level data exists, the West and Plains states account for roughly 15–25 percent of US Chapter 12 filings in any given year, with California, Nebraska, Kansas, and Idaho consistently leading the regional totals. States with the most outspoken Sagebrush Rebellion politics (Wyoming, Nevada, Utah) are *not* the states with the most bankruptcy activity.

## Data and method

- **Source**: Special thanks to Dinterman's `historical-bankruptcies` GitHub repository, drawing on Jerry Stam's USDA ERS historical compilation for 1899–1979 and US Courts Administrative Office Table F-2 for 1987–2024.
- **Definition**: "Farmer bankruptcies" refers to farmer-specific filings under pre-1987 Chapters 7 and 11 (Stam series) and Chapter 12 filings from 1987 forward. Definitions are not perfectly comparable across the 1987 break; the spike at 1987 in particular reflects both a backlog and a statistical reclassification.
- **Farm counts** are from the USDA Census of Agriculture at five-year intervals.
