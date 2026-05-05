---
title: "Farm Wealth, 1910–2026"
date: 2026-05-04
lede: "Tracing U.S. farm net income, net worth, debt stress, and federal payments from 1910 to 2026."
weight: 15
draft: false
viz: chart
themes: [farm-crisis, rural-economy, sagebrush-rebellion-1979]
regions: [national, northern-plains, southern-plains, intermountain-west, rocky-mountain, southwest]
chart:
  src: /data/farm-income.json
  type: small-multiples
  datapath: data
  xfield: year
  title: "U.S. farm sector income, wealth, and federal payments, 1910–2026"
  infotitle: "Farm economy"
  infoprompt: "Hover to see values at a year."
  adminbands: true
  panels:
    - field: net_farm_income
      label: "Net farm income"
      color: rust
      unit: " B$"
      scale: 1
      format: "1f"
    - field: farm_equity
      label: "Farm net worth"
      color: sage
      unit: " B$"
      scale: 1
      format: "int"
    - field: debt_asset_ratio
      label: "Debt-to-asset ratio"
      color: navy
      unit: "%"
      scale: 1
      format: "1f"
    - field: govt_payments
      label: "Government payments"
      color: gold
      unit: " B$"
      scale: 1
      format: "1f"
---

These four panels describe a century of American farm economics: how income fluctuated, how wealth accumulated, and how the federal government stepped in as a backstop.  The "Show administrations" toggle allows you to shade periods of time by presidential administration.

- **Net farm income** (in nominal billions) traces the year-to-year return to farm operators after expenses. 
- **Farm net worth (equity)** shows what the sector owned minus what it owed. 
- **Debt-to-asset ratio** (available from 1960) makes the leverage story precise.
- **Government payments** charts federal outlays to farmers---commodity support, conservation contracts, disaster relief---from the New Deal appropriations in 1933 to the present.

## Data and method

- **Source**: USDA Economic Research Service, [Farm Income and Wealth Statistics](https://www.ers.usda.gov/data-products/farm-income-and-wealth-statistics/), February 2026 release. U.S.-aggregate series only; state-level balance-sheet data has been suspended by ERS as of 2025.
