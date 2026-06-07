---
# ─── New essay archetype (Writing section) ───────────────────────
#
# Run from the project root:
#     hugo new content/narrative/my-essay-slug.md
#
# Hugo fills in `title` from the file slug and `date` from `now`. The
# remaining fields below are the project's editorial knobs — review
# each before flipping `draft: false`.
#
# Field reference
# ---------------
# title       Display title. Hugo derives an initial value from the
#             file slug; refine it to the actual essay title.
# genre       One of `essay`, `field-note`, `method`. Controls which
#             filter pill the essay appears under on /narrative/.
# number      Essay number (1, 2, 3, …). Stays with the essay
#             regardless of how the index sorts. Pick the next
#             integer in the published series; unnumbered drafts
#             still get a stable loop-index fallback.
# date        Publication date. Used for sort order, the meta row,
#             and the relatedness scoring against `date` in the
#             [related] config.
# lede        One-sentence deck shown under the title on the essay
#             page and in the meta row of the Writing index. Plain
#             text — inline markdown is supported by markdownify.
# place       Geographic anchor for the essay (e.g. "Nevada",
#             "Northern Plains"). Optional; surfaces in the meta
#             row when set.
# themes      Project-level taxonomies (public-lands, dust-bowl,
#             farm-crisis, etc.). Drive the related-essays scoring
#             and the sightlines/atlas cross-references.
# tags        Finer-grained labels (BLM, FLPMA, Great Basin, …).
#             Render in the Writing index meta row and the Tag
#             filter row. Display labels are auto-prettified
#             (slug → "Slug words"); acronyms in all-caps pass
#             through unchanged.
# weight      Tie-breaker for sort order when dates match.
# draft       Hide the page from production builds until ready.
# toc         Show the in-page table of contents on the essay
#             reading page.
#
# Bylines come from the `cascade.authors` block in
# content/narrative/_index.md, so most essays don't need an explicit
# author. Override only for guest or co-authored pieces by adding:
#     authors: [Jason Heppler, Co-Author Name]

title: "{{ replace .Name "-" " " | title }}"
genre: essay
number: 0
date: {{ .Date }}
lede: ""
place: ""
themes: []
tags: []
weight: 10
draft: true
toc: false
---

<!--
  Draft notes — remove before publishing.

  - Open with the move that frames the rest of the essay (a moment,
    a quote, a number, a place). Per /editorial-statement/, this is
    the human-authored layer of the project.
  - Use `## ` headings for sections, `### ` for sub-points. The
    Survey reading column is 46rem at 19px Source Serif; tight
    paragraphs read better than long stacked ones.
  - Citations: {{</* cite key="cawley1993federal" pages="42-45" */>}}
    looks up the bibliography entry by key. Run `make bibliography`
    if you've added a new BibTeX entry. Author/year/pages overrides
    are supported for manual cites.
  - Footnotes: `text[^1]` with `[^1]: footnote body` somewhere below
    the paragraph. Goldmark handles the rest.
  - Figures: `{{</* figure src="image.png" caption="…" attr="…" */>}}`
    for either a page-bundle resource (auto-resized to WebP) or a
    static /figures/... SVG.
-->

Open the essay here.
