// ─────────────────────────────────────────────
// Governing Ground — atlas renderer (trends mode)
//
// Small-multiples line chart: one panel per CRS policy area, three
// lines per panel (one per regional delegation), X = Congress (year
// labels), Y = chosen metric. Mounts on data-viz="atlas".
//
// Config (lowercase — Hugo lowercases frontmatter keys):
//   {
//     src:     "/data/atlas-regional-timeseries.json",
//     metric:  "permember" | "shareofregion" | "cosponsorships",
//     chamber: "both" | "house" | "senate",
//   }
//
// A `mode` field is accepted but currently only "trends" is supported.
// A prior per-Congress heatmap mode was removed when the dual-entry
// atlas was consolidated into a single trends entry; restore from git
// history if a single-Congress view is wanted again.
// ─────────────────────────────────────────────

(function () {
  "use strict";
  if (typeof d3 === "undefined") return;

  const METRIC_LABELS = {
    permember:       "Cosponsorships per member",
    shareofregion:   "Share of region’s total (%)",
    cosponsorships:  "Total cosponsorships",
  };
  const METRIC_FIELD = {
    permember:       "perMember",
    shareofregion:   "shareOfRegion",
    cosponsorships:  "cosponsorships",
  };
  const CHAMBER_LABELS = {
    both:   "Both chambers",
    house:  "House only",
    senate: "Senate only",
  };

  // Each Congress is two years starting odd-numbered years from 1789.
  // 108 → 2003 (Jan), 109 → 2005, ... 119 → 2025.
  function congressToYear(c) { return 1789 + (c - 1) * 2; }
  function congressSpanLabel(c) {
    const y = congressToYear(c);
    return `${y}–${String((y + 1) % 100).padStart(2, "0")}`;
  }

  // Region brand colors — also reused for trend-line series.
  const REGION_COLORS = {
    "great-plains": "#a94b2b",
    "rest-west":    "#1f2a44",
    "corn-belt":    "#c2882e",
  };

  function initAtlas(container) {
    const id = container.id;
    const configEl = document.getElementById(id + "-config");
    if (!configEl) return;
    let cfg;
    try { cfg = JSON.parse(configEl.textContent); }
    catch (err) { console.error("Invalid atlas config for", id, err); return; }

    if (container.dataset.initialized === "true") return;
    container.dataset.initialized = "true";
    container.classList.add("atlas-viz");
    container.innerHTML = "";

    const src = cfg.src;
    if (!src) { console.error("atlas: missing src"); return; }

    let metric  = (cfg.metric  || "permember").toLowerCase();
    let chamber = (cfg.chamber || "both").toLowerCase();
    if (!(metric  in METRIC_FIELD))   metric  = "permember";
    if (!(chamber in CHAMBER_LABELS)) chamber = "both";

    fetch(src)
      .then(r => r.json())
      .then(data => renderTrends(container, data, cfg, metric, chamber))
      .catch(err => {
        console.error("atlas fetch failed", err);
        container.innerHTML = '<p class="atlas-viz__error">Could not load data.</p>';
      });
  }

  // ───────── Cell value extraction (shared by both modes) ─────────
  // perMember and cosponsorships are chamber-aware via byChamber.{house,senate}
  // shareOfRegion is region-total based (chamber-agnostic by definition).
  function valueOf(cell, metric, chamber) {
    if (chamber === "both" || metric === "shareofregion") {
      return +cell[METRIC_FIELD[metric]] || 0;
    }
    const by = cell.byChamber && cell.byChamber[chamber];
    if (!by) return 0;
    if (metric === "permember")      return +by.perMem || 0;
    if (metric === "cosponsorships") return +by.cosp   || 0;
    return 0;
  }

  // ───────────────────────── TRENDS MODE ─────────────────────────
  // Interaction model:
  //   - Hover anywhere over a panel's chart area → live guide-line
  //     follows the cursor, snapping to the nearest Congress. Small
  //     ghost dots show where the line crosses each region's series.
  //     A year label at the top of the line shows the Congress span.
  //     No tooltip — data goes in the detail panel after click.
  //   - Click on a panel → "pins" the (Congress, panel's policy area).
  //     Pinned guide-line is solid + thicker than the hover ghost.
  //     The detail panel below the small-multiples populates.
  //   - Detail panel is a two-column grid:
  //       Left  (40%): three rows, one per region, with metric value /
  //                    bills / D-R-I count. Click a row to drill members.
  //       Right (60%): empty until a region row is clicked; then shows
  //                    that region's members with name-search + state-
  //                    filter chips.
  function renderTrends(container, data, cfg, initialMetric, initialChamber) {
    const regions = data.regions;
    const areas   = data.policyAreas;
    const congs   = data.congresses;
    const meta    = data.congressMeta || {};

    // (congress, region, policyArea) → cell
    const byKey = new Map();
    data.cells.forEach(c => byKey.set(`${c.congress}|${c.region}|${c.policyArea}`, c));

    // ─── Controls + meta caption ───────────────────────────────────
    const ctrls = controlsRow(container);
    const metricSel  = makeSelect(ctrls, "Show", METRIC_LABELS, initialMetric);
    const chamberSel = makeSelect(ctrls, "Chamber", CHAMBER_LABELS, initialChamber);

    const metaSpan = document.createElement("span");
    metaSpan.className = "atlas-viz__meta";
    const startYr = congressToYear(congs[0]);
    const endYr   = congressToYear(congs[congs.length - 1]) + 1;
    metaSpan.textContent = `${congs.length} Congresses · ${startYr}–${endYr}`;
    ctrls.appendChild(metaSpan);

    // ─── Region legend (click to highlight one series) ─────────────
    const legend = document.createElement("div");
    legend.className = "atlas-viz__legend-strip";
    regions.forEach(r => {
      const chip = document.createElement("button");
      chip.className = "atlas-viz__legend-chip";
      chip.dataset.region = r.slug;
      chip.innerHTML = `<span class="atlas-viz__swatch" style="background:${REGION_COLORS[r.slug]}"></span>${escapeHtml(r.label)}`;
      legend.appendChild(chip);
    });
    container.appendChild(legend);

    // ─── SVG canvas ────────────────────────────────────────────────
    const svgWrap = document.createElement("div");
    svgWrap.className = "atlas-viz__svg-wrap";
    container.appendChild(svgWrap);
    const svg = d3.select(svgWrap).append("svg")
      .attr("class", "atlas-viz__svg").attr("role", "img");

    // ─── Detail panel scaffold (below the SVG) ─────────────────────
    const detail = document.createElement("div");
    detail.className = "atlas-trend__detail";
    detail.setAttribute("hidden", "");
    detail.innerHTML =
        '<div class="atlas-trend__detail-left"></div>'
      + '<div class="atlas-trend__detail-right"></div>';
    container.appendChild(detail);
    const detailLeft  = detail.querySelector(".atlas-trend__detail-left");
    const detailRight = detail.querySelector(".atlas-trend__detail-right");

    // ─── State ─────────────────────────────────────────────────────
    const srcDir = cfg.src.replace(/\/[^/]+$/, "/");
    const memberCache    = new Map();   // congress → per-congress JSON
    let   highlightedRegion = null;     // legend chip dimming
    let   pinned         = null;        // { cong, area } or null
    let   selectedRegion = null;        // region slug for right column

    legend.querySelectorAll(".atlas-viz__legend-chip").forEach(chip => {
      chip.addEventListener("click", () => {
        const slug = chip.dataset.region;
        highlightedRegion = (highlightedRegion === slug) ? null : slug;
        legend.querySelectorAll(".atlas-viz__legend-chip").forEach(c =>
          c.classList.toggle("is-dim", highlightedRegion && c.dataset.region !== highlightedRegion));
        draw();
      });
    });

    function draw() {
      const metric  = metricSel.value;
      const chamber = chamberSel.value;
      const width   = svgWrap.clientWidth || 900;
      const cols    = width < 720 ? 2 : 3;
      const rows    = Math.ceil(areas.length / cols);

      const margin = { top: 26, right: 14, bottom: 36, left: 46 };
      const gap    = 28;
      const panelW = (width - gap * (cols - 1)) / cols;
      const panelH = 180;   // bumped for guide-line year label at top
      const totalH = rows * panelH + (rows - 1) * gap + 16;

      svg.attr("viewBox", `0 0 ${width} ${totalH}`)
         .attr("width", width).attr("height", totalH);
      svg.selectAll("*").remove();

      const xScale = d3.scaleLinear()
        .domain(d3.extent(congs))
        .range([margin.left, panelW - margin.right]);

      areas.forEach((area, ai) => {
        const col = ai % cols;
        const row = Math.floor(ai / cols);
        const px  = col * (panelW + gap);
        const py  = row * (panelH + gap);

        const pg = svg.append("g")
          .attr("class", "atlas-trend__panel")
          .attr("data-area", area)
          .attr("transform", `translate(${px}, ${py})`);

        // Panel data: 3 series, one per region
        const series = regions.map(r => ({
          slug:  r.slug,
          label: r.label,
          color: REGION_COLORS[r.slug],
          points: congs.map(c => {
            const cell = byKey.get(`${c}|${r.slug}|${area}`);
            return cell ? { x: c, y: valueOf(cell, metric, chamber), cell } : null;
          }).filter(Boolean),
        }));

        const ymax  = d3.max(series.flatMap(s => s.points.map(p => p.y))) || 1;
        const yScale = d3.scaleLinear().domain([0, ymax]).nice()
          .range([panelH - margin.bottom, margin.top]);

        // Panel background — slightly different fill if this panel is
        // the pinned one, so the user can find it at a glance.
        pg.append("rect")
          .attr("class", "atlas-trend__panel-bg")
          .attr("x", 0).attr("y", 0)
          .attr("width", panelW).attr("height", panelH)
          .attr("fill", (pinned && pinned.area === area) ? "#fff5e3" : "#fffdf8")
          .attr("rx", 4);

        // X axis with calendar-year ticks (auto-spaced)
        const innerPanelW = panelW - margin.left - margin.right;
        const minTickPx   = 56;
        const maxTicks    = Math.max(2, Math.floor(innerPanelW / minTickPx));
        const tickStep    = Math.max(1, Math.ceil(congs.length / maxTicks));
        const tickIdx     = new Set(
          congs.map((_, i) => i).filter(i => i % tickStep === 0)
        );
        tickIdx.add(congs.length - 1);
        const xAxis = d3.axisBottom(xScale)
          .tickValues(congs.filter((_, i) => tickIdx.has(i)))
          .tickFormat(d => String(congressToYear(d)))
          .tickSize(3);
        pg.append("g")
          .attr("class", "atlas-trend__axis")
          .attr("transform", `translate(0, ${panelH - margin.bottom})`)
          .call(xAxis);
        const yAxis = d3.axisLeft(yScale).ticks(4)
          .tickFormat(d => formatValue(d, metric)).tickSize(3);
        pg.append("g")
          .attr("class", "atlas-trend__axis")
          .attr("transform", `translate(${margin.left}, 0)`)
          .call(yAxis);

        // Panel title
        pg.append("text")
          .attr("x", margin.left).attr("y", margin.top - 10)
          .attr("class", "atlas-trend__title")
          .text(area);

        // Lines + static dot markers (no event handlers — markers only)
        const lineGen = d3.line().x(p => xScale(p.x)).y(p => yScale(p.y));
        series.forEach(s => {
          const dim = highlightedRegion && highlightedRegion !== s.slug;
          pg.append("path")
            .datum(s.points).attr("class", "atlas-trend__line")
            .attr("fill", "none")
            .attr("stroke", s.color)
            .attr("stroke-width", dim ? 1 : 2)
            .attr("opacity", dim ? 0.25 : 0.95)
            .attr("d", lineGen);
          pg.selectAll(null).data(s.points).join("circle")
            .attr("class", "atlas-trend__dot")
            .attr("cx", p => xScale(p.x)).attr("cy", p => yScale(p.y))
            .attr("r", dim ? 1.2 : 2)
            .attr("fill", s.color)
            .attr("opacity", dim ? 0.3 : 1)
            .style("pointer-events", "none");
        });

        // Pinned guide-line group (shown if this panel is pinned)
        const pinGroup = pg.append("g")
          .attr("class", "atlas-trend__pin")
          .style("display", "none");
        pinGroup.append("line")
          .attr("class", "atlas-trend__pin-line")
          .attr("y1", margin.top).attr("y2", panelH - margin.bottom);
        regions.forEach(r => {
          pinGroup.append("circle")
            .attr("class", "atlas-trend__pin-dot")
            .attr("data-region", r.slug)
            .attr("r", 4)
            .attr("fill", REGION_COLORS[r.slug])
            .attr("stroke", "#fff").attr("stroke-width", 1.5);
        });
        pinGroup.append("text")
          .attr("class", "atlas-trend__pin-label")
          .attr("text-anchor", "middle")
          .attr("y", margin.top - 14);

        // Live hover guide-line group (shown on mousemove over capture)
        const hoverGroup = pg.append("g")
          .attr("class", "atlas-trend__hover")
          .style("display", "none");
        hoverGroup.append("line")
          .attr("class", "atlas-trend__hover-line")
          .attr("y1", margin.top).attr("y2", panelH - margin.bottom);
        regions.forEach(r => {
          hoverGroup.append("circle")
            .attr("class", "atlas-trend__hover-dot")
            .attr("data-region", r.slug)
            .attr("r", 3)
            .attr("fill", REGION_COLORS[r.slug])
            .attr("opacity", 0.7);
        });
        hoverGroup.append("text")
          .attr("class", "atlas-trend__hover-label")
          .attr("text-anchor", "middle")
          .attr("y", margin.top - 14);

        // Apply pinned position if this is the pinned panel
        if (pinned && pinned.area === area) {
          applyGuide(pinGroup, pinned.cong, area, xScale, yScale);
          pinGroup.style("display", null);
        }

        // Invisible capture rect on top of the plot area
        const innerLeft  = margin.left;
        const innerRight = panelW - margin.right;
        const innerTop   = margin.top;
        const innerBot   = panelH - margin.bottom;
        pg.append("rect")
          .attr("class", "atlas-trend__capture")
          .attr("x", innerLeft).attr("y", innerTop)
          .attr("width", innerRight - innerLeft)
          .attr("height", innerBot - innerTop)
          .attr("fill", "transparent")
          .style("cursor", "crosshair")
          .on("mousemove", function (ev) {
            const [mx] = d3.pointer(ev, this);
            // d3.pointer returns coords in the target's local frame.
            // Since <rect> doesn't establish a new coordinate system,
            // mx is already in the parent panel's coords — same space
            // as xScale's range. Invert directly.
            const cong = nearestCong(xScale.invert(mx));
            applyGuide(hoverGroup, cong, area, xScale, yScale);
            hoverGroup.style("display", null);
          })
          .on("mouseleave", () => hoverGroup.style("display", "none"))
          .on("click", function (ev) {
            const [mx] = d3.pointer(ev, this);
            const cong = nearestCong(xScale.invert(mx));
            const wasSamePin = pinned && pinned.cong === cong && pinned.area === area;
            pinned = wasSamePin ? null : { cong, area };
            // Reset region selection when pin changes (or clears)
            selectedRegion = null;
            draw();
            updateDetailLeft();
            renderDetailRight();
          });
      });
    }

    // Position the guide-line group at a given Congress in a panel.
    function applyGuide(group, cong, area, xScale, yScale) {
      const x = xScale(cong);
      group.selectAll(".atlas-trend__pin-line, .atlas-trend__hover-line")
        .attr("x1", x).attr("x2", x);
      const metric  = metricSel.value;
      const chamber = chamberSel.value;
      regions.forEach(r => {
        const cell = byKey.get(`${cong}|${r.slug}|${area}`);
        const dot = group.select(`circle[data-region="${r.slug}"]`);
        if (cell) {
          dot.attr("cx", x).attr("cy", yScale(valueOf(cell, metric, chamber)))
             .style("display", null);
        } else {
          dot.style("display", "none");
        }
      });
      group.select("text").attr("x", x).text(congressSpanLabel(cong));
    }

    function nearestCong(invertedX) {
      let best = congs[0], bestD = Math.abs(invertedX - best);
      for (const c of congs) {
        const d = Math.abs(invertedX - c);
        if (d < bestD) { best = c; bestD = d; }
      }
      return best;
    }

    // ─── Detail panel: left column (regions for pinned cell) ───────
    function updateDetailLeft() {
      if (!pinned) {
        detail.setAttribute("hidden", "");
        return;
      }
      detail.removeAttribute("hidden");
      const { cong, area } = pinned;
      const metric = metricSel.value, chamber = chamberSel.value;
      const span = congressSpanLabel(cong);
      const partyLabel = (n, sing, plur) =>
        `${n.toLocaleString()} ${n === 1 ? sing : plur}`;
      const rows = regions.map(r => {
        const cell = byKey.get(`${cong}|${r.slug}|${area}`) || {};
        return { r, cell, v: valueOf(cell, metric, chamber), bp: cell.byParty || {} };
      });
      detailLeft.innerHTML =
          `<header class="atlas-trend__detail-header">`
        + `<div class="atlas-trend__detail-titles">`
        + `<h3>${escapeHtml(area)}</h3>`
        + `<p class="atlas-trend__detail-sub">${cong}th Congress · ${span} · `
        + `<span class="atlas-trend__detail-metric">${escapeHtml(METRIC_LABELS[metric])}</span></p>`
        + `</div>`
        + `<button type="button" class="atlas-trend__unpin-btn">Unpin</button>`
        + `</header>`
        + `<ol class="atlas-trend__regions">`
        + rows.map(({ r, cell, v, bp }) => `
            <li class="atlas-trend__region-row${selectedRegion === r.slug ? ' is-selected' : ''}">
              <button type="button" data-region="${r.slug}" class="atlas-trend__region-btn">
                <span class="atlas-trend__region-left">
                  <span class="atlas-trend__region-name">
                    <span class="atlas-trend__swatch" style="background:${REGION_COLORS[r.slug]}"></span>
                    ${escapeHtml(r.label)}
                  </span>
                  <span class="atlas-trend__region-sub">
                    <span class="atlas-trend__region-sub-line">${(cell.bills || 0).toLocaleString()} bills</span>
                    <span class="atlas-trend__region-sub-line">
                      <span class="dem">${partyLabel(bp.d || 0, 'Democrat', 'Democrats')}</span>,
                      <span class="rep">${partyLabel(bp.r || 0, 'Republican', 'Republicans')}</span>${bp.i ? `, <span class="ind">${partyLabel(bp.i, 'Independent', 'Independents')}</span>` : ''}
                    </span>
                  </span>
                </span>
                <span class="atlas-trend__region-right">
                  <span class="atlas-trend__region-val">${formatValue(v, metric)}</span>
                </span>
              </button>
            </li>`).join("")
        + `</ol>`;
      detailLeft.querySelector(".atlas-trend__unpin-btn").onclick = () => {
        pinned = null;
        selectedRegion = null;
        draw();
        updateDetailLeft();
        detailRight.innerHTML = "";
      };
      detailLeft.querySelectorAll(".atlas-trend__region-btn").forEach(btn => {
        btn.addEventListener("click", () => {
          selectedRegion = btn.dataset.region;
          updateDetailLeft();
          renderDetailRight();
        });
      });
    }

    // ─── Detail panel: right column (members + search + state filter) ─
    async function renderDetailRight() {
      if (!pinned || !selectedRegion) {
        detailRight.innerHTML =
          '<p class="atlas-trend__detail-empty">Select a region on the left to see its members.</p>';
        return;
      }
      const { cong, area } = pinned;
      const regionSlug = selectedRegion;
      let perCong = memberCache.get(cong);
      if (!perCong) {
        detailRight.innerHTML =
          `<p class="atlas-trend__detail-loading">Loading the ${cong}th Congress…</p>`;
        try {
          const r = await fetch(`${srcDir}atlas-regional-${cong}.json`);
          perCong = await r.json();
          memberCache.set(cong, perCong);
        } catch (err) {
          detailRight.innerHTML =
            `<p class="atlas-viz__error">Could not load member detail for the ${cong}th Congress.</p>`;
          return;
        }
        // Race protection — user may have pinned elsewhere during the await
        if (!pinned || pinned.cong !== cong || pinned.area !== area
            || selectedRegion !== regionSlug) return;
      }
      const regionInfo = (perCong.regions || []).find(r => r.slug === regionSlug);
      const all = (perCong.members || [])
        .filter(m => m.region === regionSlug && (m.totals[area] || 0) > 0);
      all.sort((a, b) => (b.totals[area] || 0) - (a.totals[area] || 0));

      const states = Array.from(new Set(all.map(m => m.state))).sort();
      const regionLabel = regions.find(r => r.slug === regionSlug).label;
      detailRight.innerHTML =
          `<header class="atlas-trend__right-header">`
        + `<h4>${escapeHtml(regionLabel)}</h4>`
        + `<p class="atlas-trend__right-sub">${all.length} of ${regionInfo ? regionInfo.memberCount : "?"} members cosponsored ≥1 bill in this area</p>`
        + `<input type="search" class="atlas-trend__search" placeholder="Search by name…" autocomplete="off">`
        + `<div class="atlas-trend__state-chips" role="group" aria-label="Filter by state">`
        + `<button type="button" data-state="" class="is-active">All</button>`
        + states.map(s => `<button type="button" data-state="${s}">${s}</button>`).join("")
        + `</div>`
        + `</header>`
        + `<div class="atlas-trend__members-headers" role="row" aria-hidden="true">`
        + `  <span aria-label="Party"></span>`
        + `  <span>Member</span>`
        + `  <span>State</span>`
        + `  <span class="atlas-trend__members-headers-count">Bills</span>`
        + `</div>`
        + `<ol class="atlas-trend__members"></ol>`;

      const ol     = detailRight.querySelector(".atlas-trend__members");
      const search = detailRight.querySelector(".atlas-trend__search");
      const chips  = detailRight.querySelectorAll(".atlas-trend__state-chips button");

      let query = "", stateFilter = null;
      function paint() {
        const q = query.toLowerCase();
        const matches = all.filter(m =>
          (!stateFilter || m.state === stateFilter)
          && (!q || m.name.toLowerCase().includes(q))
        );
        ol.innerHTML = matches.length
          ? matches.map(m => {
              const partyClass = m.party === "R" ? "rep" : m.party === "D" ? "dem" : "ind";
              const cleanName = m.name.replace(/^(Sen\.|Rep\.|Del\.|Res\.)\s*/, "")
                                      .replace(/\s+\[.*?\]$/, "");
              const chamberLabel = m.chamber === "senate" ? "Senate" : "House";
              return `<li>`
                + `<span class="atlas-viz__pty atlas-viz__pty--${partyClass}">${m.party || "?"}</span>`
                + `<span class="atlas-viz__name">${escapeHtml(cleanName)}</span>`
                + `<span class="atlas-viz__st">${m.state} · ${chamberLabel}</span>`
                + `<span class="atlas-viz__ct">${m.totals[area]}</span>`
                + `</li>`;
            }).join("")
          : `<li class="atlas-trend__no-match">No members match this filter.</li>`;
      }
      search.addEventListener("input", () => { query = search.value; paint(); });
      chips.forEach(c => c.addEventListener("click", () => {
        chips.forEach(x => x.classList.remove("is-active"));
        c.classList.add("is-active");
        stateFilter = c.dataset.state || null;
        paint();
      }));
      paint();
    }

    metricSel.addEventListener("change", () => { draw(); updateDetailLeft(); });
    chamberSel.addEventListener("change", () => { draw(); updateDetailLeft(); });
    window.addEventListener("resize", debounce(() => { draw(); }, 120));
    draw();
  }

  // ───────────── Shared UI / drawing helpers ─────────────
  function controlsRow(container) {
    const c = document.createElement("div");
    c.className = "atlas-viz__controls";
    container.appendChild(c);
    return c;
  }
  function makeSelect(parent, label, options, initial) {
    const wrap = document.createElement("label");
    wrap.className = "atlas-viz__control";
    wrap.innerHTML = `<span class="atlas-viz__control-label">${label}:</span> `;
    const sel = document.createElement("select");
    sel.className = "atlas-viz__metric-select";
    Object.entries(options).forEach(([k, v]) => {
      const o = document.createElement("option");
      o.value = k; o.textContent = v;
      if (k === initial) o.selected = true;
      sel.appendChild(o);
    });
    wrap.appendChild(sel);
    parent.appendChild(wrap);
    return sel;
  }
  function formatValue(v, metric) {
    if (metric === "shareofregion") return (v * 100).toFixed(1) + "%";
    if (metric === "permember")     return v.toFixed(1);
    return v.toLocaleString();
  }
  function escapeHtml(s) {
    return String(s || "").replace(/[&<>"']/g,
      c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
  }
  function debounce(fn, ms) { let t; return () => { clearTimeout(t); t = setTimeout(fn, ms); }; }

  function init() { document.querySelectorAll('[data-viz="atlas"]').forEach(initAtlas); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
