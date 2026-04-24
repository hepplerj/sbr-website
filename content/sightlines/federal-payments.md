---
title: "Federal Payments to Western Counties"
date: 2026-04-21
lede: "Over a century of in-lieu-of-taxes payments, revenue shares, and compensation programs flowing from federal-land agencies to the counties that host them. Reconstructed from the Taylor/Steiner *Follow the Money* dataset."
weight: 21
draft: false
viz: chart
themes: [public-lands, rural-economy]
regions: [great-plains, intermountain-west, pacific, national]
chart:
  type: bars
  src: /data/follow-the-money.json
  datapath: data
  xfield: year
  ylabel: "Millions of 2020 dollars"
  unitshort: "M"
  infotitle: "Annual payments"
  infoprompt: "Hover a bar for that year's total (2020 dollars, millions)."
  title: "Federal payments to western counties, 1906–2020"
  selector:
    label: "Program"
    default: "PILT"
    options:
      - { value: "PILT",   label: "Payments in Lieu of Taxes (PILT)", title: "PILT — Payments in Lieu of Taxes, 1906–2020",
          annotations: [{ year: 1976, label: "PILT enacted (FLPMA)" }] }
      - { value: "SRS",    label: "Secure Rural Schools",             title: "Secure Rural Schools, 1906–2020",
          annotations: [{ year: 2000, label: "SRS Act" }, { year: 2008, label: "Peak" }] }
      - { value: "FS",     label: "Forest Service 25% Fund",          title: "Forest Service 25% Fund, 1906–2020",
          annotations: [{ year: 1908, label: "25% Fund statute" }, { year: 1990, label: "Peak · spotted-owl era" }] }
      - { value: "O_C",    label: "Oregon & California Lands",        title: "Oregon & California Lands, 1906–2020",
          annotations: [{ year: 1937, label: "O&C Act" }] }
      - { value: "LWCF",   label: "Land & Water Conservation Fund",   title: "Land & Water Conservation Fund, 1906–2020",
          annotations: [{ year: 1964, label: "LWCF Act" }, { year: 2020, label: "Great American Outdoors Act" }] }
      - { value: "FML",    label: "Federal Mineral Leasing",          title: "Federal Mineral Leasing, 1906–2020",
          annotations: [{ year: 1920, label: "Mineral Leasing Act" }] }
      - { value: "TGA-3",  label: "Taylor Grazing Act (3% receipts)", title: "Taylor Grazing Act 3% receipts, 1906–2020",
          annotations: [{ year: 1934, label: "Taylor Grazing Act" }] }
      - { value: "TGA-15", label: "Taylor Grazing Act (15% receipts)",title: "Taylor Grazing Act 15% receipts, 1906–2020",
          annotations: [{ year: 1976, label: "FLPMA" }] }
      - { value: "BLM",    label: "BLM Receipts",                     title: "BLM direct receipts, 1906–2020" }
      - { value: "BJA/NG", label: "Bankhead-Jones / National Grasslands", title: "Bankhead-Jones / National Grasslands, 1906–2020",
          annotations: [{ year: 1937, label: "Bankhead-Jones Act" }, { year: 1960, label: "National Grasslands designated" }] }
---

Reconstructed from Jay Taylor's work in *[Follow the Money](https://followthemoney.stanford.edu)*, this chart visualizes ten revenue-sharing and in-lieu-of-taxes programs that transfer money from federal land agencies to the counties that host them. All figures are summed across the eleven western states (Arizona, California, Colorado, Idaho, Montana, Nevada, New Mexico, Oregon, Utah, Washington, Wyoming) and expressed in 2020 dollars. 

Sagebrush politics is partly a fiscal story. A Nevada county where a high percentage of the land is federally administered cannot tax that land, cannot levy property assessments on it, and depends on federal in-lieu payments to fund schools, roads, and public safety. 

Historian Jay Taylor built the *Follow the Money* dataset to make this visible at the county-year scale. Their original visualizations at the [project site](https://followthemoney.stanford.edu) include county-level maps that rise and fall over time: a much finer-grained view than this aggregate chart. I've only summed their numbers here; the county-scale detail is theirs. [A companion map](../federal-payments-map/) is available for visualizing this data at the county level.

## Data and method

- **Source**: Taylor, Joseph E., III, Krista Fryauff, Erik Steiner, Celena Allen, Alex Sherman, and Zephyr Frank. *Follow the Money: A Spatial History of In-Lieu Programs for Western Federal Lands.* Spatial History Project, CESTA, Stanford University, 1 June 2016. Licensed CC BY-NC 4.0.
- **Re-aggregation**: summed the `Federal_Program_History_2020_Dollars_JAY_TAYLOR.csv` file across all counties per year, per program. Missing-data sentinel values (`-999`, `NA`) were treated as zero for the sum. Values shown are millions of 2020 dollars.
- **Coverage**: 11 western states, ~400 counties, 1906–2020 (115 years). Some programs begin later in the series (e.g., PILT from 1977, SRS from 2001) and some taper earlier.

