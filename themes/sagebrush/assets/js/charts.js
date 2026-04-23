// ─────────────────────────────────────────────
// Governing Ground — charts renderer (D3)
// Hooks into elements with data-viz="chart". Config is read from
// <script type="application/json" id="{id}-config">.
//
// Supports five chart types (keyed by config.type):
//   1. stripes          — climate-stripes-style annual ribbon
//   2. stripes-stacked  — multiple stripe ribbons sharing one x-axis
//   3. line             — annotated line chart
//   4. bars             — vertical bar chart (e.g. annual counts)
//   5. timeline         — categorical swim-lane timeline of events
//
// Config shape (lowercase keys, to match Hugo's .Params lowercasing):
//   {
//     src:      "/data/conus-temperature.json",
//     type:     "stripes" | "line",
//     field:    "anomaly_f",    // property on each datum for the value
//     xfield:   "year",
//     datapath: "data",          // dot-path to the array in the JSON
//     domain:   [-3.5, 3.5],     // color/y-axis domain
//     title:    "Annual temperature anomaly",
//     ylabel:   "Anomaly (°F)",
//     annotations: [
//       { year: 1934, label: "Dust Bowl", side: "above" },
//       { year: 2012, label: "Megadrought", side: "above" }
//     ]
//   }
// ─────────────────────────────────────────────

