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
        if      (type === "line")            drawLine(container, cfg, series, info);
        else if (type === "bars")            drawBars(container, cfg, series, info);
        else if (type === "stripes-stacked") drawStackedStripes(container, cfg, series, info);
        else                                  drawStripes(container, cfg, series, info);
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
      })
      .on("mouseout", function () {
        d3.select(this).attr("r", 6);
        info.innerHTML = infoHTML(cfg);
      });

    // X axis (decade ticks)
    const tickYears = d3.range(Math.ceil(xMin / 10) * 10, xMax + 1, 10);
    g.append("g").attr("class", "chart-viz__axis")
      .attr("transform", `translate(0,${innerH})`)
      .call(d3.axisBottom(xScale).tickValues(tickYears).tickFormat((y) => y).tickSizeOuter(0));
  }

  function escapeHTML(s) {
    return String(s || "")
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  // ── Line chart ──────────────────────────────────────────────────────
  function drawLine(container, cfg, series, info) {
    const x = cfg.xfield || "year";
    const y = cfg.field;

    const data = series.map((d) => ({ x: +d[x], y: +d[y], raw: d }))
      .filter((d) => !isNaN(d.x) && !isNaN(d.y))
      .sort((a, b) => a.x - b.x);

    const W = 1200, H = 420;
    const margin = { top: 36, right: 20, bottom: 40, left: 56 };
    const innerW = W - margin.left - margin.right;
    const innerH = H - margin.top - margin.bottom;

    const svg = d3.select(container).append("svg")
      .attr("viewBox", `0 0 ${W} ${H}`)
      .attr("preserveAspectRatio", "xMidYMid meet")
      .attr("role", "img")
      .attr("aria-label", cfg.title || "Line chart");

    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    const xScale = d3.scaleLinear().domain(d3.extent(data, (d) => d.x)).range([0, innerW]);
    const yDomain = cfg.domain || d3.extent(data, (d) => d.y);
    const yScale = d3.scaleLinear().domain(yDomain).nice().range([innerH, 0]);

    // Zero line if domain crosses zero
    if (yScale.domain()[0] < 0 && yScale.domain()[1] > 0) {
      g.append("line").attr("class", "chart-viz__zero")
        .attr("x1", 0).attr("x2", innerW)
        .attr("y1", yScale(0)).attr("y2", yScale(0));
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

    const line = d3.line()
      .x((d) => xScale(d.x))
      .y((d) => yScale(d.y))
      .curve(d3.curveMonotoneX);

    g.append("path")
      .datum(data)
      .attr("class", "chart-viz__line")
      .attr("d", line);

    g.selectAll("circle.chart-viz__dot")
      .data(data)
      .join("circle")
      .attr("class", "chart-viz__dot")
      .attr("cx", (d) => xScale(d.x))
      .attr("cy", (d) => yScale(d.y))
      .attr("r", 2.2)
      .on("mouseover", (event, d) => updateInfo(info, cfg, d))
      .on("mouseout", () => updateInfo(info, cfg));
  }

  // ── Shared helpers ──────────────────────────────────────────────────
  function updateInfo(info, cfg, d) {
    if (!d) { info.innerHTML = infoHTML(cfg); return; }
    const unit = cfg.unitshort || "";
    const val = (d.y > 0 ? "+" : "") + d.y.toFixed(2) + unit;
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
