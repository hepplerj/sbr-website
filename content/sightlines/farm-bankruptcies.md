---
title: "Farm Bankruptcies, 1899–2024"
date: 2026-04-18
lede: "Annual farmer bankruptcy filings across the United States over 126 years. Three distinct crises — the 1920s agricultural depression, the post-Chapter 12 filing surge of 1987, and the 2019 trade-war spike — stand out. The 1980s Farm Crisis itself is present as a data gap."
weight: 35
draft: false
viz: chart
themes: [farm-crisis, rural-economy]
regions: [national, great-plains]
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
    - { year: 1925, label: "1920s ag depression" }
    - { year: 1934, label: "Dust Bowl" }
    - { year: 1987, label: "Chapter 12 enacted" }
    - { year: 2010, label: "Recession / commodity slump" }
    - { year: 2019, label: "Trade-war spike" }
---

## What the chart shows

Each bar is one year's count of farmer bankruptcy filings in the United States. Three features dominate:

- **The 1920s agricultural depression**, 1921–1929. The real peak in farm bankruptcy is not the Dust Bowl or the 1980s Farm Crisis but the mid-1920s — a collapse in commodity prices after World War I that has been almost entirely written out of public memory. 1925 filed 7,872 farmer bankruptcies; 1987 filed 6,535. The 1920s numbers were higher.
- **The 1934 Dust Bowl**, at a lower but still elevated level. The Taylor Grazing Act passed this same year, framed explicitly as a response to the visible failure of unregulated range management.
- **The 1987 Chapter 12 surge**, when Congress enacted a farmer-specific bankruptcy chapter in direct response to the 1980s Farm Crisis. The 6,535 filings of 1987 are the backlog of farmers who had been waiting for a usable bankruptcy option; counts then decline rapidly over the early 1990s.

A subtler feature is the **very low baseline of 1945–1975**, when American agriculture consolidated into fewer, larger, often subsidized farms. Filings fell below 300 in some years. This is the same period during which the American farm count dropped from 5.4 million (1950) to 2.6 million (1970). Consolidation, not bankruptcy, was the mechanism of farmer exit.

## The data gap, 1980–1986

The grey band from 1980 to 1986 is **real**. Before Chapter 12 was enacted in October 1986, farmer-specific bankruptcy data was not separately tabulated in the Administrative Office of the US Courts statistics: farmers filed under Chapter 7 (liquidation) or Chapter 11 (business reorganization), and their filings were counted alongside all other small-business cases. The 1980s Farm Crisis is by every other measure the most severe rural-economic episode since the 1930s — an estimated 250,000 family farms lost between 1981 and 1987 — but the bankruptcy data that would let us measure it at the federal-case level simply doesn't exist in a separable form.

The 1987 spike is the best available proxy for the crisis's backlog. Research compilations of state-level farm foreclosure data from the Farmers Home Administration and state courts during 1980–1986 exist in scattered academic and government archives; integrating them into this chart is a future iteration.

## Why the chart matters for the sagebrush rebellions

Farm bankruptcy data is not simply economic background. Each visible spike maps directly onto a political mobilization:

- The 1920s spike fed the **Non-Partisan League** in the northern Plains and the early legislative campaigns for farm credit reform.
- The 1930s spike motivated the **Taylor Grazing Act** and the **Bankhead-Jones Act**, the federal land-management regime that later sagebrush rebels would try to unwind.
- The 1987 spike — and the 1981–1987 crisis that preceded it — fueled the **Wise Use Movement** in the late 1980s and the **county-supremacy** campaigns of the 1990s. The constitutional theory was old; what was new was a generation of rural people who had just lost farms and were looking for someone to blame.
- The 2019–2020 spike, modest in absolute terms, coincides with the **Malheur aftermath trials** and the broader post-2016 patriot-militia reorganization.

The political argument isn't that bankruptcy *causes* sagebrush rebellions — the Great Basin states with the loudest rebellion politics (Nevada, Utah) are not major agricultural bankruptcy producers. It's that bankruptcy-driven rural distress creates the conditions in which transfer arguments find an audience, and the conditions in which the most committed activists emerge.

## West & Plains detail

See the companion [state-by-state chart for 1996–2024](../west-plains-bankruptcies/) — fifteen rows, one per Western and Plains state, sorted by total filings. In the years where state-level data exists, the West and Plains states account for roughly 15–25 percent of US Chapter 12 filings in any given year, with California, Nebraska, Kansas, and Idaho consistently leading the regional totals. One finding worth surfacing: the states with the loudest sagebrush-rebellion politics (Wyoming, Nevada, Utah) are *not* the states with the most bankruptcy activity.

## Data and method

- **Source**: Dinterman, `historical-bankruptcies` GitHub repository, drawing on Jerry Stam's USDA ERS historical compilation for 1899–1979 and US Courts Administrative Office Table F-2 for 1987–2024.
- **Definition**: "Farmer bankruptcies" refers to farmer-specific filings under pre-1987 Chapters 7 and 11 (Stam series) and Chapter 12 filings from 1987 forward. Definitions are not perfectly comparable across the 1987 break; the spike at 1987 in particular reflects both a real backlog and a statistical reclassification.
- **Gap**: 1980–1986 is empty in the source because separable farmer-bankruptcy data was not published.
- **Farm counts** (used as context for rate calculations in future iterations) are from the USDA Census of Agriculture at five-year intervals.
