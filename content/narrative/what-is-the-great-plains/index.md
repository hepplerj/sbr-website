---
title: "What are the Great Plains?"
date: 2026-05-24
lede: "On the historiography of regional boundaries, why this project uses several different definitions of 'Plains' at once, and what gets lost when the units of analysis don't match the geography they claim to describe."
place: "Great Plains"
weight: 20
draft: true
toc: true
---

<!--
  OUTLINE / SCAFFOLD — Jason to write the prose.

  This page is a methods/essay piece in the vein of a digital-history
  white paper. The argumentative goal: make explicit a problem the
  project has been quietly demonstrating, which is that "the region"
  is a constructed analytic unit, not a discovered natural fact, and
  that the project uses different region schemes for different
  questions on purpose. The Great Plains is the case study.

  Sections below are headings + editorial cues + source pointers.
  Replace the bracketed editorial notes with prose. The figure embed
  near the top is wired up and renders the Fenneman boundary over
  contiguous-US state outlines.
-->

## The question

*Editorial note: open with the live problem. The project has multiple regional taxonomies — the 8-region sightlines filter, the 3-region atlas split, the National Grassland-specific maps — that don't agree with each other. That's not a bug, but it deserves to be argued. The honest opening is: when you talk about the Great Plains, which Great Plains do you mean?*

{{< figure src="trimble-1980-great-plains.png"
           alt="Map of the Great Plains as illustrated in Donald E. Trimble's 1980 USGS bulletin, showing the region's geographic extent across the central United States."
           caption="The Great Plains as drawn in Donald Trimble's *Geologic Story of the Great Plains* (1980), a US Geological Survey publication intended for a general audience. The figure shows the region as a geologic and physiographic unit defined by its rock and sediment history rather than by political boundaries."
           credit="Donald E. Trimble, *The Geologic Story of the Great Plains*, Geological Survey Bulletin 1493 (Washington, D.C.: U.S. Government Printing Office, 1980). Public domain (US government work)." >}}

