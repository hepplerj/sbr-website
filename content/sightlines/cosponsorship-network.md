---
title: "Cosponsorship on Federal Public-Lands Bills"
date: 2026-04-19
lede: "A network of legislators who cosponsored federal-public-lands legislation across the 96th through 118th Congresses (1979–2024). Nodes colored by party, sized by how many bills in the set each cosponsored."
weight: 8
draft: false
viz: network
themes: [public-lands, sagebrush-rebellion-1979]
regions: [national, northern-plains, southern-plains, intermountain-west, rocky-mountain, southwest, pacific-northwest, pacific-southwest]
network:
  src: /data/cosponsorship-network.json
  infotitle: "Cosponsorship network"
  infoprompt: "Hover a node for party, state, and bills cosponsored. Click a legislator to open their full bill list. Drag to rearrange."
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

> This is a draft network under active development. The bill set will grow as additional pre-2003 bills are compiled from historical records. Follow the [changelog](/updates/) for notices when this network changes.

Fifty-seven bills introduced in the 96th through 118th Congresses (1979–2024) on federal-public-lands matters — transfer of federal lands to states, disposal of "excess" federal acreage, Antiquities Act reform and rollback, grazing administration, monument-designation review, sage-grouse / ESA flexibility, wilderness-study-area release. Legislators appear as nodes if they cosponsored at least **two** bills in the set. Edges connect pairs who cosponsored **two or more** of the same bills.

246 legislators meet the threshold. 2,249 edges connect them. The graph is dense by design: it shows the full caucus across four decades.

**Click any legislator** to open a modal with their complete bill list from the dataset — sponsor versus cosponsor role, Congress, bill number, full title, and a link out to the Congress.gov page.

## What to read off the graph

- **Node size encodes bill count.** The 97th–104th bills significantly shift who is largest. Members who bridged the original Sagebrush Rebellion era into the Pombo/Bishop years — Don Young (R-AK), James Hansen (R-UT), and others who signed onto the recurring Rangelands Fee Act series — now emerge prominently alongside the post-2003 caucus.
- **The grazing thread is now visible.** The Public Rangelands Fee Act appeared in four consecutive Congresses (99th–102nd) with 28–43 cosponsors each time. Members who signed all four form a distinct cluster connecting the Reagan-era resistance to the current caucus.
- **The 104th Congress hub.** H.R. 2745 ("Restoration of Natural Resources Laws on Public Lands," 1995–96) carries 149 cosponsors — the largest single bill in the dataset by far. It creates a dense sub-graph representing the Contract with America–era legislative moment, the closest Congress came to a wholesale rollback of federal land law.
- **The core caucus persists across chairmanships.** Republicans who chaired the House Natural Resources Committee — Richard Pombo (108th–109th), Doc Hastings (112th–113th), Rob Bishop (114th–115th), Bruce Westerman (118th) — form a through-line. When the chair changed, the caucus's bills changed format but not its membership.
- **The partisan shape holds.** The overwhelming majority of nodes are Republican. Democrats present are almost entirely the "narrow grounds" pattern: individual cross-aisle sign-ons to specific bills with regional or procedural angles (grazing-fee reform, state-transfer provisions), not consistent caucus membership.

## What to read off the *absences*

- **The 105th–106th gap (1997–2002) remains.** The Chenoweth/Hansen years are partially captured through the 104th, but the late Clinton era is still thin. The Congress.gov API has the data; the limiting factor is identifying the right bills.
- **Senate representation is still uneven.** The Rangelands Fee Act series and the 104th disposal bills are all House bills. Senate caucus members from that era — and later ones like Heller, Gardner, and Daines — are under-represented relative to their actual legislative activity.

## What the graph does not say

Cosponsorship is *declared alignment*, not authorship or policy outcome. A legislator can cosponsor for regional signaling, caucus loyalty, constituent favor, or genuine commitment — and the graph cannot distinguish among them. None of the 57 bills in the set became law. The graph measures legislative *coordination* — who agreed to be seen cosponsoring transfer-friendly bills — which is a distinct and narrower measurement than policy power.

## Bills in the set

Fifty-seven bills, 96th–118th Congresses. Curated to represent the transfer, disposal, grazing, wilderness-release, and Antiquities-Act-reform lineage that sits in the Sagebrush-rebellion policy space. 96th–107th Congress bills are sourced from the Congress.gov API; 108th onward from GPO `govinfo.gov` BILLSTATUS.

