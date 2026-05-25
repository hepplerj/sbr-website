// ─────────────────────────────────────────────
// Governing Ground — atlas renderer
// Two modes for the regional-cosponsorship views:
//   mode: "heatmap" (default) — region × policy-area grid for one Congress
//   mode: "trends"             — small-multiples lines, one per policy area,
//                                three lines per panel (one per region),
//                                X = Congress, Y = chosen metric
//
// Mounts on elements with data-viz="atlas". Config and data shapes
// follow scripts/build_atlas_regional.py.
//
// Heatmap config (lowercase — Hugo lowercases frontmatter keys):
//   {
//     mode:    "heatmap",
//     src:     "/data/atlas-regional-117.json",
//     metric:  "permember" | "shareofregion" | "cosponsorships",
//     chamber: "both" | "house" | "senate",      // default "both"
//   }
//
// Trends config:
//   {
//     mode:    "trends",
//     src:     "/data/atlas-regional-timeseries.json",
//     metric:  "permember" | "shareofregion" | "cosponsorships",
//     chamber: "both" | "house" | "senate",
//   }
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

  const COLOR_DOMAIN = ["#f7f2ec", "#e8d4b8", "#d09870", "#a94b2b", "#6b2d18"];

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
    "corn-belt":    "#4a5640",
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

    const mode    = (cfg.mode    || "heatmap").toLowerCase();
    let   metric  = (cfg.metric  || "permember").toLowerCase();
    let   chamber = (cfg.chamber || "both").toLowerCase();
    if (!(metric  in METRIC_FIELD))   metric  = "permember";
    if (!(chamber in CHAMBER_LABELS)) chamber = "both";

    fetch(src)
      .then(r => r.json())
      .then(data => {
        if (mode === "trends") renderTrends(container, data, cfg, metric, chamber);
        else                   renderHeatmap(container, data, cfg, metric, chamber);
      })
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

  // ───────────────────────── HEATMAP MODE ─────────────────────────
  function renderHeatmap(container, data, cfg, initialMetric, initialChamber) {
    const regions = data.regions;
    const areas   = data.policyAreas;
    const cells   = data.cells;
    const cellByKey = new Map(cells.map(c => [c.region + "|" + c.policyArea, c]));

    const ctrls = controlsRow(container);
    const metricSel  = makeSelect(ctrls, "Show", METRIC_LABELS, initialMetric);
    const chamberSel = makeSelect(ctrls, "Chamber", CHAMBER_LABELS, initialChamber);

    const meta = document.createElement("span");
    meta.className = "atlas-viz__meta";
    meta.textContent = `${data.billsKept.toLocaleString()} bills · `
      + `${regions.reduce((a, r) => a + r.memberCount, 0)} members `
      + `· ${data.congress}th Congress (${data.years})`;
    ctrls.appendChild(meta);

    const margin = { top: 28, right: 16, bottom: 110, left: 220 };
    const cellH = 56;
    const innerH = regions.length * cellH;

    const svgWrap = document.createElement("div");
    svgWrap.className = "atlas-viz__svg-wrap";
    container.appendChild(svgWrap);
    const svg = d3.select(svgWrap).append("svg")
      .attr("class", "atlas-viz__svg").attr("role", "img");

    const tooltip = makeTooltip(container);
    const drill   = makeDrill(container);
    const g       = svg.append("g");

    function draw() {
      const metric  = metricSel.value;
      const chamber = chamberSel.value;
      const field   = METRIC_FIELD[metric];
      const width   = svgWrap.clientWidth || 800;
      const innerW  = Math.max(320, width - margin.left - margin.right);
      const cellW   = innerW / areas.length;
      const totalH  = innerH + margin.top + margin.bottom;

      svg.attr("viewBox", `0 0 ${width} ${totalH}`)
         .attr("width", width).attr("height", totalH);
      g.attr("transform", `translate(${margin.left},${margin.top})`);
      g.selectAll("*").remove();

      const vals = cells.map(c => valueOf(c, metric, chamber));
      const vmax = d3.max(vals) || 1;
      const color = d3.scaleQuantize().domain([0, vmax]).range(COLOR_DOMAIN);

      // Row labels
      g.selectAll(".atlas-row-label")
        .data(regions).join("text")
        .attr("class", "atlas-row-label")
        .attr("x", -12).attr("y", (_, i) => i * cellH + cellH / 2)
        .attr("text-anchor", "end")
        .each(function (r) {
          const s = d3.select(this);
          const memN = chamber === "house"  ? r.memberHouse
                     : chamber === "senate" ? r.memberSenate
                     : r.memberCount;
          s.append("tspan").attr("x", -12).attr("dy", "-0.4em")
            .attr("class", "atlas-row-label__main").text(r.label);
          s.append("tspan").attr("x", -12).attr("dy", "1.2em")
            .attr("class", "atlas-row-label__sub")
            .text(`${memN} member${memN === 1 ? "" : "s"}`);
        });

      // Column labels
      g.selectAll(".atlas-col-label")
        .data(areas).join("text")
        .attr("class", "atlas-col-label")
        .attr("x", (_, i) => i * cellW + cellW / 2)
        .attr("y", innerH + 14).attr("text-anchor", "end")
        .attr("transform", (_, i) =>
          `rotate(-32, ${i * cellW + cellW / 2}, ${innerH + 14})`)
        .text(d => d);

      // Cells
      const cellG = g.selectAll(".atlas-cell")
        .data(regions.flatMap(r =>
          areas.map(a => {
            const base = cellByKey.get(r.slug + "|" + a) || {};
            return Object.assign({ _region: r, _area: a }, base);
          })))
        .join("g")
        .attr("class", "atlas-cell")
        .attr("transform", d => {
          const ri = regions.indexOf(d._region);
          const ai = areas.indexOf(d._area);
          return `translate(${ai * cellW}, ${ri * cellH})`;
        })
        .style("cursor", "pointer")
        .on("mousemove", (ev, d) => showHeatmapTooltip(ev, d, metric, chamber, tooltip, container))
        .on("mouseleave", () => tooltip.setAttribute("hidden", ""))
        .on("click", d_ev_capture(d => openDrill(drill, d, data, container)));

      cellG.append("rect")
        .attr("width", cellW - 2).attr("height", cellH - 2).attr("rx", 4)
        .attr("fill", d => color(valueOf(d, metric, chamber)));

      cellG.append("text")
        .attr("x", (cellW - 2) / 2).attr("y", (cellH - 2) / 2)
        .attr("text-anchor", "middle").attr("dy", "0.32em")
        .attr("class", "atlas-cell__value")
        .attr("fill", d => valueOf(d, metric, chamber) > vmax * 0.55
              ? "#f7f2ec" : "#2b2b2b")
        .text(d => formatValue(valueOf(d, metric, chamber), metric));

      drawLegend(g, innerH + 70, vmax, metric, chamber);
    }

    metricSel.addEventListener("change", draw);
    chamberSel.addEventListener("change", draw);
    window.addEventListener("resize", debounce(draw, 120));
    draw();
  }

  // ───────────────────────── TRENDS MODE ─────────────────────────
  function renderTrends(container, data, cfg, initialMetric, initialChamber) {
    const regions = data.regions;
    const areas   = data.policyAreas;
    const congs   = data.congresses;
    const meta    = data.congressMeta || {};

    // Index cells: (congress, region, policyArea) → cell
    const byKey = new Map();
    data.cells.forEach(c => byKey.set(`${c.congress}|${c.region}|${c.policyArea}`, c));

    const ctrls = controlsRow(container);
    const metricSel  = makeSelect(ctrls, "Show", METRIC_LABELS, initialMetric);
    const chamberSel = makeSelect(ctrls, "Chamber", CHAMBER_LABELS, initialChamber);

    const m = document.createElement("span");
    m.className = "atlas-viz__meta";
    const startYr = congressToYear(congs[0]);
    const endYr   = congressToYear(congs[congs.length - 1]) + 1;
    m.textContent = `${congs.length} Congresses · ${startYr}–${endYr}`;
    ctrls.appendChild(m);

    // Derive the per-Congress data dir from the time-series src
    // ("/data/atlas-regional-timeseries.json" → "/data/").
    const srcDir = cfg.src.replace(/\/[^/]+$/, "/");
    const memberCache = new Map();  // congress (number) → per-congress json
    const drill = makeDrill(container);

    // Region legend (clickable to highlight one series)
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

    const svgWrap = document.createElement("div");
    svgWrap.className = "atlas-viz__svg-wrap";
    container.appendChild(svgWrap);
    const svg = d3.select(svgWrap).append("svg")
      .attr("class", "atlas-viz__svg").attr("role", "img");

    const tooltip = makeTooltip(container);
    let highlightedRegion = null;
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

      const width = svgWrap.clientWidth || 900;
      const cols  = width < 720 ? 2 : 3;
      const rows  = Math.ceil(areas.length / cols);

      const margin = { top: 12, right: 14, bottom: 36, left: 46 };
      const gap    = 28;
      const panelW = (width - gap * (cols - 1)) / cols;
      const panelH = 160;
      const totalH = rows * panelH + (rows - 1) * gap + 16;

      svg.attr("viewBox", `0 0 ${width} ${totalH}`)
         .attr("width", width).attr("height", totalH);
      svg.selectAll("*").remove();

      const xScale = d3.scaleLinear().domain(d3.extent(congs)).range([margin.left, panelW - margin.right]);

      // Per-panel y-max from the visible chamber & metric
      areas.forEach((area, ai) => {
        const col = ai % cols;
        const row = Math.floor(ai / cols);
        const px  = col * (panelW + gap);
        const py  = row * (panelH + gap);

        const pg = svg.append("g").attr("transform", `translate(${px}, ${py})`);

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

        const yVals = series.flatMap(s => s.points.map(p => p.y));
        const ymax  = d3.max(yVals) || 1;
        const yScale = d3.scaleLinear().domain([0, ymax]).nice()
          .range([panelH - margin.bottom, margin.top]);

        // Panel background
        pg.append("rect")
          .attr("x", 0).attr("y", 0)
          .attr("width", panelW).attr("height", panelH)
          .attr("fill", "#fffdf8").attr("rx", 4);

        // Axes — minimal. X ticks show calendar years (first year of
        // each Congress). Aim for ~6–8 ticks per panel regardless of
        // series length: tickStep scales up as more Congresses are
        // packed in. With 24 Congresses (1979–present) we step every
        // 4th (8-year spacing); with the original 12 we step every
        // 2nd. The rightmost endpoint is always kept so the most
        // recent year stays legible.
        const innerPanelW = panelW - margin.left - margin.right;
        const minTickPx   = 56;  // ~7 chars + breathing room
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
          .attr("x", margin.left).attr("y", margin.top - 2)
          .attr("class", "atlas-trend__title")
          .text(area);

        const line = d3.line().x(p => xScale(p.x)).y(p => yScale(p.y));

        series.forEach(s => {
          const dim = highlightedRegion && highlightedRegion !== s.slug;
          pg.append("path")
            .datum(s.points).attr("class", "atlas-trend__line")
            .attr("fill", "none")
            .attr("stroke", s.color)
            .attr("stroke-width", dim ? 1 : 2)
            .attr("opacity", dim ? 0.25 : 0.95)
            .attr("d", line);
          pg.selectAll(null).data(s.points).join("circle")
            .attr("cx", p => xScale(p.x)).attr("cy", p => yScale(p.y))
            .attr("r", dim ? 1.5 : 2.5).attr("fill", s.color)
            .attr("opacity", dim ? 0.3 : 1)
            .style("cursor", "pointer")
            .on("mousemove", (ev, p) => showTrendTooltip(ev, p, s, area, metric, chamber, tooltip, container))
            .on("mouseleave", () => tooltip.setAttribute("hidden", ""))
            .on("click", (ev, p) => openTrendDrill(p, s, area));
        });
      });
    }

    async function openTrendDrill(p, s, area) {
      const cong = p.cell.congress;
      let perCong = memberCache.get(cong);
      if (!perCong) {
        drill.innerHTML =
            `<button class="atlas-viz__drill-close" aria-label="Close">×</button>`
          + `<div class="atlas-viz__drill-loading">Loading the ${cong}th Congress…</div>`;
        drill.removeAttribute("hidden");
        drill.querySelector(".atlas-viz__drill-close").onclick = () =>
          drill.setAttribute("hidden", "");
        try {
          const r = await fetch(`${srcDir}atlas-regional-${cong}.json`);
          perCong = await r.json();
          memberCache.set(cong, perCong);
        } catch (err) {
          drill.innerHTML =
              `<button class="atlas-viz__drill-close" aria-label="Close">×</button>`
            + `<p>Could not load member detail for the ${cong}th Congress.</p>`;
          drill.querySelector(".atlas-viz__drill-close").onclick = () =>
            drill.setAttribute("hidden", "");
          return;
        }
      }
      const region = (perCong.regions || []).find(r => r.slug === s.slug);
      const list = (perCong.members || [])
        .filter(m => m.region === s.slug && (m.totals[area] || 0) > 0)
        .sort((a, b) => (b.totals[area] || 0) - (a.totals[area] || 0))
        .slice(0, 25);
      const span = congressSpanLabel(cong);
      drill.innerHTML =
          `<button class="atlas-viz__drill-close" aria-label="Close">×</button>`
        + `<h3>${escapeHtml(s.label)} · ${cong}th (${span})</h3>`
        + `<div class="atlas-viz__drill-area">${escapeHtml(area)}</div>`
        + `<p class="atlas-viz__drill-sub">${list.length} of `
          + `${region ? region.memberCount : "?"} delegation members cosponsored `
          + `≥1 bill in this area. Top 25:</p>`
        + `<ol class="atlas-viz__drill-list">`
        + list.map(m => {
            const partyClass = m.party === "R" ? "rep" : m.party === "D" ? "dem" : "ind";
            const cleanName = m.name.replace(/^(Sen\.|Rep\.|Del\.|Res\.)\s*/, "")
                                    .replace(/\s+\[.*?\]$/, "");
            const chamberTag = m.chamber === "senate" ? "S" : "H";
            return `<li>`
              + `<span class="atlas-viz__pty atlas-viz__pty--${partyClass}">${m.party || "?"}</span>`
              + `<span class="atlas-viz__name">${escapeHtml(cleanName)}</span>`
              + `<span class="atlas-viz__st">${m.state} · ${chamberTag}</span>`
              + `<span class="atlas-viz__ct">${m.totals[area]}</span>`
              + `</li>`;
          }).join("")
        + `</ol>`;
      drill.removeAttribute("hidden");
      drill.querySelector(".atlas-viz__drill-close").onclick = () =>
        drill.setAttribute("hidden", "");
    }

    metricSel.addEventListener("change", draw);
    chamberSel.addEventListener("change", draw);
    window.addEventListener("resize", debounce(draw, 120));
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
  function makeTooltip(container) {
    const t = document.createElement("div");
    t.className = "atlas-viz__tooltip";
    t.setAttribute("hidden", "");
    container.appendChild(t);
    return t;
  }
  function makeDrill(container) {
    const d = document.createElement("div");
    d.className = "atlas-viz__drill";
    d.setAttribute("hidden", "");
    container.appendChild(d);
    return d;
  }
  function drawLegend(g, y, vmax, metric, chamber) {
    const lg = g.append("g").attr("class", "atlas-legend")
      .attr("transform", `translate(0, ${y})`);
    const legW = 220, legH = 10;
    lg.selectAll("rect").data(COLOR_DOMAIN).join("rect")
      .attr("x", (_, i) => i * (legW / COLOR_DOMAIN.length))
      .attr("width", legW / COLOR_DOMAIN.length)
      .attr("height", legH).attr("fill", d => d);
    lg.append("text").attr("y", -4).attr("class", "atlas-legend__title")
      .text(METRIC_LABELS[metric] + (chamber === "both" ? "" : ` (${CHAMBER_LABELS[chamber]})`));
    lg.append("text").attr("y", legH + 14).attr("x", 0)
      .attr("class", "atlas-legend__tick").text("0");
    lg.append("text").attr("y", legH + 14).attr("x", legW)
      .attr("text-anchor", "end").attr("class", "atlas-legend__tick")
      .text(formatValue(vmax, metric));
  }

  function showHeatmapTooltip(ev, d, metric, chamber, tooltip, container) {
    const v = valueOf(d, metric, chamber);
    const memN = chamber === "house"  ? d._region.memberHouse
               : chamber === "senate" ? d._region.memberSenate
               : d._region.memberCount;
    const bp = d.byParty || {};
    tooltip.innerHTML =
        `<div class="atlas-viz__tooltip-title">${escapeHtml(d._region.label)}</div>`
      + `<div class="atlas-viz__tooltip-area">${escapeHtml(d._area)}</div>`
      + `<dl>`
      + `<dt>${escapeHtml(METRIC_LABELS[metric])}</dt><dd>${formatValue(v, metric)}</dd>`
      + `<dt>Members (${chamber})</dt><dd>${memN}</dd>`
      + `<dt>Bills touched</dt><dd>${(d.bills || 0).toLocaleString()}</dd>`
      + `<dt>D / R / I cosp.</dt><dd>${bp.d||0} / ${bp.r||0} / ${bp.i||0}</dd>`
      + `</dl>`
      + `<div class="atlas-viz__tooltip-hint">Click for top members</div>`;
    positionTooltip(tooltip, ev, container, 240, 130);
  }

  function showTrendTooltip(ev, p, s, area, metric, chamber, tooltip, container) {
    const c = p.cell;
    const bp = c.byParty || {};
    const span = congressSpanLabel(c.congress);
    tooltip.innerHTML =
        `<div class="atlas-viz__tooltip-title">${escapeHtml(s.label)} · ${span}</div>`
      + `<div class="atlas-viz__tooltip-area">${escapeHtml(area)} · ${c.congress}th Cong.</div>`
      + `<dl>`
      + `<dt>${escapeHtml(METRIC_LABELS[metric])}</dt><dd>${formatValue(p.y, metric)}</dd>`
      + `<dt>Bills touched</dt><dd>${(c.bills || 0).toLocaleString()}</dd>`
      + `<dt>D / R / I cosp.</dt><dd>${bp.d||0} / ${bp.r||0} / ${bp.i||0}</dd>`
      + `</dl>`
      + `<div class="atlas-viz__tooltip-hint">Click for top members</div>`;
    positionTooltip(tooltip, ev, container, 240, 130);
  }
  function positionTooltip(tooltip, ev, container, w, h) {
    tooltip.removeAttribute("hidden");
    const rect = container.getBoundingClientRect();
    const x = ev.clientX - rect.left + 12;
    const y = ev.clientY - rect.top + 12;
    tooltip.style.left = Math.min(x, container.clientWidth - w) + "px";
    tooltip.style.top  = Math.min(y, container.clientHeight - h) + "px";
  }

  function openDrill(drill, d, data, container) {
    const slug = d._region.slug;
    const area = d._area;
    const list = (data.members || [])
      .filter(m => m.region === slug && (m.totals[area] || 0) > 0)
      .sort((a, b) => (b.totals[area] || 0) - (a.totals[area] || 0))
      .slice(0, 25);
    drill.innerHTML =
        `<button class="atlas-viz__drill-close" aria-label="Close">×</button>`
      + `<h3>${escapeHtml(d._region.label)} — ${escapeHtml(area)}</h3>`
      + `<p class="atlas-viz__drill-sub">${list.length} of `
        + `${d._region.memberCount} delegation members cosponsored ≥1 bill `
        + `in this area. Top 25:</p>`
      + `<ol class="atlas-viz__drill-list">`
      + list.map(m => {
          const partyClass = m.party === "R" ? "rep" : m.party === "D" ? "dem" : "ind";
          const cleanName = m.name.replace(/^(Sen\.|Rep\.|Del\.|Res\.)\s*/, "")
                                  .replace(/\s+\[.*?\]$/, "");
          const chamberTag = m.chamber === "senate" ? "S" : "H";
          return `<li>`
            + `<span class="atlas-viz__pty atlas-viz__pty--${partyClass}">${m.party || "?"}</span>`
            + `<span class="atlas-viz__name">${escapeHtml(cleanName)}</span>`
            + `<span class="atlas-viz__st">${m.state} · ${chamberTag}</span>`
            + `<span class="atlas-viz__ct">${m.totals[area]}</span>`
            + `</li>`;
        }).join("")
      + `</ol>`;
    drill.removeAttribute("hidden");
    drill.querySelector(".atlas-viz__drill-close").onclick = () =>
      drill.setAttribute("hidden", "");
  }
  // D3 callback adapter (curried so each cell gets the same drill handler)
  function d_ev_capture(fn) { return (_ev, d) => fn(d); }

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
