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

> This is a draft network under active development. The bill set will grow as additional bills are compiled from historical records. Follow the [changelog](/updates/) for notices when this network changes.

This graph charts fifty-seven bills introduced in the 96th through 118th Congresses (1979–2024) on federal-public-lands matters:transfer of federal lands to states, disposal of "excess" federal acreage, Antiquities Act reform and rollback, grazing administration, monument-designation review, sage-grouse / ESA flexibility, and wilderness study areas. Legislators appear as nodes if they cosponsored at least **two** bills in the set. Edges connect pairs who cosponsored **two or more** of the same bills. 246 legislators meet the threshold; 2,249 edges connect them.

**Click any legislator** to open a modal with their complete bill list from the dataset.

## How to read this graph

- **Node size encodes bill count.** Notably, Congressional members who bridged the 1979 Sagebrush Rebellion era into the Pombo/Bishop years later emerge prominently alongside the post-2003 caucus.
- **The 104th Congress cluster.** H.R. 2745 ("Restoration of Natural Resources Laws on Public Lands," 1995–96) carries 149 cosponsors---the largest single bill in the dataset by far. It creates a dense sub-graph representing the Contract with America–era legislative moment, the closest Congress came to a wholesale rollback of federal land law.
- **A partisan shape holds.** The overwhelming majority of nodes are Republicans. Democrats present are almost entirely focused on bills with regional or procedural angles (grazing fee reform, state transfer provisions) rather than consistent caucus membership.

There are any number of reasons a legislator would cosponsor a bill: for regional signaling, caucus loyalty, constituent favor, or genuine commitment. This graph makes no distinctions at that closer reading---rather, the network tries to demonstrate alignment and coordination. Notably, none of the 57 bills in this network became law. 

Nodes can be filtered by what I've identified as five bill types to isolate clusters of coalitions focused on specific land use issues by selecting a highlight to fade out nodes that don't match.

## Bills in the data

Fifty-seven bills across the 96th–118th Congresses appear in this dataset. The dataset is specifically curated to represent the transfer, disposal, grazing, wilderness areas, and Antiquities Act reform that I believe demonstrates a lineage in Sagebrush-style politics. Years shown are the two-year span of the Congress in which the bill was introduced.

