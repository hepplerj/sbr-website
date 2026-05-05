---
title: "Farm Wealth and the Federal Hand"
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

The four panels together describe a century of American farm economics: how income fluctuated, how wealth accumulated and then buckled, how leverage grew dangerous, and how the federal government stepped in — repeatedly — as a backstop. Each panel answers a different question; read together they illuminate why farmers and ranchers in the 1970s and 1980s simultaneously carried grievances against federal overreach and depended on federal payments to survive.

## What to read in the panels

**Net farm income** (in nominal billions) traces the year-to-year return to farm operators after expenses. The Depression trough is visible in the early 1930s, the postwar recovery in the 1940s–50s, and the 1970s commodity boom that pushed income to a then-record $33 billion in 1973 before the Farm Crisis knocked it back. The long nominal rise since 1990 reflects both genuine productivity gains and the inflation of farm receipts.

**Farm net worth (equity)** shows what the sector owned minus what it owed — the balance-sheet measure of farm wealth. Between 1950 and 1979, equity grew nearly eightfold, driven by rising land values. When commodity prices collapsed after 1980 and interest rates spiked under Volcker, land values fell sharply: farm equity dropped from a 1979 peak of $767 billion to $604 billion by 1985 — a loss of $163 billion in real assets while debt held firm. That negative equity shock triggered foreclosures, bank failures in the rural Midwest and Plains, and the political mobilization that became the 1980s farm crisis movement.

**Debt-to-asset ratio** (available from 1960) makes the leverage story precise. Through the 1960s farms carried roughly 14–16 percent leverage — manageable. Aggressive lending through the 1970s — when farmland seemed an inflation-proof investment — pushed the ratio to 16 percent by 1979 even as nominal asset values soared. After the crash, it climbed to 22 percent in 1985: the highest reading in the series, the moment of maximum fragility. The ratio has since declined as asset values recovered, but the line is rising again after 2012 as input costs and borrowing have grown faster than income.

**Government payments** charts federal outlays to farmers — commodity supports, conservation contracts, disaster relief — from the first New Deal appropriations in 1933 to the present. The pattern is instructive: payments stayed below $2 billion for forty years, then jumped nearly fivefold between 1979 and 1986 as Congress tried to shore up a collapsing farm sector. The spike contradicts a common claim in sagebrush rebellion rhetoric: that the federal government was a predatory presence rather than a financial lifeline. Western ranchers who mobilized against federal land management in the same years were often the same operators collecting federal payments to survive the commodity crash.

## Data and method

- **Source**: USDA Economic Research Service, [Farm Income and Wealth Statistics](https://www.ers.usda.gov/data-products/farm-income-and-wealth-statistics/), February 2026 release. U.S.-aggregate series only; state-level balance-sheet data has been suspended by ERS as of 2025.
- **Coverage**: Net farm income and farm assets/debt/equity run from 1910 through the 2026 ERS forecast. Government payments begin in 1933 (the first AAA appropriations). The debt-to-asset ratio series begins in 1960.
- **Units**: All dollar values in nominal (current-year) billions. No inflation adjustment is applied — the equity panel in particular reflects both real wealth change and general price-level movement.
- **Pipeline script**: [`scripts/build_farm_income.py`](https://github.com/hepplerj/sbr-website/blob/main/scripts/build_farm_income.py). No API key required; the script downloads the ERS bulk ZIP directly.
