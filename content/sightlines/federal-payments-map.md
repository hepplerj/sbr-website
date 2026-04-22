---
title: "Federal Payments by County"
date: 2026-04-21
lede: "The county-level companion to the federal-payments chart. Pick a program and a year; counties are shaded by how much they received that year (2020 dollars)."
weight: 22
draft: false
viz: map
themes: [public-lands, rural-economy]
regions: [great-plains, intermountain-west, pacific, national]
map:
  center: [41.0, -112.0]
  zoom: 5
  legendtitle: "Payment (thousands, 2020 $)"
  infotitle: "County payments"
  infoprompt: "Pick a program and year, then hover a county for its payment that year."
  layers:
    - src: /data/ftm-counties.geojson
      style: sage
      label: "Counties"
      labelfield: name
      popupnote: "Follow the Money — Taylor et al. 2016"
  paymentsviz:
    layerindex: 0
    manifesturl: /data/ftm-payments-manifest.json
    srctemplate: /data/ftm-payments-{slug}.json
    fipsfield: fips
    default: PILT
    year: 2010
---

## What the map shows

Every county in the eleven western states for which Joseph Taylor, Erik Steiner, and collaborators reconstructed federal-payment histories at the county-year-program scale. Each county is shaded by the amount it received from the selected program in the selected year, expressed in thousands of 2020 dollars. Counties that received nothing that year show a muted gray; counties that received the bulk of a program's disbursements in that year show the darkest rust.

Use the **Program** dropdown in the bottom-left to switch which revenue-sharing or in-lieu-of-taxes program is being mapped. Use the **Year** slider to move through time; the map re-colors in place. The legend scale is fixed per-program (built from that program's all-time maximum county-year value), so dragging the slider shows the program waxing and waning honestly over a century.

**What to notice:**

- **PILT** (Payments in Lieu of Taxes) lights up everywhere with high-federal-ownership land from 1977 forward — the map looks blankest before PILT was enacted and fills in afterward. Counties with the largest shaded acres (Nye, NV; Pima, AZ) are the ones with the most federal land to be compensated for.
- **SRS** (Secure Rural Schools) is the dramatic stripe in the Pacific Northwest from 2000 onward — western Oregon and northern California counties that lost federal-timber revenue after the spotted-owl injunctions. Siskiyou, Trinity, Jackson, Josephine, Lane, Douglas: these counties light up a rust-dark red.
- **Forest Service 25% Fund** is the long-running predecessor to SRS — darker in the 1960s–1980s Pacific Northwest and the northern Rockies, fading after 2000 as SRS effectively replaced it.
- **O&C Lands** (Oregon and California Revested Lands) is a narrow band of eighteen Oregon counties — Coos, Douglas, Jackson, Josephine, Klamath, Lane, Lincoln, Linn, Curry, Benton, Marion, Polk, Tillamook, Washington, Yamhill, Columbia, Clackamas, and Multnomah. Nowhere else in the country shows up on this map.
- **Federal Mineral Leasing** is a Wyoming-and-Utah story after 1976 — the coal, oil, and gas revenue shared back to the states and the counties where extraction happens.

## Why this map matters

Jay Taylor and Erik Steiner built *Follow the Money* to show that the sagebrush-politics claim "the federal government takes but doesn't give" has a specific, testable shape. For some counties — the PNW timber counties, the Wyoming mineral counties — federal payments are the single largest item on the local ledger. For other federally dense counties with fewer receipts (much of the Great Basin), PILT is a comparatively small cushion against an untaxable base. And in years when a program lapses or gets cut, you can literally watch the rust drain out of a region. That is a fiscal pattern the aggregated [line chart](../federal-payments/) compresses into a single curve; this map unfolds it.

## Data and method

- **Source**: Taylor, Joseph E., III, Krista Fryauff, Erik Steiner, Celena Allen, Alex Sherman, and Zephyr Frank. *Follow the Money: A Spatial History of In-Lieu Programs for Western Federal Lands.* Spatial History Project, CESTA, Stanford University, 1 June 2016. Licensed CC BY-NC 4.0.
- **Payments file**: the project's `Federal_Program_History_2020_Dollars_JAY_TAYLOR.csv`, re-shaped into ten per-program JSON files (one per federal program). Amounts are rounded to thousands of dollars. Each program file is loaded on demand when the user selects it from the dropdown — the map ships around 1 MB of data even if someone touches every program.
- **County geometry**: US Census Bureau TIGERweb Generalized_ACS2023 cartographic boundaries at 1:20M scale, filtered to the eleven states in the dataset.
- **Color scale**: sqrt-transformed — the biggest single-county-year spike (a Lane County, Oregon SRS payment, or a Sublette County, Wyoming mineral-leasing year) doesn't wash out the mid-range. Scale is fixed per-program for honest year-over-year comparison.

## Companion views

- **[Federal Payments to Western Counties](../federal-payments/)** — the same dataset aggregated to an annual total per program. The chart shows the national-scale time series; this map shows which counties carry the totals in any given year.
- **[Taylor Grazing Districts](../grazing-districts/)** — the administrative geography behind the TGA-3 and TGA-15 payment programs.
- **[Federal Lands in the American West](../federal-lands/)** — the ownership-share map that explains why some counties receive so much more than others: they host so much more federal land.
