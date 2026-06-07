# Shortcodes reference

Project-specific Hugo shortcodes available throughout `content/`. Each
lives in `themes/sagebrush/layouts/shortcodes/<name>.html`.

This file exists because the Hugo escape pattern for documenting
shortcode syntax inside another template (the `{{</* */>}}` form)
contains literal `*/` sequences, which close Go-template `{{/* */}}`
comments prematurely. Putting the docs here keeps the template files
clean and the examples copy-pasteable.

> **Just copy the snippets below verbatim.** All examples use the
> plain `{{< name >}}…{{< /name >}}` form Hugo actually expects.
> If you see `{{</* */>}}` (with the `/*` and `*/` inside) anywhere
> else, that's a *documentation escape* used to render shortcode
> delimiters as visible text in other Markdown files — it's not how
> you invoke a shortcode in your essay.

---

## `pullquote` — display pull quotes with optional attribution

Renders the inner block as a `<blockquote>` inside an
`<aside class="pullquote">`. When `author` and/or `source` are
supplied, appends a small attribution line; each can be wrapped in
an anchor via its matching `*url` parameter.

### Parameters

| Param       | Purpose                                                  |
|-------------|----------------------------------------------------------|
| `author`    | Person being quoted. Optional.                           |
| `authorurl` | Optional link for the author name.                       |
| `source`    | Source title, document, or context. Renders in `<cite>`. |
| `sourceurl` | Optional link for the source title.                      |

The inner content runs through `markdownify`, so emphasis, links,
and footnotes inside the quote work as expected. Multi-paragraph
quotes are supported — separate paragraphs with a blank line.

### Bare quote (no attribution)

Use for a memorable line lifted from the essay itself.

```md
{{< pullquote >}}
A short, memorable line that earns its own beat.
{{< /pullquote >}}
```

### With author

Quoting another voice without a specific source citation.

```md
{{< pullquote author="Edward Abbey" >}}
Wilderness is not a luxury but a necessity of the human spirit.
{{< /pullquote >}}
```

### With author + source + source URL

Primary-source quotation with full attribution and a link out to
the source (book, archival document, transcript, etc.).

```md
{{< pullquote author="Theodore Roosevelt"
              source="Annual Message to Congress, December 3, 1907"
              sourceurl="https://www.presidency.ucsb.edu/documents/seventh-annual-message-2" >}}
The conservation of natural resources is the fundamental problem.
Unless we solve that problem it will avail us little to solve all
others.
{{< /pullquote >}}
```

### With author + author URL + source

Linking the author rather than (or in addition to) the source.

```md
{{< pullquote author="Cliven Bundy"
              authorurl="https://en.wikipedia.org/wiki/Cliven_Bundy"
              source="ABC News interview, April 9, 2014" >}}
I'm willing to pay for grazing on the land, but I'll pay it to the
sovereign state of Nevada.
{{< /pullquote >}}
```

### Where the URLs should point

- **`authorurl`** — a person page (Wikipedia, the author's own site,
  an in-project person record if/when one exists).
- **`sourceurl`** — the source itself (worldcat for books,
  archive.org for archival material, a `/documents/<slug>/` link
  to an in-project transcription, a deep link to a govinfo.gov
  Statutes-at-Large PDF, etc.).

---

## `cite` — inline parenthetical citation