(function () {
  "use strict";
  if (typeof d3 === "undefined") return;

  // Named palettes for stripe charts.
  //
  // Diverging palettes (five-stop, centered on zero):
  //   `temp`:   cool-navy  → cream  → rust   (cooler ←→ warmer)
  //   `precip`: rust-brown → cream  → navy   (drier  ←→ wetter)
  //
  // Sequential palettes (low-to-high, used with `scale: "sequential"`):
  //   `rust`:   cream → rust       (for positive-only count/intensity data)
  const PALETTES = {
    temp:   ["#2f4a6e", "#7f9ab3", "#f5efe1", "#b88553", "#7c3519"],
    precip: ["#7c3519", "#b88553", "#f5efe1", "#7f9ab3", "#2f4a6e"],
    rust:   ["#f5efe1", "#e5d6b3", "#c9a978", "#b88553", "#9a6439", "#7c3519", "#5a1f0a"],
  };

  // Build a color scale for a palette + domain, either diverging (centered
  // on zero — domain-min through domain-max with zero at the midpoint) or
  // sequential (linear from domain-min to domain-max, no zero anchor).
  function makeColorScale(palette, domain, mode) {
    if (mode === "sequential") {
      const n = palette.length;
      const stops = palette.map((_, i) => domain[0] + (domain[1] - domain[0]) * i / (n - 1));
      return d3.scaleLinear().domain(stops).range(palette).clamp(true);
    }
    // Diverging: assume 5-stop palette centered on 0
    return d3.scaleLinear()
      .domain([domain[0], domain[0] * 0.4, 0, domain[1] * 0.4, domain[1]])
      .range(palette)
      .clamp(true);
  }

  function initChart(container) {
    if (container.dataset.initialized === "true") return;
    const id = container.id;
    const configEl = document.getElementById(id + "-config");
    if (!configEl) return;
    let cfg;
    try { cfg = JSON.parse(configEl.textContent); }
    catch (err) { console.error("Invalid chart config for", id, err); return; }

    container.dataset.initialized = "true";
    container.classList.add("viz-embed__frame--live", "chart-viz", "chart-viz--" + (cfg.type || "stripes"));
    container.innerHTML = "";

    const info = document.createElement("div");
    info.className = "info-panel chart-viz__info";
    info.innerHTML = infoHTML(cfg);
    container.appendChild(info);

    d3.json(cfg.src)
      .then((raw) => {
        const type = cfg.type || "stripes";
        // Timeline reads both events + lane definitions from the raw JSON;
        // every other chart type works off a single resolved array.
        if (type === "timeline") {
          drawTimeline(container, cfg, raw, info);
          return;
        }
        const series = resolvePath(raw, cfg.datapath || "data");
        if (!Array.isArray(series)) throw new Error("data path '" + (cfg.datapath || "data") + "' did not resolve to an array");
        if (type === "line") {
          drawLine(container, cfg, series, info);
        } else if (type === "bars") {
          // If a selector is configured, render it and re-draw on change.
          if (cfg.selector && Array.isArray(cfg.selector.options) && cfg.selector.options.length) {
            attachSelector(container, cfg, (newCfg) => {
              container.querySelectorAll("svg").forEach((s) => s.remove());
              drawBars(container, newCfg, series, info);
            });
          } else {
            drawBars(container, cfg, series, info);
          }
        } else if (type === "small-multiples") {
          drawSmallMultiples(container, cfg, series, info);
        } else if (type === "stripes-stacked") {
          drawStackedStripes(container, cfg, series, info);
        } else {
          drawStripes(container, cfg, series, info);
        }
      })
      .catch((err) => {
        container.classList.add("viz-embed__frame--error");
        container.innerHTML = `<div class="viz-embed__error">Chart could not load: ${err.message}</div>`;
      });
  }

  // ── Climate stripes ─────────────────────────────────────────────────
  function drawStripes(container, cfg, series, info) {
    const x = cfg.xfield || "year";
    const y = cfg.field;

    const data = series.map((d) => ({ x: +d[x], y: +d[y], raw: d }))
      .filter((d) => !isNaN(d.x) && !isNaN(d.y))
      .sort((a, b) => a.x - b.x);

    const W = 1200, H = 260;
    const margin = { top: 48, right: 16, bottom: 48, left: 16 };
    const innerW = W - margin.left - margin.right;
    const innerH = H - margin.top - margin.bottom;

    const svg = d3.select(container).append("svg")
      .attr("viewBox", `0 0 ${W} ${H}`)
      .attr("preserveAspectRatio", "xMidYMid meet")
      .attr("role", "img")
      .attr("aria-label", cfg.title || "Climate stripes chart");

    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    const [xMin, xMax] = d3.extent(data, (d) => d.x);
    const xScale = d3.scaleLinear().domain([xMin, xMax + 1]).range([0, innerW]);

    const domain = cfg.domain || [-3.5, 3.5];
    const paletteName = cfg.palette || "temp";
    const palette = PALETTES[paletteName] || PALETTES.temp;
    const color = makeColorScale(palette, domain, cfg.scale);

    const barW = innerW / (xMax - xMin + 1);

    g.selectAll("rect.chart-viz__stripe")
      .data(data)
      .join("rect")
      .attr("class", "chart-viz__stripe")
      .attr("x", (d) => xScale(d.x))
      .attr("y", 0)
      .attr("width", barW + 0.5) // slight overlap — avoids anti-alias gaps
      .attr("height", innerH)
      .attr("fill", (d) => color(d.y))
      .on("mouseover", (event, d) => updateInfo(info, cfg, d))
      .on("mouseout", () => updateInfo(info, cfg));

    // X-axis (decade ticks, subtle)
    const tickYears = d3.range(Math.ceil(xMin / 10) * 10, xMax + 1, 10);
    const axis = d3.axisBottom(xScale)
      .tickValues(tickYears)
      .tickFormat((y) => y)
      .tickSizeOuter(0);

    g.append("g")
      .attr("class", "chart-viz__axis")
      .attr("transform", `translate(0,${innerH})`)
      .call(axis);

    // Annotations — notable year markers with dashed guides + labels
    (cfg.annotations || []).forEach((a) => {
      const datum = data.find((d) => d.x === a.year);
      if (!datum) return;
      const xPos = xScale(a.year) + barW / 2;
      const above = a.side !== "below";
      const labelY = above ? -10 : innerH + 30;

      g.append("line")
        .attr("class", "chart-viz__guide")
        .attr("x1", xPos).attr("x2", xPos)
        .attr("y1", above ? -6 : innerH)
        .attr("y2", above ? 0 : innerH + 6);

      g.append("text")
        .attr("class", "chart-viz__annotation")
        .attr("x", xPos)
        .attr("y", labelY)
        .attr("text-anchor", "middle")
        .text(`${a.year} · ${a.label}`);
    });

    // Legend ramp
    addRampLegend(container, color, domain, cfg);
  }

  // ── Stacked stripes (multi-series ribbon) ──────────────────────────
  function drawStackedStripes(container, cfg, series, info) {
    // series here is the array found at cfg.datapath — i.e. a list of
    // per-region objects that each carry a label and their own time series.
    const labelKey = cfg.serieslabel || "label";
    const dataKey  = cfg.seriesdata  || "data";
    const xKey     = cfg.xfield      || "year";
    const yKey     = cfg.field       || "anomaly";

    // Normalize each series
    const rows = series.map((s) => ({
      label: s[labelKey] || "",
      data: (s[dataKey] || [])
        .map((d) => ({ x: +d[xKey], y: +d[yKey], raw: d }))
        .filter((d) => !isNaN(d.x) && !isNaN(d.y))
        .sort((a, b) => a.x - b.x),
    }));
    if (!rows.length || !rows[0].data.length) return;

    const ROW_H = 70;
    const W = 1200;
    const margin = { top: 36, right: 16, bottom: 48, left: 180 };
    const innerW = W - margin.left - margin.right;
    const innerH = rows.length * ROW_H;
    const H = innerH + margin.top + margin.bottom;

    const svg = d3.select(container).append("svg")
      .attr("viewBox", `0 0 ${W} ${H}`)
      .attr("preserveAspectRatio", "xMidYMid meet")
      .attr("role", "img")
      .attr("aria-label", cfg.title || "Stacked climate stripes");

    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    const xDomain = d3.extent(rows[0].data, (d) => d.x);
    const xScale = d3.scaleLinear().domain([xDomain[0], xDomain[1] + 1]).range([0, innerW]);

    const domain = cfg.domain || [-5, 5];
    const palette = PALETTES[cfg.palette || "temp"] || PALETTES.temp;
    const color = makeColorScale(palette, domain, cfg.scale);

    const barW = innerW / (xDomain[1] - xDomain[0] + 1);

    // One row per series
    rows.forEach((row, i) => {
      const rowG = g.append("g").attr("transform", `translate(0,${i * ROW_H})`);

      // Ribbon background (so empty years still register as a row)
      rowG.append("rect")
        .attr("class", "chart-viz__stripe-row-bg")
        .attr("x", 0).attr("y", 6)
        .attr("width", innerW).attr("height", ROW_H - 12);

      rowG.selectAll("rect.chart-viz__stripe")
        .data(row.data)
        .join("rect")
        .attr("class", "chart-viz__stripe")
        .attr("x", (d) => xScale(d.x))
        .attr("y", 6)
        .attr("width", barW + 0.5)
        .attr("height", ROW_H - 12)
        .attr("fill", (d) => color(d.y))
        .on("mouseover", (event, d) => updateRowInfo(info, cfg, row.label, d))
        .on("mouseout",  () => updateInfo(info, cfg));

      // Row label, left of the ribbon
      svg.append("text")
        .attr("class", "chart-viz__series-label")
        .attr("x", margin.left - 12)
        .attr("y", margin.top + i * ROW_H + ROW_H / 2 + 4)
        .attr("text-anchor", "end")
        .text(row.label);
    });

    // Shared bottom axis
    const tickYears = d3.range(Math.ceil(xDomain[0] / 10) * 10, xDomain[1] + 1, 10);
    g.append("g")
      .attr("class", "chart-viz__axis")
      .attr("transform", `translate(0,${innerH})`)
      .call(d3.axisBottom(xScale).tickValues(tickYears).tickFormat((t) => t).tickSizeOuter(0));

    // Annotations span the full height as a dashed guide with label on top
    (cfg.annotations || []).forEach((a) => {
      const xPos = xScale(a.year) + barW / 2;
      g.append("line")
        .attr("class", "chart-viz__guide")
        .attr("x1", xPos).attr("x2", xPos)
        .attr("y1", -6).attr("y2", innerH + 4)
        .attr("stroke-dasharray", "3 3");
      g.append("text")
        .attr("class", "chart-viz__annotation")
        .attr("x", xPos)
        .attr("y", -12)
        .attr("text-anchor", "middle")
        .text(`${a.year} · ${a.label}`);
    });

    addRampLegend(container, color, domain, cfg);
  }

  function updateRowInfo(info, cfg, seriesLabel, d) {
    if (!d) { info.innerHTML = infoHTML(cfg); return; }
    const unit = cfg.unitshort || "";
    const val = (d.y > 0 ? "+" : "") + d.y.toFixed(2) + unit;
    info.innerHTML = `<h4>${seriesLabel}</h4><div class="detail">${d.x}: ${val}</div>`;
  }

  // ── Bar chart ───────────────────────────────────────────────────────
  // ── Selector dropdown above a chart (currently used by bars) ─────────
  // Emits a <select> above the chart and calls redraw(newCfg) on change.
  // cfg.selector = { label, default, options: [{ value, label, ... }] }
  // Passes through title/unit/ylabel/annotations overrides per option, so
  // each option can relabel the axis, title, and callouts.
  function attachSelector(container, cfg, redraw) {
    const sel = cfg.selector;
    const wrap = document.createElement("div");
    wrap.className = "chart-viz__selector";
    const labelText = sel.label || "";
    const options = sel.options.map((o) =>
      `<option value="${o.value}"${o.value === sel.default ? " selected" : ""}>${o.label}</option>`
    ).join("");
    wrap.innerHTML = `<label>${labelText}<select>${options}</select></label>`;
    container.appendChild(wrap);

    const apply = (value) => {
      const opt = sel.options.find((o) => o.value === value) || sel.options[0];
      // Merge per-option overrides onto a shallow copy of cfg.
      const newCfg = Object.assign({}, cfg, {
        field: opt.value,
        title: opt.title || cfg.title,
        ylabel: opt.ylabel || cfg.ylabel,
        unitshort: opt.unit != null ? opt.unit : cfg.unitshort,
        annotations: opt.annotations || cfg.annotations || [],
      });
      redraw(newCfg);
    };

    wrap.querySelector("select").addEventListener("change", (e) => apply(e.target.value));
    apply(sel.default || sel.options[0].value);
  }

  function drawBars(container, cfg, series, info) {
    const x = cfg.xfield || "year";
    const y = cfg.field  || "count";

    // Keep null/undefined as a "gap" marker so we can render an explicit
    // missing-data band rather than silently skipping years.
    const data = series
      .map((d) => ({ x: +d[x], y: (d[y] == null ? null : +d[y]), raw: d }))
      .filter((d) => !isNaN(d.x))
      .sort((a, b) => a.x - b.x);

    const W = 1200, H = 420;
    const margin = { top: 48, right: 20, bottom: 44, left: 60 };
    const innerW = W - margin.left - margin.right;
    const innerH = H - margin.top - margin.bottom;

    const svg = d3.select(container).append("svg")
      .attr("viewBox", `0 0 ${W} ${H}`)
      .attr("preserveAspectRatio", "xMidYMid meet")
      .attr("role", "img")
      .attr("aria-label", cfg.title || "Bar chart");

    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    const [xMin, xMax] = d3.extent(data, (d) => d.x);
    const xScale = d3.scaleLinear().domain([xMin, xMax + 1]).range([0, innerW]);

    const yMax = d3.max(data, (d) => d.y || 0);
    const yScale = d3.scaleLinear().domain([0, yMax]).nice().range([innerH, 0]);

    // Render explicit gap bands for runs of null values
    const gaps = [];
    let gapStart = null;
    data.forEach((d) => {
      if (d.y === null) { if (gapStart === null) gapStart = d.x; }
      else if (gapStart !== null) { gaps.push([gapStart, d.x]); gapStart = null; }
    });
    if (gapStart !== null) gaps.push([gapStart, data[data.length - 1].x + 1]);

    g.selectAll("rect.chart-viz__gap")
      .data(gaps)
      .join("rect")
      .attr("class", "chart-viz__gap")
      .attr("x", (d) => xScale(d[0]))
      .attr("y", 0)
      .attr("width", (d) => xScale(d[1]) - xScale(d[0]))
      .attr("height", innerH);

    // Gridlines
    g.append("g").attr("class", "chart-viz__grid")
      .selectAll("line")
      .data(yScale.ticks(5))
      .join("line")
      .attr("x1", 0).attr("x2", innerW)
      .attr("y1", (t) => yScale(t)).attr("y2", (t) => yScale(t));

    // Bars
    const barW = innerW / (xMax - xMin + 1);
    g.selectAll("rect.chart-viz__bar")
      .data(data.filter((d) => d.y !== null))
      .join("rect")
      .attr("class", "chart-viz__bar")
      .attr("x", (d) => xScale(d.x) + 1)
      .attr("y", (d) => yScale(d.y))
      .attr("width", Math.max(1, barW - 1))
      .attr("height", (d) => innerH - yScale(d.y))
      .on("mouseover", function (event, d) {
        d3.select(this).classed("is-hover", true);
        updateInfo(info, cfg, d);
      })
      .on("mouseout", function () {
        d3.select(this).classed("is-hover", false);
        updateInfo(info, cfg);
      });

    // Axes
    const tickYears = d3.range(Math.ceil(xMin / 10) * 10, xMax + 1, 10);
    g.append("g").attr("class", "chart-viz__axis")
      .attr("transform", `translate(0,${innerH})`)
      .call(d3.axisBottom(xScale).tickValues(tickYears).tickFormat((t) => t).tickSizeOuter(0));
    g.append("g").attr("class", "chart-viz__axis")
      .call(d3.axisLeft(yScale).ticks(5).tickFormat(d3.format(",")).tickSizeOuter(0));

    if (cfg.ylabel) {
      svg.append("text")
        .attr("class", "chart-viz__axis-label")
        .attr("transform", `translate(16,${margin.top + innerH / 2}) rotate(-90)`)
        .attr("text-anchor", "middle")
        .text(cfg.ylabel);
    }

    // Annotations: dashed guide + label
    (cfg.annotations || []).forEach((a) => {
      const datum = data.find((d) => d.x === a.year);
      const xPos = xScale(a.year) + barW / 2;
      const yTop = datum && datum.y !== null ? yScale(datum.y) : innerH / 2;

      g.append("line")
        .attr("class", "chart-viz__guide")
        .attr("x1", xPos).attr("x2", xPos)
        .attr("y1", yTop - 4).attr("y2", -6);
      g.append("text")
        .attr("class", "chart-viz__annotation")
        .attr("x", xPos)
        .attr("y", -12)
        .attr("text-anchor", "middle")
        .text(`${a.year} · ${a.label}`);
    });

    // Gap label
    gaps.forEach(([a, b]) => {
      const mid = (xScale(a) + xScale(b)) / 2;
      g.append("text")
        .attr("class", "chart-viz__gap-label")
        .attr("x", mid)
        .attr("y", innerH / 2 + 4)
        .attr("text-anchor", "middle")
        .text("data gap");
    });
  }

  // ── Categorical-swim-lane timeline ──────────────────────────────────
  // Events are positioned horizontally by year and vertically by type.
  // Each type gets a labeled lane; events render as small colored dots.
  // Hover populates the info panel with the event's year + title + blurb.
  const TIMELINE_COLORS = {
    agency:       "#4a5640", // sage-dark
    law:          "#1f2a44", // navy
    proclamation: "#a94b2b", // rust
    rebellion:    "#c9a978", // gold
  };

  function drawTimeline(container, cfg, raw, info) {
    const events = (cfg.datapath ? resolvePath(raw, cfg.datapath) : raw.events) || [];
    const lanes  = cfg.lanes || raw.lanes || [];
    if (!events.length || !lanes.length) return;

    const LANE_H = 72;
    const W = 1200;
    const margin = { top: 28, right: 20, bottom: 44, left: 190 };
    const innerW = W - margin.left - margin.right;
    const innerH = lanes.length * LANE_H;
    const H = innerH + margin.top + margin.bottom;

    const svg = d3.select(container).append("svg")
      .attr("viewBox", `0 0 ${W} ${H}`)
      .attr("preserveAspectRatio", "xMidYMid meet")
      .attr("role", "img")
      .attr("aria-label", cfg.title || "Timeline");

    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    const years = events.map((e) => +e.year).filter((y) => !isNaN(y));
    const xMin = Math.min.apply(null, years) - 3;
    const xMax = Math.max.apply(null, years) + 3;
    const xScale = d3.scaleLinear().domain([xMin, xMax]).range([0, innerW]);

    const laneIndex = new Map(lanes.map((l, i) => [l.key, i]));
    const laneY = (i) => i * LANE_H + LANE_H / 2;

    // Lane backgrounds (alternating tint) + labels + guide lines
    lanes.forEach((lane, i) => {
      g.append("rect")
        .attr("class", "chart-viz__timeline-lane-bg")
        .attr("x", 0).attr("y", i * LANE_H)
        .attr("width", innerW).attr("height", LANE_H)
        .attr("opacity", i % 2 ? 0.35 : 0.15);
      g.append("line")
        .attr("class", "chart-viz__timeline-guide")
        .attr("x1", 0).attr("x2", innerW)
        .attr("y1", laneY(i)).attr("y2", laneY(i));
      // Lane label (in SVG root coords — outside the translated group)
      svg.append("text")
        .attr("class", "chart-viz__timeline-lane-label")
        .attr("x", margin.left - 14)
        .attr("y", margin.top + laneY(i) + 4)
        .attr("text-anchor", "end")
        .text(lane.label);
      if (lane.note) {
        svg.append("text")
          .attr("class", "chart-viz__timeline-lane-note")
          .attr("x", margin.left - 14)
          .attr("y", margin.top + laneY(i) + 20)
          .attr("text-anchor", "end")
          .text(lane.note);
      }
    });

    // Event markers
    g.selectAll("circle.chart-viz__timeline-event")
      .data(events.filter((e) => laneIndex.has(e.type)))
      .join("circle")
      .attr("class", (e) => "chart-viz__timeline-event event-" + e.type)
      .attr("cx", (e) => xScale(+e.year))
      .attr("cy", (e) => laneY(laneIndex.get(e.type)))
      .attr("r", 6)
      .attr("fill", (e) => TIMELINE_COLORS[e.type] || "#888")
      .attr("stroke", "#fbf8f0")
      .attr("stroke-width", 1.5)
      .on("mouseover", function (event, d) {
        d3.select(this).attr("r", 9);
        info.innerHTML = `
          <h4>${d.year}</h4>
          <div class="detail"><strong>${escapeHTML(d.title || "")}</strong></div>
          ${d.description ? `<div class="detail chart-viz__timeline-info-desc">${escapeHTML(d.description)}</div>` : ""}
        `;
        info.style.display = "block";
        placeTimelineCard(info, container, event);
      })
      .on("mousemove", function (event) {
        placeTimelineCard(info, container, event);
      })
      .on("mouseout", function () {
        d3.select(this).attr("r", 6);
        info.style.display = "none";
      });

    // X axis (decade ticks)
    const tickYears = d3.range(Math.ceil(xMin / 10) * 10, xMax + 1, 10);
    g.append("g").attr("class", "chart-viz__axis")
      .attr("transform", `translate(0,${innerH})`)
      .call(d3.axisBottom(xScale).tickValues(tickYears).tickFormat((y) => y).tickSizeOuter(0));
  }

  function placeTimelineCard(card, container, event) {
    const rect = container.getBoundingClientRect();
    const gap  = 14;
    const cardW = 264;
    let x = event.clientX - rect.left + gap;
    let y = event.clientY - rect.top  + gap;
    if (x + cardW > rect.width - gap) x = event.clientX - rect.left - cardW - gap;
    card.style.left  = x + "px";
    card.style.top   = y + "px";
    card.style.right = "auto";
  }

  function escapeHTML(s) {
    return String(s || "")
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  // ── Line chart ──────────────────────────────────────────────────────
  // Named colors for line-chart series — match the site's palette.
  // Callers use short names (`cfg.series[i].color = "rust"`), or a
  // literal CSS color which passes through.
  const LINE_COLORS = {
    rust:  "#a94b2b",
    navy:  "#1f2a44",
    sage:  "#4a5640",
    gold:  "#c9a978",
    green: "#4a9e5c",
    olive: "#8aa07c",
  };
  const resolveColor = (name, fallback) => LINE_COLORS[name] || name || fallback;

  function drawLine(container, cfg, series, info) {
    const x = cfg.xfield || "year";

    // Normalize to a series array. Backward compat: cfg.field + cfg.label
    // is equivalent to a single-element series config.
    const seriesCfg = (cfg.series && cfg.series.length)
      ? cfg.series.map((s, i) => ({
          field: s.field,
          label: s.label || s.field,
          color: resolveColor(s.color, ["#a94b2b","#1f2a44","#4a5640","#c9a978"][i % 4]),
          unit:  s.unit != null ? s.unit : (cfg.unitshort || ""),
          rawfield: s.rawfield || null,
          rawunit:  s.rawunit != null ? s.rawunit : "",
          rawscale: s.rawscale != null ? Number(s.rawscale) : 1,
          rawformat: s.rawformat || null,
        }))
      : [{
          field: cfg.field,
          label: cfg.label || "",
          color: "#a94b2b",
          unit:  cfg.unitshort || "",
        }];

    // Per-series data with x/y extracted.
    seriesCfg.forEach((s) => {
      s.data = series.map((d) => ({
        x: +d[x],
        y: (d[s.field] == null || d[s.field] === "") ? null : +d[s.field],
        raw: d,
      })).filter((d) => !isNaN(d.x)).sort((a, b) => a.x - b.x);
    });

    const allY = seriesCfg.flatMap((s) => s.data.map((d) => d.y).filter((v) => v != null && !isNaN(v)));
    const allX = seriesCfg.flatMap((s) => s.data.map((d) => d.x));
    if (!allY.length) return;

    const W = 1200, H = 420;
    const margin = { top: 52, right: 20, bottom: 40, left: 60 };
    const innerW = W - margin.left - margin.right;
    const innerH = H - margin.top - margin.bottom;

    const svg = d3.select(container).append("svg")
      .attr("viewBox", `0 0 ${W} ${H}`)
      .attr("preserveAspectRatio", "xMidYMid meet")
      .attr("role", "img")
      .attr("aria-label", cfg.title || "Line chart");

    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    const xScale = d3.scaleLinear().domain(d3.extent(allX)).range([0, innerW]);
    const yDomain = cfg.domain || [Math.min(0, d3.min(allY)), d3.max(allY)];
    const yScale = d3.scaleLinear().domain(yDomain).nice().range([innerH, 0]);

    // Zero line if domain crosses zero
    if (yScale.domain()[0] < 0 && yScale.domain()[1] > 0) {
      g.append("line").attr("class", "chart-viz__zero")
        .attr("x1", 0).attr("x2", innerW)
        .attr("y1", yScale(0)).attr("y2", yScale(0));
    }

    // Baseline reference line (e.g., the indexed 100)
    if (cfg.baseline != null) {
      g.append("line").attr("class", "chart-viz__zero")
        .attr("x1", 0).attr("x2", innerW)
        .attr("y1", yScale(cfg.baseline)).attr("y2", yScale(cfg.baseline));
    }

    // Axes
    g.append("g").attr("class", "chart-viz__axis")
      .attr("transform", `translate(0,${innerH})`)
      .call(d3.axisBottom(xScale).tickFormat((y) => y).tickSizeOuter(0));
    g.append("g").attr("class", "chart-viz__axis")
      .call(d3.axisLeft(yScale).tickSizeOuter(0));

    if (cfg.ylabel) {
      svg.append("text")
        .attr("class", "chart-viz__axis-label")
        .attr("transform", `translate(14,${margin.top + innerH / 2}) rotate(-90)`)
        .attr("text-anchor", "middle")
        .text(cfg.ylabel);
    }

    const lineGen = d3.line()
      .defined((d) => d.y != null && !isNaN(d.y))
      .x((d) => xScale(d.x))
      .y((d) => yScale(d.y))
      .curve(d3.curveMonotoneX);

    // Draw one line per series.
    seriesCfg.forEach((s) => {
      g.append("path")
        .datum(s.data)
        .attr("class", "chart-viz__line")
        .style("stroke", s.color)
        .attr("d", lineGen);
    });

    // ── Crosshair tracker ─────────────────────────────────────────────
    // A vertical guide + per-series highlight dots that follow the cursor
    // and show all series' values at the hovered x simultaneously.
    const tracker = g.append("g")
      .attr("class", "chart-viz__tracker")
      .style("display", "none");
    tracker.append("line")
      .attr("class", "chart-viz__tracker-line")
      .attr("y1", 0).attr("y2", innerH);
    const trackerDots = seriesCfg.map((s) =>
      tracker.append("circle")
        .attr("class", "chart-viz__tracker-dot")
        .attr("r", 4)
        .style("fill", s.color)
    );

    // Lookup by x for each series (sparse series skip years, so keyed map).
    const byX = seriesCfg.map((s) => {
      const m = new Map();
      s.data.forEach((d) => { if (d.y != null) m.set(d.x, d); });
      return m;
    });
    // Union of x-values present in any series, sorted.
    const xUnion = Array.from(new Set(
      seriesCfg.flatMap((s) => s.data.filter((d) => d.y != null).map((d) => d.x))
    )).sort((a, b) => a - b);
    const bisect = d3.bisector((a, b) => a - b).left;

    g.append("rect")
      .attr("class", "chart-viz__tracker-overlay")
      .attr("width", innerW)
      .attr("height", innerH)
      .attr("fill", "transparent")
      .on("mouseenter", () => tracker.style("display", null))
      .on("mouseleave", () => {
        tracker.style("display", "none");
        info.innerHTML = infoHTML(cfg);
      })
      .on("mousemove", (event) => {
        const [mx] = d3.pointer(event);
        const xv = xScale.invert(mx);
        // Snap to nearest x in the union
        const i = bisect(xUnion, xv);
        const candidates = [xUnion[i - 1], xUnion[i]].filter((v) => v != null);
        const snapX = candidates.length === 1
          ? candidates[0]
          : (Math.abs(candidates[0] - xv) < Math.abs(candidates[1] - xv)
              ? candidates[0] : candidates[1]);
        const cx = xScale(snapX);
        tracker.select("line").attr("x1", cx).attr("x2", cx);

        const rows = seriesCfg.map((s, si) => {
          const pt = byX[si].get(snapX);
          if (!pt) {
            trackerDots[si].style("display", "none");
            return `<div class="detail"><strong style="color:${s.color}">${s.label}:</strong> —</div>`;
          }
          trackerDots[si]
            .style("display", null)
            .attr("cx", cx)
            .attr("cy", yScale(pt.y));
          // If the series config names a rawfield, show the raw value
          // (scaled + formatted + unit'd) alongside the indexed y.
          let valStr;
          if (s.rawfield && pt.raw && pt.raw[s.rawfield] != null) {
            const raw = +pt.raw[s.rawfield] / s.rawscale;
            const fmt = s.rawformat === "int"
              ? d3.format(",")
              : s.rawformat === "1f"
                ? d3.format(",.1f")
                : d3.format(",.2f");
            valStr = `${fmt(raw)}${s.rawunit} <span class="detail__muted">(${d3.format(",.1f")(pt.y)}${s.unit})</span>`;
          } else {
            valStr = `${d3.format(",")(pt.y)}${s.unit}`;
          }
          return `<div class="detail"><strong style="color:${s.color}">${s.label}:</strong> ${valStr}</div>`;
        }).join("");

        info.innerHTML = `<h4>${snapX}</h4>${rows}`;
      });

    // Inline legend (only when we have more than one series)
    if (seriesCfg.length > 1) {
      const legend = svg.append("g")
        .attr("class", "chart-viz__inline-legend")
        .attr("transform", `translate(${margin.left},${margin.top - 32})`);
      let offset = 0;
      seriesCfg.forEach((s) => {
        const row = legend.append("g").attr("transform", `translate(${offset},0)`);
        row.append("rect")
          .attr("x", 0).attr("y", 6)
          .attr("width", 18).attr("height", 3)
          .attr("fill", s.color);
        const label = row.append("text")
          .attr("x", 24).attr("y", 10)
          .attr("class", "chart-viz__legend-text")
          .text(s.label);
        offset += 24 + s.label.length * 6.8 + 24;
      });
    }
  }

  // ── Small-multiples line chart ──────────────────────────────────────
  // Stacked panels sharing an x-axis. Each panel is its own linear line
  // on its own y-scale — honest about unlike scales, unlike an indexed
  // overlay. Shared crosshair across all panels.
  //
  // cfg.panels = [{ field, label, color, unit, scale, format }]
  //   field:  data row key (e.g. "farms")
  //   scale:  raw/scale is what's plotted (e.g. 1000000 for "M")
  //   format: "int" | "1f" (default) | "2f"
  function drawSmallMultiples(container, cfg, series, info) {
    const x = cfg.xfield || "year";
    const panels = (cfg.panels || []).map((p, i) => ({
      field: p.field,
      label: p.label || p.field,
      color: resolveColor(p.color, ["#a94b2b","#4a5640","#1f2a44","#c9a978"][i % 4]),
      unit:  p.unit != null ? p.unit : "",
      scale: p.scale != null ? Number(p.scale) : 1,
      format: p.format || "1f",
    }));
    if (!panels.length) return;

    // Extract per-panel data
    panels.forEach((p) => {
      p.data = series.map((d) => ({
        x: +d[x],
        y: (d[p.field] == null || d[p.field] === "") ? null : +d[p.field] / p.scale,
      })).filter((d) => !isNaN(d.x) && d.y != null).sort((a, b) => a.x - b.x);
    });

    const W = 1200;
    const panelH = 180;
    const panelGap = 28;
    const margin = { top: 36, right: 20, bottom: 40, left: 70 };
    const H = margin.top + margin.bottom
            + panels.length * panelH
            + (panels.length - 1) * panelGap;
    const innerW = W - margin.left - margin.right;

    const svg = d3.select(container).append("svg")
      .attr("viewBox", `0 0 ${W} ${H}`)
      .attr("preserveAspectRatio", "xMidYMid meet")
      .attr("role", "img")
      .attr("aria-label", cfg.title || "Small-multiples line chart");

    const allX = panels.flatMap((p) => p.data.map((d) => d.x));
    const xScale = d3.scaleLinear()
      .domain([d3.min(allX), d3.max(allX)])
      .range([0, innerW]);

    const fmtOf = (spec) => spec === "int" ? d3.format(",")
                         : spec === "2f"  ? d3.format(",.2f")
                         :                  d3.format(",.1f");

    const lineGen = (yScale) => d3.line()
      .defined((d) => d.y != null && !isNaN(d.y))
      .x((d) => xScale(d.x))
      .y((d) => yScale(d.y))
      .curve(d3.curveMonotoneX);

    // Draw each panel.
    const panelGroups = panels.map((p, idx) => {
      const top = margin.top + idx * (panelH + panelGap);
      const g = svg.append("g").attr("transform", `translate(${margin.left},${top})`);

      const yMax = d3.max(p.data, (d) => d.y);
      const yMin = d3.min(p.data, (d) => d.y);
      const yScale = d3.scaleLinear()
        .domain([Math.min(0, yMin), yMax]).nice()
        .range([panelH, 0]);

      // Gridlines
      g.append("g").attr("class", "chart-viz__grid")
        .selectAll("line")
        .data(yScale.ticks(4))
        .join("line")
        .attr("x1", 0).attr("x2", innerW)
        .attr("y1", (t) => yScale(t)).attr("y2", (t) => yScale(t));

      // Line
      g.append("path")
        .datum(p.data)
        .attr("class", "chart-viz__line")
        .style("stroke", p.color)
        .attr("d", lineGen(yScale));

      // Y-axis
      g.append("g").attr("class", "chart-viz__axis")
        .call(d3.axisLeft(yScale).ticks(4).tickFormat(fmtOf(p.format)).tickSizeOuter(0));

      // Panel label (top-left, inside panel area)
      g.append("text")
        .attr("class", "chart-viz__panel-label")
        .attr("x", 0).attr("y", -10)
        .style("fill", p.color)
        .text(`${p.label}${p.unit ? ` (${p.unit.trim()})` : ""}`);

      // X-axis only on the bottom-most panel
      if (idx === panels.length - 1) {
        g.append("g").attr("class", "chart-viz__axis")
          .attr("transform", `translate(0,${panelH})`)
          .call(d3.axisBottom(xScale).tickFormat((y) => y).tickSizeOuter(0));
      }

      return { g, yScale, p, top, panelH };
    });

    // ── Shared crosshair ─────────────────────────────────────────────
    // One dashed guide spans the union of all panels; one highlight dot
    // per panel; hover readout lists all panels' values at the snapped x.
    const guideTop = margin.top;
    const guideBottom = margin.top + panels.length * panelH + (panels.length - 1) * panelGap;

    const tracker = svg.append("g")
      .attr("class", "chart-viz__tracker")
      .style("display", "none");
    const trackerLine = tracker.append("line")
      .attr("class", "chart-viz__tracker-line")
      .attr("y1", guideTop).attr("y2", guideBottom);
    const trackerDots = panelGroups.map((pg) =>
      tracker.append("circle")
        .attr("class", "chart-viz__tracker-dot")
        .attr("r", 4)
        .style("fill", pg.p.color)
    );

    // Per-panel lookup by x
    const byX = panels.map((p) => {
      const m = new Map();
      p.data.forEach((d) => m.set(d.x, d));
      return m;
    });
    const xUnion = Array.from(new Set(allX)).sort((a, b) => a - b);
    const bisect = d3.bisector((a, b) => a - b).left;

    svg.append("rect")
      .attr("class", "chart-viz__tracker-overlay")
      .attr("x", margin.left).attr("y", margin.top)
      .attr("width", innerW)
      .attr("height", guideBottom - guideTop)
      .attr("fill", "transparent")
      .on("mouseenter", () => tracker.style("display", null))
      .on("mouseleave", () => {
        tracker.style("display", "none");
        info.innerHTML = infoHTML(cfg);
      })
      .on("mousemove", (event) => {
        const [mx] = d3.pointer(event);
        const xv = xScale.invert(mx - margin.left);
        const i = bisect(xUnion, xv);
        const candidates = [xUnion[i - 1], xUnion[i]].filter((v) => v != null);
        const snapX = candidates.length === 1
          ? candidates[0]
          : (Math.abs(candidates[0] - xv) < Math.abs(candidates[1] - xv)
              ? candidates[0] : candidates[1]);
        const cx = margin.left + xScale(snapX);
        trackerLine.attr("x1", cx).attr("x2", cx);

        const rows = panelGroups.map((pg, pi) => {
          const pt = byX[pi].get(snapX);
          if (!pt) {
            trackerDots[pi].style("display", "none");
            return `<div class="detail"><strong style="color:${pg.p.color}">${pg.p.label}:</strong> —</div>`;
          }
          trackerDots[pi]
            .style("display", null)
            .attr("cx", cx)
            .attr("cy", pg.top + pg.yScale(pt.y));
          return `<div class="detail"><strong style="color:${pg.p.color}">${pg.p.label}:</strong> ${fmtOf(pg.p.format)(pt.y)}${pg.p.unit}</div>`;
        }).join("");

        info.innerHTML = `<h4>${snapX}</h4>${rows}`;
      });
  }

  // ── Shared helpers ──────────────────────────────────────────────────
  function updateInfo(info, cfg, d) {
    if (!d) { info.innerHTML = infoHTML(cfg); return; }
    const unit = cfg.unitshort || "";
    // Anomaly charts want a +/- sign prefix; count/dollar charts don't.
    let val;
    if (cfg.anomaly) {
      val = (d.y > 0 ? "+" : "") + d.y.toFixed(2) + unit;
    } else if (Number.isInteger(d.y)) {
      val = d3.format(",")(d.y) + unit;
    } else {
      val = d3.format(",.1f")(d.y) + unit;
    }
    info.innerHTML = `<h4>${d.x}</h4><div class="detail">${val}</div>${
      cfg.infodetail ? `<div class="detail">${cfg.infodetail}</div>` : ""
    }`;
  }

  function infoHTML(cfg) {
    return `<h4>${cfg.infotitle || cfg.title || "Hover for values"}</h4><div class="detail">${
      cfg.infoprompt || "Hover a stripe or point for its value."
    }</div>`;
  }

  function addRampLegend(container, color, domain, cfg) {
    const legend = document.createElement("div");
    legend.className = "legend chart-viz__legend";
    const unit = cfg.unitshort || "";
    const title = cfg.legendtitle || `Anomaly (${unit})`;

    const stops = [];
    for (let i = 0; i <= 100; i += 10) {
      const v = domain[0] + (domain[1] - domain[0]) * (i / 100);
      stops.push(`${color(v)} ${i}%`);
    }
    const gradient = `linear-gradient(to right, ${stops.join(", ")})`;

    // Sequential ramps show min/mid/max; diverging ramps anchor the mid at zero.
    const signed = (n) => (n > 0 ? "+" : "") + n;
    const mid = cfg.scale === "sequential"
      ? Math.round((domain[0] + domain[1]) / 2)
      : 0;

    legend.innerHTML = `
      <h4>${title}</h4>
      <div class="chart-viz__ramp" style="background:${gradient}"></div>
      <div class="chart-viz__ramp-ticks">
        <span>${signed(domain[0])}</span>
        <span>${signed(mid)}</span>
        <span>${signed(domain[1])}</span>
      </div>
    `;
    container.appendChild(legend);
  }

  function resolvePath(obj, path) {
    return path.split(".").reduce((o, k) => (o == null ? o : o[k]), obj);
  }

  function boot() {
    document.querySelectorAll('[data-viz="chart"]').forEach(initChart);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
