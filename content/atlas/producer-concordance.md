---
title: "Reading the Producer: A Concordance"
date: 2026-08-17
lede: "Every occurrence of every tracked term in the American Cattle Producer in context."
weight: 4
draft: false
atlas:
  mode: kwic
  src: /data/producer-kwic/index.json
  howto:
    - "**Pick a term** from the menu (grouped by concept, with occurrence counts). The bar strip shows its distribution by year."
    - "**Click a year bar** to filter the lines to that year; click it again to clear."
    - "**Filter lines** with the search box — e.g. filter *drought* lines to those mentioning *Texas*."
    - "**Click a citation** to open that issue in the Internet Archive reader with the term pre-searched, one click from the page scan."
---

This atlas tracks every occurrence of every term tracked in *[The Producer's Vocabulary](/atlas/producer-vocabulary/)* atlas, listed here with ten words of context and an issue citation that links out to the Internet Archive's reader with the term pre-searched. Any pattern in the curves can be read back in its original context on the scanned page.

Read together, *[The Producer's Vocabulary](/atlas/producer-vocabulary/)* and *Reading the Producer* help jump between close reading and distant reading. 

## Data and method

27,385 keyword-in-context lines across 43 tracked terms, extracted by `scripts/build_producer_kwic.py` from the OCR text of the Internet Archive collection [pub_american-beef-producer](https://archive.org/details/pub_american-beef-producer) (508 issues, 1919–1961).
