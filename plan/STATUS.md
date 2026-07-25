# STATUS

_Last updated: 2026-07-18 (written as a session handoff — a fresh
session should be able to work from this file alone)._

## Where things stand

**Branch:** `feature/monuments-wildfire`, 2 commits ahead of `main`:

- `4f4dde7` — National Monuments scatter (Antiquities Act designations)
- `53019ff` — A Burning West (NIFC wildfire two-panel small-multiples)

**Everything else is UNCOMMITTED** — three coherent threads of work plus
infrastructure, all built and verified (rendering checked in the dev
server via screenshots + DOM eval; no console errors; `hugo --gc` and
`hugo -D` both build clean). The natural next task is committing.

### Suggested commit grouping

1. **plan/ scaffold** — `plan/` + the CLAUDE.md "Open work" pointer.
   Decision-free, ready to go.
2. **Climate viz** — 4 sightlines + `trajectory`/`decade-strips`/
   `compound`/`heatmap` renderers + `build_climate_space.py`,
   `build_states_temperature.py` + data JSONs + Makefile targets +
   related SCSS.
3. **Legislation text-reuse** — `legislation.md`,
   `build_legislation_textreuse.py`, its JSON, the 3 atlas instruments,
   `matrix`/`concordance`/`genealogy` renderers + modal, the atlas
   dispatcher generalization (atlas/single.html, atlas/list.html), the
   CLAUDE.md atlas-dispatcher section.
4. **Documents archive** — 8 state-bill page-bundles,
   `build_legislation_documents.py`, the documents-list filter rail
   (documents/list.html), the `hugo.toml` Documents nav item.
5. **Farm foreclosures** — `content/sightlines/farm-foreclosures.md`,
   `scripts/build_farm_foreclosures.py`,
   `scripts/data/usda_farm_transfers.csv`,
   `static/data/farm-foreclosures.json`, Makefile target. Standalone —
   no shared-file overlap with 1–4 (uses existing `bars` renderer).

(2–4 could be further split; SCSS and charts.js changes span threads
2–3, so commit 2 before 3 or accept some overlap in one of them.)

---

## Thread A — Climate visualizations (Sightlines, all `draft: true`)

Four alternatives/companions to the original warming stripes, each in
`content/sightlines/`, each a new `charts.js` chart type:

