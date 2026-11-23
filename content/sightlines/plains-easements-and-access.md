---
title: "Easements and Access on the Plains"
date: 2026-11-23
lede: "Federal easements kept Plains land private and closed. State walk-in leases open some of it to the public. The two instruments, side by side."
weight: 18
draft: true
viz: map
themes: [public-lands]
regions: [northern-plains, southern-plains, rocky-mountain]
map:
  renderer: d3
  mode: timeline
  src: /data/federal-interests-easements.json
  statessrc: /data/states.json
  focus: ["38", "46", "31", "20", "30", "56", "08"]   # ND, SD, NE, KS, MT, WY, CO
  focuslabel: "ND, SD, NE, KS, MT, WY, and CO"
  start: 1930
  color: "#1f6b66"
  infotitle: "Federal easements and state walk-in leases"
  areas:
    src: /data/hunting-access.json
    color: "#d4a017"
    label: "Walk-in hunting leases, 2026–27 (ND PLOTS, KS WIHA)"
---

<!-- EXPLORATORY DRAFT (branch explore/hunting-access). Prose is the author's.
Editorial cues:
- Base map is "Federal Easements on the Northern Plains" with the frame widened to NE and KS.
- Dots = FWS easements by acquisition year (slider). Gold fill = state walk-in leases, a single
  2026–27 snapshot; they do NOT move with the slider.
- Only ND and KS walk-in data are loaded. SD Walk-In Areas, NE Open Fields and Waters, MT Block
  Management, WY Walk-In Areas, CO Walk-In Access are absent — gaps in the fill are gaps in the data.
- Easement ≠ access: the teal dots are private and closed; the gold is private and open.
-->
