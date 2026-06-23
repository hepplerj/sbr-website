---
title: "National Monuments under the Antiquities Act"
date: 2026-06-09
lede: "Every significant national monument proclaimed since 1906, plotted by year and acreage and colored by the party of the designating president — and the reduce-then-restore saga of Bears Ears and Grand Staircase."
weight: 12
draft: true
viz: chart
themes: [public-lands, sagebrush-rebellion-1979, bundy-family]
regions: [national, intermountain-west, southwest, rocky-mountain]
chart:
  src: /data/national-monuments.json
  type: scatter
  datapath: monuments
  modspath: modifications
  xfield: year
  yfield: acres
  colorfield: party
  labelfield: name
  namefield: name
  labelthreshold: 1500000
  hideidlecard: true
  title: "National monuments under the Antiquities Act, 1906–2023 (acreage by year)"
  infotitle: "National monuments"
  infoprompt: "Hover a dot for details."
  palette:
    R: rust
    D: navy
  catlabels:
    R: "Republican president"
    D: "Democratic president"
  periods:
    - { start: 1979, end: 1989, label: "Sagebrush Rebellion",
        description: "The first organized wave of state-led resistance to federal land authority. Note that Reagan, its ally in the White House, designated no new monuments." }
    - { start: 2016, end: 2021, label: "Bears Ears fight",
        description: "Obama's 2016 designation, Trump's 2017 reduction, and Biden's 2021 restoration — the modern climax of the monument-as-overreach grievance." }
---

> **Draft.** The dataset is a curated selection of significant Antiquities
> Act designations, not the complete ~160-monument list, and acreages are
> approximate proclaimed figures pending verification against
> [CRS report R41330](https://crsreports.congress.gov/) and the
> proclamation texts. The visualization and the data scaffold are in
> place; the prose below is a working draft. Follow the
> [changelog](/updates/) for when this leaves draft.

<!--
  SCAFFOLD — Jason to write the prose. Headings + editorial cues + the
  facts the chart surfaces. Per the AI bright line, the analysis here is
  human-authored.

  The argument this chart is built to support: the Antiquities Act gives
  a president the power to lock up federal land *unilaterally* — no
  Congress, no local consent — which is the purest form of the
  federal-overreach grievance at the heart of every sagebrush rebellion.

  Facts the data surfaces (verify before asserting):
    - 50 significant designations plotted, 1906–2023; 35 by Democratic
      presidents, 15 by Republican.
    - Theodore Roosevelt's 1906–1909 burst — including Grand Canyon
      (~808k acres), the most aggressive early use, upheld by the
      Supreme Court in 1920.
    - Jackson Hole (FDR, 1943) was so contested that Wyoming's delegation
      amended the Antiquities Act in 1950 to bar further monuments in the
      state without Congress — the one geographic carve-out in the law.
    - Carter's December 1978 Alaska designations: 15 monuments, ~56M
      acres in a single day during the ANILCA standoff (the chart shows
      the major individual units stacked at 1978). Provoked the backlash
      that produced ANILCA (1980).
    - Reagan, the Sagebrush Rebellion's man in the White House, proclaimed
      ZERO new monuments — the visible gap in the 1980s is the point.
    - Clinton's Grand Staircase–Escalante (1996, ~1.7M acres), the first
      big BLM-managed monument, announced from the Arizona rim — a lasting
      Utah grievance — and his 2000–2001 wave of ~19 more.
    - Gold Butte (Obama, 2016) sits next to the Bundy ranch near
      Bunkerville, designated two years after the 2014 armed standoff.
    - Bears Ears (Obama 2016, 1.35M) → reduced ~85% by Trump (2017) →
      restored by Biden (2021). Grand Staircase cut roughly in half in
      2017, restored in 2021. The dashed connectors trace both sagas.

  Possible structure:
    ## A presidential power
    ## The partisan pattern (and the Reagan gap)
    ## The Western land monuments
    ## Bears Ears and the limits of the pen
    ## How to read this chart
-->

The Antiquities Act of 1906 gave the president a power Congress has
spent the century since trying, and failing, to take back: the ability
to set aside federal land as a national monument by proclamation alone.
This chart plots the significant designations across that century —
each dot a monument at the year it was proclaimed, its height the
acreage locked up, its color the party of the president who signed it.

*(Draft prose continues — see scaffold above.)*
