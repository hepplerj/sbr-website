---
title: "A Burning West"
date: 2026-06-09
lede: "U.S. wildland fires and acres burned since 1983. The number of fires has barely moved; the acreage they consume has more than doubled. The fires aren't more numerous — they're bigger."
weight: 33
draft: true
viz: chart
themes: [climate, public-lands, rural-economy]
regions: [national]
chart:
  src: /data/wildfire.json
  type: small-multiples
  datapath: data
  xfield: year
  title: "U.S. wildland fires and acres burned, 1983–2025"
  infotitle: "Wildfire"
  infoprompt: "Hover any year to read both panels at once."
  hideidlecard: true
  panels:
    - field: acres
      label: "Acres burned"
      color: rust
      unit: "M acres"
      scale: 1000000
      format: "1f"
    - field: fires
      label: "Number of fires"
      color: navy
      unit: "k"
      scale: 1000
      format: "1f"
---

> **Draft.** Data is the National Interagency Fire Center's official
> 1983–2025 series; the prose below is a working draft. NIFC does not
> publish comparable figures before 1983, so the series starts there.
> Follow the [changelog](/updates/) for when this leaves draft.

<!--
  SCAFFOLD — Jason to write the prose. Headings + editorial cues + the
  facts the chart surfaces. Per the AI bright line, the analysis here is
  human-authored.

  The argument the two panels are built to support: the catastrophe is
  not that the West is catching fire more *often* — it's that each fire
  burns far more land. That divergence is the visible downstream of the
  warming and drying charted in [A Century of Warming](/sightlines/temperature-history/)
  and [A Drying West](/sightlines/precipitation-history/), and it sits
  underneath the modern grievance that recasts federal land management
  (rather than climate) as the cause of megafires.

  Facts the data surfaces (NIFC, 1983–2025):
    - Acres burned: ~2.7M/yr average in 1983–1992 → ~7.1M/yr in
      2016–2025. Roughly a 2.6× increase.
    - Number of fires over the same span: ~63,000/yr then, ~63,000/yr
      now — essentially flat. (The two anomalously low counts in
      1983–84 reflect incomplete early reporting under the then-new
      tracking process.)
    - Three years cleared 10 million acres: 2015, 2017, and 2020 — all
      in the last decade.
    - The worst years cluster after 2000, overlapping the Western
      megadrought the climate sightlines chart.

  Possible structure:
    ## Fewer fires is not the good news it sounds like
    ## What the acreage panel shows
    ## Climate upstream, grievance downstream
    ## A note on the data (the 1983 floor; the 2004 NC gap)
-->

Two numbers, side by side. The bottom panel counts how many wildland
fires the United States recorded each year since 1983; the top panel
measures how much land they burned. The first line is nearly flat. The
second is not.

*(Draft prose continues — see scaffold above.)*
