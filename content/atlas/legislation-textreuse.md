---
title: "One Bill, Seven Statehouses"
date: 2026-07-06
lede: "How much of each state's sagebrush public-lands bill is the same text? A similarity matrix of shared legal phrasing."
weight: 20
draft: false
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

This chart asks of the legislation text: for every pair of bills, what share of five-word phrases are identical? The matrix here demonstrates a "distant reading" of state legislation: which bills read alike, but also offers close reading by clicking on a singe cell to see were passages are shared. From this chart we can see New Mexico and Arizona share the most five-word phrases. Parts of Nevada's 1979 assembly bill appear throughout New Mexico, Wyoming, Utah, and Arizona.

