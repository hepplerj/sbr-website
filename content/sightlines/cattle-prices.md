---
title: "A Century of Cattle Prices"
date: 2026-05-22
lede: "Prices received by US ranchers for cattle and calves, 1910–2025, in 2024 dollars. The long rise to the 1973 peak, the decade-and-a-half real collapse to 1996, and the post-2014 recovery — the rancher's-eye view of the commodity that public-land grazing is fundamentally about."
weight: 38
draft: false
viz: chart
themes: [rural-economy]
regions: [national, intermountain-west, northern-plains, southern-plains]
chart:
  src: /data/cattle-prices.json
  type: line
  datapath: data
  xfield: year
  title: "Cattle prices received by US ranchers, 1910–2025 (2024 dollars)"
  ylabel: "Price ($/cwt, 2024 dollars)"
  unitshort: " /cwt"
  infotitle: "Cattle prices"
  infoprompt: "Hover the chart for each year's real price; nominal also available in the data file."
  series:
    - { field: cattle,         label: "Cattle (≥500 lbs)",         color: rust }
    - { field: steers_heifers, label: "Steers & heifers (≥500 lbs)", color: navy }
    - { field: calves,         label: "Calves",                    color: gold }
  periods:
    - { start: 1921, end: 1929, label: "1920s ag depression",
        description: "Post-WWI commodity collapse hit cattle alongside row crops. Real prices spent most of the decade well below the wartime peak." }
    - { start: 1930, end: 1940, label: "Dust Bowl",
        description: "Cattle prices collapsed early in the Depression; the Taylor Grazing Act (1934) followed three years of historically low real prices." }
    - { start: 1973, end: 1979, label: "1970s cattle boom",
        description: "Real cattle prices peaked in 1973 at the highest level of the century. A drawn-out collapse over the next six years coincided with the political mobilization that became the 1979 Sagebrush Rebellion." }
    - { start: 1980, end: 1987, label: "Farm Crisis",
        description: "Real cattle prices fell further through the early 1980s, compounding the broader rural credit collapse documented on the farm-bankruptcies chart." }
    - { start: 2000, end: 2024, label: "Western megadrought",
        description: "The driest two-decade stretch in the West since at least 800 CE. Drought-driven herd liquidations (notably 2011–13 in the southern Plains) cut the national cow herd sharply and pushed the 2014 real-price spike." }
  annotations:
    - { year: 1973, label: "Real-price peak" }
    - { year: 1996, label: "Multi-decade real-price trough" }
    - { year: 2014, label: "Drought-driven herd shortage" }
---

Cattle prices are the ranchers'-eye view of the commodity that federal range policy is fundamentally about. Three series here — adult cattle (≥500 lbs), finished steers and heifers ready for slaughter, and weaned calves — all in 2024 dollars so the long arc reads honestly across more than a century of inflation.

The shape of the chart is one of the more legible economic backdrops to the public-lands politics on this site. Real cattle prices climbed steadily from the Depression trough through the postwar decades, peaked in **1973** at the highest real level of the twentieth century, then fell — and kept falling — for more than two decades. By **1996** real prices reached a multi-decade trough, below where they had been at the end of World War II. The post-2014 recovery, driven by a multi-year drought in the southern Plains that culled the national herd, brought real prices back near 1970s levels.

## How this lines up with the politics

The 1973 peak and the long real-price decline that followed are difficult to read as anything other than backdrop to the **1979 Sagebrush Rebellion**. Western ranchers in 1979 had just lived through six years of falling real income on the central commodity of their business; the BLM was simultaneously executing the [Taylor Grazing Act](../timeline/) permit-and-allotment regime that FLPMA (1976) had codified as permanent. Federal regulatory expansion arrived at the moment that economic ground was eroding under ranchers' feet — and the political response in Nevada took the form of a state-sovereignty claim over federal land.

The 1980s continuation of the price decline shows up on the [farm-bankruptcies chart](../farm-bankruptcies/) as the Farm Crisis. The mid-1990s real-price trough sits in the period that produced the Wise Use coalition and the county-supremacy movement. The 2014 spike, which gave ranchers a brief reprieve, is the year of the **Bunkerville standoff** — Cliven Bundy's unpaid grazing fees had been accumulating since 1993, but the standoff happened in a year of historically high real cattle prices. (None of this is mono-causal; commodity prices are one variable among several. The chart describes the income climate, not the trigger.)

## Data and method

- **Source**: USDA NASS QuickStats, `CATTLE [class] - PRICE RECEIVED, MEASURED IN $ / CWT`, national. Free API; requires a `NASS_API_KEY` environment variable.
- **Annual aggregation**: NASS publishes calendar-year annuals only from 1996 forward. For 1910–1995, the script computes an annual mean from the 12 monthly values (requiring at least 10 monthly observations per year, so half-reported years don't appear as artificial spikes or troughs).
- **Real prices**: nominal $/cwt deflated to 2024 dollars using **CPI-U** (CPI for All Urban Consumers, all items, not seasonally adjusted) from the [Federal Reserve Bank of St. Louis (FRED)](https://fred.stlouisfed.org/series/CPIAUCNS), series `CPIAUCNS`. CPI begins in 1913 — for the 1910–1912 NASS years, nominal is available but real is not.
- **Pipeline script**: [`scripts/build_cattle_prices.py`](https://github.com/hepplerj/sbr-website/blob/main/scripts/build_cattle_prices.py).

## Companion views

- **[Farm Bankruptcies, 1899–2024](../farm-bankruptcies/)** — the bankruptcy filings that respond to the price collapses on this chart.
- **[A Century of Consolidation](../farm-consolidation/)** — the long-run decline in farm count + rise in average farm size that the price arc helped drive.
- **[Federal Public-Lands Timeline](../timeline/)** — the statutory and movement events sitting on top of this income story.
