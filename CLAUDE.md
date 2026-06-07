# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

*Governing Ground* — a digital history project on the sagebrush rebellions
(1930s–2016). A Hugo static site with a custom theme and a Python data
pipeline. The content mixes long-form narrative with interactive maps,
network graphs, time-series charts, and a reference atlas.

## Commands

```sh
hugo server -D          # dev server at :1313 (drafts visible)
hugo --gc --minify      # production build → public/

make                    # run all Python data-build scripts
make <target>           # run one; see scripts/README.md for the full table
make cosponsorship      # rebuild the public-lands cosponsorship network
make atlas-regional     # rebuild the regional-cosponsorship atlas (96–119)
make fig-great-plains   # rebuild the Great Plains narrative figure (SVG)
```

Python build scripts are **stdlib-only** by design — no `requirements.txt`,
no virtualenv, runs with any modern Python 3.9+. Keep it that way. The
one shell-script exception is `build_physio_great_plains.sh`, which needs
GDAL (`ogr2ogr`) to dissolve and simplify the USGS Fenneman shapefile;
its output is committed and only needs re-running if the upstream
shapefile changes (effectively never — Fenneman 1928 is historical).

Requires Hugo **extended** (v0.128+) for SCSS. Check with `hugo version` —
the string must contain `+extended`.

## Repository layout

```
content/sightlines/     — maps, networks, charts (all dispatched from one layout)
content/atlas/          — reference instruments (heatmaps, time-series, scorecards)
content/narrative/      — essays with authors cascade
content/glossary.md     — project vocabulary
content/sources/        — bibliography page
scripts/                — build_*.py pipelines (stdlib-only) and one .sh
scripts/.env            — gitignored API keys (CONGRESS_API_KEY, NASS_API_KEY)
scripts/.cache/         — gitignored pipeline cache (BILLSTATUS ZIPs,
                          Congress.gov API responses, USGS shapefiles)
static/data/            — JSON/GeoJSON/TopoJSON served at /data/ for JS fetches
static/figures/         — static SVG figures for narrative essays
data/                   — Hugo data files (e.g. bibliography.json) read at build time
themes/sagebrush/       — custom theme; treat it as part of the project, not a dependency
Articles.bibtex         — source-of-truth bibliography, parsed by build_bibliography.py
Books.bibtex
GitHub Issues            — flagged future work, labeled by category + tier
```

## Three gotchas that WILL bite if not remembered

1. **Hugo lowercases `.Params` frontmatter keys, recursively.** Nested
   objects (palettes, labels, map configs) arrive as all-lowercase keys
   no matter what the YAML says. All viz config JS modules normalize to
   lowercase on lookup. When adding new fields, use lowercase or
   single-word keys (`valuefield` not `valueField`) in both frontmatter
   and JS. This is documented in the header comments of each JS module.

2. **`type:` is a Hugo builtin** that controls layout lookup. Never use
   it as a page-level discriminator. `layouts/sightlines/single.html`
   uses `viz:` (values `map` / `network` / `chart`) to dispatch. Inside
   chart configs, `type:` is used for sub-kind (`stripes` / `line` /
   `bars` / `stripes-stacked`) — that's not a Hugo-reserved use and
   works fine.

3. **Hugo's HTML minifier mangles inline `<script>` tags** containing
   JSON-like content (object literals become quoted strings, etc.). Viz
   config is always emitted as `<script type="application/json" id="{id}-config">`
   and parsed in JS via `JSON.parse(textContent)`. Never put viz config
   in a plain `<script>` block.

## Drafts and list filtering

Hugo's `-D` flag is the single source of truth for draft inclusion.
Pages with `draft: true` are absent from `.RegularPages` in production
builds and present in `hugo server -D`. List templates (`_default`,
`sightlines`, `atlas`) do **not** add a template-level `where ...
"Params.draft" "!=" true` filter — earlier versions did and it defeated
the standard preview workflow. If you add a new list template, follow
the same pattern.

## The sightlines dispatcher

All interactive viz pages live in `content/sightlines/` with frontmatter
like:

```yaml
viz: map            # map | network | chart
themes: [public-lands, dust-bowl]
regions: [rocky-mountain, intermountain-west, southwest]
map:                # or network: / chart: depending on viz
  renderer: leaflet  # leaflet (default) or d3
  src: /data/federal-lands.geojson
  ...
```

`layouts/sightlines/single.html` reads `viz` and emits a container with
`data-viz="{viz}"`. The matching JS module (`maps.js` for Leaflet,
`d3-maps.js` for D3 AlbersUSA, `networks.js` for force-directed graphs,
`charts.js` for stripes/line/bars) picks it up on DOMContentLoaded.

## The atlas dispatcher

Atlas pages live in `content/atlas/` and are *reference instruments*
(heatmaps, time-series, scorecards) rather than the argument-with-a-viz
form of sightlines. They mount via `atlas:` frontmatter:

