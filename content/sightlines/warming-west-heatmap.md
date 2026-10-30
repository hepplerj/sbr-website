---
title: "The Warming West, State by State"
date: 2026-06-09
lede: "Every Western and Plains state's annual temperature since 1895, stacked north to south. Read top to bottom and the whole grid reddens toward the right — the warming, and its latitude, made visible at once."
weight: 29
draft: true
viz: chart
themes: [climate, public-lands, dust-bowl]
regions: [national, northern-plains, southern-plains, rocky-mountain, intermountain-west, southwest, pacific-northwest]
chart:
  src: /data/states-temperature.json
  type: heatmap
  title: "Western & Plains state temperature anomalies by latitude, 1895–2024"
  infotitle: "State temperature"
  infoprompt: "Hover a cell for a state's anomaly in a given year."
  hideidlecard: true
  periods:
    - { start: 1930, end: 1940, label: "Dust Bowl",
        description: "Drought and heat across the southern Plains — the warm spike visible as a rust column early in the record." }
    - { start: 1950, end: 1957, label: "1950s drought",
        description: "A severe multi-year Southern Plains and Southwest drought, second only to the Dust Bowl in the instrumental record." }
    - { start: 2000, end: 2024, label: "Western megadrought",
        description: "The driest two-decade stretch in the Southwest in over a millennium — and the period when the grid reddens across nearly every row." }
---

> **Draft.** Modeled on a latitude-by-time view of global surface
> temperature, retargeted to the Western and Plains states. Data is NOAA
> Climate at a Glance statewide annual temperature anomalies against the
> 1901–2000 baseline; rows are ordered north → south by centroid
> latitude. Prose is a working draft. Follow the [changelog](/updates/).

<!--
  SCAFFOLD — Jason to write the prose. Per the AI bright line, the
  analysis is human-authored.

  The form: a Hovmöller-style heatmap — place on the vertical axis
  (states, north to south), time on the horizontal (1895–2024), color
  the temperature anomaly (blue cool, rust hot) on each cell. It shows
  in one image what a stack of line charts can't: the warming AND its
  spatial structure. The grid reddens to the right; the question the eye
  asks is whether the north reddens earlier or harder than the south.

  Facts to verify against the data:
    - Every row warms — recent (2020–2024) state averages run ~+1.9 to
      ~+2.6°F above the 1901–2000 baseline.
    - The northern, more continental states (the Dakotas, Montana) swing
      harder year to year — bigger blues and bigger reds — than the
      milder-latitude states.
    - The right edge (2000s on) is rust across nearly every row.

  Possible structure:
    ## Place on one axis, time on the other
    ## Reading the reddening
    ## Does the north warm differently than the south?
    ## A note on states as latitude bands
-->

A line chart shows one place warming. A stack of them shows several, but
makes you compare slopes by eye. This does something a line can't: it
puts place on one axis and time on the other and lets color carry the
temperature, so the warming and its geography appear together. Each row
is a state, stacked north to south; each column a year; each cell as blue
as that year was cool, as rust as it was hot.

*(Draft prose continues — see scaffold above.)*
