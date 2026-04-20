# Governing Ground

A digital history of the sagebrush rebellions — recurring fights over land,
power, and federal authority in the American West from the 1930s through
2016. Built with [Hugo](https://gohugo.io), a custom theme, and a Python
data pipeline that draws on open federal datasets.

## Requirements

- Hugo **extended**, v0.128.0 or newer (`hugo version` must show `+extended`)
- Python 3.9+ (standard library only — no virtualenv or package manager
  needed)
- Git
- GNU Make (for the data-build pipeline)

## Local development

```sh
hugo server -D          # http://localhost:1313 (drafts visible)
hugo --gc --minify      # production build → public/
```

Deploy is institutional — every push to `main` triggers a build and sync
to the server.

## Data pipeline

All datasets served on the site are produced by Python scripts in
[`scripts/`](scripts/). Each is self-contained, stdlib-only, and
documents its source URL in the module docstring.

```sh
make                    # rebuild every dataset
make cosponsorship      # rebuild one
make help               # (or just read scripts/README.md)
```

Output goes to:

- `static/data/` — JSON / GeoJSON / TopoJSON that visualization JS
  fetches at runtime (served at `/data/...`)
- `data/bibliography.json` — Hugo data file read server-side at build
  time by the `{{< cite >}}` shortcode and the Sources page

See [`scripts/README.md`](scripts/README.md) for the dataset catalog and
provenance.

## Content model

```
content/
  _index.md               Home
  narrative/              Long-form essays (authored)
  sightlines/             Interactive views — maps, networks, charts
  sources/                Bibliography (rendered from BibTeX)
  about/
  ai.md                   AI-use disclosure
```

Everything interactive lives in a single `sightlines/` section. Each page
declares its type in frontmatter:

```yaml
viz: map            # map | network | chart
themes: [public-lands, dust-bowl]
regions: [great-plains, intermountain-west]
map:                # or network: / chart: — depending on viz
  renderer: leaflet  # leaflet (default) or d3
  src: /data/federal-lands.geojson
  ...
```

One dispatcher layout (`themes/sagebrush/layouts/sightlines/single.html`)
picks the right JavaScript module — `maps.js` (Leaflet),
`d3-maps.js` (D3 AlbersUSA), `networks.js` (D3 force), or `charts.js`
(stripes / bars / line) — based on the `viz` field. The Sightlines index
page offers region + theme filters across the full collection.

## Narratives and bylines

Essays in `content/narrative/` inherit an `authors:` list via the
section's `_index.md` cascade. Individual essays override for
multi-author or guest-written pieces. Citations use the `{{< cite >}}`
shortcode which resolves keys against `data/bibliography.json` (produced
by parsing the two root-level `.bibtex` files on every pipeline run).

## Typography and palette

- **Display** — Zilla Slab
- **Body** — Source Serif 4
- **UI** — Source Sans 3
- **Mono** — JetBrains Mono

Palette: sagebrush green, weathered-paper cream, rust / iron-oxide
accent, deep navy. All palette tokens and type scales live in
[`themes/sagebrush/assets/css/_variables.scss`](themes/sagebrush/assets/css/_variables.scss).

## AI use

Project infrastructure, visualization code, data pipelines, and
methodology notes are AI-drafted and human-reviewed. Narrative prose and
historical-research decisions are human-authored. See
[`/ai/`](content/ai.md) for the full statement.

## Further reading

- [`CLAUDE.md`](CLAUDE.md) — architecture notes + gotchas for future
  Claude Code sessions
- [`TODO.md`](TODO.md) — running inventory of flagged future work by
  section
- [`scripts/README.md`](scripts/README.md) — dataset catalog + provenance

## License

Written content: [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
Site code and theme: MIT.