```yaml
atlas:
  mode: trends                                 # only "trends" is honored
  src: /data/atlas-regional-timeseries.json
  metric: permember                            # permember | shareofregion | cosponsorships
  chamber: both                                # both | house | senate
  howto:                                       # optional markdown-bullet list
    - "**Hover** to preview the nearest Congress…"
    - "**Click** to pin and open the detail panel…"
```

`layouts/atlas/single.html` emits a `data-viz="atlas"` container plus
(optionally) a `<details class="prose-details">` "How to use this chart"
block above the viz, rendered from `atlas.howto`. `atlas.js` mounts the
trends view: small-multiples panels + hover guide-line + click-to-pin
two-column detail panel.

## head.html JS loading

`head.html` conditionally loads libraries based on what's needed:

- `maps.js` + Leaflet CSS/JS — when `.HasShortcode "map"` OR
  `.Params.map` is set (and not `renderer: d3`)
- `d3-maps.js` + D3 + topojson-client — when `.Params.map.renderer: d3`
- `networks.js` + D3 — when `.Params.network` is set
- `charts.js` + D3 — when `.Params.chart` is set
- `atlas.js` + D3 — when `.Params.atlas` is set
- `sightlines-map.js` + D3 + topojson-client — on the sightlines section
  list page (`$hasSightlinesList`, detected via
  `and (eq .Section "sightlines") .IsSection`)

Narrative pages with no viz ship zero viz JS.

## static/data/ vs data/

- **`static/data/*.json`** — served at `/data/...` URL. Fetched at
  runtime by viz JS modules. Most build scripts write here.
- **`data/*.json`** — Hugo data files, read at build time via
  `hugo.Data.*`. Currently only `bibliography.json` lives here (the
  `{{< cite >}}` shortcode and Sources page render from it server-side).

This distinction matters when extending the pipeline. If a build script
wants Hugo to render its output into HTML at build time, put it in
`data/`. If a JS module will fetch it, put it in `static/data/`.

## JS viz modules

The viz modules follow the same pattern: scan for
`[data-viz="{kind}"]` containers, read config from the
`<script type="application/json" id="{id}-config">` sibling, fetch the
data file, render into the container.

- **`maps.js`** — Leaflet. Multi-layer support via `layers: [...]`
  array. Style presets by name (`sage`, `green`, `gold`, `rust`, `navy`,
  `context`). Click-to-enable scroll-zoom pattern (hovering doesn't
  hijack page scroll).
- **`d3-maps.js`** — D3 with **null projection** because the project's
  `fedland.topojson` is pre-projected to 960×500 AlbersUSA coordinates.
  Applying another projection to it produces chaos. Documented in the
  header comment.
- **`networks.js`** — D3 force layout. Supports pan + zoom (always-on
  scroll-zoom). Node click opens a modal when the node has a
  `cosponsored` (or similar detail) field. Node radius is sqrt-scaled
  from `bills` or `weight` field when present. Center-pull via
  `forceX` + `forceY` (strength configurable via `cfg.centerstrength`,
  default 0.08) keeps isolated sub-clusters from drifting to the edges.
- **`charts.js`** — D3. Four chart types: `stripes` (climate ribbon),
  `stripes-stacked` (multi-region), `line`, `bars`. Palettes named
  (`temp` cool→rust, `precip` brown→navy, `rust` sequential for
  counts). `scale: "sequential"` vs default diverging controls color
  domain mapping.
- **`atlas.js`** — D3. Currently one mode (`trends`): small-multiples
  with hover guide-line snapping to nearest Congress, click-to-pin,
  two-column detail panel below the charts (40/60 grid, stacks on
  narrow viewports). Member drill lazy-fetches the per-Congress JSON
  on demand and caches in-memory. A prior heatmap mode was stripped;
  restore from git history if a per-Congress view is wanted again.
- **`sightlines-map.js`** — loaded only on the sightlines list page.
  Handles theme-pill filtering and the mini AlbersUSA region-filter map.
  Uses `static/data/states.json` (us-atlas states-10m, 112KB) with
  `d3.geoAlbersUsa()` projection. **Eight region slugs**:
  `northern-plains` (ND/SD/NE), `southern-plains` (KS/OK/TX),
  `rocky-mountain` (MT/WY/CO), `intermountain-west` (ID/UT/NV),
  `southwest` (AZ/NM), `pacific-northwest` (WA/OR),
  `pacific-southwest` (CA/HI), `alaska` (AK). FIPS→region lookup
  lives in `FIPS_REGION`; clicking a state (or its legend chip)
  toggles that region in the active filter set. Also renders
  toggleable physiographic overlays (Fenneman Great Plains is the
  first one) driven by the "Map features" sidebar section.

### Region taxonomies are scheme-specific

The sightlines 8-region taxonomy and the atlas 3-region scheme answer
different questions on purpose:

- **Sightlines** asks "what content is geographically relevant to this
  region?" — state polygons + landscape-character groupings.
- **Atlas** asks "what does this congressional delegation spend its
  cosponsorship attention on?" — three delegations (Great Plains,
  American West, Midwest) treated as political-economy actors.

