---
title: "Cosponsorship on Plains Grasslands Bills"
date: 2026-05-22
lede: "A second cosponsorship network — focused on Plains grasslands politics: Conservation Reserve Program modifications, sodsaver / native-sod protection, lesser prairie chicken listing fights, bison restoration, and the North American Grasslands Conservation Act. Same dataset shape as the sagebrush-rebellion network; different coalition."
weight: 9
draft: false
viz: network
themes: [public-lands, rural-economy]
regions: [national, northern-plains, southern-plains]
network:
  src: /data/grasslands-cosponsorship-network.json
  infotitle: "Grasslands cosponsorship"
  infoprompt: "Hover a node for party, state, and bills cosponsored. Click a legislator to open their full bill list."
  legendtitle: "Party"
  chargestrength: -180
  linkdistance: 155
  palette:
    republican:  "#a94b2b"
    democrat:    "#1f2a44"
    independent: "#4a5640"
    other:       "#6b7a5a"
  labels:
    republican:  "Republican"
    democrat:    "Democrat"
    independent: "Independent"
    other:       "Other / unaffiliated"
---

> A draft sister network to the [federal-public-lands cosponsorship view](../cosponsorship-network/). The bill set will grow as more standalone grasslands legislation is added.

This graph plots seventeen standalone bills introduced in the 103rd through 119th Congresses (1994–2025) on grasslands and Plains-conservation topics: the Tallgrass Prairie National Preserve, the Conservation Reserve Program, sodsaver and native-sod protection, the lesser prairie chicken (both protection and delisting bills), the North American Grasslands Conservation Act, bison restoration, and a couple of boundary modifications affecting the National Grasslands. Legislators appear as nodes if they cosponsored at least **two** bills in the set; edges connect pairs who shared cosponsorships on **two or more** bills.

The result is small but telling. Fifteen legislators meet the threshold across the seventeen bills. The split is two Democrats to eleven Republicans — fewer Democrats than the [sagebrush cosponsorship network](../cosponsorship-network/) at first read, but the two Democrats at the top of the bill-count list (**Klobuchar of Minnesota and Bennet of Colorado**) sit alongside **Thune of South Dakota** as the most-active cosponsors. That bipartisan top is the network's structural story.

## How to read this graph

- **The Klobuchar–Thune axis** drives the network. Both legislators cosponsor four bills in the set; almost all of those are the sodsaver / Prairie Protection / American Prairie Conservation Act re-introductions. The pair has run the same bill across three Congresses (113th S. 801, 115th S. 1913, 118th S. 1539) — a sustained bipartisan Plains-conservation thread that has no parallel in the sagebrush network.
- **The lesser-prairie-chicken delisting coalition** is the largest single sub-cluster: Plains-state Republicans (Lucas, Bridenstine, Cole — all OK; Flores, Neugebauer, Thornberry — all TX; Huelskamp — KS; Tipton — CO; Mullin — OK; Pearce — NM) cosponsoring two LPC delisting/voluntary-recovery bills.
- **Bennet of Colorado** sits as a Democratic node connecting to both the Plains-Republican LPC cluster (through shared cosponsorship of CRP and grasslands bills) and to the Klobuchar–Thune sodsaver axis. He is the most-connected single Democrat in the graph.

## How this differs from the sagebrush network

Comparing the two networks side-by-side surfaces a contrast in Plains conservation politics versus Intermountain-West transfer politics:

- **Bipartisanship is the norm here, the exception there.** The sagebrush network is ~95% Republican; this one is meaningfully Democratic at the top.
- **Plains-state geography.** Senators and representatives from SD, MN, OK, KS, TX, NE dominate this network — the Plains states with substantial private grassland and CRP enrollment. The sagebrush network skews Intermountain (NV, UT, WY, ID).
- **Different policy verbs.** Sagebrush legislation says *transfer*, *disposal*, *Antiquities-Act-reform*. Grasslands legislation says *conserve*, *enroll*, *easement*, *recovery*, *modernize*. Different politics live behind each verb.

One bill appears in **both** networks: **S. 273 (115th, Risch) Greater Sage-Grouse Protection Act**. Sage-grouse straddles the two stories — both a Plains/grasslands species concern and a sagebrush-coalition flashpoint. Treating it as a member of both networks is the honest call.

## Bills in the set

Years are the two-year span of each Congress in which the bill was introduced.

| Congress | Years | Bill | Short label |
|---|:---:|---|---|
| 103rd | 1993–94 | S. 2412   | Tallgrass Prairie National Preserve Act (Kassebaum) |
| 104th | 1995–96 | S. 695    | Tallgrass Prairie National Preserve Act (Kassebaum); → Pub.L. 104-333 |
| 111th | 2009–10 | H.R. 5153 | Minuteman Missile NHS Boundary Modification |
| 112th | 2011–12 | S. 1478   | Minuteman Missile NHS Boundary Modification |
| 113th | 2013–14 | S. 801    | Prairie Protection Act (Thune-Klobuchar) |
| 113th | 2013–14 | H.R. 4866 | Lesser Prairie Chicken Voluntary Recovery Act |
| 114th | 2015–16 | H.R. 659  | Lesser Prairie Chicken Voluntary Recovery Act |
| 115th | 2017–18 | S. 273    | Greater Sage-Grouse Protection Act (Risch) |
| 115th | 2017–18 | S. 1913   | American Prairie Conservation Act |
| 117th | 2021–22 | S. 4639   | North American Grasslands Conservation Act |
| 118th | 2023–24 | S. 1539   | American Prairie Conservation Act |
| 118th | 2023–24 | H.R. 4017 | Conservation Reserve Program Improvement Act |
| 118th | 2023–24 | H.R. 8270 | Conservation Reserve Program Modernization Act |
| 118th | 2023–24 | S. 5115   | Tribal Heritage & American Bison Restoration Act |
| 118th | 2023–24 | H.R. 9695 | Tribal Heritage & American Bison Restoration Act (House) |
| 118th | 2023–24 | H.R. 9945 | North American Grasslands Conservation Act |
| 119th | 2025–26 | H.R. 587  | Lesser Prairie-Chicken delisting (Mann) |

## Data and method

- **Source**: GPO `govinfo.gov` BILLSTATUS bulk-XML for the 108th Congress forward (no API key). Pre-108th would use the Congress.gov v3 API; this network's earliest bill is from the 111th, so the entire set runs through govinfo.
- **Curated set**: fifteen standalone bills selected as the grasslands counterpart to the federal-public-lands set (which lives in the [sister network](../cosponsorship-network/)). Farm Bill omnibus reauthorizations are excluded — cosponsorship of a 1,000-page omnibus carries almost no grassland-specific signal — even though that's where most legislative action on grassland conservation actually lands. This network reads as a "where does standalone grasslands action live" view, not a comprehensive policy outcome view.
- **Nodes**: legislators who cosponsored at least **two** bills in the set, or who primary-sponsored any bill. Primary sponsors are always retained.
- **Edges**: pairs of legislators who cosponsored at least **two** of the same bills.
- **Sizing**: circle area is sqrt-proportional to bill count.
- **Pipeline script**: [`scripts/build_grasslands_cosponsorship_network.py`](https://github.com/hepplerj/sbr-website/blob/main/scripts/build_grasslands_cosponsorship_network.py).

## Companion view

- **[Cosponsorship on Federal Public-Lands Bills](../cosponsorship-network/)** — the sagebrush-rebellion-focused network, ~57 bills across the 96th–118th Congresses (1979–2024). Different bills, different coalition; the two graphs together describe two distinct modes of western-lands politics.
