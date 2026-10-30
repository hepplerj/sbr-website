---
title: "US Federal Lands by Agency (Alt)"
date: 2026-07-24
lede: "The same federal estate, read more capaciously: fee title, land held in trust, and permanent federal easements on land that stays private. Toggle the layers and watch the Plains fill in."
weight: 16
draft: true
viz: map
themes: [public-lands]
regions: [national, northern-plains]
map:
  renderer: d3
  src: /data/fedland.topojson
  statesobject: states
  dataobject: fedland
  colorfield: type
  alignsrc: /data/states.json
  infotitle: "Federal interests in land"
  infoprompt: "Turn on a layer, then hover anywhere. The panel reports every federal interest at that point."
  floatinfo: true
  probetitle: "Federal interests here"
  feelabel: "Fee title, by agency"
  feenone: "None — private, state, or tribal fee"
  layerstitle: "Layers"
  legendtitle: "Managing agency"
  legendorder: [FS, BLM, FWS, NPS, BOR, DOD, BIA, TVA, DOE, NASA, VA, USDA, DOJ, DOT, HHS, MWAA]
  layers:
    - id: trust
      kind: polygons
      label: "Land held in trust"
      probelabel: "Trust"
      src: /data/federal-interests-trust.json
      color: "#a94b2b"
      texture: hatch
      namefield: name
      on: false
    - id: easements
      kind: points
      label: "Federal easements on private land"
      probelabel: "Easement"
      src: /data/federal-interests-easements.json
      # A hue outside the agency palette on purpose: an easement is a
      # different kind of interest, not one more agency.
      color: "#1f6b66"
      dotradius: 0.85
      hitradius: 3
      opacity: 0.6
      on: false
      yearfilter: true
      yearlabel: "Acquired"
    - id: greatplains
      kind: outline
      label: "Great Plains (Fenneman, 1928)"
      src: /data/physio-great-plains.geojson
      color: "#5a3a28"
      width: 2.2
      on: false
  palette:
    FS:   "#4a9e5c"   # forest green
    BLM:  "#c9a978"   # rangeland gold
    FWS:  "#8aa07c"   # refuge olive
    NPS:  "#3a5982"   # park navy
    BOR:  "#6b8cab"   # reclamation blue-gray
    DOD:  "#7a7367"   # military gray-brown
    BIA:  "#a94b2b"   # rust
    TVA:  "#a8915a"   # dun
    DOE:  "#d9b84a"   # yellow
    NASA: "#3a3a3a"   # near-black
    VA:   "#9a6da0"   # plum
    USDA: "#6b7a3a"   # olive-dark
    DOJ:  "#555"
    DOT:  "#777"
    HHS:  "#999"
    MWAA: "#bbb"
    default: "#c4b8e0"
  labels:
    FS:   "Forest Service"
    BLM:  "Bureau of Land Management"
    FWS:  "Fish & Wildlife Service"
    NPS:  "National Park Service"
    BOR:  "Bureau of Reclamation"
    DOD:  "Department of Defense"
    BIA:  "Bureau of Indian Affairs"
    TVA:  "Tennessee Valley Authority"
    DOE:  "Department of Energy"
    NASA: "NASA"
    VA:   "Veterans Affairs"
    USDA: "USDA (other)"
    DOJ:  "Department of Justice"
    DOT:  "Department of Transportation"
    HHS:  "Health & Human Services"
    MWAA: "Metropolitan Washington Airports"
---

<!--
PROSE SCAFFOLD — argument and verified numbers. Jason writes the prose.

The move this page makes: the published federal-lands map answers "what does
the United States own?" This one answers "where does the United States hold an
interest in land?" Those are different questions, and the Plains are where the
answer diverges most.

§1 — The empty quarter that isn't.
    Open on the familiar picture: fee title concentrated west of the Rockies,
    the Dakotas nearly blank. That blankness is the conventional wisdom about
    federal power on the Plains, and it is an artifact of what fee title
    measures.

§2 — Trust land is not public land, and not the agency's. [layer: trust]
    335 Land Area Representations, ~126.9 million acres. The fee map colors
    these BIA rust, as though they were the Bureau's holdings the way a
    national forest is the Forest Service's. They aren't: the United States
    holds the title, but holds it *for* tribes and individual Indians. Same
    federal title, categorically different relationship. Worth saying plainly
    that a map which can't distinguish those two is making a claim.

§3 — The easement layer is the reveal. [layer: easements]
    42,755 federal easement tracts, 5,429,148 deeded acres. Where they are:
      South Dakota  16,165 tracts   1,922,632 ac   35.4%
      North Dakota  18,266 tracts   1,805,448 ac   33.3%
      Montana          870 tracts     616,667 ac   11.4%
      Minnesota      4,418 tracts     384,920 ac    7.1%
    The Dakotas alone: 34,431 tracts, 3,728,080 acres — 68.7% of the national
    total. The five Prairie Pothole states: 93.0% of tracts, 87.2% of acreage.
    38,888 of these are Waterfowl Production Area easements (4,390,109 ac) —
    wetland and grassland easements bought under the Duck Stamp authority.

