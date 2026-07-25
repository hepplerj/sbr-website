---
title: "Four Roads Out of the Twentieth Century"
date: 2026-06-09
lede: "A century of Western climate as four decade-by-decade drift paths — temperature against precipitation, one per region. Three march into the hot-dry corner. The Northern Plains takes a different road."
weight: 31
draft: true
viz: chart
themes: [climate, public-lands, sagebrush-rebellion-1979]
regions: [national, southwest, intermountain-west, northern-plains, pacific-northwest]
chart:
  src: /data/climate-space.json
  type: trajectory
  xfield: temp
  yfield: precip
  timefield: year
  title: "Western climate space: temperature vs. precipitation anomaly by region, 1895–2024"
  infotitle: "Climate space"
  infoprompt: "Hover a region's decade marker for its temperature and precipitation anomaly."
  hideidlecard: true
  palette:
    southwest: "#a94b2b"
    west: "#c98a3a"
    northwest: "#2f6e8e"
    northern-rockies-plains: "#5a7a4a"
  quadrants:
    - { x: 1, y: -1, label: "Warmer · drier" }
    - { x: -1, y: 1, label: "Cooler · wetter" }
    - { x: 1, y: 1, label: "Warmer · wetter" }
    - { x: -1, y: -1, label: "Cooler · drier" }
---

> **Draft.** Prototype of an alternative to the warming-stripes chart.
> Data is the four NOAA Western climate regions, temperature and
> precipitation anomalies against the 1901–2000 baseline. The prose
> below is a working draft. Follow the [changelog](/updates/) for when
> this leaves draft.

<!--
  SCAFFOLD — Jason to write the prose. Per the AI bright line, the
  analysis is human-authored.

  Why this chart beside the warming stripes: stripes flatten everything
  but temperature, and treat "the West" as one place. This plots two
  variables at once, per region, and the point is the DIVERGENCE.

  Each path connects a region's decade averages in order; the hollow
  ring is the earliest decade, the filled dot + label the most recent.
  Every region warms hard (all four end well right of center). But they
  split on water:

  Facts the data surfaces (NOAA regions, recent = 2000s–2020s avg vs
  1901–2000):
    - Southwest: +2.0°F, −0.95 in  → deep in the hot-dry corner.
    - West (CA/NV): +1.9°F, −1.02 in → driest endpoint.
    - Northwest: +1.5°F, −0.83 in → also hot-dry.
    - Northern Rockies & Plains: +1.7°F, +0.39 in → warms hard but
      stays WET. It arrows right, not down.
    - So "the West" is not one climate. The canyon-country Southwest and
      the Northern Plains — Jason's two poles — are on different roads.

  Possible structure:
    ## Reading a climate as a path
    ## Everyone warms
    ## Three regions turn dry — one doesn't
    ## Why the divergence matters for the politics
-->

Most climate charts show one number moving through time, and treat the
West as a single place. This one does neither. Each line is a region,
drawn by connecting its decade-average climate in order — temperature
left to right, precipitation bottom to top. Every road runs rightward;
they all warm. Where they part company is on water.

*(Draft prose continues — see scaffold above.)*
