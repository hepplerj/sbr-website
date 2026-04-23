// ─────────────────────────────────────────────
// Governing Ground — network renderer (D3 force layout)
// Hooks into elements with data-viz="network". Config is read from
// <script type="application/json" id="{id}-config">.
//
// Node data shape:
//   { nodes: [{id, label, type, role}, ...],
//     links: [{source, target, type}, ...] }
//
// Config shape (all lowercase — Hugo lowercases frontmatter keys):
//   {
//     src: "/data/bundy-network.json",
//     palette:      { family: "#...", event: "#...", ... },
//     labels:       { family: "Family", event: "Event", ... },
//     linkstyles:   { parent: {dash: false, width: 2}, ... },
//     infotitle:    "Hover a node",
//     infoprompt:   "...",
//     legendtitle:  "Node type",
//     chargestrength: -260,
//     linkdistance:   80
//   }
// ─────────────────────────────────────────────

(function () {
  "use strict";
  if (typeof d3 === "undefined") return;

  const VIEW_W = 960;
  const VIEW_H = 560;

  const DEFAULT_PALETTE = {
    family:    "#a94b2b", // rust — the Bundys are the project's conceptual center
    associate: "#c9a978", // gold — movement allies
    event:     "#4a5640", // sage-dark — pinning events
    org:       "#1f2a44", // navy — organizations
    default:   "#6b7a5a",
  };

  const DEFAULT_LABELS = {
    family:    "Family",
    associate: "Associate",
    event:     "Event",
    org:       "Organization",
  };

  function initNetwork(container) {
    const id = container.id;
    const configEl = document.getElementById(id + "-config");
    if (!configEl) return;
    let cfg;
    try { cfg = JSON.parse(configEl.textContent); }
    catch (err) { console.error("Invalid network config for", id, err); return; }

    if (container.dataset.initialized === "true") return;
    container.dataset.initialized = "true";
    container.classList.add("viz-embed__frame--live", "network-viz");
    container.innerHTML = "";

    const palette = Object.assign({}, DEFAULT_PALETTE, lowerKeys(cfg.palette || {}));
    const labels  = Object.assign({}, DEFAULT_LABELS,  lowerKeys(cfg.labels  || {}));
    const colorFor = (t) => palette[String(t || "").toLowerCase()] || palette.default;

    // Info and legend overlays
    const info = document.createElement("div");
    info.className = "info-panel network-viz__info";
    info.innerHTML = infoHTML(cfg);
    container.appendChild(info);

    const legend = document.createElement("div");
    legend.className = "legend network-viz__legend";
    container.appendChild(legend);

    const hint = document.createElement("div");
    hint.className = "network-viz__zoom-hint";
    hint.setAttribute("aria-hidden", "true");
    hint.innerHTML = `
      <span class="network-viz__zoom-hint-off">Click to enable scroll-zoom</span>
      <span class="network-viz__zoom-hint-on">Scroll to zoom · drag to pan</span>
    `;
    container.appendChild(hint);

    // Modal scaffolding — populated on node click, shown/hidden via class.
    const modal = document.createElement("div");
    modal.className = "network-viz__modal";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-hidden", "true");
    modal.innerHTML = `
      <div class="network-viz__modal-backdrop" data-close></div>
      <div class="network-viz__modal-panel">
        <button class="network-viz__modal-close" data-close aria-label="Close">&times;</button>
        <div class="network-viz__modal-body"></div>
      </div>
    `;
    container.appendChild(modal);
    const modalBody = modal.querySelector(".network-viz__modal-body");
    function closeModal() {
      modal.classList.remove("is-open");
      modal.setAttribute("aria-hidden", "true");
    }
    modal.querySelectorAll("[data-close]").forEach((el) => el.addEventListener("click", closeModal));
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });

    const svg = d3.select(container).append("svg")
      .attr("viewBox", `0 0 ${VIEW_W} ${VIEW_H}`)
      .attr("preserveAspectRatio", "xMidYMid meet")
      .attr("role", "img")
      .attr("aria-label", cfg.infotitle || "Network diagram");

    // Pan/zoom: everything renders inside gRoot, which receives the zoom
    // transform. Info panel and legend are DOM siblings of the SVG (not
    // inside gRoot), so they stay anchored as fixed overlays.
    const gRoot   = svg.append("g").attr("class", "network-viz__root");
    const gLinks  = gRoot.append("g").attr("class", "network-viz__links");
    const gNodes  = gRoot.append("g").attr("class", "network-viz__nodes");
    const gLabels = gRoot.append("g").attr("class", "network-viz__labels");

    // Wheel-zoom is opt-in: hovering the graph shouldn't hijack page scroll.
    // Click on the SVG to enable; mouse-leave disables. Drag-to-pan and
    // touch pinch-to-zoom are always on.
    let wheelZoomEnabled = false;
    const zoom = d3.zoom()
      .scaleExtent([0.3, 5])
      .filter((event) => {
        if (event.type === "wheel") return wheelZoomEnabled;
        return !event.ctrlKey && !event.button;
      })
      .on("zoom", (event) => gRoot.attr("transform", event.transform));

    svg.call(zoom).on("dblclick.zoom", null);
    container.addEventListener("click",      () => { wheelZoomEnabled = true;  container.classList.add("network-viz--zoom-active"); });
    container.addEventListener("mouseleave", () => { wheelZoomEnabled = false; container.classList.remove("network-viz--zoom-active"); });

    // Category filter state — set of active category strings.
    // Empty = no filter (all nodes full opacity).
    const activeCategories = new Set();

    const CAT_LABELS = {
      disposal:   "Disposal & Transfer",
      grazing:    "Grazing & Range",
      antiquities:"Antiquities & Monuments",
      wilderness: "Wilderness & Roadless",
      esa:        "ESA & Wildlife",
    };

    d3.json(cfg.src)
      .then(render)
      .catch((err) => {
        container.classList.add("viz-embed__frame--error");
        container.innerHTML = `<div class="viz-embed__error">Network could not load: ${err.message}</div>`;
      });

    function render(graph) {
      const nodes = graph.nodes.map((d) => Object.assign({}, d));
      const links = graph.links.map((d) => Object.assign({}, d));

      // Weight/radius scale must be built BEFORE the force simulation —
      // the collide force's radius accessor is invoked at sim init.
      const weightFor = (d) => (typeof d.bills === "number" ? d.bills
                              : typeof d.weight === "number" ? d.weight
                              : null);
      const weights = nodes.map(weightFor).filter((x) => typeof x === "number");
      const wExtent = weights.length
        ? [Math.max(1, d3.min(weights)), Math.max(1, d3.max(weights))]
        : [1, 1];
      const rScale = d3.scaleSqrt().domain(wExtent).range([6, 20]);

      function radiusFor(d) {
        const w = weightFor(d);
        if (w != null) return rScale(Math.max(1, w));
        if (d.type === "event") return 14;
        if (d.type === "org")   return 12;
        return 10;
      }

      // forceX/forceY give every node a mild pull toward center, so
      // isolated sub-clusters (nodes connected only to each other) don't
      // drift off to the edges. Tune via cfg.centerstrength.
      const centerPull = cfg.centerstrength != null ? cfg.centerstrength : 0.08;

      const sim = d3.forceSimulation(nodes)
        .force("link",    d3.forceLink(links).id((d) => d.id).distance(cfg.linkdistance || 90).strength(0.7))
        .force("charge",  d3.forceManyBody().strength(cfg.chargestrength || -280))
        .force("center",  d3.forceCenter(VIEW_W / 2, VIEW_H / 2))
        .force("x",       d3.forceX(VIEW_W / 2).strength(centerPull))
        .force("y",       d3.forceY(VIEW_H / 2).strength(centerPull))
        .force("collide", d3.forceCollide().radius((d) => radiusFor(d) + 4));

      const link = gLinks.selectAll("line")
        .data(links)
        .join("line")
        .attr("class", (d) => "network-viz__link link-" + safe(d.type))
        .attr("stroke-width", (d) => linkWidth(d))
        .attr("stroke-dasharray", (d) => isDashed(d.type) ? "4 3" : null);

      const node = gNodes.selectAll("circle")
        .data(nodes)
        .join("circle")
        .attr("class", (d) => "network-viz__node node-" + safe(d.type) + (hasDetail(d) ? " is-clickable" : ""))
        .attr("r", radiusFor)
        .attr("fill", (d) => colorFor(d.type))
        .attr("stroke", "#fbf8f0")
        .attr("stroke-width", 1.5)
        .call(drag(sim))
        .on("mouseover", (event, d) => {
          d3.select(event.currentTarget).classed("is-hover", true);
          highlightNeighbors(d, true);
          updateInfo(d);
        })
        .on("mouseout", (event, d) => {
          d3.select(event.currentTarget).classed("is-hover", false);
          highlightNeighbors(d, false);
          updateInfo();
        })
        .on("click", (event, d) => {
          // d3.drag calls preventDefault during drag; skip the click if so.
          if (event.defaultPrevented) return;
          if (!hasDetail(d)) return;
          openModal(d);
        });

      const label = gLabels.selectAll("text")
        .data(nodes)
        .join("text")
        .attr("class", "network-viz__label")
        .attr("dy", (d) => -radiusFor(d) - 6)
        .attr("text-anchor", "middle")
        .text((d) => d.label);

      sim.on("tick", () => {
        link
          .attr("x1", (d) => d.source.x)
          .attr("y1", (d) => d.source.y)
          .attr("x2", (d) => d.target.x)
          .attr("y2", (d) => d.target.y);
        node
          .attr("cx", (d) => d.x)
          .attr("cy", (d) => d.y);
        label
          .attr("x", (d) => d.x)
          .attr("y", (d) => d.y);
      });

      // Cache adjacency for hover emphasis
      const adj = new Map(nodes.map((n) => [n.id, new Set()]));
      links.forEach((l) => {
        adj.get(l.source.id || l.source).add(l.target.id || l.target);
        adj.get(l.target.id || l.target).add(l.source.id || l.source);
      });

      function highlightNeighbors(focus, on) {
        const neighbors = adj.get(focus.id) || new Set();
        neighbors.add(focus.id);
        node.classed("is-dim", on ? (d) => !neighbors.has(d.id) : false);
        label.classed("is-dim", on ? (d) => !neighbors.has(d.id) : false);
        link.classed("is-dim", on ? (l) => !(
          (l.source.id === focus.id) || (l.target.id === focus.id)
        ) : false);
      }

      renderLegend(nodes);

      function nodeMatchesFilter(d) {
        if (activeCategories.size === 0) return true;
        return (d.cosponsored || []).some((b) => activeCategories.has(b.category));
      }

      function applyFilter() {
        const on = activeCategories.size > 0;
        node.style("opacity",  on ? (d) => nodeMatchesFilter(d) ? 1 : 0.08 : null);
        label.style("opacity", on ? (d) => nodeMatchesFilter(d) ? 1 : 0.08 : null);
        link.style("opacity",  on ? (l) => {
          const sm = nodeMatchesFilter(l.source);
          const tm = nodeMatchesFilter(l.target);
          return (sm && tm) ? 0.6 : 0.04;
        } : null);
      }

      renderFilter(graph, applyFilter);
    }

    function renderFilter(graph, applyFilter) {
      const cats = [...new Set((graph.bills || []).map((b) => b.category).filter(Boolean))];
      if (cats.length === 0) return;

      const bar = document.createElement("div");
      bar.className = "network-viz__filter";
      bar.setAttribute("aria-label", "Highlight by bill category");
      bar.innerHTML = `<span class="network-viz__filter-label">Highlight:</span>` +
        cats.map((c) =>
          `<button class="network-viz__filter-btn" data-cat="${c}">${CAT_LABELS[c] || c}</button>`
        ).join("");

      bar.querySelectorAll(".network-viz__filter-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
          const cat = btn.dataset.cat;
          if (activeCategories.has(cat)) {
            activeCategories.delete(cat);
            btn.classList.remove("is-active");
          } else {
            activeCategories.add(cat);
            btn.classList.add("is-active");
          }
          applyFilter();
        });
      });

      container.insertBefore(bar, legend.nextSibling);
    }

    function hasDetail(d) {
      return Array.isArray(d.cosponsored) && d.cosponsored.length > 0;
    }

    function openModal(d) {
      modalBody.innerHTML = renderModal(d);
      modal.classList.add("is-open");
      modal.setAttribute("aria-hidden", "false");
    }

    function linkWidth(d) {
      if (d.type === "parent" || d.type === "spouse") return 2.2;
      if (d.type === "led" || d.type === "founded")   return 2.0;
      return 1.4;
    }

    function isDashed(type) {
      return type === "affiliation";
    }

    function updateInfo(d) {
      if (!d) { info.innerHTML = infoHTML(cfg); return; }
      const typeLabel = labels[String(d.type || "").toLowerCase()] || d.type || "";
      info.innerHTML = `
        <h4>${d.label}</h4>
        ${d.role ? `<div class="detail">${d.role}</div>` : ""}
        ${typeLabel ? `<div class="detail network-viz__type">${typeLabel}</div>` : ""}
      `;
    }

    function renderLegend(nodes) {
      const present = new Set(nodes.map((n) => String(n.type || "").toLowerCase()));
      // Preferred order: explicit cfg.labelorder, else keys of labels/palette,
      // else a reasonable bridging/family default. Keep only types actually in play.
      const configured = cfg.labelorder
        || Object.keys(cfg.labels || {})
        || Object.keys(cfg.palette || {});
      const fallback = ["family", "person", "associate", "event", "org",
                        "republican", "democrat", "independent", "other"];
      const order = ((configured && configured.length ? configured : fallback))
        .filter((t) => present.has(String(t).toLowerCase()));
      const title = cfg.legendtitle || "Node type";
      const items = order.map((t) => {
        const key = String(t).toLowerCase();
        const sw = colorFor(key);
        const lbl = labels[key] || t;
        return `<div class="legend-item"><span class="legend-swatch legend-swatch--round" style="background:${sw}"></span>${lbl}</div>`;
      });
      legend.innerHTML = `<h4>${title}</h4>${items.join("")}`;
    }
  }

  function drag(sim) {
    function started(event, d) {
      if (!event.active) sim.alphaTarget(0.3).restart();
      d.fx = d.x; d.fy = d.y;
    }
    function dragged(event, d) { d.fx = event.x; d.fy = event.y; }
    function ended(event, d) {
      if (!event.active) sim.alphaTarget(0);
      d.fx = null; d.fy = null;
    }
    return d3.drag().on("start", started).on("drag", dragged).on("end", ended);
  }

  function infoHTML(cfg) {
    return `<h4>${cfg.infotitle || "Hover a node"}</h4><div class="detail">${
      cfg.infoprompt || "Drag nodes to rearrange. Pan by dragging empty space; click to enable scroll-zoom."
    }</div>`;
  }

  function safe(s) { return String(s || "x").replace(/[^a-z0-9]/gi, ""); }

  // ─── Modal rendering ────────────────────────────────────────────────
  function renderModal(d) {
    const metaBits = [];
    if (d.party && d.state) metaBits.push(`${d.party}-${d.state}`);
    if (d.district)          metaBits.push(`District ${d.district}`);
    const meta = metaBits.length ? `<p class="network-viz__modal-meta">${metaBits.join(" · ")}</p>` : "";
    const role = d.role ? `<p class="network-viz__modal-role">${d.role}</p>` : "";

    const bills = (d.cosponsored || []).map(renderBillRow).join("");
    const heading = d.cosponsored && d.cosponsored.length
      ? `<h4 class="network-viz__modal-section">Bills in this set (${d.cosponsored.length})</h4>`
      : "";

    return `
      <h3 class="network-viz__modal-name">${escapeHTML(d.label || "")}</h3>
      ${meta}
      ${role}
      ${heading}
      ${bills ? `<ul class="network-viz__bill-list">${bills}</ul>` : ""}
    `;
  }

  function renderBillRow(b) {
    const roleChip = b.role === "sponsor"
      ? `<span class="network-viz__bill-role network-viz__bill-role--sponsor">Sponsor</span>`
      : `<span class="network-viz__bill-role">Cosponsor</span>`;
    const ordinal = ordinalCongress(b.congress);
    const billNo = `${b.type.toUpperCase()} ${b.number}`;
    const url = congressGovURL(b.congress, b.type, b.number);
    const title = escapeHTML(b.title || b.label || "");
    return `
      <li class="network-viz__bill">
        ${roleChip}
        <div class="network-viz__bill-body">
          <div class="network-viz__bill-id">
            ${ordinal} Congress · <a href="${url}" target="_blank" rel="noopener">${billNo}</a>
          </div>
          ${title ? `<div class="network-viz__bill-title">${title}</div>` : ""}
        </div>
      </li>
    `;
  }

  const TYPE_TO_URL = { hr: "house-bill", s: "senate-bill", hjres: "house-joint-resolution", sjres: "senate-joint-resolution" };
  function congressGovURL(congress, type, number) {
    const t = TYPE_TO_URL[type] || type;
    return `https://www.congress.gov/bill/${ordinalCongress(congress).toLowerCase()}-congress/${t}/${number}`;
  }
  function ordinalCongress(n) {
    const v = n % 100;
    if (v >= 11 && v <= 13) return n + "th";
    switch (n % 10) {
      case 1: return n + "st";
      case 2: return n + "nd";
      case 3: return n + "rd";
      default: return n + "th";
    }
  }
  function escapeHTML(s) {
    return String(s || "")
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  function lowerKeys(obj) {
    const out = {};
    for (const k in obj) out[k.toLowerCase()] = obj[k];
    return out;
  }

  function boot() {
    document.querySelectorAll('[data-viz="network"]').forEach(initNetwork);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
