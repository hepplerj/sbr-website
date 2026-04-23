---
title: "Bridging the Rebellions"
date: 2026-04-18
lede: "Twenty-eight people, events, and organizations across four decades of federal-lands conflict. The graph makes one argument visible: the sagebrush rebellions are not a sequence of separate incidents but a recurring form — and the bridges are legible as specific people and specific institutions."
weight: 6
draft: true 
viz: network
themes: [sagebrush-rebellion-1979, public-lands]
regions: [great-plains, intermountain-west, pacific]
network:
  src: /data/bridging-network.json
  infotitle: "Bridging the rebellions"
  infoprompt: "Hover a node for role and era. Drag to rearrange. Thicker edges indicate leadership or kinship; dashed edges indicate looser affiliations."
  legendtitle: "Node type"
  chargestrength: -420
  linkdistance: 95
  palette:
    family: "#a94b2b"
    person: "#c9a978"
    event:  "#4a5640"
    org:    "#1f2a44"
  labels:
    family: "Bundy family"
    person: "Movement figure"
    event:  "Event"
    org:    "Organization"
---

## What the graph shows

Six events (sage-green), scattered across forty years; twenty-two people and organizations (rust, gold, navy) that connect them. Drag any node to rearrange the layout. Hover a node for its role. The force simulation pulls events apart and lets bridging actors settle between them — the bridges are where the argument lives.

## The bridges worth naming

A node that sits between two or more events is, in movement terms, *continuity infrastructure*. Read the graph this way:

- **Cliven Bundy** connects the Taylor Grazing Act administrative regime (his grievance dates to 1989, when he stopped paying federal grazing fees) to the 2014 Bunkerville standoff. He is the link between the bureaucratic sagebrush story and the armed one.
- **Ammon and Ryan Bundy** connect Bunkerville (2014) to Malheur (2016). The graph makes the kinship tie explicit and places it at the structural center of the post-2010 rebellion.
- **Ryan Payne** connects Bunkerville to Malheur as a *non-family* bridge — a militia operative at both events. His participation argues that the Bundy network was not merely a family affair but embedded in a broader patriot-movement infrastructure.
- **Richard Mack** connects the 1990s county-supremacy movement to the 2014 Bunkerville standoff. His Sheriff-centered Tenth-Amendment doctrine — carried by the Constitutional Sheriffs and Peace Officers Association — arrived at the Bundy Ranch as a ready-made legal theory.
- **James Watt** connects the 1979 Rebellion to its institutional afterlife. As co-founder of the Mountain States Legal Foundation (1977) he helped build the conservative legal architecture that made later transfer arguments thinkable; as Interior Secretary (1981–83) he translated rebellion politics into federal policy.
- **Ron Arnold** connects the 1988 Wise Use founding to everything after. Wise Use as a movement dissolved into its successor organizations by the late 1990s, but the rhetorical and strategic repertoire it developed — "multiple use," property-rights framing, coalition with rural-identity politics — runs through the 2012 Utah HB 148 and the 2014 and 2016 standoffs.
- **Ken Ivory** connects the 2012 Utah state-legislative push to the broader movement infrastructure through the American Lands Council — an organization specifically formed to carry model-bill advocacy to other Western state legislatures. HB 148 is the legislative parallel to the armed standoffs that followed.

## What the graph argues

Two claims:

**1. The rebellions are a single continuous movement, not separate events.** Each node that bridges multiple events is evidence of that continuity. The rebellions look episodic in press coverage and differ sharply in tactics (legislative resolutions, legal filings, armed occupations), but the personnel and the institutional carriers overlap substantially. A person who participated in the 1990s county-supremacy movement was substantially more likely to appear at Bunkerville than a random Western rancher — not because the movement is small (it is large) but because the networks that produce activism are persistent.

**2. The bridges are institutional as much as biographical.** The Mountain States Legal Foundation, the Center for the Defense of Free Enterprise, the Constitutional Sheriffs and Peace Officers Association, the American Lands Council, the Oath Keepers — each is an organizational structure that *preserves* the movement between events. When the 2014 Bundy Ranch standoff happened, CSPOA and the Oath Keepers were already there with a legal theory and a deployment apparatus; they weren't improvised. This is what it means to say the sagebrush rebellions are a *recurring form*: the form is not new each time.

## What the graph does not show (yet)

- **Archival correspondence** between the actors. A richer version would weight ties by documented contact (letters, phone records, organizational membership rosters). Drawing that data out of the archival record is future work.
- **Rank-and-file participants**. The graph shows leaders, founders, and bridging figures. The hundreds of people who showed up at Bunkerville or the dozens who occupied Malheur are not individually represented — their collective presence is implied by the event nodes.
- **Opposition networks**. A complete relational history of the rebellions would include environmental groups, federal agencies, ranchers who *rejected* the transfer argument, and tribal nations whose historical claims complicate the entire framing. This graph tells one side's story structurally; the other sides need their own visualizations.
- **Temporal edges**. All edges here are timeless — "Richard Mack founded CSPOA" and "CSPOA supported Bunkerville" render as equivalent in the viz even though they are separated by years and different organizational states. A time-weighted or animated version would show the network forming, not just its final shape.

## Sources

Compiled from the works cited in this project's [bibliography](/sources/), especially:

- R. McGreggor Cawley, *Federal Land, Western Anger: The Sagebrush Rebellion and Environmental Politics* (1993) — foundational for the 1979 coalition.
- James R. Skillen, *This Land Is My Land: Rebellion in the West* (2020) — traces the three waves (Sagebrush, War for the West, Patriot) and the institutional continuity between them.
- Anthony McCann, *Shadowlands: Fear and Freedom at the Oregon Standoff* (2019) — on the Malheur occupation and its antecedents.
- John Temple, *Up in Arms: How the Bundy Family Hijacked Public Lands...* (2019) — on the Bundy family and the armed-standoff turn.
- Contemporaneous press coverage (*High Country News*, *The Oregonian*, *The New York Times*, *Mother Jones*) for the 2012–2016 material.
- Federal indictment and trial records, *United States v. Bundy et al.* (D. Nev. 2016; D. Or. 2016).

The graph is a first draft. Corrections, additional bridging figures, and suggested edge-weighting are welcome — open an issue on the project [GitHub](https://github.com/hepplerj/sagebrush).
