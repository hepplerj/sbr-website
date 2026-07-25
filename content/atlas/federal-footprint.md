---
title: "The Federal Footprint, State by State"
date: 2026-07-24
lede: "Seventeen states, ranked by how much of their land carries a federal interest — fee title, land held in trust, or a permanent easement on private ground. Change the sort and watch who leads."
weight: 30
draft: true
tag: "Federal lands"
themes: [public-lands]
regions: [national, northern-plains, rocky-mountain, intermountain-west, southwest]
atlas:
  mode: footprint
  src: /data/federal-footprint.json
  howto:
    - "**Hover** a state's bar for a one-line readout of its federal-interest breakdown."
    - "**Sort** by total federal interest, fee, trust, or easement share (or acres), or by north → south file order, using the control above the chart. Rows animate to their new rank."
    - "**Click** a state to pin it and open the detail panel below: a full breakdown table on the left, the state's cumulative easement-acquisition curve on the right. Click again, or use **Unpin**, to close it."
    - "**Bar segments**, left to right: five fee-title agencies (BLM, FS, FWS, NPS, DOD), then land held in trust (hatched), then FWS easements on private land."
---

<!--
PROSE SCAFFOLD — argument and verified numbers go here. Jason writes the prose.

The move this page makes: the companion map (/sightlines/us-federal-lands-alt/)
answers "where is a federal interest, on the ground?" This page asks the same
question a different way — "how much, by state, and who leads depending on
which definition of 'federal' you use?" The re-ranking IS the argument.

§1 — Open on the conventional picture: sort by fee %, and the bar chart
    reproduces the familiar sagebrush-rebellion map almost exactly — Nevada
    at the top (~85%), the BLM/Forest Service states of the Interior West
    filling out the top ranks, the Plains and Texas near the bottom.

§2 — Now sort by total federal interest. [verify against live data once the
    real 17-state file replaces the fixture — do not hand-copy fixture
    numbers into prose] The Dakotas climb sharply once trust and easement
    acreage are added to fee title. This is the same move the companion map
    makes, but ranked and comparable across all 17 states at once rather than
    read off a map by eye.

§3 — Sort by trust % alone: a different set of states leads again — wherever
    BIA LAR reservation and off-reservation trust land is large relative to
    state size. Sort by easement acres: the Prairie Pothole states (ND, SD)
    dominate, for reasons the companion map's method note explains (Waterfowl
    Production Area buybacks, mostly post-1960).

§4 — Click into a state and read the cumulative easement curve on the right.
    For the Dakotas the curve should show almost nothing before 1960, then a
    steep climb — the same "quiet build during exactly the sagebrush-rebellion
    decades" point as the companion map's §3b, but per-state and dated.

§5 — Honest limits: same as the companion map. The split estate (federal
    subsurface minerals under private surface) isn't counted anywhere here,
    and would change the standings, particularly for WY, MT, ND, NM. See the
    method note below.
-->

How much of a state is under some form of federal interest depends entirely
on how you count. The [companion map](/sightlines/us-federal-lands-alt/) shows
three kinds of federal interest — fee title, land held in trust, and permanent
easements on private land — as togglable layers you explore geographically.
This page asks the same question as a ranking: sort seventeen states by each
definition in turn, and watch the leaderboard reshuffle.

## Data and method

**Fee lands** — CRS Report R42346, *Federal Land Ownership: Overview and
Data* (Feb. 21, 2020 version), **Table 2**: FY2018 acreage by state for five
agencies — Bureau of Land Management, Forest Service, Fish & Wildlife
Service, National Park Service, and Department of Defense (DOD as of
9/30/2017). CRS's five-agency table excludes the Bureau of Indian Affairs, so
fee and trust acreage never double-count the same acre.

**Trust lands** are the Bureau of Indian Affairs' American Indian and Alaska
Native Land Area Representations (LAR) — the same source as the companion
map's trust layer. Several LAR polygons (Navajo Nation, Standing Rock, Wind
River, and others) cross state lines, so trust acreage is **apportioned to
each state by area sampling**: the polygon is intersected against state
boundaries and acreage assigned in proportion to the area falling in each
state, rather than credited whole to one state. **Oklahoma shows zero trust
acreage, and that is the source speaking, not a bug**: the LAR dataset carries
no polygons for Oklahoma, where tribal land is predominantly held as allotted
or restricted-fee land under a different legal regime than the reservation
trust tracts LAR represents. Oklahoma's actual tribal land base is therefore
invisible to this instrument — a limit of the category, worth keeping in mind
when reading its row.

**Easements** are US Fish & Wildlife Service National Realty Tracts filtered
to easement interest (`INTTYPE1 = 'E'`), the same source as the companion
map's easement layer. Each tract is assigned to a state by the point-in-polygon
location of its centroid. Acreage is the deeded figure (`DOCACRES`).

**Percent of state land is computed in the browser**, dividing each interest's
acreage by the state's Census-vintage land area (see the data file's `source`
block for the exact vintage). It is never precomputed and shipped, so the
displayed percentage and the underlying acreage can't drift apart.

**Easements are a property interest, not ownership.** Every acre in the
easement segment of each bar is still privately owned, farmed, and taxed —
the United States holds a permanent, recorded right in it, not title. Counting
it as federal "interest" alongside fee title and trust land is a real claim
about the reach of federal land policy on the Plains; it is not a claim that
the Dakotas are one-third federally *owned*. The breakdown table in the
detail panel repeats this caveat for exactly that reason.

**The cumulative easement curve** (right column of the detail panel, after
clicking a state) plots dated tracts only — `ACQUISITION_DATE` on each
easement tract — as a running total by year. Tracts with no recorded date are
counted in the state total and the table, but are not placed on the curve,
since they can't honestly be dated; the count of undated tracts is noted
beneath the chart when it is nonzero.

**What is still missing.** As with the companion map, the largest omission is
the **split estate** — federal subsurface minerals beneath private surface,
administered by BLM — which is not counted here at all. Its inclusion would
particularly reshuffle Wyoming, Montana, New Mexico, and North Dakota. Also
absent: Corps of Engineers flowage easements, non-FWS conservation easements
(NRCS wetland reserve easements are substantial on the Plains), and ESA
critical habitat. These figures are a floor, not a ceiling.

See also the [regional cosponsorship trends](/atlas/regional-trends/) atlas
instrument for how the delegations governing these states spend their
legislative attention on public-lands policy.
