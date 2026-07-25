# Governing Ground: Federal Land Interests Map — Data Acquisition & Augmentation Plan

A plan of action for extending the existing "US Federal Lands" map (fee lands by managing agency) into a multi-layer map of *federal interests in land*. The goal is to show that the federal presence on the Great Plains is real but takes forms invisible on a conventional fee-title map: easements, split estates, trust lands, and regulatory overlays.

**Intended agent:** Claude Code. Work through phases in order; each phase produces a usable intermediate. Ask before making irreversible choices (e.g., simplification tolerances that discard data).

---

## Context for the agent

- The existing map shows federal **fee lands colored by managing agency** (BLM, USFS, NPS, FWS, DOD, BIA, BOR, DOE, etc.) with hover-for-agency interaction, on a muted cream/tan basemap. Inspect the existing repo/code before starting — identify the rendering stack (likely D3 + TopoJSON or MapLibre GL + vector tiles) and match it.
- The conceptual model is a **spectrum of federal interest**, mapped as toggleable layers:
  1. **Fee lands** (exists today) — full federal ownership, by agency
  2. **Trust lands** — held in trust for tribes/individuals; visually and categorically distinct from "federal land"
  3. **Partial interests** — easements (FWS wetland/grassland, scenic, flowage, conservation)
  4. **Split estates** — federal subsurface minerals under private surface
  5. **Regulatory overlays** — ESA critical habitat (stretch goal: floodplains, historic grazing districts)
  6. **Historical layer** — Land Utilization Program purchase areas vs. current national grasslands
- Design intent: the user starts at the conventional view and toggles layers on, watching the "empty" Plains fill in. The reveal is the argument.
- Author's stack preferences: Python with `uv` and PEP 723 inline script metadata for all wrangling scripts; keep scripts single-purpose and re-runnable; outputs to a `data/processed/` directory as GeoJSON or TopoJSON (or MBTiles/PMTiles if the map uses vector tiles).

---

## Phase 0 — Repo reconnaissance

1. Locate the map code. Identify: rendering library, projection (likely Albers USA), data format consumed, build pipeline, and how the current agency layer is styled.
2. Document findings in `docs/map-architecture.md` before touching data.
3. Decide (and record) the target format for new layers based on what the map already consumes. If current data is TopoJSON at the national scale, plan for aggressive-but-documented simplification; if vector tiles, plan a tippecanoe/PMTiles pipeline.

**Checkpoint:** short architecture summary + proposed data format. Pause for review.

---

## Phase 1 — Baseline refresh: PAD-US as the fee-lands backbone

**Source:** USGS Protected Areas Database of the United States (PAD-US), current version (4.x as of 2024–25; check for newer).
- Landing: https://www.usgs.gov/programs/gap-analysis-project/science/pad-us-data-download
- Formats: geodatabase (full), GeoPackage, or state extracts. National GDB is large (multi-GB); prefer the GeoPackage or use `ogr2ogr` with SQL filters to extract only needed feature classes.

**Tasks:**
1. Download PAD-US "Fee" feature class. Filter `Own_Type = 'FED'`; retain `Mang_Name` (managing agency), `Unit_Nm`, `GIS_Acres`.
2. Cross-check against the existing map's data source. If the existing map already uses PAD-US, just record the version; if it uses another source, note discrepancies (PAD-US is more complete but includes small parcels that may need area-thresholding for national display).
3. Also extract the PAD-US **"Designation"** feature class filtered to national grasslands (`Des_Tp = 'NG'` or name LIKE '%National Grassland%') — needed for Phase 6.
4. Emit `data/processed/fee_lands.{format}` keyed by agency, with a stable schema: `{agency, unit_name, acres, geometry}`.

**Gotchas:** PAD-US has overlapping polygons (fee + designation + easement layers overlap by design). Never union across feature classes. Watch for Alaska/Hawaii projection handling in the existing map.

---

## Phase 2 — Trust lands as a distinct category

**Source:** BIA "American Indian and Alaska Native Land Area Representations" (AIAN-LAR / formerly "Indian Lands Dataset").
- BIA open data: https://biamaps.geoplatform.gov/ (BIA Branch of Geospatial Support); also mirrored on data.gov. Look for "Land Area Representations (LAR)" polygons.
- Supplement/cross-check: Census AIANNH boundaries (reservation outlines, but NOT trust status — use only for context).

