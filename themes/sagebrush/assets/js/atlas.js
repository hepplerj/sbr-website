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
// A `mode` field dispatches between two mounts:
//   "trends"    — small-multiples (above). Unchanged; see renderTrends.
//   "footprint" — ranked horizontal stacked bars, one row per state,
//                 % of state land in federal fee / trust / easement
//                 interest. See renderFootprint. Config:
//   {
//     mode: "footprint",
//     src:  "/data/federal-footprint.json",
//   }
//
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

    const mode = (cfg.mode || "trends").toLowerCase();

    if (mode === "footprint") {
      fetch(src)
        .then(r => r.json())
        .then(data => renderFootprint(container, data, cfg))
        .catch(err => {
          console.error("atlas fetch failed", err);
          container.innerHTML = '<p class="atlas-viz__error">Could not load data.</p>';
        });
      return;
    }

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

  // ─────────────────────── FOOTPRINT MODE ───────────────────────
  // Ranked horizontal stacked bars, one row per state: federal interest
  // as % of state land. Percent-of-state is computed here from
  // `landacres` — never shipped in the data file, so the two can't
  // disagree (spec §Output schema notes).
  //
  // Interaction model:
  //   - Sort control re-ranks rows; existing rows animate to their new
  //     y-position (d3 transition), matching the cosponsorship pinning
  //     grammar used by renderTrends.
  //   - Hover a row → highlight + one-line readout above the chart
  //     (not a floating tooltip — matches spec instruction).
  //   - Click a row → pin → two-column detail panel below (40/60,
  //     stacks narrow): left = breakdown table, right = cumulative
  //     easement-acquisition curve with hover guide.
  const FOOTPRINT_AGENCY_COLORS = {
    blm: "#c9a978", fs: "#4a9e5c", fws: "#8aa07c", nps: "#3a5982", dod: "#7a7367",
  };
  const FOOTPRINT_TRUST_COLOR     = "#a94b2b";
  const FOOTPRINT_EASEMENT_COLOR  = "#1f6b66";

  function renderFootprint(container, data, cfg) {
    const agencies      = data.agencies || ["blm", "fs", "fws", "nps", "dod"];
    const agencyLabels  = data.agencylabels || {};

    const states = (data.states || []).map((s, i) => {
      const land        = s.landacres || 1;
      const feePct       = ((s.feetotal || 0) / land) * 100;
      const trustPct     = ((s.trust || 0) / land) * 100;
      const easeAcres    = (s.easements && s.easements.acres) || 0;
      const easePct      = (easeAcres / land) * 100;
      return Object.assign({}, s, {
        _order: i,
        _feePct: feePct,
        _trustPct: trustPct,
        _easementPct: easePct,
        _easementAcres: easeAcres,
        _totalPct: feePct + trustPct + easePct,
      });
    });

    const SORTS = {
      total:         { label: "Total federal interest %", fn: (a, b) => b._totalPct - a._totalPct },
      fee:           { label: "Fee %",                     fn: (a, b) => b._feePct - a._feePct },
      trust:         { label: "Trust %",                   fn: (a, b) => b._trustPct - a._trustPct },
      easementpct:   { label: "Easement %",                fn: (a, b) => b._easementPct - a._easementPct },
      easementacres: { label: "Easement acres",            fn: (a, b) => b._easementAcres - a._easementAcres },
      fileorder:     { label: "North → South",             fn: (a, b) => a._order - b._order },
    };
    const sortLabels = {};
    Object.keys(SORTS).forEach(k => { sortLabels[k] = SORTS[k].label; });

    // ─── Controls ────────────────────────────────────────────────
    const ctrls = controlsRow(container);
    const sortSel = makeSelect(ctrls, "Sort by", sortLabels, "total");
    const metaSpan = document.createElement("span");
    metaSpan.className = "atlas-viz__meta";
    metaSpan.textContent = `${states.length} states` + (data.retrieved ? ` · retrieved ${data.retrieved}` : "");
    ctrls.appendChild(metaSpan);

    // ─── Hover readout (fixed, not a floating tooltip) ─────────────
    const readout = document.createElement("div");
    readout.className = "atlas-footprint__readout";
    readout.textContent = "Hover a state to see its federal-interest breakdown. Click to pin.";
    container.appendChild(readout);

    // ─── SVG canvas ─────────────────────────────────────────────────
    const svgWrap = document.createElement("div");
    svgWrap.className = "atlas-viz__svg-wrap";
    container.appendChild(svgWrap);
    const svg = d3.select(svgWrap).append("svg")
      .attr("class", "atlas-viz__svg atlas-footprint__svg").attr("role", "img");

    const hatchId = "footprint-trust-hatch";
    const defs = svg.append("defs");
    const hatchPattern = defs.append("pattern")
      .attr("id", hatchId)
      .attr("patternUnits", "userSpaceOnUse")
      .attr("width", 4).attr("height", 4)
      .attr("patternTransform", "rotate(45)");
    hatchPattern.append("rect")
      .attr("width", 4).attr("height", 4)
      .attr("fill", FOOTPRINT_TRUST_COLOR).attr("fill-opacity", 0.6);
    hatchPattern.append("line")
      .attr("x1", 0).attr("y1", 0).attr("x2", 0).attr("y2", 4)
      .attr("stroke", FOOTPRINT_TRUST_COLOR).attr("stroke-width", 1.6);

    const rowsGroup = svg.append("g").attr("class", "atlas-footprint__rows");

    // ─── Legend (segment meaning) ───────────────────────────────────
    const legend = document.createElement("div");
    legend.className = "atlas-viz__legend-strip atlas-footprint__legend";
    const legendItems = agencies.map(a => ({
      key: a,
      label: agencyLabels[a] || a.toUpperCase(), color: FOOTPRINT_AGENCY_COLORS[a] || "#999",
    })).concat([
      { key: "trust", label: "Trust (BIA LAR, hatched)", color: FOOTPRINT_TRUST_COLOR, hatch: true },
      { key: "easements", label: "Easements", color: FOOTPRINT_EASEMENT_COLOR },
    ]);
    // Chip lookup by segment key, so hovering a bar segment can light up the
    // matching legend entry.
    const legendChips = new Map();
    legendItems.forEach(li => {
      const chip = document.createElement("span");
      chip.className = "atlas-viz__legend-chip atlas-footprint__legend-chip";
      chip.innerHTML = `<span class="atlas-viz__swatch" style="background:${li.color};border-radius:2px;${li.hatch ? "background-image:repeating-linear-gradient(45deg,rgba(0,0,0,.35) 0 1px,transparent 1px 4px);" : ""}"></span>${escapeHtml(li.label)}`;
      legend.appendChild(chip);
      legendChips.set(li.key, chip);
    });
    container.insertBefore(legend, svgWrap);

    // Mouse-follow segment popup. Lives in the svg wrapper so its coordinates
    // are the same space as d3.pointer(ev, svgWrap).
    const segTip = document.createElement("div");
    segTip.className = "atlas-footprint__tip";
    segTip.setAttribute("hidden", "");
    svgWrap.appendChild(segTip);

    const segLabel = key =>
      key === "trust" ? "Land held in trust" :
      key === "easements" ? "Federal easements" :
      (agencyLabels[key] || key.toUpperCase());

    function setHotSegment(key) {
      legendChips.forEach((chip, k) => {
        chip.classList.toggle("is-hot", k === key);
        chip.classList.toggle("is-dim", key != null && k !== key);
      });
    }

    function showSegTip(ev, d, seg) {
      const [px, py] = d3.pointer(ev, svgWrap);
      segTip.innerHTML = `<strong>${escapeHtml(segLabel(seg.key))}</strong>`
        + `<span>${Math.round(seg.acres).toLocaleString()} acres · ${formatPctFP(seg.pct)} of ${escapeHtml(d.name)}</span>`;
      segTip.removeAttribute("hidden");
      // Right of the cursor unless that would clip; never past the wrap edge.
      const w = segTip.offsetWidth || 180;
      const x = (px + 14 + w > svgWrap.clientWidth) ? Math.max(2, px - w - 14) : px + 14;
      segTip.style.left = x + "px";
      segTip.style.top = Math.max(2, py - 34) + "px";
    }

    function hideSegTip() {
      segTip.setAttribute("hidden", "");
      setHotSegment(null);
    }

    // ─── Detail panel scaffold ────────────────────────────────────
    const detail = document.createElement("div");
    detail.className = "atlas-footprint__detail";
    detail.setAttribute("hidden", "");
    detail.innerHTML =
        '<div class="atlas-footprint__detail-left"></div>'
      + '<div class="atlas-footprint__detail-right"></div>';
    container.appendChild(detail);
    const detailLeft  = detail.querySelector(".atlas-footprint__detail-left");
    const detailRight = detail.querySelector(".atlas-footprint__detail-right");

    // ─── State ───────────────────────────────────────────────────
    let pinnedAbbr = null;
    let hoveredAbbr = null;

    function currentSort() {
      return SORTS[sortSel.value] || SORTS.total;
    }

    function segmentsFor(d, xScale) {
      const land = d.landacres || 1;
      const segs = [];
      let cum = 0;
      agencies.forEach(a => {
        const acres = (d.fee && d.fee[a]) || 0;
        const pct = (acres / land) * 100;
        const x0 = xScale(cum);
        cum += pct;
        const x1 = xScale(cum);
        segs.push({ key: a, x0, x1, pct, acres, color: FOOTPRINT_AGENCY_COLORS[a] || "#999" });
      });
      {
        const acres = d.trust || 0;
        const pct = d._trustPct;
        const x0 = xScale(cum);
        cum += pct;
        const x1 = xScale(cum);
        segs.push({ key: "trust", x0, x1, pct, acres, pattern: true });
      }
      {
        const acres = d._easementAcres;
        const pct = d._easementPct;
        const x0 = xScale(cum);
        cum += pct;
        const x1 = xScale(cum);
        segs.push({ key: "easements", x0, x1, pct, acres, color: FOOTPRINT_EASEMENT_COLOR });
      }
      return { segs, total: cum };
    }

    function readoutText(d) {
      return `${d.name} (${d.abbr}) — ${formatPctFP(d._totalPct)} of state land under federal `
        + `interest: fee ${formatPctFP(d._feePct)}, trust ${formatPctFP(d._trustPct)}, `
        + `easements ${formatPctFP(d._easementPct)} (${Math.round(d._easementAcres).toLocaleString()} ac).`;
    }
    function setReadout(d) {
      readout.textContent = d ? readoutText(d)
        : "Hover a state to see its federal-interest breakdown. Click to pin.";
    }

    function draw(animate) {
      const width  = svgWrap.clientWidth || 900;
      const narrow = width < 560;
      const rowH   = narrow ? 28 : 32;
      const margin = { top: 6, right: 60, bottom: 6, left: narrow ? 46 : 150 };
      const barMax = d3.max(states, d => d._totalPct) || 1;
      const xScale = d3.scaleLinear().domain([0, barMax]).nice()
        .range([margin.left, Math.max(margin.left + 40, width - margin.right)]);

      const sorted = states.slice().sort(currentSort().fn);
      const yOf = new Map(sorted.map((s, i) => [s.abbr, margin.top + i * rowH]));
      const totalH = margin.top + sorted.length * rowH + margin.bottom;

      svg.attr("viewBox", `0 0 ${width} ${totalH}`).attr("width", width).attr("height", totalH);

      const rows = rowsGroup.selectAll(".atlas-footprint__row")
        .data(states, d => d.abbr);

      const rowsEnter = rows.enter().append("g")
        .attr("class", "atlas-footprint__row")
        .attr("transform", d => `translate(0, ${yOf.get(d.abbr)})`);

      rowsEnter.append("rect")
        .attr("class", "atlas-footprint__hit")
        .attr("x", 0).attr("y", 1)
        .attr("fill", "transparent");
      rowsEnter.append("text")
        .attr("class", "atlas-footprint__label")
        .attr("text-anchor", "end");
      rowsEnter.append("g").attr("class", "atlas-footprint__segments");
      rowsEnter.append("text")
        .attr("class", "atlas-footprint__value");

      rows.exit().remove();

      // Position: instant on enter, transition on re-sort of existing rows.
      if (animate) {
        rows.transition().duration(450).ease(d3.easeCubicOut)
          .attr("transform", d => `translate(0, ${yOf.get(d.abbr)})`);
      } else {
        rows.attr("transform", d => `translate(0, ${yOf.get(d.abbr)})`);
      }

      const rowsAll = rowsEnter.merge(rows);

      rowsAll.select(".atlas-footprint__hit")
        .attr("width", width)
        .attr("height", rowH - 2);

      rowsAll.select(".atlas-footprint__label")
        .attr("x", margin.left - 10)
        .attr("y", rowH / 2).attr("dy", "0.35em")
        .text(d => narrow ? d.abbr : `${d.abbr} — ${d.name}`);

      rowsAll.each(function (d) {
        const { segs, total } = segmentsFor(d, xScale);
        const g = d3.select(this).select(".atlas-footprint__segments");
        const sel = g.selectAll("rect").data(segs, s => s.key);
        sel.enter().append("rect")
          .merge(sel)
            .attr("x", s => s.x0)
            .attr("y", 3)
            .attr("width", s => Math.max(0, s.x1 - s.x0))
            .attr("height", rowH - 6)
            .attr("fill", s => (s.pattern ? `url(#${hatchId})` : s.color));
        sel.exit().remove();

        d3.select(this).select(".atlas-footprint__value")
          .attr("x", xScale(total) + 6)
          .attr("y", rowH / 2).attr("dy", "0.35em")
          .text(formatPctFP(total));
      });

      rowsAll
        .classed("is-hover", d => d.abbr === hoveredAbbr)
        .classed("is-pinned", d => d.abbr === pinnedAbbr);

      rowsAll.select(".atlas-footprint__hit")
        .on("mouseenter", function (ev, d) {
          hoveredAbbr = d.abbr;
          rowsAll.classed("is-hover", r => r.abbr === hoveredAbbr);
          setReadout(d);
        })
        // Segments and labels are pointer-events:none (so clicks reach this
        // rect), which means they can't take their own hover events. Instead,
        // resolve the segment from the cursor's x — the SVG's user units equal
        // CSS pixels here (viewBox width == width attr), so d3.pointer x
        // compares directly against each segment's [x0, x1) span.
        .on("mousemove", function (ev, d) {
          const [mx] = d3.pointer(ev, svg.node());
          const seg = segmentsFor(d, xScale).segs
            .find(s => mx >= s.x0 && mx < s.x1 && s.x1 - s.x0 > 0);
          if (seg && seg.pct > 0) {
            setHotSegment(seg.key);
            showSegTip(ev, d, seg);
          } else {
            hideSegTip();
          }
        })
        .on("mouseleave", function () {
          hoveredAbbr = null;
          rowsAll.classed("is-hover", false);
          hideSegTip();
          setReadout(pinnedAbbr ? states.find(s => s.abbr === pinnedAbbr) : null);
        })
        .on("click", function (ev, d) {
          pinnedAbbr = (pinnedAbbr === d.abbr) ? null : d.abbr;
          rowsAll.classed("is-pinned", r => r.abbr === pinnedAbbr);
          setReadout(pinnedAbbr ? d : null);
          updateDetail();
        });
    }

    // ─── Detail panel ────────────────────────────────────────────
    function updateDetail() {
      if (!pinnedAbbr) {
        detail.setAttribute("hidden", "");
        detailLeft.innerHTML = "";
        detailRight.innerHTML = "";
        return;
      }
      const d = states.find(s => s.abbr === pinnedAbbr);
      if (!d) { detail.setAttribute("hidden", ""); return; }
      detail.removeAttribute("hidden");

      const land = d.landacres || 1;
      const agencyRows = agencies.map(a => {
        const acres = (d.fee && d.fee[a]) || 0;
        const pct = (acres / land) * 100;
        return `<tr><td>${escapeHtml(agencyLabels[a] || a.toUpperCase())}</td>
          <td class="atlas-footprint__num">${Math.round(acres).toLocaleString()}</td>
          <td class="atlas-footprint__num">${formatPctFP(pct)}</td></tr>`;
      }).join("");

      const ease = d.easements || {};
      detailLeft.innerHTML =
          `<header class="atlas-footprint__detail-header">`
        + `<div class="atlas-footprint__detail-titles">`
        + `<h3>${escapeHtml(d.name)} <span class="atlas-footprint__detail-abbr">(${escapeHtml(d.abbr)})</span></h3>`
        + `<p class="atlas-footprint__detail-sub">${formatPctFP(d._totalPct)} of state land under federal interest</p>`
        + `</div>`
        + `<button type="button" class="atlas-footprint__unpin-btn">Unpin</button>`
        + `</header>`
        + `<table class="atlas-footprint__table">`
        + `<thead><tr><th>Interest</th><th class="atlas-footprint__num">Acres</th><th class="atlas-footprint__num">% of state</th></tr></thead>`
        + `<tbody>`
        + agencyRows
        + `<tr class="atlas-footprint__subtotal"><td>Fee total</td>`
        + `<td class="atlas-footprint__num">${Math.round(d.feetotal || 0).toLocaleString()}</td>`
        + `<td class="atlas-footprint__num">${formatPctFP(d._feePct)}</td></tr>`
        + `<tr><td>Trust (BIA LAR)</td>`
        + `<td class="atlas-footprint__num">${Math.round(d.trust || 0).toLocaleString()}</td>`
        + `<td class="atlas-footprint__num">${formatPctFP(d._trustPct)}</td></tr>`
        + `<tr><td>Easements (${(ease.tracts || 0).toLocaleString()} tracts)</td>`
        + `<td class="atlas-footprint__num">${Math.round(d._easementAcres).toLocaleString()}</td>`
        + `<td class="atlas-footprint__num">${formatPctFP(d._easementPct)}</td></tr>`
        + `<tr class="atlas-footprint__grandtotal"><td>Grand total federal interest</td>`
        + `<td class="atlas-footprint__num">${Math.round((d.feetotal || 0) + (d.trust || 0) + d._easementAcres).toLocaleString()}</td>`
        + `<td class="atlas-footprint__num">${formatPctFP(d._totalPct)}</td></tr>`
        + `</tbody></table>`
        + `<p class="atlas-footprint__caveat">Easements are a property interest in private land, `
        + `counted here as federal interest, not federal ownership.</p>`;

      detailLeft.querySelector(".atlas-footprint__unpin-btn").onclick = () => {
        pinnedAbbr = null;
        hoveredAbbr = null;
        draw(false);
        setReadout(null);
        updateDetail();
      };

      drawCurve(detailRight, d);
    }

    // ─── Right column: cumulative easement-acquisition curve ───────
    function drawCurve(host, d) {
      const ease = d.easements || {};
      const cumulative = ease.cumulative || [];
      host.innerHTML = '<h4 class="atlas-footprint__curve-title">Cumulative easement acreage acquired</h4>'
        + '<div class="atlas-footprint__curve-wrap"></div>';
      const wrap = host.querySelector(".atlas-footprint__curve-wrap");

      if (!cumulative.length) {
        wrap.innerHTML = '<p class="atlas-trend__detail-empty">No dated easement acquisitions on record for this state.</p>';
        return;
      }

      const width  = wrap.clientWidth || 420;
      const height = 220;
      const margin = { top: 14, right: 16, bottom: 28, left: 52 };

      const svgC = d3.select(wrap).append("svg")
        .attr("class", "atlas-footprint__curve-svg")
        .attr("viewBox", `0 0 ${width} ${height}`)
        .attr("width", width).attr("height", height).attr("role", "img");

      const years = cumulative.map(p => p[0]);
      const xDomain = [Math.min(1888, years[0]), Math.max(2026, years[years.length - 1])];
      const xScale = d3.scaleLinear().domain(xDomain).range([margin.left, width - margin.right]);
      const yScale = d3.scaleLinear().domain([0, d3.max(cumulative, p => p[1]) || 1]).nice()
        .range([height - margin.bottom, margin.top]);

      const area = d3.area()
        .x(p => xScale(p[0])).y0(height - margin.bottom).y1(p => yScale(p[1]));
      const line = d3.line()
        .x(p => xScale(p[0])).y(p => yScale(p[1]));

      svgC.append("path").datum(cumulative)
        .attr("class", "atlas-footprint__curve-area").attr("d", area);
      svgC.append("path").datum(cumulative)
        .attr("class", "atlas-footprint__curve-line").attr("fill", "none").attr("d", line);

      const siFormat = d3.format(".2~s");
      const xAxis = d3.axisBottom(xScale).ticks(Math.max(2, Math.floor(width / 90))).tickFormat(d3.format("d"));
      const yAxis = d3.axisLeft(yScale).ticks(4).tickFormat(siFormat);
      svgC.append("g").attr("class", "atlas-trend__axis")
        .attr("transform", `translate(0, ${height - margin.bottom})`).call(xAxis);
      svgC.append("g").attr("class", "atlas-trend__axis")
        .attr("transform", `translate(${margin.left}, 0)`).call(yAxis);

      // Hover guide, snapping to the nearest recorded point.
      const guide = svgC.append("g").attr("class", "atlas-footprint__curve-guide").style("display", "none");
      guide.append("line")
        .attr("y1", margin.top).attr("y2", height - margin.bottom)
        .attr("class", "atlas-trend__hover-line");
      guide.append("circle").attr("r", 3.5).attr("class", "atlas-footprint__curve-dot");
      guide.append("text").attr("class", "atlas-trend__hover-label").attr("text-anchor", "middle");

      svgC.append("rect")
        .attr("x", margin.left).attr("y", margin.top)
        .attr("width", Math.max(0, width - margin.left - margin.right))
        .attr("height", Math.max(0, height - margin.top - margin.bottom))
        .attr("fill", "transparent")
        .style("cursor", "crosshair")
        .on("mousemove", function (ev) {
          const [mx] = d3.pointer(ev, this);
          const yr = xScale.invert(mx);
          let best = cumulative[0], bestD = Math.abs(yr - best[0]);
          cumulative.forEach(p => {
            const dd = Math.abs(yr - p[0]);
            if (dd < bestD) { best = p; bestD = dd; }
          });
          const gx = xScale(best[0]), gy = yScale(best[1]);
          guide.select("line").attr("x1", gx).attr("x2", gx);
          guide.select("circle").attr("cx", gx).attr("cy", gy);
          guide.select("text").attr("x", gx).attr("y", margin.top - 4)
            .text(`${best[0]} · ${siFormat(best[1])} ac`);
          guide.style("display", null);
        })
        .on("mouseleave", () => guide.style("display", "none"));

      if (ease.undated) {
        const cap = document.createElement("p");
        cap.className = "atlas-footprint__undated";
        cap.textContent = `${ease.undated.toLocaleString()} additional tract${ease.undated === 1 ? "" : "s"} `
          + `have no recorded acquisition date and are omitted from this curve.`;
        wrap.appendChild(cap);
      }
    }

    sortSel.addEventListener("change", () => draw(true));
    window.addEventListener("resize", debounce(() => draw(false), 120));
    draw(false);
  }
  function formatPctFP(v) { return (Math.round(v * 10) / 10).toFixed(1) + "%"; }

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
