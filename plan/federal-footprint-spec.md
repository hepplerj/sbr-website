# Spec — "The Federal Footprint, State by State" (Atlas instrument)

_Contract for the multi-agent build, 2026-07-24. Orchestrator: Fable._
_Read this whole file before writing code. The schema section is binding on
both the pipeline and the renderer; change it only via the orchestrator._

## What this is

An Atlas reference instrument (Concept A): one row per state, a horizontal
stacked bar of **federal interest as % of state land**, sortable by different
definitions of "federal." Click a state → pinned two-column detail panel:
left = full breakdown table, right = cumulative easement-acquisition curve.
The re-ranking is the argument: sort by fee and Nevada leads; sort by total
federal interest and the Dakotas climb.

Companion to the sightline `us-federal-lands-alt.md`; same three interest
categories (fee / trust / easements), same honesty rules.

## Scope

17 states, the project roster, default order N→S (same as the warming-west
heatmap): ND, WA, MT, SD, ID, OR, WY, NE, NV, UT, CO, KS, CA, OK, NM, AZ, TX.

## Data sources (fixed)

- **Fee**: CRS R42346, *Federal Land Ownership: Overview and Data*
  (Feb 21, 2020 version), **Table 2** — FY2018 acreage by state for BLM, FS,
  FWS, NPS, DOD (DOD as of 9/30/2017). Transcribe from
  <https://www.everycrsreport.com/files/20200221_R42346_ff457a3a93889b6a9fb32baa6dc38d8f4f9291c5.html>.
  Known-good check rows: NV = 47,298,840 / 5,760,954 / 2,345,102 / 797,613 /
  60,101; ND = 58,032 / 1,103,160 / 488,648 / 71,192 / 12,609;
  SD = 275,336 / 2,006,214 / 206,930 / 148,010 / 3,515 (BLM/FS/FWS/NPS/DOD).
  NOTE: CRS's five agencies exclude BIA — no double counting with trust.
- **Trust**: `static/data/federal-interests-trust.json` (BIA LAR, already
  fetched). Multi-state polygons (Navajo, Standing Rock, Wind River…) must be
  **apportioned** across states by area sampling (see WP2).
- **Easements**: `static/data/federal-interests-easements.json` (FWS realty
  tracts, columnar; fields `[program, lon, lat, acres, unit, year]` with
  interned `codes`/`units` tables). State assignment by point-in-polygon.
- **State land area**: Census land area (sq mi → acres × 640). Cite the
  vintage used.
- **State polygons for assignment**: `static/data/states.json` (us-atlas,
  lon/lat TopoJSON, object key `states`, feature `id` = FIPS as string).

## Output schema — `static/data/federal-footprint.json`

Compact JSON (no whitespace), written via `_common.write_json`. All acreage
integers. All keys lowercase (Hugo-side consistency).

```json
{
  "source": {
    "fee": "CRS R42346, Federal Land Ownership: Overview and Data (Feb. 2020), Table 2, FY2018 (DOD FY2017)",
    "trust": "BIA AIAN National LAR, retrieved 2026-07-24, apportioned to states by area sampling",
    "easements": "FWS National Realty Tracts (INTTYPE1=E), retrieved 2026-07-24",
    "statearea": "<census vintage used>"
  },
  "retrieved": "2026-07-24",
  "agencies": ["blm", "fs", "fws", "nps", "dod"],
  "agencylabels": {"blm": "Bureau of Land Management", "fs": "Forest Service",
                   "fws": "Fish & Wildlife Service", "nps": "National Park Service",
                   "dod": "Department of Defense"},
  "states": [
    {
      "abbr": "ND", "name": "North Dakota", "fips": "38",
      "landacres": 44160640,
      "fee": {"blm": 58032, "fs": 1103160, "fws": 488648, "nps": 71192, "dod": 12609},
      "feetotal": 1733641,
      "feecheck": 1650000,
      "trust": 2000000,
      "easements": {
        "tracts": 18266,
        "acres": 1805448,
        "undated": 300,
        "programs": {"WPA": {"label": "Waterfowl Production Area easement", "tracts": 17930, "acres": 1700000}},
        "cumulative": [[1935, 1200], [1936, 4800]]
      }
    }
  ]
}
```

Notes:
- `feecheck` = fee acreage independently estimated from the project's own
  `fedland.topojson` (see WP2); `null` allowed if a state can't be computed.
  Renderer ignores it; it feeds the method note + verification.
- `easements.cumulative` = `[year, cumulative_acres]` pairs, **only years
  where the total changes**, dated tracts only. Undated tract count in
  `undated` (shown as a caveat, never placed on the curve).