**Tasks:**
1. Download LAR polygons. These represent tracts where the US holds land in trust — reservations and off-reservation trust land.
2. **Do not merge into the fee-lands layer.** Create `data/processed/trust_lands.{format}` as its own layer with its own legend category.
3. In the map, style distinctly (different texture/hatching, not just another solid color) and write hover copy that states the trust relationship plainly, e.g., "Held in trust by the United States for [tribe]. Not public land."
4. If the existing map colors BIA parcels as an agency, remove them from the agency layer and migrate them here, noting the change in a changelog.

**Gotchas:** LAR data quality varies by region; some tracts are approximations. Include a data-caveats note in the layer's info panel. Individual allotments (checkerboarded trust parcels within reservations, esp. in SD/ND/MT) may or may not be present depending on the vintage — document what the downloaded version actually contains.

---

## Phase 3 — Partial interests: the easement layers (the Plains-transforming layer)

This is the highest-value, highest-friction phase. Three sub-sources, in priority order:

### 3a. FWS wetland and grassland easements (Prairie Pothole region)
- **Source:** FWS National Realty tracts. FWS publishes "FWS Interest" spatial data (fee vs. easement vs. lease) via the FWS GIS/ECOS data portal: https://gis-fws.opendata.arcgis.com/ — look for "FWS Interest" or "National Realty Tracts" layers. The `INTTYPE1` / interest-type attribute distinguishes fee from easement.
- Filter to easement interest types (wetland easement, grassland easement, conservation easement, FmHA easement). Geographic concentration: ND, SD, MT, MN, NE.
- **This is the single most important new dataset for the project's argument.** Millions of acres of permanent federal interest on private land across the Dakotas, invisible on the current map.

### 3b. NCED (National Conservation Easement Database)
- **Source:** https://www.conservationeasement.us/ — download requires free registration; national GeoJSON/shapefile.
- Filter to easements where the **holder is a federal agency** (`eholder` / holder-type attributes). NCED *undercounts* FWS easements, so treat 3a as authoritative for FWS and use NCED for other federal holders (NRCS/USDA easements — WRP/ACEP wetland reserve easements are significant on the Plains — plus Forest Service, NPS-held easements).
- Deduplicate against 3a by spatial overlap + holder name before merging.

