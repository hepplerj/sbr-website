---
title: "The Federal Footprint, State by State"
date: 2026-07-24
lede: "Seventeen states, ranked by how much of their land carries a federal interest."
weight: 30
draft: false
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

How much of a state is under some form of federal interest depends on how you count. The [companion map](/sightlines/us-federal-lands-alt/) shows three kinds of federal interest (fee title, land held in trust, and permanent easements on private land) as togglable layers you explore geographically.

## Data and method

**Fee lands**: CRS Report R42346, *Federal Land Ownership: Overview and Data* (Feb. 21, 2020 version), **Table 2**: FY2018 acreage by state for five agencies---Bureau of Land Management, Forest Service, Fish & Wildlife Service, National Park Service, and Department of Defense (DOD as of 9/30/2017).

**Trust lands** are the Bureau of Indian Affairs' American Indian and Alaska Native Land Area Representations (LAR). Several LAR polygons cross state lines, so trust acreage is apportioned to each state by area sampling: the polygon is intersected against state boundaries and acreage assigned in proportion to the area falling in each state, rather than credited whole to one state. 
:> [!WARNING]
> 
**Easements** are US Fish & Wildlife Service National Realty Tracts filtered to easement interest (`INTTYPE1 = 'E'`), the same source as the companion map's easement layer. Each tract is assigned to a state by the point-in-polygon location of its centroid. Acreage is the deeded figure (`DOCACRES`).

**Percent of state land is computed in the browser**, dividing each interest's acreage by the state's Census-vintage land area (see the data file's `source` block for the exact vintage).

**Easements are a property interest, not ownership.** Every acre in the easement segment of each bar is still privately owned, farmed, and taxed: the United States holds a permanent, recorded right in it, but not title. Counting it as federal "interest" alongside fee title and trust land my claim about the reach of federal land policy on the Plains; it is not a claim that the Dakotas are one-third federally *owned*.

**The cumulative easement curve** (right column of the detail panel, after clicking a state) plots dated tracts as a running total by year. Tracts with no recorded date are counted in the state total and the table, but are not placed on the curve, since they can't be dated; the count of undated tracts is noted beneath the chart when it is nonzero.

See also the [regional cosponsorship trends](/atlas/regional-trends/) atlas instrument for how the delegations governing these states spend their legislative attention on public-lands policy.
