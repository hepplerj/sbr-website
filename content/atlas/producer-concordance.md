---
title: "Reading the Producer: A Concordance"
date: 2026-08-17
lede: "Every occurrence of every tracked term in the American Cattle Producer, in context — each line one click from the page scan on the Internet Archive."
weight: 4
draft: true
atlas:
  mode: kwic
  src: /data/producer-kwic/index.json
  howto:
    - "**Pick a term** from the menu (grouped by concept, with occurrence counts). The bar strip shows its distribution by year."
    - "**Click a year bar** to filter the lines to that year; click it again to clear."
    - "**Filter lines** with the search box — e.g. filter *drought* lines to those mentioning *Texas*."
    - "**Click a citation** to open that issue in the Internet Archive reader with the term pre-searched, one click from the page scan."
---

Frequency curves compress; this instrument decompresses. Every
occurrence of every term tracked in [The Producer's
Vocabulary](/atlas/producer-vocabulary/) is listed here with ten words
of context on each side and an issue citation that deep-links into the
Internet Archive's reader with the term pre-searched — so any pattern
in the curves can be read back in its original context on the scanned
page.

This is also the project's audit trail. Distant reading of a trade
journal is treacherous — words change referents, columns get nostalgic,
advertisements repeat — and the honest answer is to keep the context
one click away. Two examples of what auditing catches:

- **"Wolf" peaked in 1953**, decades after wolves were functionally
  extirpated from the range states. The lines reveal a serialized
  nostalgia column ("The Early Day Wolf") and supply-house
  advertisements calling cattle grubs "wolves, warbles." The term was
  removed from the lexicon.
- **"Federal control" peaked in 1919** — two decades before the land
  fights. The lines show it meant meatpacker licensing and wartime
  railroad administration. The anti-federal vocabulary predates the
  land fight and was later repurposed for it — a finding, not an error,
  but one only the context reveals.

## Data and method

27,385 keyword-in-context lines across 43 tracked terms, extracted by
`scripts/build_producer_kwic.py` from the OCR text of the Internet
Archive collection
[pub_american-beef-producer](https://archive.org/details/pub_american-beef-producer)
(508 issues, 1919–1961). Context is case-preserving; matching is
case-insensitive with word boundaries, so line counts here agree with
the frequency curves. Lines are quoted at snippet length and every line
cites and links its source issue.
