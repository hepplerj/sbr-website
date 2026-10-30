---
title: "Updates"
heading: "Changelog"
lede: "Each entry notes what changed and why: new visualizations, revised narrative, corrected data, or structural changes to the site will all be documented here. Subscribe to the changelog's specific **[RSS feed](/updates/index.xml)** for project updates."
outputs: ["HTML", "RSS"]
# Entries borrow the narrative essay layout (layouts/narrative/single.html)
# and are AI-authored, so they're bylined to Claude. Pages only — the
# changelog list keeps its own layout.
cascade:
  - target:
      kind: page
    type: narrative
    authors:
      - Claude
---
