---
title: "Regional Congressional Cosponsorships, 96th–119th Congress"
date: 2026-05-24
lede: "Twenty-four Congresses of regional cosponsorship activity (1979–2026) charted by policy area and chamber."
weight: 1
draft: false
atlas:
  mode: trends
  src: /data/atlas-regional-timeseries.json
  metric: permember
  chamber: both
  howto:
    - "**Hover** anywhere over a panel to see a dashed vertical guide-line at the nearest Congress. Small dots mark where the line crosses each region's series, and the year span shows at the top of the line."
    - "**Click** a panel to pin the position. A solid dark line stays at the pinned Congress; hovering elsewhere still shows the dashed preview without losing your pin. Click the same spot again or use the **Unpin** button to dismiss."
    - "A **detail panel** opens below the charts once you pin. The left column shows that policy area's value, bill count, and party breakdown for each of the three regions. Click any region row to populate the right column with that delegation's members."
    - "The **right column** is a member list with name search and state-filter chips."
    - "**Metric** controls the y-axis: per-member (delegation-size-adjusted), share-of-region (% of total cosponsorships), or raw total."
---

This view plots cosponsorship attention across six CRS policy areas and twenty-four Congresses: the 96th (1979–1980) through the 119th (2025–2026). Each panel is one policy area, with three lines for each regional delegation I've created. This atlas asks "what does this delegation spend its cosponsorship attention on?"

The three regional delegations are:

- **Great Plains** — Montana, Wyomoing, Colorado, North Dakota, South Dakota, Nebraska, Kansas.
- **American West** — Alaska, Arizona, California, Hawaii, Idaho, New Mexico, Nevada, Oregon, Utah, Washington.
- **Midwest** — Iowa, Illinois, Indiana, Michigan, Minnesota, Missouri, Ohio, Wisconsin.

> 2026-06-04: While I consider the visualization contained here to be complete, the text is still in a draft state. Follow the [changelog](/updates/) for updates to this page.

## A note on the 119th

The 119th Congress is still in session as of this build. Cosponsorship counts will continue to accumulate.

## Data and method

This series uses two data sources, dispatched on Congress number:

- **108th and later (2003+)**: GPO `govinfo.gov` BILLSTATUS bulk-data ZIPs, one per chamber-type per Congress.
- **96th–107th (1979–2002)**: `api.congress.gov` v3 JSON API. 

The same regional and policy-area schema applies to both eras. The `byChamber` and `byParty` breakdowns are computed at build time and shipped in `atlas-regional-timeseries.json` (~120 KB for 24 Congresses).

The **per-member metric** divides cosponsorships by delegation size for *that Congress only* — accounting for delegation turnover. When you switch chamber to House or Senate, the divisor narrows to just that chamber's members from the region.