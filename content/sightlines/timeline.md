---
title: "A Federal Public-Lands Timeline, 1872–2024"
date: 2026-04-19
lede: "Thirty events across four lanes — land-managing agencies, statutes, presidential actions, and rebellion episodes — laid out on a single horizontal chronology. Orientation material for readers coming fresh to the history."
weight: 2
draft: false
viz: chart
themes: [public-lands, sagebrush-rebellion-1979, bankhead-jones, malheur, bunkerville, dust-bowl]
regions: [national, great-plains, intermountain-west, pacific]
chart:
  src: /data/timeline.json
  type: timeline
  datapath: events
  title: "Federal public-lands chronology, 1872–2024"
  infotitle: "Chronology"
  infoprompt: "Hover any event marker for year, title, and a one-sentence description. Categories are color-coded by lane."
---

## How to read this

Four lanes, color-coded, sharing one 152-year timeline:

- **Land agencies** (sage) — creation of the federal bodies that manage public land. The U.S. Forest Service (1905), National Park Service (1916), and Bureau of Land Management (1946) are the three most consequential for the sagebrush-rebellion story.
- **Statutes** (navy) — the laws that define the legal framework. The Antiquities Act (1906), Taylor Grazing Act (1934), Wilderness Act (1964), and the Federal Land Policy and Management Act or FLPMA (1976) are the load-bearing four.
- **Proclamations** (rust) — presidential or secretarial actions under existing authority: national monument designations, secretarial appointments, monument reductions and restorations.
- **Sagebrush rebellions** (gold) — movement episodes from the 1946–48 "first Sagebrush Rebellion" forward. The post-WWII livestock-industry campaign against BLM grazing cuts, Nevada AB 413 (1979), Wise Use conference (1988), Nye County bulldozer incident (1994), Oath Keepers founding (2009), Utah HB 148 (2012), Bunkerville (2014), and Malheur (2016) are the markers.

Hover a marker for its one-sentence description. The goal is orientation, not argument — readers coming fresh to the history can scan the full chronology in one view before diving into any specific essay or sightline.

## Why this belongs in the project

Federal public-lands policy rests on institutional structures that are often taken for granted by people already inside the field: that BLM is not the same as the Forest Service, that the Antiquities Act does one thing and the Wilderness Act does another, that FLPMA's 1976 retention clause is the exact premise the 1979 Sagebrush Rebellion rejected. Without that context, the later rebellion episodes can look like isolated incidents rather than a recurring argument against a specific legal architecture.

The timeline is an appendix — reference material, not an interpretive essay. Facts that inform reading the narrative: dates are uncontested, agency histories are well documented, and the short descriptions stick to what the statute or agency does rather than what it means. Interpretation lives in the [narrative](/narrative/); the timeline is the scaffolding against which those essays can be read.

## What the lanes reveal when read together

Four patterns are worth surfacing:

1. **The 1934 cluster**. In a single year Congress passed the Taylor Grazing Act (ending the open range), the Interior Department created the Grazing Service (first agency specifically for non-forest, non-park federal land), and Roosevelt expanded the New Deal's relief architecture that would produce the 1937 Bankhead-Jones Act. Three simultaneous entries into the "Taylor Grazing era" explain why the sagebrush rebels date their grievance to 1934, not 1979.
2. **The "first Sagebrush Rebellion," 1946–48**. The 1979 Nevada AB 413 push is typically treated as the movement's origin, but the same political argument was tried — and defeated — thirty years earlier. After the BLM's creation in 1946 and its postwar grazing-cut program, the livestock lobby organized through Senator Pat McCarran's (D-NV) Senate hearings to push for privatization. Bernard DeVoto's *Harper's* journalism helped kill the transfer effort. The 1979 rebellion was self-consciously a revival of this episode — rebels knew the history they were invoking.
3. **The 1964–1976 institutional buildout**. Wilderness Act, NEPA, Endangered Species Act, FLPMA. Four statutes in twelve years that collectively built the environmental-review and preservation architecture the Wise Use movement and the post-2000 sagebrush caucus have spent forty years trying to unwind.
4. **The 2014–2024 proclamation cycle**. Four entries in the proclamation lane within a decade — Bears Ears designated, Bears Ears reduced, Bears Ears restored, Avi Kwa Ame + Baaj Nwaavjo I'tah Kukveni. No other ten-year window in the Antiquities Act's 118-year history has this density. That density is itself a historical fact worth noticing.

## Sources

- Congressional Research Service, *Federal Land Ownership: Overview and Data* (R42346); *The Antiquities Act* (R41330); *Federal Land Policy and Management Act* (RL34273).
- National Park Service, USDA Forest Service, Bureau of Land Management, and U.S. Fish & Wildlife Service official histories.
- R. McGreggor Cawley, *Federal Land, Western Anger* (1993); James R. Skillen, *This Land Is My Land* (2020); and the other works in this project's [bibliography](/sources/).

## Extensions

- **Events**: straightforward data-entry. The `EVENTS` list in [`scripts/build_timeline.py`](https://github.com/hepplerj/sbr-website/blob/main/scripts/build_timeline.py) is the single source of truth; add a tuple and rerun `make timeline`.
- **Lanes**: a fifth lane for cultural / media milestones (Abbey's *The Monkey Wrench Gang* 1975, Boyle's *Drop City* 2003, the Hammond fire that triggered Malheur) would surface the parallel cultural chronology.
- **Per-event links**: clickable markers that jump to the relevant sightline or narrative essay would turn the timeline into a site-wide index.