### 3c. Corps of Engineers flowage easements
- **Source:** hardest to obtain nationally. Check the USACE geospatial open-data portal (https://geospatial-usace.opendata.arcgis.com/) for real estate/flowage easement layers per district; the Omaha District (Missouri River mainstem reservoirs — Oahe, Sakakawea, Fort Peck) matters most for this project.
- If national coverage isn't available, scope to the Missouri River basin and note incompleteness. Partial coverage with honest labeling beats omission.

**Tasks:**
1. Build one script per sub-source; normalize into a shared schema: `{holder_agency, interest_type, program, acres, state, geometry}`.
2. Merge into `data/processed/partial_interests.{format}` with `interest_type` preserved for sub-layer filtering (users should be able to toggle "wetland/grassland easements" separately from "other conservation easements").
3. Many easements are small (40–160 acres). At national zoom, consider a density/aggregation rendering (e.g., county-level shading or point clustering) that resolves into true polygons on zoom. Propose the approach before implementing.

**Gotchas:** Easement polygons often overlap PAD-US fee lands (data errors) — clip or flag overlaps rather than silently double-counting. NCED licensing: check redistribution terms; may require attribution text in the map.

---

## Phase 4 — Split estates: the federal mineral checkerboard

**Source:** BLM administers the federal subsurface mineral estate (~700M acres). 
- BLM National Data: https://gbp-blm-egis.hub.arcgis.com/ (BLM GIS hub) — search "Subsurface Mineral Estate" / "Federal Mineral Ownership." Some states publish better data than the national layer (Wyoming and Montana BLM state offices have solid mineral-estate polygons; relevant for Thunder Basin and the Powder River Basin).
- Fallback: state-level surface-management-agency (SMA) + mineral ownership layers from BLM state offices.

**Tasks:**
1. Acquire federal mineral estate polygons for, at minimum: MT, WY, ND, SD, NE, CO, NM, OK (the project's core geography). National coverage if the data quality supports it.
2. Compute the split-estate layer: federal minerals **minus** federal surface (spatial difference against Phase 1 fee lands) = private-surface/federal-minerals. This derived layer is the payoff.
3. Emit `data/processed/split_estate.{format}`. Style as hatching/stipple under the surface layers — it should read as "beneath."

**Gotchas:** Mineral estate data is PLSS-section-based and blocky; geometry will look like literal checkerboard. That's fine — it *is* the checkerboard. Large file sizes; simplify with care (section lines matter visually). Document the vintage; mineral records change slowly but the data snapshots vary.

---

## Phase 5 — Regulatory overlays (stretch goal, time-boxed)

- **ESA critical habitat:** FWS Critical Habitat portal, national polygons + linear features: https://ecos.fws.gov/ecp/report/critical-habitat — downloadable national shapefile/GDB. Straightforward. Emit as its own toggle layer.
- **Optional/deferred:** FEMA floodplains (huge, tangential), historic Taylor Grazing Act district boundaries (archival digitization project — flag as future work, don't attempt now).

Time-box this phase to a day of effort; critical habitat only unless it goes unusually smoothly.

---

## Phase 6 — Historical layer: LUP purchase areas vs. national grasslands

The signature scholarly layer; no ready-made dataset exists.

**Sources to investigate, in order:**
1. PAD-US designation layer for **current** national grassland boundaries (from Phase 1, task 3).
2. Historical LUP project boundaries: check (a) USDA Agricultural Economic Report No. 85 (Wooten 1965, "The Land Utilization Program, 1934 to 1964") — contains project lists and state maps that could be georeferenced; (b) National Archives RG 114 (SCS) / RG 95 (USFS) cartographic records — flag for the author to pursue if nothing digital exists; (c) Forest Service Geodata Clearinghouse (https://data.fs.usda.gov/geodata/) for any "land utilization project" or acquired-lands layers; (d) the Stanford Spatial History Project "Follow the Money" — they mapped Bankhead-Jones county payments; their county-level data may be published or obtainable on request.
3. Minimum viable version: a **county-level choropleth** of LUP purchase acreage (Wooten's tables, hand-entered into CSV) displayed alongside current grassland polygons. This is achievable without archival georeferencing and still shows the "ghost acreage" — counties where land was purchased but no grassland exists today.

**Tasks:**
1. Build the county-level MVP first: `data/processed/lup_counties.csv` + join to county geometries.
2. Document the archival path to true polygon boundaries as future work in `docs/lup-boundaries-roadmap.md`.

---

## Phase 7 — Map integration

1. Add a **layer control panel**: Fee lands (default on) / Trust lands / Easements & partial interests (with sub-toggles) / Federal minerals / Critical habitat / Historical: LUP. Preserve the existing hover interaction; extend hover to report *all* interests present at a point when multiple layers are on ("Surface: private · Minerals: federal (BLM) · Easement: FWS grassland easement").
2. Respect the existing visual language (muted palette). Proposed encoding: fee = solid fills by agency (as now); trust = distinct hatch; easements = stipple/dot texture in a new hue family; minerals = diagonal hatching beneath; critical habitat = outline/tint.
3. Add per-layer info panels with one-paragraph explanations and data provenance + vintage. The author will write final copy; generate accurate drafts.
4. Performance: if total payload exceeds what the current architecture handles gracefully, propose migration to PMTiles + MapLibre before hacking around it.
5. Add a `DATA.md` at repo root: every source, URL, download date, license/attribution, processing script, and known gaps.

---

## Working agreements

- One `uv` script (PEP 723 metadata) per dataset in `scripts/`, named `fetch_*.py` / `process_*.py`; each idempotent and documented at the top.
- Never commit raw downloads to git; `data/raw/` is gitignored, `data/processed/` outputs are small enough to commit or are built in CI — decide in Phase 0 and record it.
- All geometry in EPSG:4326 at rest; project at render time to match the existing map.
- When a dataset is incomplete (Corps easements, LUP boundaries), ship it with visible caveats rather than omitting it. Honest partial data serves the argument; silent gaps undermine it.
- Checkpoint with the author at the end of Phases 0, 3, and 6 before proceeding.

## Definition of done

A user can load the map, see the familiar fee-lands picture, toggle on easements and federal minerals, and watch the Great Plains transform from "empty" to "governed" — with every layer documented, attributed, and honestly caveated.
