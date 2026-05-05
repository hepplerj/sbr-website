---
title: "Farm wealth visualization, cosponsorship expansion, and site improvements"
date: 2026-05-05
summary: "A new farm income and wealth sightline (1910–2026) with a presidential administrations toggle; the cosponsorship network expanded to 57 bills and 246 legislators; a new inline definition shortcode; and a round of infrastructure fixes."
---

## New sightlines

- **[Farm Wealth, 1910–2026](/sightlines/farm-income-wealth/)** — four stacked panels drawn from the USDA ERS Farm Income and Wealth Statistics (February 2026 release): net farm income, farm net worth (equity), debt-to-asset ratio, and government payments to farmers, all running from 1910 through the 2026 ERS forecast. A **"Show administrations" toggle** overlays shaded bands by presidential administration across all four panels simultaneously; hovering any year shows the president's name, party, and term alongside the panel values. The chart makes visible the 1970s land-value bubble, the 1980s Farm Crisis debt crunch, and the irony of sagebrush-era operators collecting record federal payments while demanding federal withdrawal from Western lands.

## Cosponsorship network expansion

The [Cosponsorship on Federal Public-Lands Bills](/sightlines/cosponsorship-network/) network has been extended:

- **57 bills** (was 41) — 16 new bills from the 97th–104th Congresses (1981–1996) added, covering the Public Rangelands Fee Act series (99th–102nd), the 104th Congress disposal push including H.R. 2745 with its 149 cosponsors, and several Watt-era transfer bills
- **246 legislators, 2,249 edges** (was 113 legislators, 814 edges) — the earlier-Congress additions pulled in the full Watt/Chenoweth/Hansen era caucus
- Pre-108th Congress bills now sourced from the Congress.gov API v3 (requires a free `CONGRESS_API_KEY`); 108th-onward bills continue from GPO govinfo.gov BILLSTATUS

## Chart improvements

- **Presidential administration bands** — available on small-multiples charts via `adminbands: true` in the chart's frontmatter config. Currently enabled on the Farm Wealth chart. Renders muted rust (Republican) and navy (Democrat) bands behind the data, toggled by a button below the chart. Hover readout adds president name and party when bands are active.
- **Larger axis labels** on stacked-stripes and small-multiples charts — bumped from 14 px to 26 px in SVG coordinates so tick labels stay legible at the scaled-down widths of the two-column sightlines layout.

## Sightlines filter map

- **Alaska** added as a new filter region on the Sightlines index map
- **Hawaii** placed in the Pacific Southwest region alongside California

## New shortcode: `define`

An inline definition tooltip shortcode. Wraps a term with a dotted underline; hovering surfaces a popup with the definition above it. The definition accepts light markdown (bold, italics). Keyboard-accessible via `:focus-within`.

```
{{</* define term="smallholder" */>}}
  A farmer or rancher who works a modest landholding.
{{</* /define */>}}
```

## Writing

- **[Welcome to Governing Ground](/narrative/welcome/)** — an orientation post describing the project's sections: Sightlines, Data, Writing, Bibliography, the AI transparency statement, and the Changelog.
- **About page** — expanded author bio with current appointments, recent books, and ongoing research projects.

## Infrastructure

- **Dart Sass** — the SCSS pipeline now uses Dart Sass 1.99+ (`transpiler: "dartsass"`) rather than the deprecated bundled libsass. Partials updated from `@import` to `@use`.
- **`hugo.Data`** — template references to `.Site.Data` updated to `hugo.Data` to clear deprecation warnings introduced in Hugo v0.156.
- **COinS metadata** — a `coins.html` partial now emits a `<span class="Z3988">` on each page so Zotero and compatible citation managers can detect and import page metadata automatically.