Don't try to reconcile them. Different unit of analysis.

## Data pipeline

Each `scripts/build_*.py` is self-contained and idempotent. `_common.py`
provides `fetch(url, dest=None, binary=False)`, `write_json(path, obj)`,
the `DATA_DIR` constant, and `UA` user-agent. Scripts document their
source URL(s) in the module docstring.

The Makefile auto-loads `scripts/.env` if present (gitignored), so
recipes inherit `CONGRESS_API_KEY` and `NASS_API_KEY` without manual
`source`.

Sources currently wired up:

- NOAA NCEI Climate at a Glance (CONUS + 4 regions, monthly → annual)
- USDA NASS QuickStats (cattle prices, farm consolidation) — needs `NASS_API_KEY`
- FRED CPI-U for inflation deflation (no key)
- USDA Forest Service EDW (Bankhead-Jones GeoJSONs via
  jasonheppler.org mirror)
- Dinterman's `historical-bankruptcies` repo (Stam ERS + US Courts
  Table F-2)
- GPO `govinfo.gov` BILLSTATUS bulk-data ZIPs (108th Congress forward,
  keyless) — used for both cosponsorship networks and the atlas's
  modern Congresses
- Congress.gov API v3 (96th–107th, requires `CONGRESS_API_KEY`) —
  used by the atlas's legacy backfill. Threaded 6-worker fetcher with
  8-attempt exponential backoff. All bill detail + cosponsor responses
  cached under `scripts/.cache/atlas/cgapi/` so reruns are local-only.
  A full 96–107 backfill is ~186k API calls and takes ~3 hours
  throttled at 18k/hour; cache-warm reruns take minutes.
- USGS physiographic divisions (Fenneman 1928) — one-time shell-script
  conversion via ogr2ogr
- Two local BibTeX files at repo root (bibliography)
- `unitedstates/congress-legislators` YAML roster (every US legislator
  since 1789, keyed by bioguide ID) — used to backfill state/party/
  district when the per-bill records from the Congress.gov API arrive
  incomplete (mostly for pre-108th Congresses). Refresh with
  `make fetch-legislators`; cached at `scripts/.cache/legislators.json`
  (committed). The fetch script uses a purpose-built minimal YAML
  reader so the stdlib-only invariant is preserved (see
  `scripts/legislators.py` for the parser).

When upstream URLs change, edit the source URL at the top of the
affected script.

## Content conventions

- **Bylines** — `content/narrative/_index.md` has
  `cascade.authors: [Jason Heppler]`. Individual essays override
  `authors:` if multi-author or guest-written. `partials/byline.html`
  renders the "By X" line only when `authors` or `author` is set.
- **Citation** — `{{< cite key="cawley1993federal" pages="42-45" >}}`
  looks up the entry in `data/bibliography.json` (produced by
  `build_bibliography.py`), renders as `(Cawley 1993, 42–45)` with a
  link to `/sources/#cawley1993federal`.
- **Cite-this-page** block is auto-appended by `_default/single.html`
  and `sightlines/single.html` via `partial "cite.html"`.
- **BibTeX entries arrive without cite keys** (Zotero exporter quirk);
  `build_bibliography.py` auto-generates `{lastname}{year}{firstword}`
  keys with suffixes on collision.
- **Figures in essays** — narrative pages can `{{< figure src=... >}}`
  either a page-bundle resource (auto-resized to WebP at 900w/1400w via
  Hugo's image pipeline) or a static `/figures/...` SVG. The
  `.prose figure img/svg` CSS rule ensures the figure fills the prose
  column at 100% width — SVGs without explicit width/height attributes
  would otherwise fall back to the 300×150 browser default.

## SCSS notes

Hugo transpiles SCSS via **Dart Sass** (not the bundled libsass). Dart
Sass 1.99+ is required — install with:

```sh
brew tap dart-lang/dart
brew install sass/sass/sass
```

The `transpiler` option in `themes/sagebrush/layouts/partials/head.html`
is set to `"dartsass"`. Use `@use` (not `@import`) in `main.scss` — Dart
Sass deprecates `@import` and will error on it in future versions. This
is safe here because all three partials (`variables`, `typography`,
`layout`) use CSS custom properties and share no Sass variables across
files.

## AI disclosure

`/content/ai.md` is a statement about which parts of the site are
AI-assisted and which are not. The bright line: **narrative prose is
human-authored, everything else (infrastructure, viz code, data
pipelines, methodology notes in About panels) is AI-drafted and
human-reviewed.** Keep that line clean when modifying content. Scaffold
narrative posts with headings + editorial cues + figures + source
pointers — don't write the prose itself.

## Open work

See [GitHub Issues](https://github.com/hepplerj/sbr-website/issues) for
flagged extensions, labeled by category (`maps`, `networks`, `charts`,
`atlas`, `content`, etc.) and priority tier (`tier-1`, `tier-2`,
`tier-3`).
