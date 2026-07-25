---
title: "One Bill, Seven Statehouses"
date: 2026-07-06
lede: "How much of each state's sagebrush public-lands bill is the same text? A similarity matrix of shared legal phrasing — the darker the cell, the more two bills read alike. Click any cell to read the passages the two bills copied from each other."
weight: 20
draft: true
tag: "Text reuse"
themes: [public-lands, sagebrush-rebellion-1979]
regions: [national, intermountain-west, southwest, rocky-mountain]
howto:
  - "**Each cell** compares two bills. Color is the Jaccard overlap of their five-word phrases — the share of all distinct five-word sequences the two hold in common. Darker means more shared phrasing."
  - "**The diagonal** is muted: every bill is identical to itself."
  - "**Hover** a cell for the exact score. The heaviest off-diagonal cell is New Mexico ↔ Arizona."
  - "**Click** a cell to open every verbatim passage the two bills share — each an unbroken run of eight or more identical words, longest first — plus a meter showing what share of each bill's phrasing turns up in the other."
chart:
  src: /data/legislation-textreuse.json
  type: matrix
  matrixfield: jaccard
  title: "Shared phrasing among state sagebrush public-lands bills"
  infotitle: "Text similarity"
  infoprompt: "Hover a cell to compare two bills; click to read the shared text."
  hideidlecard: true
---

> **Draft — experiment.** Text-reuse analysis of the transcribed state
> bills in `legislation.md`. Similarity is the Jaccard overlap of
> five-word phrases between each pair of bills (share of all distinct
> five-word sequences the two hold in common). Method and prose are a
> working draft. Follow the [changelog](/updates/).

<!--
  SCAFFOLD — Jason to write the prose. Per the AI bright line, the
  argument is human-authored; this is one of several text-analysis
  experiments (see plan/roadmap.md).

  What the matrix shows: this is the "distant reading" overview — which
  bills read alike — with the close reading one click away: clicking a
  cell opens a modal of the verbatim passages that pair shares (the old
  standalone "Copied Clauses" drill, now merged in here). Findings to
  verify / build the argument from (all from the pipeline):
    - New Mexico ↔ Arizona is the darkest off-diagonal pair: ~53% of New
      Mexico's exact five-word phrases reappear in Arizona. Arizona
      copied New Mexico's *elaborated* text — including the tax-rolls
      provision that Nevada's 1979 original does not contain.
    - Nevada threads through New Mexico, Wyoming, Utah, and Arizona at
      ~10–15% containment each — the common-ancestor signature of the
      1979 model act.
    - Alaska (a ballot initiative) and North Dakota (a memorial
      resolution) are different genres and sit apart from the statute
      cluster.

  Companion instruments (same data file):
    - The Descent of a Bill — the genealogy network.
    - The Boilerplate DNA — the signature-phrase concordance.
-->

Historians have long suspected the state sagebrush bills of the late
1970s and 1980s share a common template. This asks the question as text:
for every pair of bills, what share of their five-word phrases is
identical? Read the darkest cells as the closest kin — then click one to
see the clauses the two bills actually share.

*(Draft prose continues — see scaffold above.)*