Renders `(Author Year, pages)` linked to `/sources/#<key>`. Looks
up the entry in `data/bibliography.json` (produced by
`scripts/build_bibliography.py` from the project's BibTeX files).

### Parameters

| Param    | Purpose                                                     |
|----------|-------------------------------------------------------------|
| `key`    | BibTeX key (preferred). Auto-resolves author + year.        |
| `author` | Manual override or no-key form.                             |
| `year`   | Manual override or no-key form.                             |
| `pages`  | Page range or single page. Optional.                        |

```md
{{< cite key="cawley1993federal" >}}
{{< cite key="cawley1993federal" pages="42-45" >}}
{{< cite author="Cawley" year="1993" pages="42-45" >}}
```

Run `make bibliography` after adding new BibTeX entries.

---

## `define` — define a glossary term inline

Drops a glossary-style definition inline in prose. The term is
wrapped with a hairline that on hover surfaces the definition.

### Parameters

| Param   | Purpose             |
|---------|---------------------|
| `term`  | Term being defined. |

```md
{{< define term="public-trust doctrine" >}}
The legal theory that the state holds certain resources in trust
for the public, not for itself or its government.
{{< /define >}}
```

---

## `gloss` + `glossbody` — annotated text spans with sidenote

The annotation apparatus for transcribed documents. A `gloss`
wraps a span of text in the body with a rust dashed underline; a
`glossbody` with the matching `id` carries the marginal note
content. Both halves are tied together by the `id` parameter.

### Parameters (each)

| Param | Purpose                                              |
|-------|------------------------------------------------------|
| `id`  | Identifier shared by the inline span and its body.   |

```md
The Secretary {{< gloss id="secretary-discretion" >}}may
withhold from disposal{{< /gloss >}} any lands the Secretary
determines to require continued retention.

{{< glossbody id="secretary-discretion" >}}
The discretionary "may" — as opposed to "shall" — is doing
substantial work here. FLPMA's authority is structured as a
permission rather than a mandate, leaving the Secretary wide room
to decline disposal even when the formal criteria are met.
{{< /glossbody >}}
```

The `glossbody` text mounts in the right-rail sidenote column on
wide viewports and as an inline expander on narrow viewports.

---

## `figure` — captioned figures

Embeds an image (either a page-bundle resource or a static
`/figures/...` SVG) with optional caption + credit. Page-bundle
images are auto-resized to WebP at 900w/1400w via Hugo's image
pipeline.

### Parameters

| Param     | Purpose                                                  |
|-----------|----------------------------------------------------------|
| `src`     | Image source (bundle filename or `/figures/...` path).   |
| `alt`     | Alt text. Required for accessibility.                    |
| `caption` | Visible caption rendered below the image.                |
| `credit`  | Photo credit / source line. Smaller, italic.             |
| `id`      | Anchor ID for cross-references.                          |

```md
{{< figure src="usda-1933.jpg"
           alt="Two horses pulling a moldboard plow"
           caption="Spring plowing in eastern Montana, 1933."
           credit="USDA Forest Service, Region 1 collection." >}}
```

---

## `map` + `network` — embed an interactive sightline inline

Mount a Leaflet/D3 map or a D3 network inside any prose page,
sourcing the same config-driven JSON files the standalone sightline
pages use. Useful for showing a small inset in an essay without
sending the reader to a separate page.

### `map` parameters

| Param          | Purpose                                                 |
|----------------|---------------------------------------------------------|
| `id`           | DOM id for the container. Must be unique on the page.   |
| `data`         | URL to the GeoJSON data file (e.g. `/data/foo.geojson`).|
| `style`        | Named palette (`sage`, `green`, `gold`, `rust`, …).     |
| `center`       | `lat,lng` viewport center.                              |
| `zoom`         | Initial zoom level (1–18).                              |
| `height`       | CSS height (e.g. `60vh`, `420px`).                      |
| `valuefield`   | Property on each feature to color by.                   |
| `valueunit`    | Unit suffix in the legend / popup.                      |
| `labelfield`   | Property to use as the feature label.                   |
| `caption`      | Optional caption rendered below the map.                |
| `legendtitle`  | Legend header text.                                     |
| `infotitle`    | Default heading in the info panel.                      |
| `infoprompt`   | Default prompt text in the info panel.                  |
| `popupnote`    | Optional small text appended to each popup.             |

```md
{{< map id="essay-inset-fedlands"
        data="/data/federal-lands.geojson"
        style="sage"
        height="420px"
        center="40.5,-115.0"
        zoom="6"
        valuefield="acres"
        caption="BLM holdings in the Great Basin." >}}
```

### `network` parameters

| Param     | Purpose                                                |
|-----------|--------------------------------------------------------|
| `id`      | DOM id for the container.                              |
| `data`    | URL to the network JSON file.                          |
| `layout`  | Force-layout preset.                                   |
| `height`  | CSS height.                                            |
| `caption` | Optional caption.                                      |

---

## `year` — current build year

Helper for inline use in chrome / colophons. Renders the year of
the build (`now.Format "2006"`).

```md
© 2025–{{< year >}} Jason A. Heppler
```

The footer template uses this directly; the shortcode form exists
for inline use in body content.

---

## Adding a new shortcode

1. Drop a `<name>.html` template in
   `themes/sagebrush/layouts/shortcodes/`.
2. Document it in this file, in the same shape as the existing
   entries (one heading, a params table, one or more usage blocks).
3. If the shortcode emits any new HTML structure that needs CSS,
   prefix selectors with the shortcode name (e.g. `.pullquote__attr`)
   so they live in their own namespace in `_layout.scss`.