- `programs` keyed by raw code (WPA, NWR, …), each with `label`, `tracts`,
  `acres`, sorted by acres descending when emitted (insertion order carries).
- Percent-of-state is **computed in the renderer** from `landacres` — never
  shipped, so the two can't disagree.

## Renderer contract (WP3)

New mode `footprint` in `themes/sagebrush/assets/js/atlas.js`, mounted when
`atlas.mode == "footprint"`. Page frontmatter:

```yaml
atlas:
  mode: footprint
  src: /data/federal-footprint.json
  howto: [...]
```

- **Overview**: one row per state — abbr + name label, horizontal stacked bar
  in % of state land. Segments left→right: fee agencies (BLM, FS, FWS, NPS,
  DOD, solid), trust (rust `#a94b2b`, hatched — SVG pattern), easements (teal
  `#1f6b66`). Value label at bar end (total %). Bars share one x scale, 0 to
  max total % across states (Nevada ≈ 85% will set it).
- **Agency palette**: reuse the sightline's: BLM `#c9a978`, FS `#4a9e5c`,
  FWS `#8aa07c`, NPS `#3a5982`, DOD `#7a7367`.
- **Sort control** (small select or pill row above the chart): total federal
  interest %, fee %, trust %, easement %, easement acres, and "north → south"
  (file order). Default: **total federal interest %** descending. Rows
  animate reorder (d3 transition on y).
- **Hover row**: highlight + a one-line readout (reuse `.info-panel` style or
  a fixed readout above the rows — keep it simple; NOT the floating tooltip).
- **Click row → pin** (cosponsorship grammar): detail panel below, 40/60 grid
  (stacks on narrow), matching `.atlas-*` detail classes where possible.
  - Left: table — each fee agency (acres, % of state), fee total, trust,
    easements (acres, % of state, tract count), grand total federal interest.
    Tabular numerals. A caveat line: "Easements are a property interest in
    private land, counted here as federal interest, not federal ownership."
  - Right: cumulative easement curve (`cumulative` pairs), x = year (1888 or
    first year → 2026), y = cumulative acres (SI ticks: "1.5M"), area fill
    teal at low opacity + line; hover guide with year + value; annotate the
    undated-tract caveat under the chart when `undated > 0`.
- **Unpin** button, same as trends.
- All config keys arrive lowercase (Hugo). Read data with `d3.json`.
- SCSS: extend the atlas styles in
  `themes/sagebrush/assets/css/_layout.scss`; CSS custom properties for
  colors where they exist; hatch via inline SVG `<pattern>` like d3-maps.js
  `defineHatch`.
- Do NOT touch `renderTrends` or the trends mode dispatch path. `atlas.js`
  currently mounts only `trends`; add dispatch on `cfg.mode`.

## Page (WP3)

`content/atlas/federal-footprint.md` — `draft: true`, `weight: 30`,
`tag: "Federal lands"`, title "The Federal Footprint, State by State",
regions/themes consistent with `us-federal-lands-alt.md`. Prose: scaffold
only (HTML comment) + a written "Data and method" section (that side of the
AI line is ours). Howto bullets for hover/sort/pin. Cross-link the sightline.

## Repo gotchas (both agents)

- Python: **stdlib only**, run with `/usr/bin/python3` (homebrew expat broken).
- Hugo lowercases ALL frontmatter keys recursively; JS must lookup lowercase.
- Viz config is emitted as `<script type="application/json">` — never plain
  `<script>` (minifier mangles it). The atlas single.html already does this.
- `make <target>`: add `federal-footprint` target; NOT in the `data`
  aggregate (depends on `federal-interests` outputs being present).
- Draft pages: no template-level draft filtering; `-D` is the only switch.
- Build check: `hugo --gc --minify` and `hugo --gc -D` must both pass clean.

## Fixture

`static/data/federal-footprint.json` currently holds a 4-state FIXTURE
(ND, SD, NV, WA) matching this schema exactly — develop the renderer against
it; the real pipeline output will replace it byte-for-byte schema-compatible.

## WP1 transcription notes

_Fetched 2026-07-24._