| Congress | Years | Bill | Bill name |
|---|:---:|---|---:|
| 96th  | 1979–80  | S. 1680 | Western Lands Distribution & Regional Equalization (Laxalt) |
| 96th  | 1979–80  | S. 2762 | Federal Lands Disposal — Nevada (Laxalt) |
| 97th  | 1981–82  | H.R. 3655 | Public Land Reform Act |
| 97th  | 1981–82  | S. 1245 | Public Land Reform Act (Senate) |
| 98th  | 1983–84  | H.R. 3305 | Disposal of Certain Federal Lands |
| 99th  | 1985–86  | H.R. 4713 | Public Rangelands Fee Act |
| 100th | 1987–88  | H.R. 1481 | Public Rangelands Fee Act |
| 101st | 1989–90  | H.R. 775  | Public Rangelands Fee Act |
| 102nd | 1991–92  | H.R. 481  | Public Rangelands Fee Act |
| 102nd | 1991–92  | H.R. 767  | State Threshold Federal Lands Transfer |
| 102nd | 1991–92  | H.R. 944  | Fair Market Grazing for Public Rangelands Act |
| 103rd | 1993–94  | H.R. 4157 | BLM Land Transfer to States |
| 104th | 1995–96  | H.R. 676  | Free Market Grazing Fees Act |
| 104th | 1995–96  | H.R. 1713 | Livestock Grazing Act |
| 104th | 1995–96  | H.R. 1745 | Utah Public Lands Management Act |
| 104th | 1995–96  | H.R. 2032 | BLM Land Transfer to States |
| 104th | 1995–96  | H.R. 2745 | Restoration of Natural Resources Laws on Public Lands |
| 104th | 1995–96  | H.R. 4242 | Antiquities Act Reform |
| 107th | 2001–02  | H.R. 3808 | Consistent Public Land Laws Enforcement |
| 108th | 2003–04  | H.R. 1153 | America's Wilderness Protection (Otter) |
| 108th | 2003–04  | H.R. 2966 | Right-to-Ride Livestock on Federal Lands |
| 108th | 2003–04  | H.R. 3324 | Voluntary Grazing Permit Buyout |
| 109th | 2005–06  | H.R. 1370 | Federal Land Asset Inventory Reform (Pearce) |
| 109th | 2005–06  | H.R. 3463 | Action Plan for Public Lands & Education (Bishop) |
| 109th | 2005–06  | S. 781    | Right-to-Ride Livestock on Federal Land |
| 109th | 2005–06  | S. 2569   | Action Plan for Public Lands & Education (Hatch) |
| 109th | 2005–06  | H.R. 3824 | ESA Recovery Collaboration (Pombo) |
| 110th | 2007–08  | H.R. 3614 | Action Plan for Public Lands & Education (Bishop) |
| 110th | 2007–08  | S. 3133   | Responsible Ownership of Public Land |
| 110th | 2007–08  | H.R. 6300 | Dona Ana County Rangeland Preservation (Pearce) |
| 111th | 2009–10  | H.R. 5339 | Disposal of Excess Federal Lands (Chaffetz) |
| 112th | 2011–12  | S. 635    | Disposal of Excess Federal Lands (Lee) |
| 112th | 2011–12  | H.R. 1126 | Disposal of Excess Federal Lands (Chaffetz) |
| 112th | 2011–12  | H.R. 1581 | Wilderness & Roadless Area Release (McCarthy) |
| 112th | 2011–12  | S. 1087   | Wilderness & Roadless Area Release (Barrasso) |
| 113th | 2013–14  | H.R. 1459 | Antiquities Act transparency (Bishop) |
| 113th | 2013–14  | H.R. 2657 | Disposal of Excess Federal Lands (Chaffetz) |
| 114th | 2015–16  | H.R. 5780 | Utah Public Lands Initiative (Bishop) |
| 114th | 2015–16  | H.R. 3650 | State National Forest Management (Young) |
| 114th | 2015–16  | H.R. 2316 | Wildlife Management Reform |
| 114th | 2015–16  | S. 361    | Disposal of Excess Federal Lands (Lee) |
| 115th | 2017–18  | H.R. 621  | Disposal of Excess Federal Lands (Chaffetz) |
| 115th | 2017–18  | H.R. 622  | Local Enforcement for Local Lands (Chaffetz) |
| 115th | 2017–18  | H.R. 2284 | National Monument Designation Transparency (Labrador) |
| 115th | 2017–18  | H.R. 2230 | Grazing Improvement Act |
| 115th | 2017–18  | H.R. 3990 | National Monument Creation & Protection (Bishop) |
| 115th | 2017–18  | S. 132    | National Monument Designation Transparency (Crapo) |
| 115th | 2017–18  | S. 273    | Greater Sage-Grouse Protection (Risch) |
| 116th | 2019–20  | H.R. 3225 | Antiquities Act amendments |
| 116th | 2019–20  | H.R. 1664 | National Monument CAP Act (Bishop) |
| 117th | 2021–22  | H.R. 3113 | State Land Management |
| 117th | 2021–22  | S. 1264   | Resiliency for Ranching (Barrasso) |
| 118th | 2023–24  | H.R. 1435 | State Transfer Reaffirmation |
| 118th | 2023–24  | H.R. 7430 | Public Lands in Public Hands (Zinke) |
| 118th | 2023–24  | H.R. 5499 | Congressional Oversight of Antiquities Act |
| 118th | 2023–24  | S. 2820   | Congressional Oversight of Antiquities Act (Lee) |
| 118th | 2023–24  | S. 3322   | Ranching Without Red Tape (Barrasso) |

## Data and method

- **Source**: GPO `govinfo.gov` BILLSTATUS bulk data for 108th Congress onward; Congress.gov API v3 for pre-108th bills. Each bill's sponsor and cosponsor list (bioguide ID, name, party, state, district) fetched and parsed.
- **Coverage floor**: The data currently starts with the 96th Congress (1979). The 97th–104th era (1981–1996) is only partially covered: land disposal, grazing fees, and Antiquities Act bills were identified through the GovTrack subject-tag scan. The 105th–106th Congresses (1997–2002) are currently sparse and still requires identifying the right bills through archival research.
- **Nodes** are legislators who appear on **two or more** bills, or who primary-sponsored any bill. Primary sponsors are always retained.
- **Edges** are pairs of legislators who cosponsored **two or more** of the same bills. Any isolated nodes have been dropped from this network.
- **Sizing**: circle *area* is proportional to a legislator's bill count.
- **Click behavior**: clicking a node opens a modal with the legislator's complete list of cosponsored bills. Bill numbers link to Congress.gov.