| Sightline | Type | Shows |
|---|---|---|
| `climate-space.md` "Four Roads Out of the Twentieth Century" | `trajectory` | 4 NOAA Western regions in temp×precip space; net-drift arrows — three drive into hot-dry, N. Rockies & Plains arrows right (warms, doesn't dry) |
| `warming-distribution.md` "The Coldest Year Now Beats the Warmest Year Then" | `decade-strips` | Southwest per-decade dot strips; whole distribution slides right |
| `hot-and-dry.md` "Hot and Dry, Together" | `compound` | Southwest barcode; hot+dry years cluster after 2000 |
| `warming-west-heatmap.md` "The Warming West, State by State" | `heatmap` | 17 states N→S × 130 years, Hovmöller; supports `chart.periods` era bands (Dust Bowl / 1950s drought / megadrought) with guide lines |

Data: `build_climate_space.py` (4 regions, temp+precip joined) and
`build_states_temperature.py` (17 states, NOAA CAG statewide, curated
N→S order). Make targets: `climate-space`, `states-temperature`.

**Open decisions:**
- **Which climate views to keep** — four temperature views + original
  stripes is a lot. Recommendation on record: the **heatmap is the
  strongest keeper**; the other three are alternatives that may not all
  earn a slot.
- Heatmap era bands: currently climate eras; could swap/add political
  periodization (one-line frontmatter change).
- All need Jason's prose before leaving `draft: true`.

## Thread B — Legislation text-reuse (Atlas, all `draft: true`)

Corpus: `legislation.md` at repo root — **8 transcribed state sagebrush
bills** with confirmed years (curated `YEARS` map in the build script):
NV 1979 · NM/WY/UT/AZ 1980 · ND/SD 1981 · AK 1982.

Pipeline: `build_legislation_textreuse.py` (stdlib) →
`static/data/legislation-textreuse.json`. Computes TF-IDF cosine,
5-shingle Jaccard, **directional containment**, **all** shared verbatim
passages ≥8 words per pair (no top-N cap — it was removed after we
caught it hiding 30 of 36 NM↔AZ passages), signature phrases (≥3
bills). `make legislation-textreuse`.

Three Atlas instruments in `content/atlas/` (each with `tag: "Text
reuse"` + `howto:` method notes):

- **`legislation-textreuse.md`** "One Bill, Seven Statehouses" —
  `matrix` type. Hover = score; **click a cell → viewport-fixed,
  scrollable modal** with a **directional containment meter** (two bars:
  "NM in AZ 53%" rust/dominant vs "AZ in NM 31%") + honest count line
  ("36 shared passages · 898 words · Jaccard 0.245") + every shared
  passage. (The former standalone "Copied Clauses" page/`reuse` renderer
  was **merged into this modal and deleted**.)
- **`legislation-genealogy.md`** "The Descent of a Bill" — `genealogy`
  type. Year-column family tree, directed edges (width ∝ shared
  5-grams, still the `sharedshingles` field), Nevada as rust root.
- **`legislation-signatures.md`** "The Boilerplate DNA" — `concordance`
  type. Ranked table of phrases in ≥3 bills with state chips.

**Key findings** (verified against the data; scaffolded for prose):
Nevada radiates to the whole 1980 cohort; **NM → AZ is the heaviest
edge** (53% containment — AZ copied NM's *elaborated* text incl. the
tax-rolls provision Nevada lacks); SD 1981 is a late NV+NM+AZ
synthesis; AK 1982 attaches via Wyoming; ND (a resolution) hangs thin.

**Open:** prose (all `draft: true`); optionally consolidate 3
instruments further.

## Thread C — Documents archive (all 8 state bills, `draft: true`)

- 8 page-bundles under `content/documents/<slug>/` (nevada, new-mexico,
  wyoming, utah, arizona, north-dakota, south-dakota, alaska), weights
  60–67, generated by `build_legislation_documents.py` —
  **write-if-absent** (never clobbers hand edits); standalone
  `make legislation-documents`, deliberately NOT in the `data` aggregate.
- **Blocking publish:** every `source.url` is an empty `# TODO`
  (canonical source URLs needed from Jason); Wyoming/Utah dates are
  operative-not-enactment dates (flagged in each `provenance:`).
- Documents **list filter**: Sightlines-style 1/3–2/3 layout
  (`.sightlines-layout` reuse) with a sticky rail — **Jurisdiction /
  Type / Decade** pill sections. Generic multi-dimension JS (AND across
  dimensions, OR within); a dimension only renders when >1 distinct
  value, the rail only when something is filterable. Adding a dimension
  = rail section + `data-<dim>` on rows, zero JS change.
- `hugo.toml`: Documents added to main nav (weight 25).
- Bill text intentionally lives in BOTH `legislation.md` (pipeline
  source) and the documents (reader-facing) — frozen historical texts,
  duplication accepted; option to repoint the pipeline later is noted.

## Thread D — Farm foreclosures sightline (`draft: true`) — 2026-07-18

[Issue #30](https://github.com/hepplerj/sbr-website/issues/30).
"Farm Foreclosures, 1913–1981" — the discontinued USDA farm real
estate transfer series (transfers per 1,000 farms by method), the
historical companion to the Farm Bankruptcies chart.

- **Data is hand-transcribed** — the series predates electronic
  publication. `scripts/data/usda_farm_transfers.csv` (per-row source
  attribution) transcribed from cumulative national tables in three
  *Agricultural Statistics* annuals on the ESMIS archive:
  1957 vol. table 634 (1913–54), 1967 vol. table 638 (1955–65,
  revised values), 1981 vol. table 607 (1966–81). Verified against
  page images + overlapping year ranges + HSUS 1949 series E 6–11.
  Latest-published revision wins for each year.
- **Correction to issue #30 as filed:** the HSUS *Bicentennial*
  edition does NOT carry the series (dropped from Chapter K); the
  1946+ continuation lives in the *Agricultural Statistics* annuals.
  The series ends at **1981** (gone from the 1982 volume), not
  "ca. 1980". Regional (farm-production-region) tables exist 1948–81
  incl. Mountain/N Plains/S Plains/Pacific — not used yet; noted in
  the issue as a stretch.
- Chart: existing `bars` renderer, selector switches
  foreclosures (rate) / foreclosures (est. farms lost) / tax_sales /
  voluntary / total; era bands (1920s depression, Dust Bowl), 1933
  annotations (38.8 per 1,000 / ≈256,000 farms). Null runs (tax sales
  exist 1927–69 only) render as the grey DATA GAP bands. Verified in
  dev server: all selector views + no console errors.
- Estimated counts are rate × annual farm numbers (Dinterman CSV —
  same denominator source as the bankruptcies chart's per-1,000 view),
  rounded to nearest hundred; all five `*_n` fields are in the JSON so
  more count views can be enabled from frontmatter alone.
- charts.js (drawBars): y-ticks compact to SI ("250k") when
  yMax ≥ 100,000 — wide labels collided with the rotated axis label.
  Bankruptcies chart (yMax ~8k) verified unaffected. Note: this adds a
  charts.js touch to this otherwise-standalone thread.
- `make farm-foreclosures` (fetches only the Dinterman farm counts;
  rates come from the committed CSV); in the `data` aggregate.
- **Before publish:** Jason's prose (scaffold with verified numbers is
  in the page as an HTML comment), and add the reciprocal cross-link
  from farm-bankruptcies.md (currently one-directional to avoid a
  draft 404).

### Experiment — combined two-panel "farm distress" chart (2026-07-19)

`content/sightlines/farm-distress.md` ("Two Ways to Lose a Farm,
1899–2024", `draft: true`) + `build_farm_distress.py` (merges the
foreclosures and bankruptcies JSONs; `make farm-distress` declares
both as prerequisites) + `static/data/farm-distress.json`.

- **The idea (Jason's):** foreclosure and bankruptcy rates stacked on
  one shared time axis (`small-multiples`), so the coverage asymmetry
  is the argument — 1930s crisis legible as foreclosures (38.8/1,000
  peak), 1980s crisis as bankruptcies (3.1/1,000 in 1987), and the
  interlocking data gaps (foreclosures dead after 1981; bankruptcies
  untabulated 1980–86) render as grey bands right where the farm
  crisis sits. Verified in dev server; hover reads both panels.
- **charts.js change (drawSmallMultiples):** null y-values are now
  kept (line breaks via `.defined()`) and null runs render as
  `data gap` bands, mirroring drawBars. This is load-bearing for the
  experiment AND visibly improves two published pages: farm-wealth's
  debt-to-asset (null 1910–59) / govt-payments (1910–32) panels and
  consolidation's avg-size (1910–49) panel now carry gap bands where
  the lines simply started mid-chart before. Checked both pages —
  reads well; Jason should confirm he likes it.
- **Open decision:** if the combined chart graduates, do the
  standalone foreclosures + bankruptcies pages stay (probably yes —
  they carry the count/tax/voluntary selector views the combined
  chart drops), and does the combined one live in Sightlines or
  become the flagship with the others cross-linked?

## Thread E — Federal interests map, prototype (`draft: true`) — 2026-07-24

Jason's `fed_lands_alt.md` plan: extend the fee-title federal-lands map into
a map of *federal interests in land*, so the Plains stop reading as empty.
Built as a **copy**, not a modification —
`content/sightlines/us-federal-lands-alt.md` ("US Federal Lands by Agency
(Alt)", weight 16). The published map is untouched and verified unchanged.

Covers plan Phases 0, 2, 3a, and most of 7. **Phases 4–6 not attempted.**

- **`scripts/build_federal_interests.py`** (stdlib, `make federal-interests`,
  deliberately NOT in the `data` aggregate — a few minutes of ArcGIS paging):
  - **Trust lands** — BIA AIAN National LAR, 335 polygons, 126.9M acres,
    generalized to ~200 m. → `static/data/federal-interests-trust.json` (999K)
  - **Easements** — FWS National Realty Tracts, `INTTYPE1='E'`: 42,755
    tracts / 5,429,148 deeded acres, shipped as **centroids** (tracts are
    40–160 ac; true outlines are sub-pixel nationally).
    → `static/data/federal-interests-easements.json` (1.2M, columnar
    array-of-arrays with interned program/unit strings — 2.6M as objects)
- **Verified numbers** (centroids assigned to states by point-in-polygon):
  SD 16,165 tracts/1,922,632 ac (35.4%) · ND 18,266/1,805,448 (33.3%) ·
  MT 870/616,667 (11.4%) · MN 4,418/384,920 (7.1%). **Dakotas alone =
  68.7% of national easement acreage**; Prairie Pothole 5 = 93.0% of
  tracts. 38,888 are WPA easements (4,390,109 ac). Acquisition 1888–2026.
- **`d3-maps.js` gained an optional `layers:` config** — see CLAUDE.md.
  Guarded throughout; no `layers:` = old behavior exactly.
- **Two gotchas found the hard way, both now fixed and documented:**
  1. D3 wants **clockwise** exterior rings (reverse of RFC 7946). A
     counterclockwise ring is read as enclosing the rest of the globe —
     Crow Creek projected to a 974×509 bbox (the entire canvas).
  2. ArcGIS's GeoJSON conversion **mis-nests holes** on fragmented
     features (Wind River came back as 82 parts, one a 4-point "exterior"
     owning 90 "holes"). Source nesting is untrustworthy; the script
     re-nests every ring by containment.
- Verified in dev server: composite hover correct at four probe points
  (fee-only, trust, easement-on-private, and nothing); no console errors;
  `hugo --gc --minify` and `hugo --gc -D` both clean; draft correctly
  absent from production.

### Round 2 (same day) — Jason's three asks, all built

Jason confirmed Phases 4–6 aren't wanted; scope is settled at what's here.

1. **Floating readout** — `floatinfo: true` makes the info panel track the
   cursor, flipping side/vertical near the container edges so it always
   stays inside the map. Opt-in flag; the published map keeps its corner
   panel (verified unchanged). Layers can set `probelabel` for a short
   key in the readout ("Easement" vs the panel's full label).
2. **Physiographic boundary** — new `kind: "outline"` layer type, reusing
   `/data/physio-great-plains.geojson` (already in the repo for the
   Sightlines region filter). Stroke-only with a pale halo, so ring
   winding is a non-issue; excluded from the hover probe, since a
   province is context, not an interest in land.
3. **Year range** — `yearfilter: true` on a point layer adds a dual-handle
   range over the data's own extent. **Only the easement layer has dates**
   (fee TopoJSON and BIA LAR carry none), so this is explicitly *not* a
   snapshot of the estate in year X, and the page says so. The quadtree is
   rebuilt from the filtered subset on every change so the hover probe can
   never report a tract that isn't drawn; undated tracts (1,484) appear
   only at full extent.

**This turned up a genuine finding.** Acquisition by decade (dated tracts):
pre-1960 = 391 (1.0%) · 1960s = 11,006 · 1970s = 7,579 · 1980s = 3,414 ·
1990s = 5,871 · 2000s = 4,640 · 2010s = 5,082 · 2020s = 3,285. **99% of the
federal easement interest on the Plains postdates 1960, and over half was
acquired 1960–1989** — i.e. the quiet federal interest in Plains land was
being assembled during the very years the sagebrush rebellion was forming
in the fee-title West. Two federal geographies, two mechanisms, same
decades. Written into the §3b prose scaffold.

### Round 3 (same day) — unified controls column

Jason asked for the legend selector and the layer toggles / year filter to
live together in one column, controls left, map right. Done as a
**split layout that only activates when the map has overlay layers**:
`.d3-map--split` flex row with a `.d3-map__controls` column (layer
toggles → year filter → agency legend as stacked sections of one card,
hairline-divided, internally scrollable) and a `.d3-map__stage` for the
SVG + stipple canvas + floating readout. The stage is the positioning
context, so the floating readout and canvas measure it, not the container.
Stacks controls-above-map under 56rem (controls capped at 40vh, scroll
inside). The published map has no overlays, never gets the class, and its
corner-anchored legend was re-verified untouched (position:absolute,
bottom/right 12px, SVG a direct child of the container).

**Open decisions for Jason:**
- **Prose** — page carries a scaffold comment with the verified numbers,
  per the AI-disclosure line. Method section is written.
- **Does BIA move out of the agency legend?** Plan Phase 2 says yes (trust
  land isn't the Bureau's holding the way a forest is the FS's). Not done
  — it changes the fee layer, which this prototype deliberately left alone.
- **Split estate (Phase 4) is the big missing layer** and probably the
  single highest-value addition; federal minerals under private surface
  would deepen the argument in WY/MT/ND. Phases 5 (critical habitat) and
  6 (LUP purchase areas) untouched.
- Whether this graduates, replaces the original, or stays a companion.

## Thread F — "The Federal Footprint, State by State" (Atlas, `draft: true`) — 2026-07-25

The Atlas companion to the federal-interests map: 17 states ranked by
**federal interest as % of state land** (fee by agency / trust hatched /
easements teal), sortable by different definitions of "federal" — the
re-ranking is the argument (SD: 5.4% fee-only vs **48.7% total**; AZ vaults
to #3 on 30.6M ac of trust). Click a state → cosponsorship-style pinned
detail: breakdown table + cumulative easement-acquisition curve.

Built as a **multi-agent orchestration** (Fable orchestrating, Sonnet
implementing; spec-driven): see `plan/federal-footprint-spec.md` — the
binding schema/contract, WP1 transcription notes, and the appended WP4
verification report.

- **Pieces:** `scripts/data/crs_federal_land_by_state.csv` +
  `state_land_areas.csv` (hand-transcribed, double-fetch verified);
  `scripts/build_federal_footprint.py` (stdlib; easement PIP state
  assignment, trust apportionment by cos-lat grid sampling, equal-area
  `feecheck` cross-check from fedland.topojson; ~70s);
  `static/data/federal-footprint.json`; `atlas.js` `footprint` mode
  (dispatch on `cfg.mode`, trends untouched); `content/atlas/
  federal-footprint.md`; `.atlas-footprint*` SCSS; `make federal-footprint`
  (not in `data` aggregate; needs federal-interests outputs present).
- **Verification:** WP4 adversarial pass CONFIRMED all checks — 6 CRS
  states re-fetched digit-for-digit; an independently written PIP matched
  all 17 states exactly; trust apportionment plausible (Wind River wholly
  WY, Uintah/Ouray wholly UT, Standing Rock split ND/SD); KS BLM = 1 acre
  is real. Orchestrator found+fixed one integration bug WP3's own test
  missed: bar segments painted over the click hit-rect (pointer-events:
  none fix). Cumulative-array duplicate points deduped; OK trust = 0
  explained in the method prose (LAR has no OK polygons — allotted/
  restricted-fee regime, a stated limit of the category).
- **feecheck caveat:** cross-check ratios worst on small-federal states
  (KS 1.96×, ND 1.40×) — 2014-vintage simplified geometry + centroid
  assignment; documented, renderer ignores the field.
- **Segment hover (2026-07-25, Jason's ask):** hovering a bar segment now
  lights the matching legend chip (others dim) AND shows a mouse-follow
  popup ("Land held in trust — 30,595,469 acres · 42.1% of Arizona").
  Because segments are pointer-events:none (the click fix), the segment is
  resolved from the cursor's x on the hit rect against the segment spans —
  no event-layer conflict; clicking anywhere still pins. Verified for
  agency/trust/easement segments; zero console errors.
- **Considered and declined (2026-07-25):** per-agency acquisition
  small-multiples — unsupportable (only FWS realty data carries dates)
  and conceptually wrong for BLM/FS (public domain was *retained*, not
  acquired) and trust (allotment/restoration history ≠ a cumulative
  line). The one honest extension — a two-series FWS fee-vs-easement
  curve (97% of FWS fee tracts have ACQUISITION_DATE; verified against
  the ArcGIS endpoint) — was offered and Jason chose to keep the
  easement-only curve. If ever revisited: filter INTTYPE1='O' from the
  same realty endpoint.
- **Open:** Jason's prose (§ scaffold in page comment); whether OK's row
  stays given the trust-invisibility caveat; both builds verified clean;
  everything uncommitted on `feature/monuments-wildfire`.

## Infrastructure changes (theme)

- **Atlas dispatcher generalized** (`layouts/atlas/single.html`): checks
  `chart:`/`network:`/`map:` before `atlas:` — Atlas pages can host any
  sightlines renderer. `list.html` gained `tag:` override. Documented in
  CLAUDE.md with the rule of thumb (argument → Sightlines; reference
  instrument → Atlas).
- **charts.js new types:** `scatter`, `trajectory`, `decade-strips`,
  `compound`, `heatmap` (+ era bands), `matrix` (+ modal), `concordance`,
  `genealogy`. Shared: `hideidlecard` flag, `pickRegion()`,
  `.chart-viz__modal` (viewport-fixed, scroll-locking, Esc/backdrop/×
  close — mirrors networks.js modal), `.chart-viz__meter-*` containment
  bars.
- `layouts/documents/list.html` rewritten (filter rail, above).

## Parked / not pursuing (do not restart without a fresh go-ahead)

- **Federal-estate-over-time viz** — Jason dismissed it.
- **Six more sagebrush states** (WA, ID, MT, OR, CA, CO) — texts not on
  the open web (predate digitized systems); full roster, findings, and
  add-later steps in `plan/roadmap.md`. WA is the highest-value target
  (bill passed the legislature; nullified by referendum).

## Gotchas for the next session

- **Run pipeline scripts with `/usr/bin/python3`** — homebrew Python
  (3.13/3.14) lacks working expat.
- **Stale `public/`** — `hugo` doesn't prune deleted pages; `rm -rf
  public && hugo` before asserting a page is gone.
- Preview workflow: create `.claude/launch.json` (hugo server -D, port
  1313) → preview_start → navigate via preview_eval → screenshot;
  remove launch.json and pkill the server when done.
- Hugo lowercases frontmatter keys recursively; viz config keys must be
  lowercase (see CLAUDE.md gotchas).
- `plan/` is committed-to-repo by decision (not gitignored).