- **Fee (CRS R42346 Table 2)**: transcribed entirely from
  <https://www.everycrsreport.com/files/20200221_R42346_ff457a3a93889b6a9fb32baa6dc38d8f4f9291c5.html>
  via WebFetch, in 8 calls (17 states split into 4 batches — {ND,WA,MT,SD,ID},
  {OR,WY,NE,NV,UT}, {CO,KS,CA,OK}, {NM,AZ,TX} — each batch fetched twice with
  differently phrased prompts). All 8 pairs agreed digit-for-digit on the
  first pass; no third fetch or reconciliation was needed. The three
  known-good check rows from this spec (NV, ND, SD) matched exactly in both
  fetches of their respective batches. No ambiguities or footnoted values
  were encountered in the transcribed cells (Kansas BLM = 1 acre is real,
  not a transcription artifact — it's the well-known "Kansas has almost no
  BLM land" fact and appeared identically in both fetches). Did not need to
  fall back to the everycrsreport `/reports/R42346.html` mirror or the
  congress.gov PDF.
- **State land area**: standard US Census 2010 land-area figures (square
  miles), not re-fetched from a live Census URL this pass — used the
  well-known published 2010 Census land-area table (sq mi), × 640 → acres,
  written to `scripts/data/state_land_areas.csv` with the exact sq-mi
  figure cited per row in the `source` column for traceability. Cross-check:
  ND computes to 44,160,640 acres, which matches this spec's own example
  `landacres` value for North Dakota (§ Output schema) exactly — a strong
  independent confirmation. The three spec sanity anchors also check out:
  NV = 70,259,840 (≈70.26M ✓), TX = 167,188,480 (≈167.2M ✓), KS = 52,325,760
  (≈52.3M ✓), all within rounding of the spec's stated targets.
- Both CSVs use 17 rows in the spec's N→S order (ND, WA, MT, SD, ID, OR, WY,
  NE, NV, UT, CO, KS, CA, OK, NM, AZ, TX). FIPS codes with a leading zero
  (CO=08, CA=06, AZ=04) are written literally as two-character strings in
  both files, matching the spec's `"fips": "38"`-style string convention.

## WP4 verification report

_Adversarial pass, 2026-07-25. Independent re-fetch and independent
from-scratch reimplementation, run against `static/data/federal-footprint.json`
as it exists on disk (retrieved-date stamps in the file read 2026-07-25)._

### 1. Fee spine vs. source — **CONFIRMED**

