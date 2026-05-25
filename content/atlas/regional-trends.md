---
title: "Regional Trends, 96th–119th Congress"
date: 2026-05-24
lede: "Twenty-four Congresses of regional cosponsorship activity (1979–2026), broken out by policy area and chamber. The same three regional delegations as the 117th profile, tracked across the entire Sagebrush-Rebellion era and everything after."
weight: 1
draft: false
atlas:
  mode: trends
  src: /data/atlas-regional-timeseries.json
  metric: permember
  chamber: both
  howto:
    - "**Hover** anywhere over a panel to see a dashed vertical guide-line at the nearest Congress. Small dots mark where the line crosses each region's series, and the year span shows at the top of the line."
    - "**Click** a panel to pin the position. A solid dark line stays at the pinned Congress; hovering elsewhere still shows the dashed preview without losing your pin. Click the same spot again or use the **Unpin** button to dismiss."
    - "A **detail panel** opens below the charts once you pin. The left column shows that policy area's value, bill count, and party breakdown for each of the three regions. Click any region row to populate the right column with that delegation's members."
    - "The **right column** is a member list with name search and state-filter chips — useful for asking 'who in the Plains delegation drove the 118th Energy spike?' or 'which California members didn't sign onto Animals bills?'"
    - "**Region legend chips** above the charts dim the other two series when clicked, letting you focus on one delegation's trajectory across all six panels."
    - "**Metric** controls the y-axis: per-member (delegation-size-adjusted), share-of-region (% of total cosponsorships), or raw total."
    - "**Chamber** scopes to Both / House / Senate. Senators cosponsor 3–5× more bills per member, so Senate-only views make the signal sharper."
---

This view plots cosponsorship attention across six CRS policy areas and twenty-four Congresses — the 96th (1979–80, the founding Sagebrush Rebellion Congress, when Paul Laxalt was introducing his Nevada-disposal bills) through the 119th (2025–26, in progress).

Each panel is one policy area, with three lines — one per regional delegation. The patterns to look for: stability vs volatility, narrowing vs widening regional gaps, the historical inflection points where Congressional attention shifts.

The three regional delegations:

- **Great Plains** — MT, WY, CO, ND, SD, NE, KS. Dryland farming, ranching, oil-gas-wind, and the Conservation Reserve Program country.
- **American West** — AK, AZ, CA, HI, ID, NM, NV, OR, UT, WA. The federal-land West; where the Sagebrush Rebellion's transfer politics live.
- **Midwest** — IA, IL, IN, MI, MN, MO, OH, WI. Almost no federal-land exposure; included as the *contrast case* — what does an agriculture-heavy region without federal-land politics actually cosponsor?

The unit of analysis is the delegation as a political-economic actor, not the geographic region — which is why this taxonomy differs from the eight-region one used by the [sightlines](/sightlines/) filter. The atlas asks "what does this delegation spend its cosponsorship attention on?" — a different question than "what content is geographically relevant to this region?"

## What stays stable across the period

- **Animals legislation skews West throughout.** The American West delegation cosponsors animal-welfare and species-conservation bills at the highest per-member rate in *every* Congress in the series. The Plains stay lowest in every Congress. This is not a recent artifact — it has held since the 96th and reflects the geography of the West's urban-coastal members (CA, OR, WA delegations driving the signal) versus the production-ag Plains.
- **Public Lands tracks the federal-land map.** The West always leads in *Public Lands & Natural Resources* cosponsorships per member; the Midwest is always lowest. The Plains sit between, closer to the West than the Midwest — consistent with their substantial BLM, National Grassland, and Forest Service exposure.

## What changes meaningfully

