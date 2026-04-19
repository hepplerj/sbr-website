# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

*Between the Fences* — a digital history project on the sagebrush rebellions
(1930s–2016). A Hugo static site with a custom theme and a Python data
pipeline. The content mixes long-form narrative with interactive maps,
network graphs, and time-series charts.

## Commands

```sh
hugo server -D          # dev server at :1313 (drafts visible)
hugo --gc --minify      # production build → public/

make                    # run all Python data-build scripts
make <target>           # run one; see `make help` or scripts/README.md
make cosponsorship      # example: just rebuild cosponsorship network
```

Python scripts are **stdlib-only** by design — no `requirements.txt`, no
virtualenv, runs with any modern Python 3.9+. Keep it that way.

Requires Hugo **extended** (v0.128+) for SCSS. Check with `hugo version` —
the string must contain `+extended`.

## Repository layout

```
content/sightlines/     — maps, networks, charts (all dispatched from one layout)
content/narrative/      — essays with authors cascade
content/sources/        — bibliography page
scripts/                — build_*.py data pipelines, all stdlib-only
static/data/            — JSON/GeoJSON/TopoJSON served at /data/ for JS fetches
data/                   — Hugo data files (e.g., bibliography.json) read at build time
themes/sagebrush/       — custom theme; treat it as part of the project, not a dependency
Articles.bibtex         — source-of-truth bibliography, parsed by build_bibliography.py
Books.bibtex
TODO.md                 — flagged future work organized by section
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
   JSON-like content (object literals become quoted strings, etc). Viz
   config is always emitted as `<script type="application/json" id="{id}-config">`
   and parsed in JS via `JSON.parse(textContent)`. Never put viz config
   in a plain `<script>` block.

## The sightlines dispatcher

All interactive viz pages live in `content/sightlines/` with frontmatter
like:

```yaml
viz: map            # map | network | chart
themes: [public-lands, dust-bowl]
regions: [great-plains, intermountain-west]
map:                # or network: / chart: depending on viz
  renderer: leaflet  # leaflet (default) or d3
  src: /data/federal-lands.geojson
  ...
```

`layouts/sightlines/single.html` reads `viz` and emits a container with
`data-viz="{viz}"`. The matching JS module (`maps.js` for Leaflet,
`d3-maps.js` for D3 AlbersUSA, `networks.js` for force-directed graphs,
`charts.js` for stripes/line/bars) picks it up on DOMContentLoaded.

`head.html` conditionally loads libraries based on what's needed:

- `maps.js` + Leaflet CSS/JS — when `.HasShortcode "map"` OR
  `.Params.map` is set (and not `renderer: d3`)
- `d3-maps.js` + D3 + topojson-client — when `.Params.map.renderer: d3`
- `networks.js` + D3 — when `.Params.network` is set
- `charts.js` + D3 — when `.Params.chart` is set

Narrative pages with no viz ship zero viz JS.

## static/data/ vs data/

- **`static/data/*.json`** — served at `/data/...` URL. Fetched at
  runtime by viz JS modules. Most build scripts write here.
- **`data/*.json`** — Hugo data files, read at build time via
  `.Site.Data.*`. Currently only `bibliography.json` lives here (the
  `{{< cite >}}` shortcode and Sources page render from it server-side).

This distinction matters when extending the pipeline. If a build script
wants Hugo to render its output into HTML at build time, put it in
`data/`. If a JS module will fetch it, put it in `static/data/`.

## JS viz modules

All four modules follow the same pattern: scan for
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
- **`networks.js`** — D3 force layout. Supports pan + zoom (click to
  enable scroll-zoom). Node click opens a modal when the node has a
  `cosponsored` (or similar detail) field. Node radius is sqrt-scaled
  from `bills` or `weight` field when present. Center-pull via
  `forceX` + `forceY` (strength configurable via
  `cfg.centerstrength`, default 0.08) keeps isolated sub-clusters
  from drifting to the edges.
- **`charts.js`** — D3. Four chart types: `stripes` (climate ribbon),
  `stripes-stacked` (multi-region), `line`, `bars`. Palettes named
  (`temp` cool→rust, `precip` brown→navy, `rust` sequential for
  counts). `scale: "sequential"` vs default diverging controls color
  domain mapping.

## Data pipeline

Each `scripts/build_*.py` is self-contained and idempotent. `_common.py`
provides `fetch(url, dest=None, binary=False)`, `write_json(path, obj)`,
and the `DATA_DIR` constant. Scripts document their source URL(s) in the
module docstring.

Sources currently wired up:

- NOAA NCEI Climate at a Glance (CONUS + 4 regions, monthly → annual)
- USDA Forest Service EDW (Bankhead-Jones GeoJSONs via
  jasonheppler.org mirror)
- Dinterman's `historical-bankruptcies` repo (Stam ERS + US Courts
  Table F-2)
- GPO `govinfo.gov` BILLSTATUS bulk feed (cosponsorship, 108th
  Congress forward — earlier 404s)
- Two local BibTeX files at repo root (bibliography)

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

## SCSS notes

Hugo transpiles SCSS via **libsass** (bundled), not Dart Sass. Two
consequences:

- `min(440px, 92vw)` and other mixed-unit CSS functions don't compile
  — libsass tries to evaluate them as Sass. Use separate
  `width: 440px; max-width: 92vw;` declarations instead.
- If a developer wants Dart Sass for modern features, they install it
  (`brew install sass/sass/sass`) and flip the `transpiler` option
  from `libsass` to `dartsass` in `themes/sagebrush/layouts/partials/head.html`.

## AI disclosure

`/content/ai.md` is a statement about which parts of the site are
AI-assisted and which are not. The bright line: **narrative prose is
human-authored, everything else (infrastructure, viz code, data
pipelines, methodology notes in About panels) is AI-drafted and
human-reviewed.** Keep that line clean when modifying content.

## Open work

See `TODO.md` for a running list of flagged extensions, organized by
section. Not a plan; just an inventory of things About panels and
earlier conversations promised.