Re-fetched CRS R42346 Table 2 live via WebFetch (fresh fetch this pass, not
reused from WP1's notes) for six states not used as WP1's check rows: MT, ID,
OR, WY, CA, AZ. Digit-for-digit match against both
`scripts/data/crs_federal_land_by_state.csv` and the `fee` dicts in
`federal-footprint.json` for all 30 cells (5 agencies × 6 states):

| state | BLM | FS | FWS | NPS | DOD |
|---|---|---|---|---|---|
| MT | 8,022,852 | 17,186,331 | 653,097 | 1,214,193 | 5,928 |
| ID | 11,776,995 | 20,447,859 | 49,733 | 511,963 | 3,098 |
| OR | 15,742,384 | 15,697,445 | 575,379 | 196,197 | 32,852 |
| WY | 17,493,875 | 9,215,971 | 70,930 | 2,345,619 | 11,327 |
| CA | 15,088,090 | 20,791,505 | 296,899 | 7,612,898 | 1,703,741 |
| AZ | 12,120,512 | 11,179,113 | 1,683,512 | 2,658,112 | 436,743 |

No discrepancies. `feetotal` in the JSON also equals `sum(fee.values())`
exactly for all 17 states (verified separately, see Check 4).

### 2. Easement assignment, independent method — **CONFIRMED**

Wrote a from-scratch TopoJSON decoder (arc delta-decoding + scale/translate
transform, arc-reversal on negative indices) and an even-odd ray-casting
point-in-polygon test over the combined ring set of each state's `states.json`
geometry (winding-agnostic, holes handled automatically by the even-odd rule)
— written and run *before* opening `scripts/build_federal_footprint.py`, per
instructions. Assigned all 42,755 tracts in
`federal-interests-easements.json` to states by this method.

Result: **exact match, all 17 states, both tracts and acres**, e.g.:

| state | tracts (mine / json) | acres (mine / json) |
|---|---|---|
| ND | 18266 / 18266 | 1,805,448 / 1,805,448 |
| SD | 16165 / 16165 | 1,922,632 / 1,922,632 |
| MT | 870 / 870 | 616,667 / 616,667 |
| CA | 425 / 425 | 131,402 / 131,402 |
| TX | 84 / 84 | 58,309 / 58,309 |
| KS | 16 / 16 | 11,892 / 11,892 |
| NV | 0 / 0 | 0 / 0 |
| (and ID, OR, WY, NE, UT, CO, OK, NM, AZ, WA — all exact) | | |

17-state total: 36,139 tracts / 4,798,778 acres, both from my script and the
JSON. The remaining 6,616 tracts (42,755 − 36,139) fall in states outside the
17-state roster (MN, WI, etc.) — consistent with the sightline's national
scope being larger than the atlas roster. No discrepancy found anywhere in
Check 2, including no need to read the pipeline script to diagnose anything.

### 3. Trust apportionment plausibility — **CONFIRMED (plausible), one caveat noted**

Polygons >1M acres in `federal-interests-trust.json` (335 features, 126,893,712
acres total — matches the sightline's "335 LARs, ~126.9M acres"):
Navajo 23,980,200; Uintah and Ouray 7,708,828; Cheyenne River 5,697,394; Pine
Ridge 5,267,722; Crow 4,989,840; Standing Rock 4,835,389; Fort Peck 4,776,790;
Wind River 3,901,717; Tohono O'odham 3,892,296; Blackfeet 3,514,328; Colville
3,148,527; Flathead 2,886,744; Yakama 2,877,303; Hopi 2,698,310; San Carlos
2,669,137; Rosebud 2,532,321; Fort Apache 2,454,630; Fort Berthold 2,241,221;
Red Lake 1,879,230; Leech Lake 1,794,106; White Earth 1,621,000; Nez Perce
1,615,556; Hualapai 1,566,112; Fort Belknap 1,466,401; Jicarilla Apache
1,308,251.

Geometry sanity checks (bbox of the named polygons vs. known state boundaries):
- **Wind River** bbox is entirely inside Wyoming (lon −109.47…−108.15, lat
  42.85…43.76) — and the JSON's WY `trust` value is **exactly** 3,901,717,
  i.e. the full, un-apportioned Wind River acreage. Correct: Wind River does
  not cross a state line.
- **Uintah and Ouray** bbox is entirely inside Utah — consistent with UT
  trust (9,989,782) being Uintah-and-Ouray-plus-something (Navajo's small UT
  corner, Goshute, etc.), not an apportioned fraction.
- **Cheyenne River** bbox (lat 44.21–45.47) sits entirely south of the ND/SD
  border (~45.94°N) — wholly SD, consistent with SD trust (19,052,740) being
  large enough to hold Pine Ridge + Cheyenne River + Rosebud + Crow Creek in
  full plus an apportioned share of Standing Rock.
- **Standing Rock** bbox (lat 45.47–46.43) straddles the ND/SD line as
  expected — both ND (3,740,695) and SD (19,052,740) trust totals are
  consistent with a split.
- **Fort Peck** bbox is entirely inside Montana, consistent with MT's large
  trust total (18,803,069 — enough for Crow + Fort Peck + Blackfeet +
  Flathead + Fort Belknap roughly in full).
- **Navajo** bbox (lon −111.89…−107.15, lat 34.9…37.46) spans AZ/NM with only
  a sliver crossing into UT territory (UT starts ~37°N) — consistent with AZ
  (30,595,469) and NM (12,587,339) each carrying large Navajo shares and UT's
  trust total (9,989,782) being dominated by Uintah and Ouray, not Navajo.

No reservation's acreage lands in an obviously wrong state.

**17-state trust total vs. national total**: sum of the 17 states'
`trust` fields = **117,540,847**; national total = 126,893,712; remainder =
**9,352,865** — matches the spec's own estimate ("~9.4M remainder") closely.
Plausible non-17-state contributors: Minnesota (Red Lake 1,879,230 + Leech
Lake 1,794,106 + White Earth 1,621,000 + Bois Forte + Fond du Lac ≈ 5–6M) and
Wisconsin (several smaller Ojibwe bands) together plausibly cover most of the
remainder, consistent with the spec's own hint.

**Caveat**: Oklahoma's `trust` = 0. Checked directly: no feature in
`federal-interests-trust.json` has a bounding box that intersects Oklahoma at
all (searched by name for Osage, Cherokee, Choctaw, Chickasaw, Creek,
Seminole, Kiowa, Comanche, Quapaw — none present as LAR polygons, and no
geometry falls in the OK bbox). This is a property of the BIA LAR source
dataset itself (Oklahoma's tribal trust land is mostly scattered individual
allotments post-allotment-era, not large contiguous reservation polygons of
the kind this LAR extract captures), not a pipeline error — the fee/easement
totals for OK look normal. Still worth flagging in the page's prose as a
real undercount for OK specifically, since readers may not intuit why
Oklahoma shows zero trust acreage.

### 4. Internal consistency — **CONFIRMED, with two minor spec deviations noted**

- **17 states, correct N→S order** (ND WA MT SD ID OR WY NE NV UT CO KS CA OK
  NM AZ TX) and correct FIPS strings: confirmed.
- **`feetotal == sum(fee)`**: exact match, all 17 states.
- **`programs` tracts/acres sum to state tracts/acres**: exact match (diff=0),
  all 17 states — tighter than the ±2 tolerance allows.
- **Cumulative curve monotonic**: nondecreasing (never decreases) in all 17
  states — confirmed. However, spec note says entries should appear "only
  years where the total changes"; found **six pairs of consecutive identical
  values** violating that: WA has `[1949,937],[1950,937]` (a genuine
  no-op year listed) and `[1959,4071],[1967,4071],[1975,4071]` (three flat
  entries in a row where only the first should exist); OK has
  `[2017,3638],[2025,3638]`; TX has `[2017,57580],[2019,57580]`. Minor —
  doesn't corrupt the totals or the shape of the curve, but is a literal spec
  deviation in the "only years where the total changes" rule and should be
  cleaned up (drop the redundant trailing duplicate points) before this
  ships.
- **Cumulative last value == acres − undated-tract acres**: independently
  recomputed undated tract counts *and* undated tract acreage per state from
  the raw `federal-interests-easements.json` tracts (using the Check-2
  point-in-polygon assignment, and treating `year == null` as undated) —
  **exact match for all 17 states**, both the `undated` tract *count* against
  the JSON's `undated` field and the last `cumulative` value against
  `acres − undated_acres_calc`. E.g. ND: undated count 597/597 match, undated
  acres computed 96,393, dated total 1,709,055, JSON's last cumulative point
  1,709,055 — exact.
- **`landacres` vs `scripts/data/state_land_areas.csv`**: exact match, all 17
  states.
- **No state's (fee + trust + easement acres) / landacres > 100%**: confirmed;
  highest is NV at 83.11%, then AZ 80.74%, UT 82.27%, ID 68.89% — all well
  under 100%, no state flagged.
- **`feecheck` vs `feetotal`**: not independently recomputed this pass (would
  require re-deriving fee acreage from `fedland.topojson` myself, out of
  scope for the time budget) — logged as **UNVERIFIABLE by this pass**, but
  noting the spread for the record: differences range from −8.1% (WY) to
  +95.9% (KS), with most states in the +2% to +40% band and a general tendency
  for `feecheck` to run *higher* than `feetotal` (13 of 17 states), plausible
  for a PAD-US-topojson-derived estimate vs. the official 5-agency CRS table
  (different, likely broader, source polygons). KS's +95.9% gap is the
  largest outlier and worth a second look if `feecheck` is ever surfaced to
  readers, though the spec says the renderer ignores it.

### 5. Cross-instrument consistency — **CONFIRMED**

- Easements JSON national totals: 42,755 tracts / 5,429,148 acres — matches
  the sightline's stated "42,755 tracts / 5,429,148 deeded acres" exactly.
- ND easements acres (1,805,448) and SD easements acres (1,922,632) in
  `federal-footprint.json` match the sightline's per-state figures exactly.
- Dakotas share: (1,805,448 + 1,922,632) / 5,429,148 = **68.67%**, matching
  the sightline's stated "68.7%".
- `content/atlas/federal-footprint.md`'s "Data and method" section was read
  in full: it makes no specific numeric claims (acreage, tract counts,
  percentages) that could contradict the JSON — it's methodological prose
  only (definitions, apportionment method, caveats). No contradiction found
  because there is nothing numeric to contradict.

### 6. Kansas — **CONFIRMED**

Re-fetched the CRS R42346 Table 2 Kansas row specifically (part of the same
Check-1 WebFetch call): BLM = **1** acre, FS = 108,621, FWS = 29,509,
NPS = 462, DOD = 115,326 — matches both the CSV and the JSON exactly. The
spec's note that this is "the well-known 'Kansas has almost no BLM land'
fact, not a transcription artifact" is correct.

### Overall verdict

**CONFIRMED.** No refuting evidence found in fee-spine transcription,
easement point-in-polygon assignment, trust apportionment plausibility,
internal arithmetic/schema consistency, or cross-instrument agreement with
the sightline and atlas page prose. Two minor, non-blocking issues are worth
a cleanup pass before ship: (a) six redundant duplicate-value points in three
states' `cumulative` arrays (WA, OK, TX) that violate the "only years where
the total changes" rule from the schema notes, and (b) Oklahoma's `trust: 0`
is real but likely to read as an error to a reader/editor unless the page's
prose or a data-file comment explains that OK has no BIA LAR reservation
polygons in this source, rather than a pipeline bug. `feecheck` values were
not independently re-derived and remain formally UNVERIFIABLE by this pass,
per spec design (renderer ignores them; they're a method note only) — flagged
for awareness, not as a refutation.
