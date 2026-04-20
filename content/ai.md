---
title: "On Generative AI in This Project"
lede: "Transparency about which parts of Governing Ground were produced with AI assistance — and, more importantly, which were not."
---

*Governing Ground* is built with the assistance of generative AI. This page documents which components AI helped produce, which it did not, and how AI output is reviewed.

## What AI helped build

- **Site infrastructure.** The Hugo theme, layout templates, partials, shortcodes, and CSS. The build and deploy scaffolding. The palette, typography system, and component library.
- **Visualization code.** The Leaflet map module (`maps.js`), the D3 AlbersUSA map module (`d3-maps.js`), the D3 force-directed network module (`networks.js`), and the D3 chart module (`charts.js`) that renders climate stripes, line plots, and bar charts.
- **Data processing pipelines.** Python scripts that aggregate NOAA monthly temperature series to annual anomalies; that compile US Courts Table F-2 and Stam historical bankruptcy data into a combined 1899–2024 series; that filter national GeoJSON and TopoJSON files to the project's Western focus; and that crosswalk federal judicial districts to states.
- **Page apparatus.** Frontmatter, methodology sections in map/network/chart About panels, legends, data-source notes, and figure captions were drafted or refined with AI assistance and then reviewed for accuracy.
- **Sample data structures.** The Bundy-family network JSON and placeholder configurations used during scaffolding were drafted by AI and revised against the historical record.

## What AI did not write

**The narrative essays.** Every piece of long-form historical analysis in the [Narrative](/narrative/) section — interpretation, argument, sourcing, voice — is written by Jason Heppler. An AI agent may leave placeholder drafts during scaffolding; any narrative text that appears on this site in final form is the author's own work.

**The research.** The archival work, the choice of which questions to ask, which sources to consult, which arguments to make, which datasets to use and which to reject, is human work. The AI did not decide that the Bankhead-Jones lands mattered to the sagebrush-rebellion story, that the 1920s agricultural depression was worth recovering alongside the Dust Bowl, or that the Northern Plains belonged on the Federal Lands map. Those are scholarly judgments.

## How AI output is reviewed

All AI-generated code is reviewed and tested locally before publication. All AI-drafted prose in About panels, methodology notes, and figure captions is reviewed for factual accuracy against the cited primary sources. Data integrity is verified against the named sources — NOAA NCEI Climate at a Glance, the USDA Forest Service Enterprise Data Warehouse, Dinterman's `historical-bankruptcies` compilation of US Courts data, and so on.

When AI output is wrong or imprecise — as it sometimes is, particularly about specific historical figures, dates, or quantitative claims — it is corrected. This page will be updated as the project grows.

## Reproducibility

Every dataset published on the site is produced by a small, reviewable Python script committed to the repository. The [`scripts/`](https://github.com/hepplerj/sagebrush/tree/main/scripts) directory contains one build script per dataset:

- [`build_federal_lands.py`](https://github.com/hepplerj/sagebrush/blob/main/scripts/build_federal_lands.py) — 14-state federal-ownership choropleth (public US-states GeoJSON + CRS R42346 ownership shares)
- [`build_conus_temperature.py`](https://github.com/hepplerj/sagebrush/blob/main/scripts/build_conus_temperature.py) — annual CONUS temperature anomalies (NOAA NCEI)
- [`build_bankhead_jones.py`](https://github.com/hepplerj/sagebrush/blob/main/scripts/build_bankhead_jones.py) — National Grasslands, Land Utilization Projects, and federal-lands context (USDA Forest Service EDW)
- [`build_us_federal_lands.py`](https://github.com/hepplerj/sagebrush/blob/main/scripts/build_us_federal_lands.py) — pre-projected AlbersUSA federal-lands TopoJSON (PAD-US, ~2014)
- [`build_farm_bankruptcies.py`](https://github.com/hepplerj/sagebrush/blob/main/scripts/build_farm_bankruptcies.py) — 1899–2024 farmer-bankruptcy series + West/Plains aggregate (Dinterman's compilation of Stam ERS and US Courts Table F-2)

Each script documents its source URLs, its transformation logic, and — where relevant — the reasoning behind its analytical choices (baseline period, binning, state set). A `Makefile` at the project root rebuilds any or all of the datasets. The scripts use only the Python standard library so they stay portable; no Conda environments, no pinned dependencies, no proprietary tooling.

AI assistance drafted these scripts in the first pass, as with the rest of the codebase. The scripts are then read, run, and corrected by the author — and they are the versioned, auditable record of how the project's data was assembled. Anyone rerunning them on the same source URLs should get the same files that ship on the site.

## Tools and sessions

The generative AI used for this project is [Claude Code](https://www.claude.com/product/claude-code) (Anthropic), running Claude Opus 4.7 (1M context). The project's GitHub repository preserves the commits produced across sessions; significant design decisions and the conversations that produced them are available on request.

## Citation

If you cite this project, please cite Jason Heppler as the author. The use of generative AI in its production is acknowledged here, in the style of how an earlier generation of digital historians acknowledged the use of content management systems, database software, or GIS tools — as infrastructure, not authorship.
