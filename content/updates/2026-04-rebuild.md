---
title: "Interactive enhancements across maps, charts, and timeline"
date: 2026-04-26
summary: "A round of feature work on the visualization layer: county-level Follow-the-Money map, era spans on the timeline, crosshair trackers, lazy-loaded grazing-allotment files, and a faster cosponsorship filter."
---

## Narrative

- **First introduction essay** drafted: [What was the Sagebrush Rebellion?](/narrative/introduction/) — opens the long-form thread of the project with a Nevada-centered account of Assembly Bill 413 (1979) and the political lineage running back through the Public Land Law Review Commission and forward into the standoffs of the 2010s.

## New sightlines

- **[Federal Payments by County](/sightlines/federal-payments-map/)** — a county-level choropleth recreating the structure of the Jay Taylor's *Follow the Money* project (Stanford, 2016). Pick one of ten federal-payment programs and a year between 1906 and 2020; the map shades each western county by the amount it received that year (2020 dollars).
- **[BLM Grazing Allotments by State](/sightlines/grazing-allotments/)** — replaces the Nevada-only allotment view. A state selector lets you flip across all ten Taylor-Grazing-Act states, ~21,700 polygons in total split into per-state files. A second layer marks five hand-curated landmarks (Bunkerville, Owyhee, Harney County, Grand Staircase-Escalante, Elko) with explanatory blurbs.
- **[USFS Range Allotments](/sightlines/usfs-range-allotments/)** — 8,440 Forest Service grazing allotments nationwide, fetched from the USDA EDW.

## Timeline rebuild

The [Federal Public-Lands Timeline](/sightlines/timeline/) doubled from 33 to 65 point events plus 6 multi-year spans. Coverage now starts at the 1785 Land Ordinance and runs through 2023. Three new visual elements:

- **An era strip above the lanes**, rendered as a thin line + label per period (Dust Bowl, Farm Crisis, Civilian Conservation Corps, the Federal Railroad Grants, the Second Sagebrush Rebellion 1979–82, the Wise Use movement 1988–2000).
- **In-lane span capsules** — a multi-year movement or program can render as a tinted bar on its lane behind the point dots.
- **Hoverable lane labels**: each lane's sub-description is now revealed on hover instead of always-visible, with a dotted-underline footnote affordance.

## Chart improvements

- **Federal payments line chart → bar chart with program selector.** The original line view squashed small programs against a $600M PILT ceiling. Each program now gets its own y-axis with per-program annotations.
- **Farm consolidation → small multiples.** Two stacked panels (number of farms in millions, average farm size in acres) on independent y-axes, replacing the indexed-to-1950 line chart.
- **Crosshair tracker** added to multi-series line charts, stacked stripes (regional precipitation / temperature), and small-multiples. A vertical guide snaps to the nearest year and the info card shows every series' value at once.
- **Bankruptcies count vs. rate toggle.** The [Farm Bankruptcies](/sightlines/farm-bankruptcies/) chart now offers a "Filings (count)" / "Rate (per 1,000 farms)" selector. Farm-count totals are backfilled from the consolidation pipeline (NASS QuickStats) so the rate runs from 1910 through 2024. Per-farm, the 1980s Farm Crisis spikes substantially higher than the 1920s ag depression — a story the raw count flattens.
- **Period bands on bar charts.** The same era-strip design used on the timeline (thin line + label) is now available on bar charts via a `periods:` config block. The bankruptcies chart uses it to mark the 1920s ag depression, Dust Bowl, and Farm Crisis at the top of the canvas.

## Map improvements

- **Click-to-filter legend** on the *US Federal Lands by Agency* map. Click an agency to dim everything else.
- **Cleaner click-popup** for grazing allotments — softer typography, only the fields that matter, prose body for landmark descriptions.
- **Per-layer toggle visibility** so primary data layers can stay always-on while overlays remain user-toggleable.

## Performance

- **Cosponsorship network filter** is much faster on dense graphs. Filtering by bill category now uses precomputed per-node category sets and CSS class toggles instead of inline opacity mutations on every datum.

## Reading + navigation

- **Sticky table of contents** on narrative essays. Opt in by adding `toc: true` to the page's frontmatter; pages without it keep the original single-column layout. Active section highlights as you scroll. Collapses cleanly on narrow screens.
- **Region map hover preview.** On the Sightlines index, hovering a state on the mini map now fades out everything outside that region; hovering a legend chip does the same in reverse. A small note clarifies that the regions roughly mirror Forest Service region designations.
- **Header simplified.** Dropped the "A century of sagebrush rebellions" subtitle from the header. The site name stands alone for now while the project's scope settles.
- **Cosponsorship bills table** now includes a Years column showing the two-year span of each Congress.

## Plumbing

- Two RSS feeds now: `/narrative/index.xml` for essays and `/updates/index.xml` for this changelog. Other sections no longer generate RSS.
- The Sources page now includes a *Digital history* section.
