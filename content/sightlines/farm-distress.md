---
title: "Two Ways to Lose a Farm, 1899–2024"
date: 2026-07-19
lede: "Foreclosures and bankruptcies on one clock. Each series goes silent exactly where the other carries the story — the gaps are the argument."
weight: 37
draft: true
viz: chart
themes: [farm-crisis, rural-economy]
regions: [national]
chart:
  src: /data/farm-distress.json
  type: small-multiples
  datapath: data
  xfield: year
  title: "Farm foreclosure and farmer-bankruptcy rates per 1,000 farms, 1899–2024"
  infotitle: "Farm distress"
  infoprompt: "Hover any year to read both panels. Grey bands mark years when nobody was counting."
  hideidlecard: true
  panels:
    - field: foreclosures
      label: "Foreclosures & defaults"
      color: rust
      unit: " per 1,000 farms"
      scale: 1
      format: "1f"
    - field: bankruptcies
      label: "Farmer bankruptcy filings"
      color: navy
      unit: " per 1,000 farms"
      scale: 1
      format: "2f"
---

<!-- EXPERIMENT — see plan/STATUS.md. Candidate replacement for (or
     companion to) the separate farm-foreclosures and farm-bankruptcies
     charts. If it graduates, decide whether the standalone pages stay.

     EDITORIAL SCAFFOLD — replace with your prose before publishing. -->

Two measures of losing a farm, on one clock, both per 1,000 farms. The top panel is the US Department of Agriculture's count of farms lost to foreclosure and related defaults, 1913–1981. The bottom is farmer bankruptcy filings, 1899–2024. Neither series covers the whole century — and the holes are not accidents.

<!-- Key observations to develop:

- **Same catastrophe, different registers.** In the 1920s–30s both
  panels rise together — but foreclosure is the dominant channel by an
  order of magnitude (38.8 per 1,000 in 1933 vs 0.9 bankruptcies per
  1,000). In the 1930s, losing the farm meant the sheriff's sale, not
  the bankruptcy court.

- **The gaps interlock.** The bankruptcy series has a hole exactly at
  1980–86 (farmer filings weren't separately tabulated before Chapter
  12), and the foreclosure series dies at 1981 (USDA stopped counting).
  The 1980s farm crisis — the worst rural downturn since the 1930s —
  falls almost entirely inside the years when nobody was counting
  either measure. The 1987 bankruptcy spike (3.1 per 1,000, the highest
  filing rate in the whole series) is the crisis surfacing in the only
  instrument still running.

- **Institutions decide what gets counted.** By the 1980s, moratoria,
  mediation, debt restructuring, and Chapter 12 itself routed distress
  away from the courthouse steps and into bankruptcy court and lender
  workouts. The two panels aren't two phenomena — they're one
  phenomenon passing between measurement regimes.

- Cross-links: /sightlines/farm-bankruptcies/ and
  /sightlines/farm-foreclosures/ for the single-series instruments
  (counts, tax sales, voluntary-sale views).
-->

## Data and method

- **Top panel**: USDA farm real estate transfer series (foreclosures, assignments, bankruptcies, and related defaults per 1,000 farms), 1913–1981, hand-transcribed from *Agricultural Statistics* annuals — full detail on the [foreclosures chart](/sightlines/farm-foreclosures/).
- **Bottom panel**: farmer bankruptcy filings per 1,000 farms, 1899–2024 — Stam's ERS compilation and US Courts Chapter 12 counts via Dinterman, as on the [bankruptcies chart](/sightlines/farm-bankruptcies/).
- **Grey bands** mark years with no data: before 1913 and after 1981 for foreclosures (the series did not exist, then was discontinued); 1980–86 for bankruptcies (farmer filings were not separately tabulated until Chapter 12 took effect).
- Panels carry independent y-scales — the point is timing and coverage, not magnitude comparison across panels.