§3b — The easement estate is RECENT, and the dates are the surprise.
    Drag the Acquired slider and the Dakotas empty out. Through 1962 there
    are 455 tracts on the whole map. By decade acquired (dated tracts only;
    1,484 have no recorded date):
      pre-1960    391 tracts    1.0% cumulative
      1960s    11,006 tracts   27.6%   <- the program arrives
      1970s     7,579 tracts   46.0%
      1980s     3,414 tracts   54.3%
      1990s     5,871 tracts   68.5%
      2000s     4,640 tracts   79.7%
      2010s     5,082 tracts   92.0%
      2020s     3,285 tracts  100.0%
    So 99% of the federal easement interest on the Plains was acquired after
    1960, and over half of it between 1960 and 1989. This is the connection
    worth pressing: the quiet federal interest in Plains land was *being
    built* during exactly the years the sagebrush rebellion was forming in
    the fee-title West. Two different federal geographies, assembled by two
    different mechanisms, in the same decades. Whether Plains landowners
    experienced the easement program as encroachment or as a check in a bad
    year is a real question — the 1930s tranche (326 tracts) is New Deal
    refuge acquisition, a different thing again.

    The point: every one of those dots is private land. Someone owns it, farms
    it, pays taxes on it, and can sell it. And the United States holds a
    permanent property right in it — perpetual, running with the land,
    surviving sale. That is a federal interest in the Plains that the fee map
    cannot show, and it is *denser* there than federal fee title is anywhere
    east of the Rockies.

§4 — What this does to the sagebrush story.
    Connect to the project's argument: the rebellion's geography of grievance
    tracks fee title (Nevada, Utah, the BLM states). But if federal interest is
    the measure, the Plains are governed too — differently, more quietly, and
    by consent-of-a-kind (easements were bought, one landowner at a time). The
    contrast between taken and bought, between managed and encumbered, is the
    thing worth thinking about here. Also worth noting what's still missing:
    the split estate (federal minerals under private surface) would add another
    order of magnitude, and is the obvious next layer.

§5 — Honest limits. See the method note below; don't over-claim.
-->

Federal land, on the conventional map, means federal **fee title** — ground the
United States owns outright. That is what the [companion map](/sightlines/us-federal-lands/)
shows, and it is a real picture of a real thing.

It is also a narrow definition, and the Great Plains are where the narrowness
shows. Use the layer toggles at upper left to add two other forms of federal
interest in land, then hover anywhere: the panel reports every interest present
at that point, not just the one drawn on top.

## How to read this map

- **Fee title, by agency** — the conventional layer, unchanged. Click an agency
  in the legend to isolate it.
- **Land held in trust** — hatched rust. Title is federal; the beneficial owner
  is a tribe or an individual Indian. Not public land.
- **Federal easements on private land** — one dot per tract. The surface stays
  in private hands; the United States holds a permanent, recorded property
  interest in it. The **Acquired** slider narrows to tracts bought in a given
  span of years.
- **Great Plains (Fenneman, 1928)** — the physiographic province boundary, for
  reference. It cuts diagonally across state lines, which is the point: the
  easement belt and the province track each other far better than either
  tracks a state.

The readout follows the cursor, so you can keep your eye on the ground you're
asking about.

## Data and method

**Fee lands** are unchanged from the companion map: federal parcels compiled
from the Protected Areas Database of the United States (PAD-US), pre-projected
to an Albers equal-area (AlbersUsa) canvas that insets Alaska and Hawaii.

**Trust lands** are the Bureau of Indian Affairs' American Indian and Alaska
Native Land Area Representations (LAR) — 335 polygons, about 126.9 million
acres, generalized to roughly 400 m for national-scale display. LAR
distinguishes reservation and trust tracts from off-reservation trust land;
both are labeled on hover. Tract-level allotment detail — the checkerboard
inside many reservations — is not present at this vintage, so the layer reads
as whole areas rather than as the fragmented ownership that actually obtains.

**Easements** are US Fish & Wildlife Service National Realty tracts filtered to
easement interest (`INTTYPE1 = 'E'`): 42,755 tracts totaling 5,429,148 deeded
acres, of which 38,888 tracts and 4,390,109 acres are Waterfowl Production Area
wetland and grassland easements. Each tract is drawn as a single dot at its
centroid rather than as its true outline. Easement tracts run 40–160 acres;
at this scale their boundaries are smaller than a pixel, so a dot is both
lighter and more honest about what the map can actually resolve. Acreage is the
deeded figure (`DOCACRES`) where the mapped figure is absent, which it is for
most easement tracts — the polygon describes the burdened estate, not a federal
parcel.

**The Acquired slider filters the easement layer only.** It is not a snapshot
of the federal estate in a given year, and shouldn't be read as one: the fee
layer carries no dates at all, and the trust polygons carry none either, so
neither can be run backward in time. What the slider does show is real —
`ACQUISITION_DATE` on each easement tract, running 1888–2026 — and it makes the
postwar Waterfowl Production Area buildout legible: only 365 tracts predate
1945. Tracts with no recorded date (1,484 of 42,755) appear only at the full
range, since they can't honestly be placed inside a narrower one.

The Great Plains outline is the same USGS/Fenneman (1928) province boundary
used by the Sightlines region filter, drawn as a stroke only.

Both federal-interest overlays are drawn in the browser from EPSG:4326 source data. Because the
fee layer arrives with its projection already baked into the file, the renderer
recovers that projection's parameters by fitting a live AlbersUsa to the file's
own state outlines, then reuses it for the overlays.

**What is still missing.** The largest omission is the **split estate** —
federal subsurface minerals beneath private surface, administered by BLM across
roughly 700 million acres. Adding it would deepen this argument considerably,
particularly in Wyoming, Montana, and the Dakotas. Also absent: Corps of
Engineers flowage easements along the Missouri River mainstem, non-FWS
conservation easements held by federal agencies (NRCS wetland reserve easements
are substantial on the Plains), and ESA critical habitat. Counts here are
therefore a floor, not a ceiling.

Sources: BIA Branch of Geospatial Support, AIAN National LAR; US Fish &
Wildlife Service, National Realty Tracts. Both retrieved 2026-07-24.