*[Editorial note after the figure: this is where you can say the figure makes the point at a glance — eastern CO, eastern WY, eastern MT are Plains; western MN, IA, MO are Plains too. The Plains exist as a thing, but they're not what the federal-data infrastructure measures.]*

## The historiographic Great Plains

*[Editorial note: this is the meat — survey the major scholarly definitions and the moves their authors are making. Each subsection is one position. You can be opinionated about which positions you find compelling.]*

### Walter Prescott Webb and the 98th meridian

*[Editorial note: Webb's *The Great Plains* (1931) is the canonical environmental-determinist account — the region is defined by aridity, treelessness, and level land beginning at the 98th meridian. Webb's claim is that crossing this line forced Americans to invent new institutions (barbed wire, the Colt revolver, the windmill, dryland farming). The boundary is a *geographic* line that produces *cultural* effects. The thesis is sweeping and has been pummeled by later historians, but its definition of the region — environmental-physical, west of the 98th — set the terms.]*

Sources to draw on: {{< cite key="webb1931great" >}} *[need to add to bibliography]*. See also {{< cite key="malin1947grassland" >}} for the major contemporary critique — Malin argued Webb's environmental determinism was overdrawn and that grassland ecology, not aridity per se, was the operative reality. *[Bibliography entries pending; add to Articles.bibtex or Books.bibtex.]*

### James Malin and the ecological grassland

*[Editorial note: Malin's *The Grassland of North America* (1947) reframes the region as an ecological unit rather than a climatic one. The Plains are the grasslands — shortgrass in the west, mixed-grass in the center, tallgrass in the east transitioning to forest. This frame extends the region north into the Canadian prairie and acknowledges its continuity with the Mexican llanos. Malin's quarrel with Webb is partly about determinism and partly about scale.]*

### Donald Worster and the Plains-as-failure

*[Editorial note: Worster's *Dust Bowl* (1979) treats the Plains as a region defined by what happened to it under capitalist agriculture — overplowing, drought, ecological collapse, dispossession. Worster's later *Rivers of Empire* (1985) extends the critique to irrigation and the West more broadly. For Worster, the Plains is the test case for the proposition that the United States misunderstood the limits of its own geography. The region is morally and politically defined as much as it's physiographically defined.]*

### John Wesley Powell and what didn't happen

*[Editorial note: Powell's *Report on the Lands of the Arid Region of the United States* (1879) proposed a fundamentally different organization for the West — drainage basins as the political-administrative unit, irrigation districts shaped by hydrography, settlement limited to where water permitted. Powell's framework lost to the rectangular survey and to state boundaries drawn by Congress. This loss is the foundational episode in the divergence between physiographic and administrative geography. Worster picks Powell up; Cunfer (below) extends the empirical case. Powell can anchor either the opening or the closing move of the essay.]*

### The post-Worster wave: Cunfer and the data revisionists

*[Editorial note: Geoff Cunfer's *On the Great Plains: Agriculture and Environment* (2005) uses county-level historical GIS to revisit Worster's claims and finds them substantially overdrawn — the Plains were neither uniformly destroyed nor uniformly malign in their land use. Cunfer's region is empirically constructed, county by county. Frieda Knobloch's *The Culture of Wilderness* (1996) and Brian Frehner's work add the cultural and energy-history dimensions. This is the wave that demonstrates region-building as a methodological move.]*

## The institutional Great Plains

*[Editorial note: pivot from scholarly to administrative. Federal agencies define the Plains for operational purposes, and those definitions don't agree either. This is a shorter section — the point is to show that even the agencies that ostensibly *manage* the region can't agree on its boundaries.]*

- **USDA Major Land Resource Areas (MLRA)** — the Plains as soil-and-conservation zones; rolls up into a "Great Plains" Land Resource Region
- **USFS Forest Service regions** — R1 (Northern), R2 (Rocky Mountain), R8 (Southern), all touching the Plains; the FS itself doesn't have a "Great Plains" region
- **EPA Ecoregions Level III** — splits the Plains into ~6 ecoregions (Northwestern Glaciated Plains, Northwestern Great Plains, High Plains, Central Great Plains, Western Corn Belt Plains, Southwestern Tablelands)
- **Census Bureau** — collapses the Plains into "West North Central" + part of "West South Central" + part of "Mountain"; gives no Plains category at all
- **USGS Fenneman provinces** — what's shown in the figure above

*[Editorial note: list these and pick a few words about what each one's optimizing for. The deeper point is that "the region" is whatever the question is — soil-conservation regions look one way, land-management regions another, statistical regions a third.]*

## What this project does and why

*[Editorial note: now the methodological turn — own the project's own choices. Two main schemes are in use, and they're chosen for different questions.]*

The **sightlines filter** uses an 8-region state-based taxonomy (Northern Plains, Southern Plains, Rocky Mountain, Intermountain West, Southwest, Pacific Northwest, Pacific Southwest, Alaska). *[Editorial note: this is the navigational geography. State polygons because that's what readers and data both speak. Northern/Southern split because the climate, politics, and farm-economy stories meaningfully diverge across that line. MT/WY/CO grouped as Rocky Mountain because their federal-land character is mountain. The Fenneman overlay (toggleable on the sightlines map) is the honesty mark — it shows where this scheme's seams lie.]*

The **atlas's regional cosponsorship analysis** uses a different 3-region scheme (Great Plains = MT/WY/CO/ND/SD/NE/KS; Intermountain & Pacific West + AK; Corn Belt Midwest). *[Editorial note: this is the political-economy geography. Treats MT/WY/CO as Plains because their *Congressional delegations* vote and cosponsor like Plains delegations, even though their landscapes are partly mountain. The unit of analysis is the legislator, not the polygon.]*

These two schemes are inconsistent on purpose. *[Editorial note: the punchline — regions are tools, not truths. The project uses the tool that fits the question.]*

## What gets lost

*[Editorial note: a short coda about the costs of every regionalization. The state-based scheme misses eastern CO/WY/MT as Plains. The political-delegation scheme treats CA as one thing when it's at least two. The Forest Service regions cut Yellowstone in half. The Fenneman boundary stops at the 49th parallel, but the Plains don't. Acknowledge that the cross-border continuity into the Prairie Provinces is real even though this project's data scope is US-only — and that any honest regional history of the Plains has to gesture at what it isn't doing.]*

## Sources

*[Editorial note: collected references — once you add the bibtex entries to `Articles.bibtex` / `Books.bibtex` and rerun `make bibliography`, the `{{< cite >}}` shortcodes will resolve. Suggested keys you'll want in the bibliography:*

- *`webb1931great` — Walter Prescott Webb, The Great Plains (1931)*
- *`malin1947grassland` — James Malin, The Grassland of North America (1947)*
- *`worster1979dustbowl` — Donald Worster, Dust Bowl (1979)*
- *`worster1985rivers` — Donald Worster, Rivers of Empire (1985)*
- *`powell1879arid` — John Wesley Powell, Report on the Lands of the Arid Region (1879)*
- *`cunfer2005plains` — Geoff Cunfer, On the Great Plains (2005)*
- *`knobloch1996wilderness` — Frieda Knobloch, The Culture of Wilderness (1996)*
- *`limerick1987legacy` — Patricia Limerick, The Legacy of Conquest (1987)*
- *`meinig1986shaping` — Donald Meinig, The Shaping of America (1986–2004)*
- *`fenneman1931physiography` — Nevin Fenneman, Physiography of the Western United States (1931)*

*Plus the federal sources as primary references — USGS physiographic divisions, USDA MLRA, EPA ecoregions documentation, USFS regional designations, Census Bureau region definitions.]*
