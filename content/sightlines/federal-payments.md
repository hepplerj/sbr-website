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

## What the chart shows

Ten revenue-sharing and in-lieu-of-taxes programs that transfer money from federal-land agencies to the counties that host them. All figures are summed across the eleven western states (Arizona, California, Colorado, Idaho, Montana, Nevada, New Mexico, Oregon, Utah, Washington, Wyoming) and expressed in 2020 dollars. The six largest programs are plotted above; four smaller programs (Taylor Grazing Act 3%, TGA 15%, BLM direct receipts, Bankhead-Jones/National Grasslands) sit on the order of a few million dollars a year and are documented in the underlying data.

**What to read from the curve:**

- **PILT is the modern backstop.** Enacted 1976 as part of FLPMA, funded on the order of hundreds of millions by the late 2010s. Designed to compensate counties for the untaxable federal estate inside them — the closest thing to a permanent federal-county revenue relationship.
- **Forest Service 25% Fund dominated for most of the 20th century.** Counties received a quarter of national-forest gross receipts (timber, grazing, recreation). As timber cut declined after the 1990s spotted-owl rulings and broader cutback in federal logging, the line crashes.
- **Secure Rural Schools stepped in.** SRS (2000, reauthorized periodically) replaces much of the collapsed FS 25% revenue with a congressional appropriation. It is perennially uncertain and politically fragile — the spikes and troughs in the SRS line are reauthorization fights.
- **O&C lands are their own story.** The Oregon & California revested lands (originally a 19th-century railroad grant, reverted to federal ownership in 1916) run under a dedicated revenue-sharing statute that historically paid out fifty percent of timber receipts. O&C counties in southern Oregon are the most fiscally dependent on federal timber in the United States.
- **Land & Water Conservation Fund** spiked in the late 1970s and has been a political football ever since. The 2020 Great American Outdoors Act made LWCF permanently funded; before that, its authorization expired and was reinstated on a near-annual cycle.
- **Mineral leasing** is volatile with commodity prices — coal, oil and gas receipts shared with the states where extraction happens.

## Why this dataset matters

Sagebrush-rebellion politics is partly a fiscal story. A Nevada or Oregon county where 60–90 percent of the land is federally administered cannot tax that land, cannot levy property assessments on it, and depends on federal in-lieu payments to fund schools, roads, and public safety. When those payments drop — as FS 25% did after 1990 — rural county budgets buckle, and the political intensity around federal-land decisions goes up. The 2000s SRS fight and the persistent calls for "county supremacy" over federal lands both trace partly to this fiscal dependence.

Taylor, Fryauff, Steiner, Allen, Sherman, and Frank built the *Follow the Money* dataset to make this visible at the county-year scale. Their original visualizations at the [project site](https://web.stanford.edu/group/spatialhistory/FollowTheMoney/) include county-level maps that rise and fall over time — a much finer-grained view than this aggregate chart. I've only summed their numbers here; the county-scale detail is theirs.

## Data and method

- **Source**: Taylor, Joseph E., III, Krista Fryauff, Erik Steiner, Celena Allen, Alex Sherman, and Zephyr Frank. *Follow the Money: A Spatial History of In-Lieu Programs for Western Federal Lands.* Spatial History Project, CESTA, Stanford University, 1 June 2016. Licensed CC BY-NC 4.0.
- **Re-aggregation**: summed the `Federal_Program_History_2020_Dollars_JAY_TAYLOR.csv` file across all counties per year, per program. Missing-data sentinel values (`-999`, `NA`) were treated as zero for the sum. Values shown are millions of 2020 dollars.
- **Coverage**: 11 western states, ~400 counties, 1906–2020 (115 years). Some programs begin later in the series (e.g., PILT from 1977, SRS from 2001) and some taper earlier (FS 25% effectively replaced by SRS).

## Companion views

- **[Taylor Grazing Districts](../grazing-districts/)** — the administrative geography behind the TGA-3 and TGA-15 lines.
- **[Federal Lands in the American West](../federal-lands/)** — the ownership-share backdrop. Counties with higher federal-land percentages are the ones these payments matter most to.
- **[Bankhead-Jones Projects](../bankhead-jones/)** — the land-utilization projects behind the BJA/NG program line.
