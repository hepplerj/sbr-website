---
title: "The Bundy Family Network"
date: 2026-04-17
lede: "A small sample graph linking Cliven Bundy and his sons through the 2014 Bunkerville standoff and the 2016 Malheur occupation, with the movement associates and organizations that bridge the two events."
weight: 5
draft: true
viz: network
themes: [bundy-family, malheur, bunkerville]
regions: [intermountain-west, pacific-northwest]
network:
  src: /data/bundy-network.json
  infotitle: "Bundy network"
  infoprompt: "Hover a node for name and role. Drag to rearrange."
  legendtitle: "Node type"
  chargestrength: -320
  linkdistance: 80
  palette:
    family:    "#a94b2b"
    associate: "#c9a978"
    event:     "#4a5640"
    org:       "#1f2a44"
  labels:
    family:    "Bundy family"
    associate: "Movement associate"
    event:     "Event"
    org:       "Organization"
---

## What the graph shows

This is a **sample network** (a deliberately small sketch, not a complete ontology) meant to demonstrate how the project's relational data will be visualized.

The **rust-colored core** is the Bundy family: Cliven and Carol, their sons Ammon, Ryan, Mel, and Dave. The **sage-green pins** are the two events that carry most of the coalition's public story: the April 2014 standoff at the Bundy Ranch in Bunkerville, Nevada, and the January–February 2016 occupation of the Malheur National Wildlife Refuge in Harney County, Oregon. The **gold** nodes are associates who were not Bundys but whose participation tied them into the coalition's orbit. The **navy** nodes are the two organizations most closely identified with the events: the Oath Keepers (militia network, active at Bunkerville) and Citizens for Constitutional Freedom, the ad-hoc group Ammon Bundy formed for Malheur.

## Sources

Primary events and participants drawn from contemporaneous press coverage (*New York Times*, *Oregonian*, *High Country News*) and from:

- Anthony McCann, *Shadowlands: Fear and Freedom at the Oregon Standoff* (Bloomsbury, 2019).
- John Temple, *Up in Arms: How the Bundy Family Hijacked Public Lands, Outfoxed the Federal Government, and Ignited America's Patriot Militia Movement* (BenBella Books, 2019).
- Federal indictment and trial records, *United States v. Bundy et al.* (D. Nev. 2016; D. Or. 2016).
