// ─────────────────────────────────────────────
// Governing Ground — documents annotation runtime
//
// Pairs each <mark class="gloss" data-gloss-id="X"> span in the body
// with its corresponding <template class="glossbody" data-gloss-id="X">
// block. Builds a right-rail sidenote column (Tufte-ish critical
// apparatus) on wide viewports; on narrow viewports the spans become
// click-to-expand inline triggers.
//
// Authoring is two paired shortcodes — see gloss.html and glossbody.html.
// IDs must be unique within the page and become hash fragments
// (`#gloss-retention-default`) for direct linking.
// ─────────────────────────────────────────────

(function () {
  "use strict";

  const NARROW_BREAKPOINT_PX = 1080;

  function init() {
    const sideRail = document.querySelector(".document-sidenotes");
    if (!sideRail) return;

    const templates = document.querySelectorAll('template.glossbody[data-gloss-id]');
    if (!templates.length) {
      sideRail.classList.add("is-empty");
      return;
    }

    // Build {id → {span, template, card}} index
    const entries = new Map();
    templates.forEach(t => {
      const id = t.dataset.glossId;
      const span = document.querySelector(`mark.gloss[data-gloss-id="${cssEscape(id)}"]`);
      if (!span) {
        console.warn(`documents.js: orphan glossbody id="${id}" (no matching span)`);
        return;
      }
      entries.set(id, { span, template: t });
    });

    if (!entries.size) {
      sideRail.classList.add("is-empty");
      return;
    }

    // Build cards in source-order (sort by span's position in the body)
    const ordered = [...entries.values()].sort(
      (a, b) => spanPos(a.span) - spanPos(b.span)
    );

    // Small column header so the rail has visible orientation even
    // when the cards are short.
    const header = document.createElement("p");
    header.className = "document-sidenotes__header";
    header.textContent = "Annotations";
    sideRail.appendChild(header);

    const list = document.createElement("ol");
    list.className = "document-sidenotes__list";
    sideRail.appendChild(list);

    ordered.forEach((entry, i) => {
      const card = document.createElement("li");
      card.className = "document-sidenotes__card";
      card.dataset.glossId = entry.span.dataset.glossId;

      const num = document.createElement("span");
      num.className = "document-sidenotes__num";
      num.textContent = i + 1;
      card.appendChild(num);

      const body = document.createElement("div");
      body.className = "document-sidenotes__body";
      // Clone the template's content into the card. <template>'s
      // `.content` is a DocumentFragment of parsed-but-inert nodes;
      // cloning preserves children including any shortcode output
      // (e.g. embedded {{< cite >}} links).
      body.appendChild(entry.template.content.cloneNode(true));
      card.appendChild(body);

      list.appendChild(card);
      entry.card = card;

      // Number the span itself with the same sequence, so the reader
      // can see "this is footnote ⁵" at a glance.
      const numSup = document.createElement("sup");
      numSup.className = "gloss__num";
      numSup.setAttribute("aria-hidden", "true");
      numSup.textContent = i + 1;
      entry.span.appendChild(numSup);
    });

    // ───── Interaction wiring ─────
    function activate(id) {
      entries.forEach((e, k) => {
        const on = (k === id);
        e.span.classList.toggle("is-active", on);
        if (e.card) e.card.classList.toggle("is-active", on);
      });
    }

    function clear() {
      entries.forEach(e => {
        e.span.classList.remove("is-active");
        if (e.card) e.card.classList.remove("is-active");
      });
    }

    // Span → card link: click/hover/focus
    entries.forEach((e, id) => {
      const onPick = () => {
        activate(id);
        // If sidebar is visible, ensure the card is in view
        if (window.innerWidth >= NARROW_BREAKPOINT_PX) {
          e.card.scrollIntoView({ block: "nearest", behavior: "smooth" });
        } else {
          // Narrow: inline-expand right after the span's paragraph
          toggleInlineExpander(e);
        }
        history.replaceState(null, "", `#gloss-${id}`);
      };
      e.span.addEventListener("click", onPick);
      e.span.addEventListener("keydown", ev => {
        if (ev.key === "Enter" || ev.key === " ") {
          ev.preventDefault();
          onPick();
        }
      });
    });

    // Card → span link
    sideRail.addEventListener("click", ev => {
      const card = ev.target.closest(".document-sidenotes__card");
      if (!card) return;
      const id = card.dataset.glossId;
      const e = entries.get(id);
      if (!e) return;
      activate(id);
      e.span.scrollIntoView({ block: "center", behavior: "smooth" });
      history.replaceState(null, "", `#gloss-${id}`);
    });

    // Click outside any gloss/card clears the active state
    document.addEventListener("click", ev => {
      if (ev.target.closest(".gloss")) return;
      if (ev.target.closest(".document-sidenotes__card")) return;
      if (ev.target.closest(".gloss-inline")) return;
      clear();
      // Also collapse any open inline expanders
      document.querySelectorAll(".gloss-inline").forEach(n => n.remove());
    });

    // Activate gloss matching the URL hash on load
    const hashMatch = (location.hash || "").match(/^#gloss-(.+)$/);
    if (hashMatch && entries.has(hashMatch[1])) {
      const id = hashMatch[1];
      const e = entries.get(id);
      activate(id);
      requestAnimationFrame(() => {
        e.span.scrollIntoView({ block: "center" });
      });
    }
  }

  // Inline expander for narrow viewports — insert/remove a card-style
  // panel right after the paragraph containing the gloss span.
  function toggleInlineExpander(entry) {
    const existing = document.querySelector(
      `.gloss-inline[data-gloss-id="${cssEscape(entry.span.dataset.glossId)}"]`
    );
    if (existing) { existing.remove(); return; }
    // Close any other open expanders
    document.querySelectorAll(".gloss-inline").forEach(n => n.remove());
    const para = entry.span.closest("li, p, blockquote") || entry.span.parentElement;
    const wrap = document.createElement("aside");
    wrap.className = "gloss-inline";
    wrap.dataset.glossId = entry.span.dataset.glossId;
    wrap.appendChild(entry.template.content.cloneNode(true));
    para.insertAdjacentElement("afterend", wrap);
  }

  // Source-order sort helper
  function spanPos(node) {
    let n = node, i = 0;
    while (n.previousSibling) { n = n.previousSibling; i++; }
    // Combine offsetTop with sibling index for a stable ordering across
    // siblings within the same parent.
    return (node.offsetTop * 1e6) + i;
  }

  // Polyfill-lite for CSS.escape (data-attribute IDs are author-chosen
  // and could in theory contain colons or other CSS-special chars).
  function cssEscape(s) {
    if (typeof CSS !== "undefined" && CSS.escape) return CSS.escape(s);
    return String(s).replace(/[^a-zA-Z0-9_-]/g, c =>
      "\\" + c.charCodeAt(0).toString(16) + " ");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else { init(); }
})();
