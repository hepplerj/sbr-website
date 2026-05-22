---
title: "Site search, a new climate chart, and a round of polish"
date: 2026-05-21
summary: "Full-text search via Pagefind and a custom 404 page; a new Regional Temperature chart; and a pass of chart-typography and layout refinements."
---

## Search

The site now has **full-text search**. A new [Search](/search/) page, built on [Pagefind](https://pagefind.app/), indexes every essay, sightline, data note, and source — readers can find a bill, a legislator, a place, or a phrase across the whole project. There's also a **custom 404 page** with a search box, so a broken or mistyped link lands somewhere useful instead of a dead end.

## New sightline

- **[Regional Temperature](/sightlines/regional-temperature/)** — annual temperature anomalies for the four NOAA climate regions (Northern Rockies & Plains, Southwest, Northwest, West), 1895–2024, as stacked stripes. The temperature counterpart to the existing Regional Precipitation chart; together they show a West that is warming unevenly and drying.

## Chart and layout polish

- **Stacked-stripes labels moved above each ribbon.** Region names previously sat in a cramped left-hand column that cropped long names like "Northern Rockies & Plains." They now sit above each ribbon, freeing the visualization to use the full width. Applies to Regional Temperature, Regional Precipitation, and the West & Plains Bankruptcies chart.
- **Figures set in a monospace face.** Chart axis ticks, hover readouts, and map-popup numbers now render in JetBrains Mono so digits align and read as data.
- **Period-band labels** (Dust Bowl, Farm Crisis, etc.) enlarged for legibility, and axis font sizes retuned across every chart type.
- **Small multiples** got more breathing room between panels.

## Infrastructure

- Social preview image and Open Graph / Twitter Card meta tags, so links to the site unfurl properly when shared.
- Project to-do tracking moved from a flat `TODO.md` file into [GitHub Issues](https://github.com/hepplerj/sbr-website/issues), labeled by category and priority tier.
- A sightlines layout refactor (title and lede into the sidebar) and a hero-image swap.
