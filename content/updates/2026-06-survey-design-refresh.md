---
title: "A Survey design refresh"
date: 2026-06-06
summary: "Site-wide typography returned to a four-family prairie stack, panel-band headers on every section, a redesigned Sightlines single layout, a reworked Documents page with an apparatus disclosure, and a new footer credit colophon."
---

The site has had a pretty substantial design pass — typographic, structural, and editorial. The goal across the whole sweep was *Survey register*: panels of paper-colored chrome with archival typography that reads as a digital edition rather than a content-management template. Most of what follows is visual rather than functional, but it changes how the site reads.

## Typography

The site is back to a **four-family prairie stack** after a brief Spectral-only experiment. Every type rule resolves through CSS custom properties (`--font-display`, `--font-body`, `--font-ui`, `--font-mono`), so the swap was a single token change with no rule-level edits.

- **Zilla Slab** for display headings — slab serif, archival-feeling, period-appropriate to the project's subject matter.
- **Source Serif 4** for long-form reading prose, with italic axes for ledes and pull quotes.
- **Source Sans 3** for labels, meta rows, navigation, and buttons — UPPERCASE with letter-spacing where it reads as a chip.
- **JetBrains Mono** for figures, axis ticks, hover readouts, and code.

## Panel-band headers across the site

Every section index and most single pages now wear a **`--panel` band** — a warm bone background offset against the page's paper — instead of the earlier hairline-rule treatment. Rust JetBrains Mono kicker over a slab-serif title over an italic Source Serif lede, sealed by a 1.5px ink rule. The whole rhythm is consistent across the seven page-header families (default list, default single, sightlines list/single, documents single, Writing index, narrative essay singles).

Each H1 is now the **same clamp size** sitewide — `clamp(2.4rem, 5.2vw, 3.6rem)` — so a title reads at the same weight whether you're on `/data/`, `/sources/`, `/sightlines/cattle-prices/`, or `/narrative/<essay>/`. The earlier two-tier system (smaller for reference, larger for landing pages) created an inconsistency that wasn't doing useful editorial work.

Header band chrome was **trimmed** to roughly 80% of its previous vertical footprint — pulling first body content closer to the top of the laptop viewport without losing the panel-band identity.

## Sightlines single layout, redesigned

Individual sightline pages — every map, network, and chart — were on a tight 1fr/2fr split with the essay in a left sidebar and the viz constrained to two-thirds of the page width. Charts in particular got crammed.

The new layout is **stacked**: banded header on top, the viz block taking the full page width below it, and a 46rem prose column for the essay context underneath. Charts now render at their natural breathing room; maps and networks get `min-height: 70vh` so Leaflet and D3-force have room to do their thing.

A small but meaningful chart improvement: the **info card now follows the cursor on data hover** instead of staying pinned to the upper-right corner where it sometimes obscured the very data you were reading. When the cursor is in dead space within the chart, the card snaps back to its default corner — so it's only following when you're actually reading a value.

## Documents single, with an apparatus disclosure

Transcribed-document pages were also reworked. The header now bands the same way as the rest of the site. The document body sits in the same 46rem reading column the essays use, at 19px Source Serif.

The big editorial change is a **disclosure pattern for document metadata**. Instead of a chunky catalog card at the top of every document, there's now:

1. A short *identifier strip* directly under the title: **Type · Date · Sponsor · Author · Jurisdiction** in JetBrains Mono dot-separated. The orienting facts a reader needs at a glance.
2. A collapsible **"About this document"** disclosure that holds the full apparatus — citation, source, alt sources, provenance, related documents, editorial-statement link.

Readers see what the document *is* immediately; researchers click for the full apparatus when they need it. The two states sit one tap apart.

Note: the Documents section is **hidden from the main nav for now** while I finish a hand-transcription pass on the five seed documents (Antiquities Act 1906, Taylor Grazing 1934, MUSY 1960, Wilderness 1964, FLPMA 1976). The URLs still work; the section returns to the nav once the transcriptions are clean.

## Footer credit colophon

The footer's brand column now includes a **credit colophon** — *"Governing Ground is a project created, developed, and written by Jason A. Heppler. © 2025–2026. Last updated June 6, 2026."* The end year and last-updated date pull from Hugo's `now` at build time, so the line refreshes on every rebuild without manual upkeep.

A small **version stamp** sits centered in the license bar — bumped manually in `hugo.toml`'s `params.version` on release. Footer column links got tighter spacing and a hairline underline that brightens on hover.

## Smaller polish

- **Site title and nav links** now align by visual center rather than alphabetic baseline — the wordmark (mixed-case slab serif with descenders) and the nav links (all-caps sans with no descenders) needed center alignment to *look* aligned, not just align mathematically.
- **`hideMeta: true`** is a new frontmatter knob for reference pages where the date + reading-time strip in the header reads as ceremony rather than information. Currently set on `/glossary/`, `/feeds/`, and `/ai/`.
- **Search page header** was getting crammed into the page's narrow reading column; lifted out to band properly with the rest of the site's headers.

Most of these are invisible until you notice they're there — which is the point.
