---
title: "Farm Foreclosures, 1913–1981"
date: 2026-07-18
lede: "The federal government's own count of farms lost to foreclosure — a series that ends on the eve of the 1980s farm crisis."
weight: 36
draft: true
viz: chart
themes: [farm-crisis, rural-economy]
regions: [national]
chart:
  src: /data/farm-foreclosures.json
  type: bars
  field: foreclosures
  xfield: year
  datapath: series
  title: "Farms lost to foreclosure and related defaults per 1,000 farms, 1913–1981"
  ylabel: "Foreclosures per 1,000 farms"
  unitshort: " per 1,000 farms"
  infotitle: "Farm transfers"
  infoprompt: "Hover a bar for that year's rate. Use the selector to switch transfer type."
  periods:
    - { start: 1921, end: 1929, label: "1920s ag depression",
        description: "Post-WWI commodity-price collapse. Foreclosure rates quintuple between 1921 and 1925 as wartime land debts come due against falling prices." }
    - { start: 1930, end: 1940, label: "Dust Bowl",
        description: "Drought, erosion, and the deepest farm-credit collapse in US history. The 1933 peak — 38.8 foreclosures per 1,000 farms — is the moment state moratorium laws and federal farm-credit intervention arrive." }
  selector:
    label: "Show"
    default: "foreclosures"
    options:
      - { value: "foreclosures", label: "Foreclosures & defaults (per 1,000 farms)",
          title: "Farms lost to foreclosure and related defaults per 1,000 farms, 1913–1981",
          ylabel: "Foreclosures per 1,000 farms",
          unit: " per 1,000 farms",
          annotations: [{ year: 1933, label: "38.8 per 1,000" }] }
      - { value: "foreclosures_n", label: "Foreclosures & defaults (est. farms lost)",
          title: "Estimated farms lost to foreclosure and related defaults, 1913–1981",
          ylabel: "Estimated farms lost (rate × farm count)",
          unit: " farms (est.)",
          annotations: [{ year: 1933, label: "≈256,000 farms" }] }
      - { value: "tax_sales", label: "Tax sales",
          title: "Farms lost to delinquent-tax sales per 1,000 farms, 1927–1969",
          ylabel: "Tax sales per 1,000 farms",
          unit: " per 1,000 farms",
          annotations: [{ year: 1933, label: "15.3 per 1,000" }] }
      - { value: "voluntary", label: "Voluntary sales",
          title: "Voluntary sales and trades per 1,000 farms, 1913–1981",
          ylabel: "Voluntary sales per 1,000 farms",
          unit: " per 1,000 farms",
          annotations: [{ year: 1947, label: "Postwar land boom" }] }
      - { value: "total", label: "All transfers",
          title: "Farms changing ownership per 1,000 farms, by all methods, 1927–1981",
          ylabel: "Transfers per 1,000 farms",
          unit: " per 1,000 farms" }
---

<!-- EDITORIAL SCAFFOLD — replace with your prose before publishing.
     Verified numbers below are safe to keep; the framing is yours to write. -->

Each bar is one year's rate of farms lost to foreclosure, per 1,000 farms in the United States, from a US Department of Agriculture series that ran from 1913 until the department stopped counting in 1981.

<!-- Key observations to develop:

- **The interwar catastrophe dwarfs everything.** From a baseline of
  2.5–4 per 1,000 in the 1910s, the rate reaches 17.4 by 1926 — before
  the Crash — and peaks at 38.8 per 1,000 in 1933. Roughly one farm in
  26 was foreclosed in that single year. The 1920s bars are the
  essential context for the 1930s rebellion: the Plains and Mountain
  West entered the Depression already a decade into a farm-credit
  collapse. (Ties to the Taylor Grazing Act / Bankhead-Jones moment —
  same framing as the bankruptcies chart.)

- **Tax sales are the hidden second channel.** Switch the selector:
  delinquent-tax sales add another 15.3 per 1,000 in 1933 — together
  with foreclosures, ~54 forced transfers per 1,000 farms. Tax-sale
  loss is the mechanism most associated with the Plains counties.

- **The postwar quiet.** After 1945 the foreclosure rate never again
  exceeds 3 per 1,000. The voluntary-sales view shows what replaced
  distress: the 1946–48 land boom (57+ per 1,000) and the consolidation
  era — farmers selling out at high prices rather than being sold out.
  (Cross-link: /sightlines/farm-consolidation/.)

- **The series ends in 1981 — and that ending is the point.** USDA
  discontinued the transfer survey on the eve of the worst farm-debt
  crisis since the 1930s. There is no government count of 1980s farm
  foreclosures; the record passes to bankruptcy courts and lender
  files. The companion bankruptcies chart takes over exactly where
  this one goes silent. (Cross-link: /sightlines/farm-bankruptcies/ —
  and add the reciprocal link there at publish time.)
-->

## Data and method

- **Source**: USDA's farm real estate transfer series — "farm transfers: estimated number by various methods per 1,000 of all farms" — begun by the Bureau of Agricultural Economics and continued by the Economic Research Service until its discontinuation after 1981. The estimates derive from county courthouse records and USDA's annual survey of farm-real-estate reporters.
- **Transcription**: the series predates electronic publication and exists only in scanned page images. Values were hand-transcribed from the cumulative national tables in three *Agricultural Statistics* annuals — table 634 (1957 volume) for 1913–1954, table 638 (1967 volume) for 1955–1965, and table 607 (1981 volume) for 1966–1981 — using the latest published revision for each year, and cross-checked against the tables' overlapping year ranges and against *Historical Statistics of the United States* (1949), series E 6–11. The transcription lives in the repository at `scripts/data/usda_farm_transfers.csv` with per-row source attribution.
- **Definitions**: "Foreclosures & defaults" includes foreclosures, assignments, bankruptcies, and related defaults — sales to avoid foreclosure among them. Tax sales were reported separately from 1927 through 1969 only. "All transfers" additionally counts inheritances, gifts, and estate sales, and is available from 1927. Years are 12-month periods ending in mid-March (through 1975) or February 1 (1976–1981); Alaska and Hawaii are excluded from 1966 forward.
- **Estimated counts**: USDA published this series only as rates. The "est. farms lost" view multiplies each rate by that year's farm count — the same annual farm-number series (via Dinterman's `historical-bankruptcies` compilation) that the [bankruptcies chart](/sightlines/farm-bankruptcies/) uses for its per-1,000 view, so the two charts share a denominator source. Estimates are rounded to the nearest hundred; the 1933 figure (≈256,000 farms) is consistent with the "more than 200,000" cited in the farm-crisis literature.
- **Why the chart ends in 1981**: foreclosure is a state-court (or non-judicial) process with no federal registry. When USDA stopped estimating transfers by type, no agency replaced the count — which is why the 1980s farm crisis, and everything since, is measured through [bankruptcy filings](/sightlines/farm-bankruptcies/) and lender data instead.
