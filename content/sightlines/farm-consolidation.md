---
title: "A Century of Consolidation"
date: 2026-04-20
lede: "Two panels. Since 1950, the number of US farms has fallen by two-thirds while the average farm size has more than doubled — from 5.6 million farms at ~213 acres each to 1.9 million at ~463 acres."
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
  infoprompt: "Two panels, shared x-axis. Hover to see both values at a year."
  panels:
    - field: farms
      label: "Number of farms"
      color: rust
      unit: "M"
      scale: 1000000
      format: "1f"
    - field: avg_size
      label: "Average farm size"
      color: sage
      unit: " acres"
      scale: 1
      format: "int"
---

## What the chart shows

Two stacked panels, shared x-axis, each on its own scale because they live in wildly different units — millions of farms versus hundreds of acres per farm.

- **Number of farms** (rust, top): from 5.6 million in 1950 to 1.9 million in 2022 — a loss of roughly two-thirds of all American farms in seventy years.
- **Average farm size** (sage, bottom): from 213 acres per farm in 1950 to 463 acres in 2022 — a bit more than doubling.

Read together, the two panels give the canonical "consolidation" story: fewer farms, each larger. Almost everything else in the rural-economy story sits on top of this one fact.

The farms panel extends back to 1910 to show the pre-1950 context — the series was roughly stable at 6–6.5 million farms through the first half of the century, then broke downward starting in the late 1940s. Average size is available as a reported NASS statistic from 1979 onward and computed (total acres ÷ number of farms) for 1950–1978. Earlier pre-1950 size figures exist in the Census of Agriculture's printed volumes but are not in QuickStats.

## What drove the shrinkage

Three mechanisms, in rough chronological order:

1. **The 1945–1975 consolidation wave.** The sharpest decline on the chart — from 5.6 million to 2.5 million farms in thirty years — is not a crisis episode but the cumulative result of mechanization, the shift from subsistence to commodity production, the interstate highway system integrating regional markets, and the federal credit apparatus that favored scale. Most farms that vanished didn't fail; they were absorbed, inherited-but-not-succeeded, or simply left. This is the period the farm-bankruptcy chart shows as an anomalously quiet baseline: consolidation, not bankruptcy, was the mechanism of farmer exit.
2. **The 1980s Farm Crisis.** A sharp jog downward on the farms line in the early 1980s — the decade-and-change the [farm-bankruptcies chart](../farm-bankruptcies/) represents as a data gap. An estimated 250,000 farms lost in the 1981–1987 window.
3. **Post-2000 flattening.** The rate of farm loss slows dramatically after 2000. The US has held at roughly 2.0–2.1 million farms since the early 2000s. What's changing during this period is not the *count* but the *distribution*: the gap between the smallest and largest farms grows, as large-commercial operations capture a rising share of total acreage and receipts while the number of sub-$50K-revenue farms holds roughly flat.

## Why this matters for the sagebrush rebellions

The "family farm in crisis" is a persistent rhetorical frame in sagebrush politics — it appears in the 1920s Non-Partisan League, in Wayne Aspinall's mid-century range politics, in 1970s Sagebrush Rebellion speeches, in Wise Use organizing, and in the Bundy-ranch standoff's self-presentation. This chart makes one blunt point about that frame: **the American family farm has been consolidating continuously for seventy-five years, across every federal administration and both major parties**. The rhetoric maps only loosely onto the underlying data.

That doesn't mean the political energy is fake — rural distress is real, the loss of community institutions that a working farm supported is real, the downstream concentration in packing and commodity-trading that squeezes small producers is real. But attributing the consolidation primarily to federal land policy, BLM grazing fees, or wilderness designations is harder to support from the evidence. The biggest declines predate the statutes most often blamed, and the flattening since 2000 has happened *during* the most active sagebrush-rebellion era.

## Data and method

- **Source**: USDA National Agricultural Statistics Service (NASS) via the QuickStats API. Farm count from `FARM OPERATIONS - NUMBER OF OPERATIONS` (national total, Census years preferred over Survey interpolations). Average farm size from `FARM OPERATIONS - AREA OPERATED, MEASURED IN ACRES / OPERATION` where reported (1979+), computed as total acres operated ÷ farm count for 1950–1978.
- **Units**: farms in raw millions; average size in raw acres. Both panels on linear scales, independent Y-axes. No indexing.
- **Range**: 1910–2025 on the farms panel; 1950–2025 on the average-size panel.
- **Pipeline script**: [`scripts/build_farm_consolidation.py`](https://github.com/hepplerj/sbr-website/blob/main/scripts/build_farm_consolidation.py). Requires a free NASS QuickStats API key in the `NASS_API_KEY` environment variable.

## Extensions

- **Farms by legal organization** (family sole-proprietorship / family partnership / family corporation / **non-family corporation**) 1978–2022. This is the *corporatization* chart specifically — measures ownership structure rather than just "bigger farms." Same NASS API, different short-descriptions.
- **Size distribution by receipts class** (<$10K, $10K–50K, $50K–250K, $250K–1M, >$1M), showing the hollowing-out of the middle.
- **Beef packing concentration** (CR4 of the four largest firms' share of cattle slaughter, 1980–present). Published in USDA GIPSA reports — not in QuickStats, requires a parallel scraping pipeline but would surface the downstream-processing concentration that squeezes ranchers.
- **State-level detail** for the fifteen West/Plains states, paralleling the [by-state bankruptcies](../west-plains-bankruptcies/) view.

## Companion views

- **[Farm Bankruptcies, 1899–2024](../farm-bankruptcies/)** — the annual filing counts against the long consolidation trend. The chart above shows the mechanism; the bankruptcies chart shows the episodes of crisis visible inside that trend.
- **[West & Plains Farm Bankruptcies, 1996–2024](../west-plains-bankruptcies/)** — state-by-state detail of the post-1996 window.
