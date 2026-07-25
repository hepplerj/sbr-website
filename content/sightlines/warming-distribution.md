---
title: "The Coldest Year Now Beats the Warmest Year Then"
date: 2026-06-09
lede: "A century of Southwest temperature, one decade per row. The whole distribution slides right — recent decades have no cold years at all."
weight: 30
draft: true
viz: chart
themes: [climate, public-lands, dust-bowl]
regions: [national, southwest]
chart:
  src: /data/climate-space.json
  type: decade-strips
  region: southwest
  field: temp
  timefield: year
  valueunit: "°F"
  xlabel: "Temperature anomaly (°F)"
  title: "Southwest annual temperature anomaly by decade, 1895–2024"
  infotitle: "Temperature distribution"
  infoprompt: "Hover a dot for that year's anomaly; the heavy tick is the decade median."
  hideidlecard: true
---

> **Draft.** Prototype #2 of three alternatives to the warming stripes.
> Data is the NOAA Southwest region annual temperature anomaly against
> the 1901–2000 baseline. Prose is a working draft. Follow the
> [changelog](/updates/).

<!--
  SCAFFOLD — Jason to write the prose.

  Idea: stripes show the mean reddening; this shows the whole
  DISTRIBUTION sliding. Each row is a decade; each dot a year placed by
  its temperature anomaly; the heavy tick is the decade median. Read top
  to bottom and the cloud marches right — and the punchline is that the
  recent decades' coldest years sit to the right of the early decades'
  warmest. The range doesn't just shift; it clears the old range
  entirely. "Normal" is a moving target.

  Facts to verify against the data before asserting them in prose.

  Possible structure:
    ## Not the average — the whole spread
    ## When the ranges stop overlapping
    ## What "normal" stops meaning
-->

A warming average can hide inside a noisy record — a few hot years
dragging a mean upward. This chart asks a harder question of the same
data: has the whole range moved? Each row is a decade of Southwest
years, each dot placed by how far that year ran above or below the
twentieth-century norm.

*(Draft prose continues — see scaffold above.)*
