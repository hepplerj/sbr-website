---
title: "On Generative AI"
lede: "Transparency about which parts of Governing Ground were produced with AI assistance — and, more importantly, which were not."
date: 2026-04-22
---

*Governing Ground* is built with the assistance of generative AI. This page documents which components AI helped produce, which it did not, and how AI output is reviewed.

I am documenting the use of generative AI both as an ethical claim and as a digital tool. Generative AI in the way I've deployed it in this project is not all that different from the use of content management systems, database software, or GIS tools in past and current digital history projects: generative AI as infrastructure, not authorship.

## What AI helped build

- **Site infrastructure.** The Hugo theme, layout templates, partials, shortcodes, and CSS. The palette, typography system, and component library were built in conversation with me.
- **Visualization code.** The Leaflet map module (`maps.js`), the D3 AlbersUSA map module (`d3-maps.js`), the D3 force-directed network module (`networks.js`), the D3 chart module (`charts.js`) that renders climate stripes, line plots, and bar charts, and the Sightlines index filter module (`sightlines-map.js`) with its clickable region mini-map.
- **Data processing pipelines.** Python scripts that pull and aggregate open and government data.
- **Page apparatus.** Frontmatter, methodology sections in map/network/chart About panels, legends, data-source notes, and figure captions were drafted or refined with AI assistance and then reviewed for accuracy.

## What AI did not write

**The narrative essays.** Every piece of long-form historical analysis in the [Narrative](/narrative/) section is written by me. Any narrative text that appears on this site is my work.

**The research.** The archival work, the choice of which questions to ask, which sources to consult, which arguments to make, which datasets to use and which to reject, is human work. The AI has not made any decisions about what matters to the sagebrush rebellion story. Those are my scholarly judgments.

## Reproducibility

Every dataset published on the site is produced by a small, reviewable Python script committed to the repository. The [`scripts/`](https://github.com/hepplerj/sagebrush/tree/main/scripts) directory contains one build script per dataset:

**Federal lands and grazing**
- [`build_federal_lands.py`](https://github.com/hepplerj/sagebrush/blob/main/scripts/build_federal_lands.py) — 14-state federal-ownership choropleth (public US-states GeoJSON + CRS R42346 ownership shares)
- [`build_us_federal_lands.py`](https://github.com/hepplerj/sagebrush/blob/main/scripts/build_us_federal_lands.py) — pre-projected AlbersUSA federal-lands TopoJSON (PAD-US, ~2014)
- [`build_bankhead_jones.py`](https://github.com/hepplerj/sagebrush/blob/main/scripts/build_bankhead_jones.py) — National Grasslands, Land Utilization Projects, and federal-lands context (USDA Forest Service EDW)
- [`build_grazing_districts.py`](https://github.com/hepplerj/sagebrush/blob/main/scripts/build_grazing_districts.py) — 93 BLM Taylor Grazing Act district polygons (BLM Egis ArcGIS FeatureServer)
- [`build_grazing_allotments.py`](https://github.com/hepplerj/sagebrush/blob/main/scripts/build_grazing_allotments.py) — ~21,700 BLM grazing-allotment polygons across 10 western states (BLM National Grazing Allotment FeatureServer)
- [`build_usfs_allotments.py`](https://github.com/hepplerj/sagebrush/blob/main/scripts/build_usfs_allotments.py) — 8,440 USFS range allotment polygons (USFS EDW Range Management layer)

**Climate and environment**
- [`build_conus_temperature.py`](https://github.com/hepplerj/sagebrush/blob/main/scripts/build_conus_temperature.py) — annual CONUS temperature anomalies (NOAA NCEI Climate at a Glance)
- [`build_conus_precipitation.py`](https://github.com/hepplerj/sagebrush/blob/main/scripts/build_conus_precipitation.py) — annual CONUS precipitation (NOAA NCEI)
- [`build_regions_climate.py`](https://github.com/hepplerj/sagebrush/blob/main/scripts/build_regions_climate.py) — temperature and precipitation for four western climate regions (NOAA NCEI)

**Rural economy**
- [`build_farm_bankruptcies.py`](https://github.com/hepplerj/sagebrush/blob/main/scripts/build_farm_bankruptcies.py) — 1899–2024 farmer-bankruptcy series + West/Plains aggregate (Dinterman's compilation of Stam ERS and US Courts Table F-2)
- [`build_farm_consolidation.py`](https://github.com/hepplerj/sagebrush/blob/main/scripts/build_farm_consolidation.py) — US farm count and average farm size, 1910–present (USDA NASS QuickStats API)
- [`build_follow_the_money.py`](https://github.com/hepplerj/sagebrush/blob/main/scripts/build_follow_the_money.py) — federal revenue-sharing payments to western counties, 1906–2020 (*Follow the Money*, Stanford CESTA)

**Politics and scholarship**
- [`build_cosponsorship_network.py`](https://github.com/hepplerj/sagebrush/blob/main/scripts/build_cosponsorship_network.py) — 41-bill federal public-lands cosponsorship network, 96th–118th Congresses (GPO govinfo.gov BILLSTATUS + Congress.gov API)
- [`build_timeline.py`](https://github.com/hepplerj/sagebrush/blob/main/scripts/build_timeline.py) — hand-curated federal public-lands chronology, 1872–2024
- [`build_bibliography.py`](https://github.com/hepplerj/sagebrush/blob/main/scripts/build_bibliography.py) — auto-keyed bibliography JSON from BibTeX source files

Each script documents its source URLs, its transformation logic, and the reasoning behind its analytical choices (baseline period, binning, state set). A `Makefile` at the project root rebuilds any or all of the datasets. The scripts use only the Python standard library so they stay portable: no pinned dependencies and no proprietary tooling are required.

AI assistance drafted these scripts in the first pass, as with the rest of the codebase. The scripts are then read, run, and corrected by me. All computational work is a versioned, auditable record of how the project's data was assembled and can be reviewed on Github. Anyone rerunning them on the same source URLs should get the same files that ship on the site. All AI-generated code is reviewed and tested locally before publication. All open data fetched and processed is reviewed for accuracy. 


## Tools and sessions

The generative AI used for this project is [Claude Code](https://www.claude.com/product/claude-code) (Anthropic), running Claude Sonnet 4.6. The project's GitHub repository preserves the commits produced across sessions.

Generative AI is more disciplined than I am about `git` commits, pull requests, and branching, and handles many of these commit messages for me.
