---
title: "Hot and Dry, Together"
date: 2026-06-09
lede: "Every year in the Southwest since 1895, lit up when it ran both hotter and drier than the twentieth-century norm. The compound years cluster, hard, after 2000."
weight: 32
draft: true
viz: chart
themes: [climate, public-lands, sagebrush-rebellion-1979]
regions: [national, southwest]
chart:
  src: /data/climate-space.json
  type: compound
  region: southwest
  xfield: temp
  yfield: precip
  timefield: year
  title: "Southwest years that ran both hot and dry, 1895–2024"
  infotitle: "Hot and dry"
  infoprompt: "Hover a year for its temperature and precipitation anomaly."
  hideidlecard: true
---

> **Draft.** Prototype #3 of three alternatives to the warming stripes.
> A "hot-and-dry" year here is one that ran both warmer (positive
> temperature anomaly) and drier (negative precipitation anomaly) than
> the 1901–2000 baseline for the NOAA Southwest region. Prose is a
> working draft. Follow the [changelog](/updates/).

<!--
  SCAFFOLD — Jason to write the prose.

  Idea: warming and drying are usually charted separately. The danger is
  the COMPOUND year — hot AND dry at once, the combination that primes
  megadrought and megafire. This barcode lights up only those years.
  Read left to right: scattered through the early century, then a dense
  block after ~2000. The threshold here is simple (temp>0 and precip<0
  vs the century baseline); a stricter definition (e.g. top-third hot,
  bottom-third dry) would sharpen the recent cluster further.

  Tie to [A Burning West](/sightlines/wildfire/): the bold years here
  should line up with the worst fire years there.

  Possible structure:
    ## One bar per year
    ## The years that were both
    ## Why "both" is the dangerous case
-->

Warming is one line; drying is another; the West usually meets them one
at a time. This chart isolates the years it met them together — every
Southwest year since 1895 drawn as a single bar, dark only when that
year ran both hotter and drier than the twentieth-century norm.

*(Draft prose continues — see scaffold above.)*