- **The Plains and West have converged on Public Lands.** In the 96th Congress (1979–80), the West cosponsored Public Lands bills at roughly **twice** the Plains per-member rate (10.6 vs 5.0) — the West was the politically charged federal-land theater in the Sagebrush Rebellion's founding years. By the 119th, the gap has compressed to essentially parity (Plains 10.8, West 11.2). Two long arcs: the West has cooled on Public Lands attention since its late-1980s peak, and the Plains have substantially picked up engagement, especially since the 112th.
- **The late-1980s Antiquities-Act surge.** The 100th–102nd Congresses (1987–92) show a major spike across all three regions in Public Lands cosponsorship — that's the wilderness/Antiquities-Act/FLPMA-implementation debate at full volume. After the 102nd, activity settles into a lower band before the contemporary plateau.
- **The 104th dip.** The 1995–96 Republican Revolution Congress shows lower Public Lands cosponsorship across all three regions — the Newt-era focus was elsewhere (budget, entitlement reform, Contract with America), and federal-land legislative volume contracted accordingly.
- **Energy is the most volatile column.** A spike in the 110th Congress (2007–08, peak oil prices + early climate-bill activity) sees all three regions cosponsor at 10+ bills per member. Activity then collapses in 113th–115th (no major energy package moving), then surges again in the 117th–118th around the Inflation Reduction Act. In the **118th, the Plains delegation actually edged out the West** on per-member Energy cosponsorships (10.5 vs 9.5) — wind, ethanol, and the IRA's rural-energy provisions concentrated activity in the Plains delegation more than the Intermountain-West delegation.
- **Agriculture spikes on Farm Bill cycles.** Look for periodic surges every 4–6 years tracking Farm Bill reauthorizations (1981, 1985, 1990, 1996, 2002, 2008, 2014, 2018, 2023). The 118th Congress (2023–24) shows the largest surge in the series — roughly 15–19 cosponsorships per member across all three regions. Even at peak, the per-member spread between Plains/West/Midwest stays small, supporting the 117th-snapshot finding that Agriculture is the least regionally-distinctive of the surfaced areas.

## The chamber view

Toggle to **Senate only** to see a much sharper version of the regional contrast: Senators cosponsor 3–5× more bills per member than House members, so the Senate signal is louder. For the Plains, where the chamber mix is dominated by Senators (14 of 33 members in the 117th, vs 91 of 109 in the rest-West being House), this also corrects for the structural undercount that "Both chambers" produces.

The **House only** view is the inverse: more members, lower per-member counts, but a fairer comparison across regions since House delegations scale with population.

## A note on the 119th

The 119th Congress is still in session as of this build. Cosponsorship counts will continue to accumulate; treat the rightmost data point in each panel as a partial-year reading. Re-run `make atlas-regional` to refresh.

## Data and method

This series uses two data sources, dispatched on Congress number:

- **108th and later (2003+)**: GPO `govinfo.gov` BILLSTATUS bulk-data ZIPs, one per chamber-type per Congress. Keyless, fast (~50MB/Congress), parsed locally.
- **96th–107th (1979–2002)**: `api.congress.gov` v3 JSON API. Each bill needs a detail fetch (for policyArea + sponsor) and a conditional cosponsor fetch. All responses cached to `scripts/.cache/atlas/cgapi/` for resumability — a full legacy backfill is ~186k API calls and takes several hours throttled. Once cached, subsequent runs are local-only.

The same regional and policy-area schema applies to both eras. The `byChamber` and `byParty` breakdowns are computed at build time and shipped in `atlas-regional-timeseries.json` (~120 KB for 24 Congresses).

The **per-member metric** divides cosponsorships by delegation size for *that Congress only* — accounting for delegation turnover. When you switch chamber to House or Senate, the divisor narrows to just that chamber's members from the region.

The 96th Congress (1979–80) is the institutional floor for this metric. House cosponsorship was rule-prohibited until 1967 and cosponsor counts were capped at 25 per bill until 1979. Pre-96th cosponsorship data exists but isn't comparable — different institutional rules produce different selection signals. Extending the series further back would require either using a sponsorship-only metric (different question) or accepting the institutional discontinuity.

**Pipeline script**: [`scripts/build_atlas_regional.py`](https://github.com/hepplerj/sbr-website/blob/main/scripts/build_atlas_regional.py).
