---
title: "The Bundy Family Network"
date: 2026-04-17
lede: "A small sample graph linking Cliven Bundy and his sons through the 2014 Bunkerville standoff and the 2016 Malheur occupation, with the movement associates and organizations that bridge the two events."
weight: 5
draft: false
viz: network
themes: [bundy-family, malheur, bunkerville]
regions: [intermountain-west, pacific]
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

This is a **sample network** — a deliberately small sketch, not a complete ontology — meant to demonstrate how the project's relational data will be visualized. Fourteen nodes, a handful of ties. Zoomed in on one family and two events. Enough to see the shape.

The **rust-colored core** is the Bundy family: Cliven and Carol, their sons Ammon, Ryan, Mel, and Dave. The **sage-green pins** are the two events that carry most of the coalition's public story: the April 2014 standoff at the Bundy Ranch in Bunkerville, Nevada, and the January–February 2016 occupation of the Malheur National Wildlife Refuge in Harney County, Oregon. The **gold** nodes are associates who were not Bundys but whose participation tied them into the coalition's orbit. The **navy** nodes are the two organizations most closely identified with the events: the Oath Keepers (militia network, active at Bunkerville) and Citizens for Constitutional Freedom, the ad-hoc group Ammon Bundy formed for Malheur.

## How to read it

- **Drag any node** to rearrange the graph. The force simulation will reflow around it.
- **Hover a node** to dim the rest of the network and see that node's role.
- **Thicker edges** indicate parent-child, spousal, or leadership ties. **Dashed edges** indicate looser affiliations rather than confirmed memberships.

The graph's visual argument is simple: the Bundy family is a *bridging structure*. Cliven is at the center of Bunkerville; Ammon is at the center of Malheur. Ryan and the militia operative Ryan Payne sit at both events, making the family the connective tissue between the 2014 standoff and the 2016 occupation. That isn't surprising, but seeing it as a drawn graph makes the structural continuity unavoidable.

## What this isn't (yet)

A few things to note about this sample:

- **Scope**: the real Bundy network is much larger. A full version would include dozens of Malheur occupiers, the attorneys and supporters who organized their defense, the conservative legal foundations that amplified their constitutional theory, and the social-media and podcasting apparatus that narrated the events in real time. This sample is trimmed to the nodes most historians would agree on.
- **Time**: edges here are static. A richer version will show when ties formed — the militia contacts Cliven made during the Clark County grazing dispute of the early 2000s, for instance, only become operational in 2014.
- **Directionality**: the graph is undirected. A more interpretive version would distinguish ties of kinship, solidarity, command, and finance — the current edge-type encoding is only a first pass.

Subsequent network pages will each focus on a specific sagebrush-rebellion coalition or event (the 1979 Nevada legislators, the Wise Use mobilization, the 1990s county-supremacy litigation, the Malheur occupation in its full breadth). This Bundy sample is a proof-of-concept for the format.

## Sources

Primary events and participants drawn from contemporaneous press coverage (*New York Times*, *Oregonian*, *High Country News*) and from:

- Anthony McCann, *Shadowlands: Fear and Freedom at the Oregon Standoff* (Bloomsbury, 2019).
- John Temple, *Up in Arms: How the Bundy Family Hijacked Public Lands, Outfoxed the Federal Government, and Ignited America's Patriot Militia Movement* (BenBella Books, 2019).
- Federal indictment and trial records, *United States v. Bundy et al.* (D. Nev. 2016; D. Or. 2016).
