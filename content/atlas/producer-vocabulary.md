---
title: "The Producer's Vocabulary, 1919–1961"
date: 2026-08-17
lede: "Term frequencies from the full run of the American Cattle Producer: what the cattle industry talked about, year by year, across eight concepts."
weight: 3
draft: false
atlas:
  mode: lexicon
  src: /data/producer-terms.json
  kwicpage: /atlas/producer-concordance/
  howto:
    - "**Hover** over a panel to see a guide-line at the nearest year with that concept's value."
    - "**Click** to pin a year. A detail panel opens below with every term in the cluster, ranked by that year's value. Click the same spot again or use **Unpin** to dismiss."
    - "**Click a term row** to see its full 42-year run at right, with its peak marked — and a link to read its concordance lines in context."
---

The *American Cattle Producer* (published as *The Producer* until the mid-1930s) was the official organ of the American National Live Stock Association published monthly from 1919 to 1961. This chart tracks a curated lexicon of land-use vocabulary across all 508 issues: climate stress, range degradation, federal administration, and anti-federal politics. Each panel aggregates a *concept cluster* of period terms. For example, what we would call drought stress appears as "drouth" (the dominant period spelling), "dry years," and "dust"; what we would call desertification appears as range "depletion" or the advancing "desert."

A few of the arcs visible here:

- **Drought is the loudest word in the corpus.** Its 1935 peak is the maximum of any tracked term across 42 years. 
- **Range condition peaks in 1949**: *erosion*, *reseeding*, *range improvement*, and *conservation* all peak together, possibly showing the industry attempting to answer its postwar critics.
- **The predator-control campaign**: *predator*, *rodent*, *bounty*, and *Biological Survey* peak between 1931 and 1938 in the midst of the pre-war chemical campaigns against pests.

## Data and method

OCR text of all 508 issues from the Internet Archive collection [pub_american-beef-producer](https://archive.org/details/pub_american-beef-producer), dehyphenated and matched against word-boundary regular expressions that include period spellings (*drouth*, *locoweed*, *predatory animals*). Rates are per 10,000 words of each year's issue text, which normalizes for changing issue length and advertising share; covers and display advertisements remain in the denominator, and OCR noise sets a floor of roughly ±0.1 per 10k.

Built by `scripts/build_producer_terms.py`. The microfilm collection ends in 1961.