| Congress | Bill | Short label |
|---|---|---|
| 96th | S. 1680 | Western Lands Distribution & Regional Equalization (Laxalt) |
| 96th | S. 2762 | Federal Lands Disposal — Nevada (Laxalt) |
| 97th | H.R. 3655 | Public Land Reform Act |
| 97th | S. 1245 | Public Land Reform Act (Senate) |
| 98th | H.R. 3305 | Disposal of Certain Federal Lands |
| 99th | H.R. 4713 | Public Rangelands Fee Act |
| 100th | H.R. 1481 | Public Rangelands Fee Act |
| 101st | H.R. 775 | Public Rangelands Fee Act |
| 102nd | H.R. 481 | Public Rangelands Fee Act |
| 102nd | H.R. 767 | State Threshold Federal Lands Transfer |
| 102nd | H.R. 944 | Fair Market Grazing for Public Rangelands Act |
| 103rd | H.R. 4157 | BLM Land Transfer to States |
| 104th | H.R. 676 | Free Market Grazing Fees Act |
| 104th | H.R. 1713 | Livestock Grazing Act |
| 104th | H.R. 1745 | Utah Public Lands Management Act |
| 104th | H.R. 2032 | BLM Land Transfer to States |
| 104th | H.R. 2745 | Restoration of Natural Resources Laws on Public Lands |
| 104th | H.R. 4242 | Antiquities Act Reform |
| 107th | H.R. 3808 | Consistent Public Land Laws Enforcement |
| 108th | H.R. 1153 | America's Wilderness Protection (Otter) |
| 108th | H.R. 2966 | Right-to-Ride Livestock on Federal Lands |
| 108th | H.R. 3324 | Voluntary Grazing Permit Buyout |
| 109th | H.R. 1370 | Federal Land Asset Inventory Reform (Pearce) |
| 109th | H.R. 3463 | Action Plan for Public Lands & Education (Bishop) |
| 109th | S. 781 | Right-to-Ride Livestock on Federal Land |
| 109th | S. 2569 | Action Plan for Public Lands & Education (Hatch) |
| 109th | H.R. 3824 | ESA Recovery Collaboration (Pombo) |
| 110th | H.R. 3614 | Action Plan for Public Lands & Education (Bishop) |
| 110th | S. 3133 | Responsible Ownership of Public Land |
| 110th | H.R. 6300 | Dona Ana County Rangeland Preservation (Pearce) |
| 111th | H.R. 5339 | Disposal of Excess Federal Lands (Chaffetz) |
| 112th | S. 635 | Disposal of Excess Federal Lands (Lee) |
| 112th | H.R. 1126 | Disposal of Excess Federal Lands (Chaffetz) |
| 112th | H.R. 1581 | Wilderness & Roadless Area Release (McCarthy) |
| 112th | S. 1087 | Wilderness & Roadless Area Release (Barrasso) |
| 113th | H.R. 1459 | Antiquities Act transparency (Bishop) |
| 113th | H.R. 2657 | Disposal of Excess Federal Lands (Chaffetz) |
| 114th | H.R. 5780 | Utah Public Lands Initiative (Bishop) |
| 114th | H.R. 3650 | State National Forest Management (Young) |
| 114th | H.R. 2316 | Wildlife Management Reform |
| 114th | S. 361 | Disposal of Excess Federal Lands (Lee) |
| 115th | H.R. 621 | Disposal of Excess Federal Lands (Chaffetz) |
| 115th | H.R. 622 | Local Enforcement for Local Lands (Chaffetz) |
| 115th | H.R. 2284 | National Monument Designation Transparency (Labrador) |
| 115th | H.R. 2230 | Grazing Improvement Act |
| 115th | H.R. 3990 | National Monument Creation & Protection (Bishop) |
| 115th | S. 132 | National Monument Designation Transparency (Crapo) |
| 115th | S. 273 | Greater Sage-Grouse Protection (Risch) |
| 116th | H.R. 3225 | Antiquities Act amendments |
| 116th | H.R. 1664 | National Monument CAP Act (Bishop) |
| 117th | H.R. 3113 | State Land Management |
| 117th | S. 1264 | Resiliency for Ranching (Barrasso) |
| 118th | H.R. 1435 | State Transfer Reaffirmation |
| 118th | H.R. 7430 | Public Lands in Public Hands (Zinke) |
| 118th | H.R. 5499 | Congressional Oversight of Antiquities Act |
| 118th | S. 2820 | Congressional Oversight of Antiquities Act (Lee) |
| 118th | S. 3322 | Ranching Without Red Tape (Barrasso) |

## Data and method

- **Source**: GPO `govinfo.gov` BILLSTATUS bulk data for 108th Congress onward (no auth required); Congress.gov API v3 for pre-108th bills (free key). Each bill's sponsor and cosponsor list (bioguide ID, name, party, state, district) fetched and parsed.
- **Coverage floor**: The 96th Congress (1979) is the current lower bound. The 97th–104th era (1981–1996) is now partially covered — disposal, grazing-fee, and Antiquities Act bills identified through the GovTrack subject-tag scan. The 105th–106th Congresses (1997–2002) remain sparse; filling them requires identifying the right bills through archival research.
- **Nodes**: legislators who appear on **two or more** bills, or who primary-sponsored any bill. Primary sponsors are always retained.
- **Edges**: pairs of kept legislators who cosponsored **two or more** of the same bills. Edge weight = count. Isolated nodes (no qualifying edges) are dropped.
- **Sizing**: circle *area* is sqrt-proportional to a legislator's bill count in the set.
- **Click behavior**: clicking a node opens a modal with the legislator's complete list of cosponsored bills in the set. Bill numbers link to Congress.gov.

## Companion views

- **[Bridging the Rebellions](../bridging-the-rebellions/)** — the movement-side network: ranchers, organizations, events. This chart shows the elected-official side of the same long story.
- **[The Bundy Family Network](../bundy-family/)** — the sample graph that demonstrates the visualization format at closer scale.

## Extensions

- **Senate expansion**: adding 4–5 more Senate bills from the 97th–104th and 108th–116th eras would pull missing caucus members into the graph (Heller, Gardner, Daines, and Senate-side Watt-era sponsors).
- **105th–106th gap**: the late Chenoweth/early Pombo era (1997–2002) remains thin. The Congress.gov API has the data; the limiting factor is identifying the right bills.
- **Weight edges by temporal proximity**: cosponsorships on bills in the same Congress indicate tighter alliance than cosponsorships spread across twenty years.
- **Committee-membership layer**: House Natural Resources and Senate Energy & Natural Resources memberships as a parallel edge type.
