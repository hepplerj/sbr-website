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

    // Container-level cursor-following for the info card. The card
    // should ONLY follow the cursor when the user is actively hovering
    // a data element (stripe, bar, dot, etc.) — not when the cursor
    // is in dead space inside the chart container.
    //
    // Trick: every renderer resets `info.innerHTML` to the default
    // prompt via `infoHTML(cfg)` on mouseout of a data element, and
    // sets it to something value-specific on mouseover. We cache the
    // default once and compare on every mousemove: matching = idle,
    // pin to CSS corner; differing = active hover, follow the cursor.
    //
    // `cfg.hideidlecard: true` suppresses the idle prompt entirely —
    // the card stays hidden until the cursor is over a data element,
    // then appears at the cursor. Good for dense charts where the idle
    // card would cover data (e.g. the wide monuments scatter).
    const defaultPromptHTML = info.innerHTML;
    const hideIdle = cfg.hideidlecard === true || cfg.hideidlecard === "true";
    if (hideIdle) info.style.display = "none";
    const resetIdle = () => {
      if (hideIdle) {
        info.style.display = "none";
      } else {
        info.style.left = "";
        info.style.top = "";
        info.style.right = "";
      }
    };
    container.addEventListener("mousemove", (event) => {
      if (info.innerHTML !== defaultPromptHTML) {
        if (hideIdle) info.style.display = "";
        placeTimelineCard(info, container, event);
      } else {
        resetIdle();
      }
    });
    container.addEventListener("mouseleave", resetIdle);

    d3.json(cfg.src)
      .then((raw) => {
        const type = cfg.type || "stripes";
        // Timeline + scatter read multiple arrays from the raw JSON
        // (timeline: events + lanes; scatter: marks + modifications), so
        // they take `raw` directly. Every other type works off a single
        // resolved array.
        if (type === "timeline") {
          drawTimeline(container, cfg, raw, info);
          return;
        }
        if (type === "scatter") {
          drawScatter(container, cfg, raw, info);
          return;
        }
        if (type === "trajectory") {
          drawTrajectory(container, cfg, raw, info);
          return;
        }
        if (type === "decade-strips") {
          drawDecadeStrips(container, cfg, raw, info);
          return;
        }
        if (type === "compound") {
          drawCompound(container, cfg, raw, info);
          return;
        }
        if (type === "heatmap") {
          drawHeatmap(container, cfg, raw, info);
          return;
        }
        if (type === "matrix") {
          drawMatrix(container, cfg, raw, info);
          return;
        }
        if (type === "concordance") {
          drawConcordance(container, cfg, raw, info);
          return;
        }
        if (type === "genealogy") {
          drawGenealogy(container, cfg, raw, info);
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

  // ── Era strip helpers ──────────────────────────────────────────────
  // Render a thin line + label per period above the chart area. Used
  // by stripes, stacked stripes, bar, line, and timeline charts to
  // mark multi-year frames (Dust Bowl, Farm Crisis, etc.) without
  // competing with the chart's own data marks.
  //
  // When labels overlap horizontally (close periods or long labels),
  // we greedy-pack them into rows so each label has its own row above
  // the line. Row 0 sits just above the line; row 1 above that; etc.
  // The chart's caller asks for the row count up front via
  // `planEraRows` so it can reserve enough top margin.

  // Per-row vertical step (in viewBox px). Tuned to the era-label
  // font size; matches the leading you'd want between two label rows.
  const ERA_ROW_STEP = 18;
  // Rough width-per-character for the era-label font (JetBrains Mono,
  // 15px). Used to estimate label widths without measuring DOM.
  const ERA_CHAR_PX = 8.2;
  // Padding around each label box so adjacent labels keep a visual gap.
  const ERA_LABEL_PAD = 8;

  function planEraRows(periods, xMin, xMax, innerW) {
    if (!periods || !periods.length) return { rows: new Map(), maxRow: 0 };
    const span = (xMax - xMin) || 1;
    // Build label boxes in chart-pixel space.
    const items = periods.map((p) => {
      const centerYear = (+p.start + +p.end) / 2;
      const cx = ((centerYear - xMin) / span) * innerW;
      // Allow either `label` (era-strip schema) or `title` (timeline
      // era schema) — same row-packing logic for both.
      const text = p.label || p.title || "";
      const w  = text.length * ERA_CHAR_PX + ERA_LABEL_PAD;
      return { p, cx, w, left: cx - w / 2, right: cx + w / 2 };
    });
    // Greedy: walk in start-year order, place each in the lowest row
    // (closest to the line) that doesn't overlap any label already
    // there. Rows are arrays of placed boxes.
    items.sort((a, b) => (+a.p.start) - (+b.p.start));
    const rows = [];
    const out = new Map();
    items.forEach((it) => {
      let placed = false;
      for (let r = 0; r < rows.length; r++) {
        const collides = rows[r].some((b) => !(it.right <= b.left || it.left >= b.right));
        if (!collides) { rows[r].push(it); out.set(it.p, r); placed = true; break; }
      }
      if (!placed) { rows.push([it]); out.set(it.p, rows.length - 1); }
    });
    return { rows: out, maxRow: rows.length - 1 };
  }

  // Total vertical room (in viewBox px) the era strip needs: room for
  // the line baseline + each label row stacked above it.
  function eraStripHeight(maxRow) {
    if (maxRow < 0) return 0;            // no periods
    return 22 + (maxRow + 1) * ERA_ROW_STEP;
  }

  function drawEraStrip(svg, periods, xScale, opts) {
    const { offsetX, offsetY, rowMap } = opts;
    if (!periods || !periods.length) return;
    const eraG = svg.append("g")
      .attr("class", opts.className || "chart-viz__bars-eras")
      .attr("transform", `translate(${offsetX},${offsetY})`);
    periods.forEach((p) => {
      const x0 = xScale(+p.start);
      const x1 = xScale(+p.end);
      const w  = Math.max(2, x1 - x0);
      // Each row is its own horizontal lane — the line itself moves up
      // along with the label, instead of all lines sharing a baseline
      // with labels stacking above. Row 0 is closest to the chart.
      const row = (rowMap && rowMap.get(p)) || 0;
      const laneY = -row * ERA_ROW_STEP;
      const labelY = laneY - 6;
      const grp = eraG.append("g")
        .attr("class", "chart-viz__timeline-era")
        .style("cursor", "help");
      grp.append("line")
        .attr("class", "chart-viz__timeline-era-line")
        .attr("x1", x0).attr("x2", x1)
        .attr("y1", laneY).attr("y2", laneY);
      [x0, x1].forEach((xv) => {
        grp.append("line")
          .attr("class", "chart-viz__timeline-era-cap")
          .attr("x1", xv).attr("x2", xv)
          .attr("y1", laneY - 3).attr("y2", laneY + 3);
      });
      grp.append("text")
        .attr("class", "chart-viz__timeline-era-label")
        .attr("x", x0 + w / 2)
        .attr("y", labelY)
        .attr("text-anchor", "middle")
        .text(p.label || "");
      // Hit-rect spans the lane (line + label + a little slack).
      grp.append("rect")
        .attr("class", "chart-viz__timeline-era-hit")
        .attr("x", x0 - 2).attr("y", labelY - 10)
        .attr("width", w + 4).attr("height", ERA_ROW_STEP)
        .attr("fill", "transparent");
      if (opts.onHover) {
        grp
          .on("mouseover", () => opts.onHover(p))
          .on("mouseout",  () => opts.onLeave && opts.onLeave());
      }
    });
  }

  // ── Climate stripes ─────────────────────────────────────────────────
  function drawStripes(container, cfg, series, info) {
    const x = cfg.xfield || "year";
    const y = cfg.field;

    const data = series.map((d) => ({ x: +d[x], y: +d[y], raw: d }))
      .filter((d) => !isNaN(d.x) && !isNaN(d.y))
      .sort((a, b) => a.x - b.x);

    const periods = (cfg.periods || []).filter((p) => p.start != null && p.end != null);
    const W = 1200;
    const baseMargin = { right: 16, left: 16 };
    const baseInnerW = W - baseMargin.left - baseMargin.right;
    const dXMin = d3.min(data, (d) => d.x), dXMax = d3.max(data, (d) => d.x);
    const eraPlan = planEraRows(periods, dXMin, dXMax + 1, baseInnerW);
    const PERIOD_H = eraStripHeight(eraPlan.maxRow);

    const H = 260 + PERIOD_H;
    const margin = { top: 48 + PERIOD_H, right: baseMargin.right, bottom: 48, left: baseMargin.left };
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

    // Periods (era strip) above the stripe ribbon
    drawEraStrip(svg, periods, xScale, {
      offsetX: margin.left,
      offsetY: PERIOD_H - 6,
      rowMap: eraPlan.rows,
      onHover: (p) => {
        info.innerHTML = `
          <h4>${p.start}–${p.end}</h4>
          <div class="detail"><strong>${escapeHTML(p.label || "")}</strong></div>
          ${p.description ? `<div class="detail chart-viz__timeline-info-desc">${escapeHTML(p.description)}</div>` : ""}
        `;
      },
      onLeave: () => updateInfo(info, cfg),
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

    const periods = (cfg.periods || []).filter((p) => p.start != null && p.end != null);

    // Each row stacks a label above its stripe ribbon. LABEL_H is the
    // band reserved for the label; the ribbon fills the rest of ROW_H.
    // Putting labels above (not left) lets the ribbon use the full
    // width — long region names like "Northern Rockies & Plains" no
    // longer need a wide left margin that would crop or shrink the viz.
    const LABEL_H = 22;
    const ROW_H = 78;
    const W = 1200;
    const baseMargin = { right: 16, left: 16 };
    const baseInnerW = W - baseMargin.left - baseMargin.right;
    const dXMin = rows[0].data[0].x;
    const dXMax = rows[0].data[rows[0].data.length - 1].x;
    const eraPlan = planEraRows(periods, dXMin, dXMax + 1, baseInnerW);
    const PERIOD_H = eraStripHeight(eraPlan.maxRow);

    const margin = { top: 36 + PERIOD_H, right: baseMargin.right, bottom: 48, left: baseMargin.left };
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

    // Ribbon geometry within a row: label band on top, ribbon below.
    const ribbonY = LABEL_H;
    const ribbonH = ROW_H - LABEL_H - 8;   // 8px gap between rows

    // One row per series
    rows.forEach((row, i) => {
      const rowG = g.append("g").attr("transform", `translate(0,${i * ROW_H})`);

      // Row label, sitting above the ribbon, left-aligned
      rowG.append("text")
        .attr("class", "chart-viz__series-label")
        .attr("x", 0)
        .attr("y", LABEL_H - 8)
        .attr("text-anchor", "start")
        .text(row.label);

      // Ribbon background (so empty years still register as a row)
      rowG.append("rect")
        .attr("class", "chart-viz__stripe-row-bg")
        .attr("x", 0).attr("y", ribbonY)
        .attr("width", innerW).attr("height", ribbonH);

      rowG.selectAll("rect.chart-viz__stripe")
        .data(row.data)
        .join("rect")
        .attr("class", "chart-viz__stripe")
        .attr("x", (d) => xScale(d.x))
        .attr("y", ribbonY)
        .attr("width", barW + 0.5)
        .attr("height", ribbonH)
        .attr("fill", (d) => color(d.y));
    });

    // ── Shared crosshair across all rows ─────────────────────────────
    // A single dashed vertical guide that follows the mouse, and a
    // readout showing every region's value at the hovered year.
    const tracker = g.append("g")
      .attr("class", "chart-viz__tracker")
      .style("display", "none");
    tracker.append("line")
      .attr("class", "chart-viz__tracker-line")
      .attr("y1", 0).attr("y2", innerH);

    // Per-row lookup tables so we don't walk arrays per mousemove.
    const byXPerRow = rows.map((r) => {
      const m = new Map();
      r.data.forEach((d) => m.set(d.x, d));
      return m;
    });
    const xUnion = Array.from(new Set(rows.flatMap((r) => r.data.map((d) => d.x)))).sort((a, b) => a - b);
    const bisect = d3.bisector((a, b) => a - b).left;
    const unit = cfg.unitshort || "";

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
        const i = bisect(xUnion, xv);
        const cand = [xUnion[i - 1], xUnion[i]].filter((v) => v != null);
        const snapX = cand.length === 1
          ? cand[0]
          : (Math.abs(cand[0] - xv) < Math.abs(cand[1] - xv) ? cand[0] : cand[1]);
        const cx = xScale(snapX) + barW / 2;
        tracker.select("line").attr("x1", cx).attr("x2", cx);

        const rowsHTML = rows.map((r, ri) => {
          const d = byXPerRow[ri].get(snapX);
          if (!d) return `<div class="detail"><strong>${r.label}:</strong> —</div>`;
          const val = (d.y > 0 ? "+" : "") + d.y.toFixed(2) + unit;
          const swatch = color(d.y);
          return `<div class="detail"><span class="chart-viz__tracker-swatch" style="background:${swatch}"></span><strong>${r.label}:</strong> ${val}</div>`;
        }).join("");
        info.innerHTML = `<h4>${snapX}</h4>${rowsHTML}`;
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

    // Era strip pinned to the top of the SVG above the row labels and
    // the per-year annotations.
    drawEraStrip(svg, periods, xScale, {
      offsetX: margin.left,
      offsetY: PERIOD_H - 6,
      rowMap: eraPlan.rows,
      onHover: (p) => {
        info.innerHTML = `
          <h4>${p.start}–${p.end}</h4>
          <div class="detail"><strong>${escapeHTML(p.label || "")}</strong></div>
          ${p.description ? `<div class="detail chart-viz__timeline-info-desc">${escapeHTML(p.description)}</div>` : ""}
        `;
      },
      onLeave: () => updateInfo(info, cfg),
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
        periods: opt.periods || cfg.periods || [],
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

    // Optional period spans (cfg.periods) — same shape as the timeline's
    // era strip: { start, end, label, description }. Render as a thin
    // line + label above the chart area; reserves extra top-margin.
    // Overlapping period labels stack into swim-lanes via planEraRows.
    const periods = (cfg.periods || []).filter((p) => p.start != null && p.end != null);
    const W = 1200;
    const baseMargin = { right: 20, left: 60 };
    const baseInnerW = W - baseMargin.left - baseMargin.right;
    const dXMin = d3.min(data, (d) => d.x), dXMax = d3.max(data, (d) => d.x);
    const eraPlan = planEraRows(periods, dXMin, dXMax + 1, baseInnerW);
    const PERIOD_H = eraStripHeight(eraPlan.maxRow);

    const H = 420 + PERIOD_H;
    const margin = { top: 48 + PERIOD_H, right: baseMargin.right, bottom: 44, left: baseMargin.left };
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
      .call(d3.axisLeft(yScale).ticks(5)
        // Wide values ("250,000") overflow the fixed left margin and
        // collide with the rotated axis label — compact to SI ("250k").
        .tickFormat(yMax >= 100000 ? d3.format("~s") : d3.format(","))
        .tickSizeOuter(0));

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

    // Periods: era strip pinned above the per-year annotation row,
    // with overlapping labels stacked into swim-lanes (planEraRows).
    drawEraStrip(svg, periods, xScale, {
      offsetX: margin.left,
      offsetY: PERIOD_H - 6,
      rowMap: eraPlan.rows,
      onHover: (p) => {
        info.innerHTML = `
          <h4>${p.start}–${p.end}</h4>
          <div class="detail"><strong>${escapeHTML(p.label || "")}</strong></div>
          ${p.description ? `<div class="detail chart-viz__timeline-info-desc">${escapeHTML(p.description)}</div>` : ""}
        `;
      },
      onLeave: () => updateInfo(info, cfg),
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

    // Three event shapes are now supported:
    //   - point:      { year, type, title, ... }
    //   - in-lane span: { start, end, type: <existing lane>, title }
    //   - era span:   { start, end, type: "era", title }
    // Eras render in a thin strip above the swim-lanes; in-lane spans
    // render as capsules on their own lane behind point dots.
    const eras       = events.filter((e) => e.type === "era" && e.start != null && e.end != null);
    const points     = events.filter((e) => e.year != null && e.type !== "era");
    const laneSpans  = events.filter((e) => e.start != null && e.end != null && e.type !== "era");

    const LANE_H = 72;
    const W = 1200;
    const baseMargin = { right: 20, left: 190 };
    const baseInnerW = W - baseMargin.left - baseMargin.right;
    // Pre-compute the era strip's row packing so the top margin can
    // reserve room for stacked-above period labels.
    const eraYMin = Math.min(...eras.map((e) => +e.start), Number.POSITIVE_INFINITY);
    const eraYMax = Math.max(...eras.map((e) => +e.end),   Number.NEGATIVE_INFINITY);
    // Use the same x-extent the chart's xScale will use — but built
    // before margins/innerW are finalized. eras can sit inside the
    // broader point/span year range, so use the full span when known.
    const tmpAllYears = []
      .concat(points.map((e) => +e.year))
      .concat(laneSpans.flatMap((e) => [+e.start, +e.end]))
      .concat(eras.flatMap((e) => [+e.start, +e.end]))
      .filter((y) => !isNaN(y));
    const tmpMin = tmpAllYears.length ? Math.min(...tmpAllYears) - 3 : 0;
    const tmpMax = tmpAllYears.length ? Math.max(...tmpAllYears) + 3 : 1;
    const eraPlan = planEraRows(eras, tmpMin, tmpMax, baseInnerW);
    const ERA_H  = eras.length ? eraStripHeight(eraPlan.maxRow) + 10 : 0;
    const margin = { top: 28 + ERA_H, right: baseMargin.right, bottom: 44, left: baseMargin.left };
    const innerW = W - margin.left - margin.right;
    const innerH = lanes.length * LANE_H;
    const H = innerH + margin.top + margin.bottom;

    const svg = d3.select(container).append("svg")
      .attr("viewBox", `0 0 ${W} ${H}`)
      .attr("preserveAspectRatio", "xMidYMid meet")
      .attr("role", "img")
      .attr("aria-label", cfg.title || "Timeline");

    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    // X-domain considers years from points, span starts/ends, and era ranges.
    const allYears = []
      .concat(points.map((e) => +e.year))
      .concat(laneSpans.flatMap((e) => [+e.start, +e.end]))
      .concat(eras.flatMap((e) => [+e.start, +e.end]))
      .filter((y) => !isNaN(y));
    const xMin = Math.min.apply(null, allYears) - 3;
    const xMax = Math.max.apply(null, allYears) + 3;
    const xScale = d3.scaleLinear().domain([xMin, xMax]).range([0, innerW]);

    const laneIndex = new Map(lanes.map((l, i) => [l.key, i]));
    const laneY = (i) => i * LANE_H + LANE_H / 2;

    // Lane backgrounds (alternating tint) + labels + guide lines.
    // Each lane label is hoverable — the sub-description (lane.note)
    // surfaces in the floating info card rather than crowding the axis.
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
      const label = svg.append("text")
        .attr("class", "chart-viz__timeline-lane-label")
        .classed("is-interactive", !!lane.note)
        .attr("x", margin.left - 14)
        .attr("y", margin.top + laneY(i) + 6)
        .attr("text-anchor", "end")
        .text(lane.label);

      if (lane.note) {
        const showNote = (event) => {
          info.innerHTML = `
            <h4>${escapeHTML(lane.label)}</h4>
            <div class="detail chart-viz__timeline-info-desc">${escapeHTML(lane.note)}</div>
          `;
          info.style.display = "block";
          placeTimelineCard(info, container, event || { clientX: 0, clientY: 0 });
        };
        const hideNote = () => { info.style.display = "none"; };

        label.on("mouseover", showNote).on("mouseout", hideNote);
        // Focusable for keyboard users. SVG <text> isn't focusable
        // without tabindex, so we add it here.
        label.attr("tabindex", 0);
        label.on("focus", showNote).on("blur", hideNote);
      }
    });

    // Hover card helpers — shared by all three render passes.
    const showCard = (event, d, kind) => {
      const yearLine = d.year != null
        ? d.year
        : `${d.start}–${d.end}`;
      info.innerHTML = `
        <h4>${yearLine}</h4>
        <div class="detail"><strong>${escapeHTML(d.title || "")}</strong></div>
        ${d.description ? `<div class="detail chart-viz__timeline-info-desc">${escapeHTML(d.description)}</div>` : ""}
      `;
      info.style.display = "block";
      placeTimelineCard(info, container, event);
    };
    const hideCard = () => { info.style.display = "none"; };

    // ── Era strip: thin line per period with a text label above ────
    // Each era gets its own row (swim-lane) when label boxes overlap;
    // see planEraRows + drawEraStrip for the shared packing logic.
    if (eras.length) {
      const stripY = margin.top - 6;   // bottom-of-strip baseline
      const eraG = svg.append("g")
        .attr("class", "chart-viz__timeline-eras")
        .attr("transform", `translate(${margin.left},${stripY})`);
      eras.forEach((e) => {
        const x0 = xScale(+e.start);
        const x1 = xScale(+e.end);
        const w  = Math.max(2, x1 - x0);
        const row = eraPlan.rows.get(e) || 0;
        const laneY = -row * ERA_ROW_STEP;
        const labelY = laneY - 6;
        const grp = eraG.append("g")
          .attr("class", "chart-viz__timeline-era")
          .style("cursor", "help");
        grp.append("line")
          .attr("class", "chart-viz__timeline-era-line")
          .attr("x1", x0).attr("x2", x1)
          .attr("y1", laneY).attr("y2", laneY);
        [x0, x1].forEach((xv) => {
          grp.append("line")
            .attr("class", "chart-viz__timeline-era-cap")
            .attr("x1", xv).attr("x2", xv)
            .attr("y1", laneY - 3).attr("y2", laneY + 3);
        });
        grp.append("text")
          .attr("class", "chart-viz__timeline-era-label")
          .attr("x", x0 + w / 2)
          .attr("y", labelY)
          .attr("text-anchor", "middle")
          .text(e.title || "");
        grp.append("rect")
          .attr("class", "chart-viz__timeline-era-hit")
          .attr("x", x0 - 2).attr("y", labelY - 10)
          .attr("width", w + 4).attr("height", ERA_ROW_STEP)
          .attr("fill", "transparent");
        grp
          .on("mouseover", (event) => showCard(event, e, "era"))
          .on("mousemove", (event) => placeTimelineCard(info, container, event))
          .on("mouseout", hideCard);
      });
    }

    // ── In-lane spans: capsules behind point dots ───────────────────
    if (laneSpans.length) {
      const spanG = g.append("g").attr("class", "chart-viz__timeline-spans");
      laneSpans.filter((e) => laneIndex.has(e.type)).forEach((e) => {
        const x0 = xScale(+e.start);
        const x1 = xScale(+e.end);
        const w  = Math.max(2, x1 - x0);
        const cy = laneY(laneIndex.get(e.type));
        const h  = 18;
        const grp = spanG.append("g")
          .attr("class", "chart-viz__timeline-span span-" + e.type)
          .style("cursor", "help");
        grp.append("rect")
          .attr("x", x0).attr("y", cy - h / 2)
          .attr("width", w).attr("height", h)
          .attr("rx", h / 2).attr("ry", h / 2)
          .attr("fill", TIMELINE_COLORS[e.type] || "#888");
        // Title centered if there's room
        if (w > 60) {
          grp.append("text")
            .attr("class", "chart-viz__timeline-span-label")
            .attr("x", x0 + w / 2)
            .attr("y", cy + 4)
            .attr("text-anchor", "middle")
            .text(e.title || "");
        }
        grp
          .on("mouseover", (event) => showCard(event, e, "span"))
          .on("mousemove", (event) => placeTimelineCard(info, container, event))
          .on("mouseout", hideCard);
      });
    }

    // ── Point events (existing dot markers) ─────────────────────────
    g.selectAll("circle.chart-viz__timeline-event")
      .data(points.filter((e) => laneIndex.has(e.type)))
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
        showCard(event, d, "point");
      })
      .on("mousemove", function (event) {
        placeTimelineCard(info, container, event);
      })
      .on("mouseout", function () {
        d3.select(this).attr("r", 6);
        hideCard();
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

  // Presidential administrations — used by the admin-bands toggle in
  // small-multiples charts. `end` is the first year of the *next*
  // administration (exclusive upper bound for the band).
  const ADMINISTRATIONS = [
    { name: "Taft",        party: "republican", start: 1909, end: 1913 },
    { name: "Wilson",      party: "democrat",   start: 1913, end: 1921 },
    { name: "Harding",     party: "republican", start: 1921, end: 1923 },
    { name: "Coolidge",    party: "republican", start: 1923, end: 1929 },
    { name: "Hoover",      party: "republican", start: 1929, end: 1933 },
    { name: "F. Roosevelt",party: "democrat",   start: 1933, end: 1945 },
    { name: "Truman",      party: "democrat",   start: 1945, end: 1953 },
    { name: "Eisenhower",  party: "republican", start: 1953, end: 1961 },
    { name: "Kennedy",     party: "democrat",   start: 1961, end: 1963 },
    { name: "Johnson",     party: "democrat",   start: 1963, end: 1969 },
    { name: "Nixon",       party: "republican", start: 1969, end: 1974 },
    { name: "Ford",        party: "republican", start: 1974, end: 1977 },
    { name: "Carter",      party: "democrat",   start: 1977, end: 1981 },
    { name: "Reagan",      party: "republican", start: 1981, end: 1989 },
    { name: "Bush",        party: "republican", start: 1989, end: 1993 },
    { name: "Clinton",     party: "democrat",   start: 1993, end: 2001 },
    { name: "Bush",        party: "republican", start: 2001, end: 2009 },
    { name: "Obama",       party: "democrat",   start: 2009, end: 2017 },
    { name: "Trump",       party: "republican", start: 2017, end: 2021 },
    { name: "Biden",       party: "democrat",   start: 2021, end: 2025 },
    { name: "Trump",       party: "republican", start: 2025, end: 2029 },
  ];

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

    // Optional period spans (same shape as the timeline/bars/stripes
    // era strips): a thin line + label per period above the chart.
    // Pack labels into rows so overlapping periods don't collide.
    const periods = (cfg.periods || []).filter((p) => p.start != null && p.end != null);
    const W = 1200;
    const baseMarginLeft = 60, baseMarginRight = 20;
    const baseInnerW = W - baseMarginLeft - baseMarginRight;
    const xExtent = [Math.min(...allX), Math.max(...allX)];
    const eraPlan = planEraRows(periods, xExtent[0], xExtent[1], baseInnerW);
    const PERIOD_H = eraStripHeight(eraPlan.maxRow);

    const H = 420 + PERIOD_H;
    const margin = { top: 52 + PERIOD_H, right: baseMarginRight, bottom: 40, left: baseMarginLeft };
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

    // Era strip pinned to the top of the SVG. The line baseline sits
    // below all stacked label rows (each row is ERA_ROW_STEP tall).
    drawEraStrip(svg, periods, xScale, {
      offsetX: margin.left,
      offsetY: PERIOD_H - 6,
      rowMap: eraPlan.rows,
      onHover: (p) => {
        info.innerHTML = `
          <h4>${p.start}–${p.end}</h4>
          <div class="detail"><strong>${escapeHTML(p.label || "")}</strong></div>
          ${p.description ? `<div class="detail chart-viz__timeline-info-desc">${escapeHTML(p.description)}</div>` : ""}
        `;
      },
      onLeave: () => { info.innerHTML = infoHTML(cfg); },
    });
  }

  // ── Scatter / event chart ───────────────────────────────────────────
  // Each datum is a mark at (xfield, yfield); y is log-scaled (good for
  // values spanning many orders of magnitude — e.g. monument acreage
  // from <100 to >10M). Color encodes a categorical field (e.g. party).
  // An optional second array (cfg.modspath) holds *modification* events
  // that reference a primary mark by name and are drawn as distinct
  // glyphs connected back to their parent with a dashed line — built for
  // the Bears Ears / Grand Staircase reduce-then-restore saga.
  //
  // cfg keys:
  //   datapath      array of primary marks (default "data")
  //   modspath      optional array of modification events
  //   xfield        x value key (default "year")
  //   yfield        y value key (default "value")
  //   colorfield    categorical key → palette lookup (e.g. "party")
  //   labelfield    key used for the hover heading + auto-labels
  //   namefield     key linking a modification to its parent (default labelfield)
  //   palette       { <category>: <named-or-hex color> }
  //   catlabels     { <category>: "Legend label" }
  //   labelthreshold  auto-label marks whose y exceeds this (0 = none)
  //   yunit         suffix for the value in hover/axis (e.g. " acres")
  //   periods       optional era spans (same shape as other charts)
  function drawScatter(container, cfg, raw, info) {
    const xKey = cfg.xfield || "year";
    const yKey = cfg.yfield || "value";
    const colorKey = cfg.colorfield || "category";
    const labelKey = cfg.labelfield || "name";
    const nameKey = cfg.namefield || labelKey;
    const yUnit = cfg.yunit || "";

    const marks = resolvePath(raw, cfg.datapath || "data") || [];
    const mods = cfg.modspath ? (resolvePath(raw, cfg.modspath) || []) : [];
    if (!Array.isArray(marks) || !marks.length) return;

    const palette = lowerKeysShallow(cfg.palette || {});
    const catLabels = lowerKeysShallow(cfg.catlabels || {});
    const colorFor = (cat) => resolveColor(palette[String(cat).toLowerCase()], "#6b7a5a");

    const allX = marks.map((d) => +d[xKey]).filter((v) => !isNaN(v));
    const allY = marks.map((d) => +d[yKey]).filter((v) => v > 0);
    if (!allX.length || !allY.length) return;

    const periods = (cfg.periods || []).filter((p) => p.start != null && p.end != null);
    const W = 1200;
    const baseMarginLeft = 64, baseMarginRight = 24;
    const baseInnerW = W - baseMarginLeft - baseMarginRight;
    const xExtent = [Math.min(...allX) - 3, Math.max(...allX) + 3];
    const eraPlan = planEraRows(periods, xExtent[0], xExtent[1], baseInnerW);
    const PERIOD_H = eraStripHeight(eraPlan.maxRow);

    const H = 480 + PERIOD_H;
    const margin = { top: 40 + PERIOD_H, right: baseMarginRight, bottom: 42, left: baseMarginLeft };
    const innerW = W - margin.left - margin.right;
    const innerH = H - margin.top - margin.bottom;

    const svg = d3.select(container).append("svg")
      .attr("viewBox", `0 0 ${W} ${H}`)
      .attr("preserveAspectRatio", "xMidYMid meet")
      .attr("role", "img")
      .attr("aria-label", cfg.title || "Scatter chart");

    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    const xScale = d3.scaleLinear().domain(xExtent).range([0, innerW]);

    // Log y. Pad the data extent by ~half a decade each way for
    // breathing room rather than snapping out to full powers of ten,
    // which would leave an empty decade above the largest mark.
    const yMin = Math.min(...allY), yMax = Math.max(...allY);
    const yScale = d3.scaleLog().domain([yMin / 1.6, yMax * 1.6]).range([innerH, 0]).clamp(true);

    // ── grid + axes ──────────────────────────────────────────────────
    const yTicks = yScale.ticks(6).filter((t) => Math.log10(t) % 1 === 0);
    g.append("g").attr("class", "chart-viz__scatter-grid")
      .selectAll("line").data(yTicks).join("line")
      .attr("x1", 0).attr("x2", innerW)
      .attr("y1", (d) => yScale(d)).attr("y2", (d) => yScale(d));

    const decadeTicks = d3.range(Math.ceil(xExtent[0] / 10) * 10, xExtent[1] + 1, 20);
    g.append("g").attr("class", "chart-viz__axis")
      .attr("transform", `translate(0,${innerH})`)
      .call(d3.axisBottom(xScale).tickValues(decadeTicks).tickFormat((y) => y).tickSizeOuter(0));
    g.append("g").attr("class", "chart-viz__axis")
      .call(d3.axisLeft(yScale).tickValues(yTicks).tickFormat(formatAcresShort).tickSizeOuter(0));

    // Era strip (shared with line/bars/stripes).
    if (periods.length) {
      drawEraStrip(svg, periods, xScale, {
        offsetX: margin.left,
        offsetY: margin.top - 6,
        rowMap: eraPlan.rows,
        onHover: (p) => {
          info.innerHTML = `
            <h4>${p.start}–${p.end}</h4>
            <div class="detail"><strong>${escapeHTML(p.label || "")}</strong></div>
            ${p.description ? `<div class="detail chart-viz__timeline-info-desc">${escapeHTML(p.description)}</div>` : ""}
          `;
        },
        onLeave: () => { info.innerHTML = infoHTML(cfg); },
      });
    }

    // ── modification connectors ──────────────────────────────────────
    // For each monument that was later modified, build a chronological
    // path [designation, …mods sorted by year] and draw consecutive
    // dashed segments. Traces the Bears Ears saga as a single line:
    // 2016 designation → 2017 reduction (drops) → 2021 restoration (climbs).
    const markByName = new Map(marks.map((d) => [d[nameKey], d]));
    const modsByName = d3.group(mods, (d) => d[nameKey]);
    const modGroup = g.append("g").attr("class", "chart-viz__scatter-mods");
    modsByName.forEach((group, name) => {
      const parent = markByName.get(name);
      if (!parent) return;
      const path = [parent, ...group]
        .filter((d) => +d[yKey] > 0)
        .sort((a, b) => +a[xKey] - +b[xKey]);
      for (let i = 0; i < path.length - 1; i++) {
        modGroup.append("line")
          .attr("class", "chart-viz__scatter-link")
          .attr("x1", xScale(+path[i][xKey])).attr("y1", yScale(+path[i][yKey]))
          .attr("x2", xScale(+path[i + 1][xKey])).attr("y2", yScale(+path[i + 1][yKey]));
      }
    });

    const showMarkCard = (event, d, isMod) => {
      const lines = [];
      if (d.president) lines.push(`${d.president}${d.party ? " (" + d.party + ")" : ""}`);
      if (d.agency) lines.push(d.agency + (d.states ? " · " + d.states.join(", ") : ""));
      const valLabel = isMod
        ? `${capitalize(d.kind || "change")} → ${formatAcres(+d[yKey])}${yUnit}`
        : `${formatAcres(+d[yKey])}${yUnit}`;
      info.innerHTML = `
        <h4>${d[xKey]} · ${escapeHTML(String(d[labelKey] || d[nameKey] || ""))}</h4>
        <div class="detail"><strong>${valLabel}</strong></div>
        ${lines.length ? `<div class="detail">${escapeHTML(lines.join(" · "))}</div>` : ""}
        ${d.note ? `<div class="detail chart-viz__timeline-info-desc">${escapeHTML(d.note)}</div>` : ""}
      `;
    };
    const hideCard = () => { info.innerHTML = infoHTML(cfg); };

    // ── primary marks ────────────────────────────────────────────────
    g.append("g").attr("class", "chart-viz__scatter-marks")
      .selectAll("circle").data(marks.filter((d) => +d[yKey] > 0)).join("circle")
      .attr("class", "chart-viz__scatter-dot")
      .attr("cx", (d) => xScale(+d[xKey]))
      .attr("cy", (d) => yScale(+d[yKey]))
      .attr("r", 7)
      .attr("fill", (d) => colorFor(d[colorKey]))
      .on("mouseover", function (event, d) {
        d3.select(this).attr("r", 10);
        showMarkCard(event, d, false);
      })
      .on("mousemove", (event) => placeTimelineCard(info, container, event))
      .on("mouseout", function () { d3.select(this).attr("r", 7); hideCard(); });

    // ── modification glyphs (down = reduction, up = restoration/expand) ─
    const symbolFor = (kind) =>
      kind === "reduction" ? d3.symbolTriangle : d3.symbolTriangle;
    g.append("g").attr("class", "chart-viz__scatter-modmarks")
      .selectAll("path").data(mods.filter((d) => +d[yKey] > 0)).join("path")
      .attr("class", (d) => "chart-viz__scatter-modglyph mod-" + String(d.kind || "x").replace(/[^a-z0-9]/gi, ""))
      .attr("transform", (d) => {
        const flip = d.kind === "reduction" ? 180 : 0;   // point down for a cut
        return `translate(${xScale(+d[xKey])},${yScale(+d[yKey])}) rotate(${flip})`;
      })
      .attr("d", d3.symbol().type((d) => symbolFor(d.kind)).size(120))
      .attr("fill", (d) => colorFor(d.party))
      .on("mouseover", function (event, d) {
        d3.select(this).attr("opacity", 0.7);
        showMarkCard(event, d, true);
      })
      .on("mousemove", (event) => placeTimelineCard(info, container, event))
      .on("mouseout", function () { d3.select(this).attr("opacity", 1); hideCard(); });

    // ── auto-labels for the big marks ────────────────────────────────
    const threshold = cfg.labelthreshold != null ? +cfg.labelthreshold : 0;
    if (threshold > 0) {
      g.append("g").attr("class", "chart-viz__scatter-labels")
        .selectAll("text").data(marks.filter((d) => +d[yKey] >= threshold)).join("text")
        .attr("class", "chart-viz__scatter-label")
        .attr("x", (d) => xScale(+d[xKey]))
        .attr("y", (d) => yScale(+d[yKey]) - 12)
        .attr("text-anchor", "middle")
        .text((d) => d[labelKey]);
    }

    // ── legend (party swatches + modification glyph key) ─────────────
    const cats = Array.from(new Set(marks.map((d) => String(d[colorKey])))).filter(Boolean);
    const legend = document.createElement("div");
    legend.className = "chart-viz__scatter-legend";
    const swatches = cats.map((c) => {
      const lbl = catLabels[c.toLowerCase()] || c;
      return `<span class="chart-viz__scatter-legend-item"><span class="chart-viz__scatter-swatch" style="background:${colorFor(c)}"></span>${escapeHTML(lbl)}</span>`;
    });
    if (mods.length) {
      swatches.push(`<span class="chart-viz__scatter-legend-item"><span class="chart-viz__scatter-glyph chart-viz__scatter-glyph--down"></span>Reduced</span>`);
      swatches.push(`<span class="chart-viz__scatter-legend-item"><span class="chart-viz__scatter-glyph chart-viz__scatter-glyph--up"></span>Restored / expanded</span>`);
    }
    legend.innerHTML = swatches.join("");
    container.appendChild(legend);
  }

  // Shallow lowercase-key normalizer (Hugo lowercases frontmatter, but
  // JSON palette/labels keys may arrive cased — normalize for lookup).
  function lowerKeysShallow(obj) {
    const out = {};
    Object.keys(obj || {}).forEach((k) => { out[k.toLowerCase()] = obj[k]; });
    return out;
  }

  function capitalize(s) {
    s = String(s || "");
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  // 1347 → "1,347 acres" ; 704000 → "704,000 acres" ; 10950000 → "10.95M acres"
  function formatAcres(n) {
    n = +n;
    if (n >= 1e6) return (n / 1e6).toFixed(n >= 1e7 ? 1 : 2).replace(/\.0+$/, "") + "M acres";
    return n.toLocaleString("en-US") + " acres";
  }
  // Axis-tick form: 1k / 10k / 100k / 1M / 10M
  function formatAcresShort(n) {
    n = +n;
    if (n >= 1e6) return (n / 1e6) + "M";
    if (n >= 1e3) return (n / 1e3) + "k";
    return String(n);
  }

  // ── Trajectory / "climate space" chart ──────────────────────────────
  // Plots each record as a point in a two-axis VALUE space (xfield vs
  // yfield, both linear and bipolar around zero), then overlays a
  // decade-average path so the chronological *drift* through that space
  // is legible — the year-to-year cloud is noisy, the decade trajectory
  // is not. Built for the temperature × precipitation "climate space"
  // sightline: watch the Southwest march into the hot-dry quadrant.
  //
  // cfg keys:
  //   datapath    array of records (default "data")
  //   xfield      x value key (e.g. "temp")
  //   yfield      y value key (e.g. "precip")
  //   timefield   chronological key for ordering + decade grouping ("year")
  //   xlabel/ylabel  axis titles (fall back to raw JSON xlabel/ylabel)
  //   quadrants   optional [{ x:±1, y:±1, label }] corner annotations
  //   hideidlecard  suppress the idle info card (handled in initChart)
  // Default region colors for the multi-region overlay, applied by
  // index. Overridable per-slug via cfg.palette.
  const TRAJ_REGION_COLORS = ["#a94b2b", "#c98a3a", "#2f6e8e", "#5a7a4a"];

  function drawTrajectory(container, cfg, raw, info) {
    const xKey = cfg.xfield || "x";
    const yKey = cfg.yfield || "y";
    const tKey = cfg.timefield || "year";
    const xLabel = cfg.xlabel || raw.xlabel || xKey;
    const yLabel = cfg.ylabel || raw.ylabel || yKey;

    const clean = (arr) => (arr || [])
      .map((d) => ({ t: +d[tKey], x: +d[xKey], y: +d[yKey] }))
      .filter((d) => !isNaN(d.t) && !isNaN(d.x) && !isNaN(d.y))
      .sort((a, b) => a.t - b.t);

    // Two modes: multi-region overlay (raw.regions present) or a single
    // path (raw.data). In multi mode color encodes REGION and the annual
    // cloud is dropped (four clouds = noise); in single mode color
    // encodes DECADE and the annual cloud stays (it's the variance).
    const palette = lowerKeysShallow(cfg.palette || {});
    const multi = Array.isArray(raw.regions) && raw.regions.length > 1;
    const series = multi
      ? raw.regions.map((r, i) => ({
          label: r.label,
          slug: r.slug || ("r" + i),
          color: palette[String(r.slug).toLowerCase()] || TRAJ_REGION_COLORS[i % TRAJ_REGION_COLORS.length],
          rows: clean(r.data),
        }))
      : [{ label: null, slug: null, color: null, rows: clean(resolvePath(raw, cfg.datapath || "data")) }];
    const allRows = series.flatMap((s) => s.rows);
    if (allRows.length < 2) return;

    const decadeOf = (t) => Math.floor(t / 10) * 10;
    const decadeAvg = (rows) => {
      const byDec = d3.group(rows, (d) => decadeOf(d.t));
      return Array.from(byDec.entries())
        .sort((a, b) => a[0] - b[0])
        .map(([dec, grp]) => ({ dec, x: d3.mean(grp, (d) => d.x), y: d3.mean(grp, (d) => d.y), n: grp.length }));
    };
    series.forEach((s) => { s.decades = decadeAvg(s.rows); });

    const W = 1200, H = 620;
    const margin = { top: 28, right: 28, bottom: 56, left: 64 };
    const innerW = W - margin.left - margin.right;
    const innerH = H - margin.top - margin.bottom;

    const svg = d3.select(container).append("svg")
      .attr("viewBox", `0 0 ${W} ${H}`)
      .attr("preserveAspectRatio", "xMidYMid meet")
      .attr("role", "img")
      .attr("aria-label", cfg.title || "Climate-space trajectory");
    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    // Domain from the points actually drawn: decade averages in multi
    // mode (a tight ±2 band), the full annual cloud in single mode.
    // Using the annual range in multi mode would squash the paths.
    const plotted = multi ? series.flatMap((s) => s.decades) : series[0].rows;
    const pad = (lo, hi) => { const m = (hi - lo) * 0.12 || 1; return [lo - m, hi + m]; };
    const xExtent = pad(Math.min(0, d3.min(plotted, (d) => d.x)), Math.max(0, d3.max(plotted, (d) => d.x)));
    const yExtent = pad(Math.min(0, d3.min(plotted, (d) => d.y)), Math.max(0, d3.max(plotted, (d) => d.y)));
    const xScale = d3.scaleLinear().domain(xExtent).range([0, innerW]);
    const yScale = d3.scaleLinear().domain(yExtent).range([innerH, 0]);

    // Hot-dry quadrant tint (x>0, y<0).
    g.append("rect").attr("class", "chart-viz__traj-quadrant")
      .attr("x", xScale(0)).attr("y", yScale(0))
      .attr("width", innerW - xScale(0)).attr("height", innerH - yScale(0));

    // Quadrant cross.
    g.append("line").attr("class", "chart-viz__traj-axis0")
      .attr("x1", xScale(0)).attr("x2", xScale(0)).attr("y1", 0).attr("y2", innerH);
    g.append("line").attr("class", "chart-viz__traj-axis0")
      .attr("x1", 0).attr("x2", innerW).attr("y1", yScale(0)).attr("y2", yScale(0));

    (cfg.quadrants || []).forEach((q) => {
      g.append("text").attr("class", "chart-viz__traj-quadlabel")
        .attr("x", q.x > 0 ? innerW - 8 : 8).attr("y", q.y > 0 ? 16 : innerH - 8)
        .attr("text-anchor", q.x > 0 ? "end" : "start").text(q.label);
    });

    g.append("g").attr("class", "chart-viz__axis")
      .attr("transform", `translate(0,${innerH})`)
      .call(d3.axisBottom(xScale).ticks(7).tickSizeOuter(0));
    g.append("g").attr("class", "chart-viz__axis")
      .call(d3.axisLeft(yScale).ticks(7).tickSizeOuter(0));
    g.append("text").attr("class", "chart-viz__axis-label")
      .attr("x", innerW / 2).attr("y", innerH + 44).attr("text-anchor", "middle").text(xLabel);
    g.append("text").attr("class", "chart-viz__axis-label")
      .attr("transform", "rotate(-90)").attr("x", -innerH / 2).attr("y", -46).attr("text-anchor", "middle").text(yLabel);

    const lineGen = d3.line().x((d) => xScale(d.x)).y((d) => yScale(d.y)).curve(d3.curveCatmullRom.alpha(0.5));
    const fmt = (v) => (v > 0 ? "+" : "") + v.toFixed(2);
    const hideCard = () => { info.innerHTML = infoHTML(cfg); };

    if (multi) {
      // ── Multi-region overlay: a NET-DRIFT vector per region. Four
      // wandering decade-paths overlapping just makes spaghetti; what a
      // four-way comparison wants is each region's net journey. So:
      // faint decade dots for texture (no connecting line) + one bold
      // arrow from the early-period centroid to the recent-period
      // centroid. Three arrows point into the hot-dry corner; the
      // Northern Plains points up-and-right instead. ──────────────────
      const centroid = (decs) => ({ x: d3.mean(decs, (d) => d.x), y: d3.mean(decs, (d) => d.y) });
      // arrowhead drawn manually so it inherits the region color.
      const drawArrow = (x1, y1, x2, y2, col) => {
        g.append("line").attr("class", "chart-viz__traj-arrow")
          .attr("x1", x1).attr("y1", y1).attr("x2", x2).attr("y2", y2).attr("stroke", col);
        const ang = Math.atan2(y2 - y1, x2 - x1), h = 11, spread = 0.42;
        [ang - spread, ang + spread].forEach((a) => {
          g.append("line").attr("class", "chart-viz__traj-arrow")
            .attr("x1", x2).attr("y1", y2)
            .attr("x2", x2 - h * Math.cos(a)).attr("y2", y2 - h * Math.sin(a)).attr("stroke", col);
        });
      };

      series.forEach((s) => {
        const dec = s.decades;
        // faint decade dots (where each decade actually sat), hoverable
        g.append("g").selectAll("circle").data(dec).join("circle")
          .attr("class", "chart-viz__traj-rdot")
          .attr("cx", (d) => xScale(d.x)).attr("cy", (d) => yScale(d.y))
          .attr("r", 3).attr("fill", s.color)
          .on("mouseover", function (event, d) {
            d3.select(this).attr("r", 6);
            info.innerHTML = `<h4>${escapeHTML(s.label)} · ${d.dec}s</h4>
              <div class="detail">${xLabel}: <strong>${fmt(d.x)}</strong></div>
              <div class="detail">${yLabel}: <strong>${fmt(d.y)}</strong></div>`;
          })
          .on("mousemove", (event) => placeTimelineCard(info, container, event))
          .on("mouseout", function () { d3.select(this).attr("r", 3); hideCard(); });
        // net-drift arrow: mean of first 3 decades → mean of last 3.
        const a = centroid(dec.slice(0, 3)), b = centroid(dec.slice(-3));
        g.append("circle").attr("class", "chart-viz__traj-start")
          .attr("cx", xScale(a.x)).attr("cy", yScale(a.y)).attr("r", 4).attr("stroke", s.color);
        drawArrow(xScale(a.x), yScale(a.y), xScale(b.x), yScale(b.y), s.color);
      });

      // DOM legend: region colors.
      const legend = document.createElement("div");
      legend.className = "chart-viz__scatter-legend";
      legend.innerHTML = series.map((s) =>
        `<span class="chart-viz__scatter-legend-item"><span class="chart-viz__scatter-swatch" style="background:${s.color}"></span>${escapeHTML(s.label)}</span>`
      ).join("");
      container.appendChild(legend);
      return;
    }

    // ── Single path: decade color ramp + annual cloud (the variance). ─
    const s0 = series[0];
    const decades = s0.decades.map((d) => d.dec);
    const color = d3.scaleSequential()
      .domain([decades[0], decades[decades.length - 1]])
      .interpolator(d3.interpolateRgb("#2f4a6e", "#a94b2b"));

    g.append("g").selectAll("circle").data(s0.rows).join("circle")
      .attr("class", "chart-viz__traj-year")
      .attr("cx", (d) => xScale(d.x)).attr("cy", (d) => yScale(d.y))
      .attr("r", 3.5).attr("fill", (d) => color(decadeOf(d.t)))
      .on("mouseover", function (event, d) {
        d3.select(this).attr("r", 6);
        info.innerHTML = `<h4>${d.t}</h4>
          <div class="detail">${xLabel}: <strong>${fmt(d.x)}</strong></div>
          <div class="detail">${yLabel}: <strong>${fmt(d.y)}</strong></div>`;
      })
      .on("mousemove", (event) => placeTimelineCard(info, container, event))
      .on("mouseout", function () { d3.select(this).attr("r", 3.5); hideCard(); });

    g.append("path").attr("class", "chart-viz__traj-path").attr("d", lineGen(s0.decades));
    g.append("g").selectAll("circle").data(s0.decades).join("circle")
      .attr("class", "chart-viz__traj-decade")
      .attr("cx", (d) => xScale(d.x)).attr("cy", (d) => yScale(d.y))
      .attr("r", 7).attr("fill", (d) => color(d.dec))
      .on("mouseover", function (event, d) {
        d3.select(this).attr("r", 10);
        info.innerHTML = `<h4>${d.dec}s average</h4>
          <div class="detail">${xLabel}: <strong>${fmt(d.x)}</strong></div>
          <div class="detail">${yLabel}: <strong>${fmt(d.y)}</strong></div>`;
      })
      .on("mousemove", (event) => placeTimelineCard(info, container, event))
      .on("mouseout", function () { d3.select(this).attr("r", 7); hideCard(); });

    [s0.decades[0], s0.decades[s0.decades.length - 1]].forEach((d) => {
      g.append("text").attr("class", "chart-viz__traj-endlabel")
        .attr("x", xScale(d.x)).attr("y", yScale(d.y) - 14)
        .attr("text-anchor", "middle").text(d.dec + "s");
    });

    const legend = document.createElement("div");
    legend.className = "chart-viz__traj-legend";
    legend.innerHTML =
      `<span class="chart-viz__traj-legend-label">${decades[0]}s</span>` +
      `<span class="chart-viz__traj-legend-ramp"></span>` +
      `<span class="chart-viz__traj-legend-label">${decades[decades.length - 1]}s</span>`;
    container.appendChild(legend);
  }

  // Pick one region's record array out of a (possibly multi-region) JSON.
  // Shared by the decade-strips and compound charts so they can reuse
  // climate-space.json. cfg.region selects by slug; falls back to the
  // first region, or to a flat raw.data array.
  function pickRegion(raw, cfg) {
    if (Array.isArray(raw.regions) && raw.regions.length) {
      const slug = String(cfg.region || "").toLowerCase();
      const hit = raw.regions.find((r) => String(r.slug).toLowerCase() === slug);
      return hit || raw.regions[0];
    }
    return { label: raw.region || null, data: resolvePath(raw, cfg.datapath || "data") || [] };
  }

  // ── Decade distribution strips ──────────────────────────────────────
  // One horizontal lane per decade; each year a dot at its value; a
  // median tick per lane. Stacked oldest→newest top to bottom so the
  // whole distribution visibly slides right — the "no more cold years"
  // framing: recent decades' coldest years sit right of early decades'
  // warmest. cfg: field (value key), timefield, region, valueunit.
  function drawDecadeStrips(container, cfg, raw, info) {
    const reg = pickRegion(raw, cfg);
    const vKey = cfg.field || "value";
    const tKey = cfg.timefield || "year";
    const unit = cfg.valueunit || "";
    const rows = (reg.data || [])
      .map((d) => ({ t: +d[tKey], v: +d[vKey] }))
      .filter((d) => !isNaN(d.t) && !isNaN(d.v));
    if (!rows.length) return;

    const decadeOf = (t) => Math.floor(t / 10) * 10;
    const byDec = d3.group(rows, (d) => decadeOf(d.t));
    const decades = Array.from(byDec.keys()).sort((a, b) => a - b);

    const LANE = 30, W = 1200;
    const margin = { top: 30, right: 30, bottom: 46, left: 70 };
    const innerW = W - margin.left - margin.right;
    const innerH = decades.length * LANE;
    const H = innerH + margin.top + margin.bottom;

    const svg = d3.select(container).append("svg")
      .attr("viewBox", `0 0 ${W} ${H}`).attr("preserveAspectRatio", "xMidYMid meet")
      .attr("role", "img").attr("aria-label", cfg.title || "Decade distribution strips");
    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    const xScale = d3.scaleLinear().domain(d3.extent(rows, (d) => d.v)).nice().range([0, innerW]);
    const color = d3.scaleSequential().domain([decades[0], decades[decades.length - 1]])
      .interpolator(d3.interpolateRgb("#2f4a6e", "#a94b2b"));

    // Zero reference line (anomaly baseline) full height.
    if (xScale.domain()[0] < 0 && xScale.domain()[1] > 0) {
      g.append("line").attr("class", "chart-viz__strip-zero")
        .attr("x1", xScale(0)).attr("x2", xScale(0)).attr("y1", -6).attr("y2", innerH + 2);
    }
    // Top axis.
    g.append("g").attr("class", "chart-viz__axis")
      .call(d3.axisTop(xScale).ticks(7).tickFormat((v) => (v > 0 ? "+" : "") + v).tickSizeOuter(0));
    g.append("text").attr("class", "chart-viz__axis-label")
      .attr("x", innerW).attr("y", innerH + 38).attr("text-anchor", "end")
      .text(cfg.xlabel || raw.xlabel || "");

    const hideCard = () => { info.innerHTML = infoHTML(cfg); };

    decades.forEach((dec, i) => {
      const y = i * LANE + LANE / 2;
      const grp = byDec.get(dec);
      const med = d3.median(grp, (d) => d.v);
      // lane label
      g.append("text").attr("class", "chart-viz__strip-lanelabel")
        .attr("x", -12).attr("y", y + 4).attr("text-anchor", "end").text(dec + "s");
      // faint guide line
      g.append("line").attr("class", "chart-viz__strip-guide")
        .attr("x1", 0).attr("x2", innerW).attr("y1", y).attr("y2", y);
      // year dots — tiny deterministic vertical jitter so equal values separate
      g.append("g").selectAll("circle").data(grp).join("circle")
        .attr("class", "chart-viz__strip-dot")
        .attr("cx", (d) => xScale(d.v))
        .attr("cy", (d) => y + ((d.t % 5) - 2) * 2.2)
        .attr("r", 4).attr("fill", color(dec))
        .on("mouseover", function (event, d) {
          d3.select(this).attr("r", 6.5);
          info.innerHTML = `<h4>${d.t}</h4><div class="detail"><strong>${d.v > 0 ? "+" : ""}${d.v.toFixed(2)}${unit}</strong></div>`;
        })
        .on("mousemove", (event) => placeTimelineCard(info, container, event))
        .on("mouseout", function () { d3.select(this).attr("r", 4); hideCard(); });
      // decade median tick
      g.append("line").attr("class", "chart-viz__strip-median")
        .attr("x1", xScale(med)).attr("x2", xScale(med))
        .attr("y1", y - LANE / 2 + 4).attr("y2", y + LANE / 2 - 4);
    });
  }

  // ── Compound hot-dry "barcode" ──────────────────────────────────────
  // Each year a thin full-height tick across a single strip. Years that
  // were BOTH hot (xfield > 0) and dry (yfield < 0) burn bold; every
  // other year is faint. The bold ticks cluster after ~2000 — the
  // compound regime, not just warming. cfg: xfield (temp), yfield
  // (precip), timefield, region.
  function drawCompound(container, cfg, raw, info) {
    const reg = pickRegion(raw, cfg);
    const tKey = cfg.timefield || "year";
    const xf = cfg.xfield || "temp";
    const yf = cfg.yfield || "precip";
    const rows = (reg.data || [])
      .map((d) => ({ t: +d[tKey], temp: +d[xf], precip: +d[yf] }))
      .filter((d) => !isNaN(d.t) && !isNaN(d.temp) && !isNaN(d.precip))
      .sort((a, b) => a.t - b.t);
    if (!rows.length) return;
    rows.forEach((d) => { d.hotdry = d.temp > 0 && d.precip < 0; });

    const W = 1200, H = 240;
    const margin = { top: 30, right: 28, bottom: 44, left: 28 };
    const innerW = W - margin.left - margin.right;
    const innerH = H - margin.top - margin.bottom;

    const svg = d3.select(container).append("svg")
      .attr("viewBox", `0 0 ${W} ${H}`).attr("preserveAspectRatio", "xMidYMid meet")
      .attr("role", "img").attr("aria-label", cfg.title || "Compound hot-dry years");
    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    const years = rows.map((d) => d.t);
    const xScale = d3.scaleLinear().domain([Math.min(...years) - 0.5, Math.max(...years) + 0.5]).range([0, innerW]);
    const barW = Math.max(2, innerW / rows.length - 1.5);
    const hideCard = () => { info.innerHTML = infoHTML(cfg); };

    g.append("g").selectAll("rect").data(rows).join("rect")
      .attr("class", (d) => "chart-viz__compound-tick" + (d.hotdry ? " is-hotdry" : ""))
      .attr("x", (d) => xScale(d.t) - barW / 2).attr("y", 0)
      .attr("width", barW).attr("height", innerH)
      .on("mouseover", function (event, d) {
        info.innerHTML = `<h4>${d.t}${d.hotdry ? " · hot & dry" : ""}</h4>
          <div class="detail">temp: <strong>${d.temp > 0 ? "+" : ""}${d.temp.toFixed(2)}</strong> · precip: <strong>${d.precip > 0 ? "+" : ""}${d.precip.toFixed(2)}</strong></div>`;
      })
      .on("mousemove", (event) => placeTimelineCard(info, container, event))
      .on("mouseout", hideCard);

    // Decade axis.
    const decadeTicks = d3.range(Math.ceil(years[0] / 10) * 10, years[years.length - 1] + 1, 20);
    g.append("g").attr("class", "chart-viz__axis")
      .attr("transform", `translate(0,${innerH})`)
      .call(d3.axisBottom(xScale).tickValues(decadeTicks).tickFormat((y) => y).tickSizeOuter(0));

    // DOM legend.
    const n = rows.filter((d) => d.hotdry).length;
    const legend = document.createElement("div");
    legend.className = "chart-viz__scatter-legend";
    legend.innerHTML =
      `<span class="chart-viz__scatter-legend-item"><span class="chart-viz__compound-swatch is-hotdry"></span>Hot &amp; dry year (${n})</span>` +
      `<span class="chart-viz__scatter-legend-item"><span class="chart-viz__compound-swatch"></span>All other years</span>`;
    container.appendChild(legend);
  }

  // ── Latitude × time heatmap (Hovmöller) ─────────────────────────────
  // Rows are places (states ordered north→south), columns are years,
  // cell color is the temperature anomaly on a diverging blue→cream→
  // rust scale. The whole grid reddens toward the right; the spatial
  // structure of the warming — which latitudes warm first and hardest —
  // becomes legible. Reads raw.rows ([{state, abbr, lat, anomalies[]}])
  // + raw.years (shared column axis).
  function drawHeatmap(container, cfg, raw, info) {
    const rows = raw.rows || [];
    const years = raw.years || [];
    if (!rows.length || !years.length) return;
    const minYear = years[0], maxYear = years[years.length - 1];

    const W = 1200;
    const ROW = 26;
    const baseInnerW = W - 30 - 52;   // right + left, finalized below
    // Optional era/period bands ("swimlane" annotations) above the grid
    // — same shape as the other charts: { start, end, label, description }.
    // Reserve top margin for the packed strip.
    const periods = (cfg.periods || []).filter((p) => p.start != null && p.end != null);
    const eraPlan = planEraRows(periods, minYear, maxYear + 1, baseInnerW);
    const stripH = periods.length ? eraStripHeight(eraPlan.maxRow) + 8 : 0;

    const margin = { top: 16 + stripH, right: 30, bottom: 64, left: 52 };
    const innerW = W - margin.left - margin.right;
    const innerH = rows.length * ROW;
    const H = innerH + margin.top + margin.bottom;

    const svg = d3.select(container).append("svg")
      .attr("viewBox", `0 0 ${W} ${H}`).attr("preserveAspectRatio", "xMidYMid meet")
      .attr("role", "img").attr("aria-label", cfg.title || "Temperature anomaly heatmap");
    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scaleBand().domain(years).range([0, innerW]);
    const y = d3.scaleBand().domain(d3.range(rows.length)).range([0, innerH]);
    // Continuous year scale for era spans + guide lines (scaleBand can't
    // interpolate arbitrary span endpoints).
    const xLin = d3.scaleLinear().domain([minYear, maxYear + 1]).range([0, innerW]);

    // Diverging color, symmetric about zero, capped so a couple of
    // extreme cells don't wash out the rest. Matches the `temp` stripes
    // palette: navy → cream → rust.
    const absExt = d3.max(rows, (r) => d3.max(r.anomalies, (v) => (v == null ? 0 : Math.abs(v)))) || 1;
    const dom = Math.min(4.5, absExt);
    const color = d3.scaleLinear()
      .domain([-dom, -dom / 2, 0, dom / 2, dom])
      .range(["#2f4a6e", "#7f9ab3", "#f5efe1", "#b88553", "#7c3519"])
      .clamp(true);

    const hideCard = () => { info.innerHTML = infoHTML(cfg); };

    rows.forEach((r, ri) => {
      g.append("g").selectAll("rect")
        .data(r.anomalies.map((v, yi) => ({ v, year: years[yi] })).filter((d) => d.v != null))
        .join("rect")
        .attr("class", "chart-viz__heat-cell")
        .attr("x", (d) => x(d.year)).attr("y", y(ri))
        .attr("width", x.bandwidth()).attr("height", y.bandwidth())
        .attr("fill", (d) => color(d.v))
        .on("mouseover", function (event, d) {
          info.innerHTML = `<h4>${escapeHTML(r.state)} · ${d.year}</h4>
            <div class="detail"><strong>${d.v > 0 ? "+" : ""}${d.v.toFixed(2)}°F</strong> vs 1901–2000</div>`;
        })
        .on("mousemove", (event) => placeTimelineCard(info, container, event))
        .on("mouseout", hideCard);
      // row label (state abbr)
      g.append("text").attr("class", "chart-viz__heat-rowlabel")
        .attr("x", -8).attr("y", y(ri) + y.bandwidth() / 2 + 4).attr("text-anchor", "end").text(r.abbr);
    });

    // Era / period "swimlane" annotations above the grid, with faint
    // vertical guides dropping through the cells so the eye can connect
    // a label to its years.
    if (periods.length) {
      periods.forEach((p) => {
        [p.start, p.end].forEach((yr) => {
          g.append("line").attr("class", "chart-viz__heat-eraguide")
            .attr("x1", xLin(+yr)).attr("x2", xLin(+yr)).attr("y1", 0).attr("y2", innerH);
        });
      });
      drawEraStrip(svg, periods, xLin, {
        offsetX: margin.left,
        offsetY: margin.top - 6,
        rowMap: eraPlan.rows,
        onHover: (p) => {
          info.innerHTML = `<h4>${p.start}–${p.end}</h4>
            <div class="detail"><strong>${escapeHTML(p.label || "")}</strong></div>
            ${p.description ? `<div class="detail chart-viz__timeline-info-desc">${escapeHTML(p.description)}</div>` : ""}`;
        },
        onLeave: () => { info.innerHTML = infoHTML(cfg); },
      });
    }

    // X axis — decade ticks.
    const decadeTicks = years.filter((yr) => yr % 20 === 0);
    const axis = g.append("g").attr("class", "chart-viz__axis").attr("transform", `translate(0,${innerH})`);
    decadeTicks.forEach((yr) => {
      const cx = x(yr) + x.bandwidth() / 2;
      axis.append("line").attr("x1", cx).attr("x2", cx).attr("y1", 0).attr("y2", 6).attr("stroke", "currentColor");
      axis.append("text").attr("x", cx).attr("y", 20).attr("text-anchor", "middle").text(yr);
    });

    // Color legend — a gradient bar with min/0/max labels.
    const lw = 260, lh = 12, lx = innerW - lw, ly = innerH + 38;
    const gradId = (container.id || "heat") + "-grad";
    const defs = svg.append("defs");
    const grad = defs.append("linearGradient").attr("id", gradId).attr("x1", "0%").attr("x2", "100%");
    [-dom, -dom / 2, 0, dom / 2, dom].forEach((v, i) => {
      grad.append("stop").attr("offset", `${i * 25}%`).attr("stop-color", color(v));
    });
    const lg = g.append("g").attr("transform", `translate(${lx},${ly})`);
    lg.append("rect").attr("width", lw).attr("height", lh).attr("fill", `url(#${gradId})`).attr("stroke", "var(--rule)");
    [[-dom, "start"], [0, "middle"], [dom, "end"]].forEach(([v, anch]) => {
      lg.append("text").attr("class", "chart-viz__heat-legendlabel")
        .attr("x", v === 0 ? lw / 2 : (v < 0 ? 0 : lw)).attr("y", lh + 14)
        .attr("text-anchor", anch).text((v > 0 ? "+" : "") + v + "°F");
    });
  }

  // ── Similarity matrix ───────────────────────────────────────────────
  // A symmetric n×n matrix (documents × documents) rendered as a heatmap
  // with categorical labels on both axes and a muted diagonal. Built for
  // the legislation text-reuse data: how much each state bill's language
  // overlaps every other's. cfg: matrixfield (which matrix in raw to
  // show — "jaccard" | "cosine"), labelfield (raw.states[].name).
  function drawMatrix(container, cfg, raw, info) {
    const items = raw.states || raw.items || [];
    const field = cfg.matrixfield || "jaccard";
    const M = raw[field];
    if (!items.length || !M) return;
    const n = items.length;
    const labels = items.map((s) => s.name || s.label || s.slug);
    const slugs = items.map((s) => s.slug);
    const nameBySlug = new Map(items.map((s) => [s.slug, s.name || s.label || s.slug]));

    // Pair lookup (order-independent) → the shared-passage detail behind
    // each cell. This is where the old standalone "Copied Clauses" drill
    // now lives: click a cell to read the verbatim text the two bills share.
    const pairKey = (a, b) => [a, b].sort().join("|");
    const pairMap = new Map((raw.pairs || []).map((p) => [pairKey(p.a, p.b), p]));

    const CELL = 54;
    const margin = { top: 96, right: 30, bottom: 20, left: 128 };
    const gridW = n * CELL, gridH = n * CELL;
    const W = gridW + margin.left + margin.right;
    const H = gridH + margin.top + margin.bottom;

    const svg = d3.select(container).append("svg")
      .attr("viewBox", `0 0 ${W} ${H}`).attr("preserveAspectRatio", "xMidYMid meet")
      .attr("role", "img").attr("aria-label", cfg.title || "Similarity matrix");
    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    // Color: off-diagonal max drives the ramp so the diagonal (self=1)
    // doesn't flatten everything else.
    let vmax = 0;
    for (let a = 0; a < n; a++) for (let b = 0; b < n; b++) if (a !== b) vmax = Math.max(vmax, M[a][b]);
    const color = d3.scaleSequential().domain([0, vmax || 1])
      .interpolator(d3.interpolateRgb("#f5efe1", "#7c3519"));

    const hideCard = () => { info.innerHTML = infoHTML(cfg); };

    // ── Click-to-read modal (mirrors the networks.js node modal) ──────
    const modal = document.createElement("div");
    modal.className = "chart-viz__modal";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-hidden", "true");
    modal.innerHTML =
      `<div class="chart-viz__modal-backdrop" data-close></div>` +
      `<div class="chart-viz__modal-panel">` +
        `<button class="chart-viz__modal-close" data-close aria-label="Close">&times;</button>` +
        `<div class="chart-viz__modal-body"></div>` +
      `</div>`;
    container.appendChild(modal);
    const modalBody = modal.querySelector(".chart-viz__modal-body");
    const closeModal = () => {
      modal.classList.remove("is-open");
      modal.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";     // release the page scroll lock
    };
    modal.querySelectorAll("[data-close]").forEach((el) => el.addEventListener("click", closeModal));
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });

    function renderPair(r, c) {
      const p = pairMap.get(pairKey(slugs[r], slugs[c]));
      if (!p) {
        return `<h3 class="chart-viz__modal-title">${escapeHTML(labels[r])} ↔ ${escapeHTML(labels[c])}</h3>` +
               `<p class="chart-viz__modal-empty">No comparison on record for this pair.</p>`;
      }
      // Directional containment: what share of each bill's five-word
      // phrases turns up in the other. The asymmetry is the evidence of
      // direction — the more fully reproduced bill is the likely source.
      const ab = p.containab || 0, ba = p.containba || 0, aDom = ab >= ba;
      const nameA = nameBySlug.get(p.a), nameB = nameBySlug.get(p.b);
      const aInB = Math.round(ab * 100), bInA = Math.round(ba * 100);
      const passages = p.passages || [];
      const passageWords = passages.reduce((s, t) => s + t.split(/\s+/).length, 0);
      const jac = (p.jaccard || 0).toFixed(3);
      const countLine = passages.length
        ? `${passages.length} shared passage${passages.length === 1 ? "" : "s"} · ${passageWords} words · Jaccard ${jac}`
        : `Jaccard ${jac}`;
      const meterRow = (src, tgt, pct, dom) =>
        `<div class="chart-viz__meter-row${dom ? " is-dominant" : ""}">` +
          `<span class="chart-viz__meter-label">${escapeHTML(src)} <span class="chart-viz__meter-in">in</span> ${escapeHTML(tgt)}</span>` +
          `<span class="chart-viz__meter-track"><span class="chart-viz__meter-fill" style="width:${pct}%"></span></span>` +
          `<span class="chart-viz__meter-val">${pct}%</span>` +
        `</div>`;
      const meter = aDom
        ? meterRow(nameA, nameB, aInB, true) + meterRow(nameB, nameA, bInA, false)
        : meterRow(nameB, nameA, bInA, true) + meterRow(nameA, nameB, aInB, false);
      return `<p class="chart-viz__modal-kicker">Shared legal text</p>` +
        `<h3 class="chart-viz__modal-title">${escapeHTML(nameA)} <span class="chart-viz__modal-arrow" aria-hidden="true">↔</span> ${escapeHTML(nameB)}</h3>` +
        `<p class="chart-viz__meter-caption">Share of each bill's five-word phrases found in the other:</p>` +
        `<div class="chart-viz__meter-group" role="group" aria-label="Directional phrase containment">${meter}</div>` +
        `<p class="chart-viz__modal-meta">${countLine}</p>` +
        (passages.length
          ? `<ul class="chart-viz__reuse-passages">${passages.map((t) => `<li>“…${escapeHTML(t)}…”</li>`).join("")}</ul>`
          : `<p class="chart-viz__modal-empty">No run of eight or more identical words appears in both bills — these two share only scattered phrasing.</p>`);
    }
    const openPair = (r, c) => {
      modalBody.innerHTML = renderPair(r, c);
      modalBody.scrollTop = 0;
      modal.classList.add("is-open");
      modal.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";   // lock page scroll behind the modal
    };

    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        const v = M[r][c];
        const diag = r === c;
        g.append("rect")
          .attr("class", "chart-viz__matrix-cell" + (diag ? " is-diag" : ""))
          .attr("x", c * CELL).attr("y", r * CELL)
          .attr("width", CELL - 2).attr("height", CELL - 2)
          .attr("fill", diag ? "var(--rule)" : color(v))
          .on("mouseover", function (event) {
            if (diag) return;
            d3.select(this).attr("stroke", "var(--ink)").attr("stroke-width", 2);
            info.innerHTML = `<h4>${escapeHTML(labels[r])} ↔ ${escapeHTML(labels[c])}</h4>
              <div class="detail">${capitalize(field)} similarity: <strong>${v.toFixed(3)}</strong></div>
              <div class="detail chart-viz__matrix-hint">Click to read the shared text</div>`;
          })
          .on("mousemove", (event) => placeTimelineCard(info, container, event))
          .on("mouseout", function () { d3.select(this).attr("stroke", null); hideCard(); })
          .on("click", () => { if (!diag) openPair(r, c); });
        // value label for legible off-diagonal cells
        if (!diag && v >= vmax * 0.14) {
          g.append("text").attr("class", "chart-viz__matrix-val")
            .attr("x", c * CELL + (CELL - 2) / 2).attr("y", r * CELL + (CELL - 2) / 2 + 4)
            .attr("text-anchor", "middle")
            .attr("pointer-events", "none")
            .attr("fill", v > vmax * 0.55 ? "var(--paper)" : "var(--ink)")
            .text(v.toFixed(2).replace(/^0/, ""));
        }
      }
    }
    // Row labels (left) and column labels (rotated, top).
    for (let i = 0; i < n; i++) {
      g.append("text").attr("class", "chart-viz__matrix-rowlabel")
        .attr("x", -10).attr("y", i * CELL + CELL / 2).attr("text-anchor", "end")
        .attr("dominant-baseline", "middle").text(labels[i]);
      g.append("text").attr("class", "chart-viz__matrix-collabel")
        .attr("transform", `translate(${i * CELL + CELL / 2},-10) rotate(-45)`)
        .attr("text-anchor", "start").text(labels[i]);
    }
  }

  // ── Genealogy network ───────────────────────────────────────────────
  // Bills laid out left→right in year columns; a directed edge runs from
  // the earlier bill to the later one (for same-year pairs, from the more
  // fully reproduced bill, by containment) with width ∝ shared phrases.
  // The descent of the model text becomes a family tree. cfg: edgemin
  // (min shared 5-grams to draw an edge, default 90), rootslug.
  function drawGenealogy(container, cfg, raw, info) {
    const states = (raw.states || []).filter((s) => s.year != null);
    if (!states.length) return;
    const byslug = new Map(states.map((s) => [s.slug, s]));
    const edgeMin = cfg.edgemin != null ? +cfg.edgemin : 90;
    const rootSlug = cfg.rootslug || "nevada";

    // Build directed edges from the pair list.
    const rawEdges = (raw.pairs || [])
      .filter((p) => byslug.has(p.a) && byslug.has(p.b))
      .map((p) => {
        const A = byslug.get(p.a), B = byslug.get(p.b);
        let src, tgt;
        if (A.year !== B.year) { [src, tgt] = A.year < B.year ? [A, B] : [B, A]; }
        else { src = (p.containab >= p.containba) ? A : B; tgt = src === A ? B : A; }
        return { src, tgt, grams: p.sharedshingles || 0, jaccard: p.jaccard || 0 };
      });
    // Keep edges above the threshold, plus every node's single strongest
    // link so nothing floats disconnected.
    const keep = new Set();
    rawEdges.forEach((e, idx) => { if (e.grams >= edgeMin) keep.add(idx); });
    states.forEach((s) => {
      let best = -1, bestG = 0;
      rawEdges.forEach((e, idx) => {
        if ((e.src === s || e.tgt === s) && e.grams > bestG) { bestG = e.grams; best = idx; }
      });
      if (best >= 0) keep.add(best);
    });
    const edges = [...keep].map((i) => rawEdges[i]);

    // Layout: year columns (scalePoint), vertical spread within a year.
    const years = Array.from(new Set(states.map((s) => s.year))).sort((a, b) => a - b);
    const W = 1200, H = 620;
    const margin = { top: 40, right: 150, bottom: 46, left: 90 };
    const innerW = W - margin.left - margin.right;
    const innerH = H - margin.top - margin.bottom;

    const svg = d3.select(container).append("svg")
      .attr("viewBox", `0 0 ${W} ${H}`).attr("preserveAspectRatio", "xMidYMid meet")
      .attr("role", "img").attr("aria-label", cfg.title || "Legislation genealogy");
    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scalePoint().domain(years).range([0, innerW]).padding(0.5);
    const byYear = d3.group(states, (s) => s.year);
    const pos = new Map();
    years.forEach((yr) => {
      const col = byYear.get(yr).slice().sort((a, b) => b.words - a.words);
      col.forEach((s, i) => {
        pos.set(s.slug, { x: x(yr), y: innerH * (i + 1) / (col.length + 1) });
      });
    });

    const rNode = d3.scaleSqrt().domain([0, d3.max(states, (s) => s.words)]).range([6, 30]);
    const wEdge = d3.scaleLinear().domain([edgeMin, d3.max(edges, (e) => e.grams) || edgeMin]).range([1.5, 9]).clamp(true);
    const hideCard = () => { info.innerHTML = infoHTML(cfg); };

    // Year column guides + axis labels.
    years.forEach((yr) => {
      g.append("line").attr("class", "chart-viz__gen-colguide")
        .attr("x1", x(yr)).attr("x2", x(yr)).attr("y1", -12).attr("y2", innerH + 10);
      g.append("text").attr("class", "chart-viz__gen-year")
        .attr("x", x(yr)).attr("y", innerH + 32).attr("text-anchor", "middle").text(yr);
    });

    // Edges (drawn first, under nodes).
    const edgeG = g.append("g");
    edges.forEach((e) => {
      const s = pos.get(e.src.slug), t = pos.get(e.tgt.slug);
      const rt = rNode(e.tgt.words);
      // Curved path; stop short of the target node so the arrow shows.
      const xm = (s.x + t.x) / 2;
      const dx = t.x - s.x, dy = t.y - s.y, len = Math.hypot(dx, dy) || 1;
      const tx = t.x - (dx / len) * (rt + 9), ty = t.y - (dy / len) * (rt + 9);
      edgeG.append("path").attr("class", "chart-viz__gen-edge")
        .attr("d", `M${s.x},${s.y} C${xm},${s.y} ${xm},${ty} ${tx},${ty}`)
        .attr("stroke-width", wEdge(e.grams))
        .on("mouseover", function () {
          d3.select(this).classed("is-hot", true);
          info.innerHTML = `<h4>${escapeHTML(e.src.name)} → ${escapeHTML(e.tgt.name)}</h4>
            <div class="detail"><strong>${e.grams}</strong> shared five-word phrases</div>`;
        })
        .on("mousemove", (event) => placeTimelineCard(info, container, event))
        .on("mouseout", function () { d3.select(this).classed("is-hot", false); hideCard(); });
      // Arrowhead at the trimmed endpoint.
      const ang = Math.atan2(dy, dx), a = 0.5, h = 9;
      edgeG.append("path").attr("class", "chart-viz__gen-arrow")
        .attr("d", `M${tx},${ty} L${tx - h * Math.cos(ang - a)},${ty - h * Math.sin(ang - a)} L${tx - h * Math.cos(ang + a)},${ty - h * Math.sin(ang + a)} Z`);
    });

    // Nodes.
    states.forEach((s) => {
      const p = pos.get(s.slug);
      const isRoot = s.slug === rootSlug;
      const node = g.append("g").attr("class", "chart-viz__gen-node").attr("transform", `translate(${p.x},${p.y})`);
      node.append("circle")
        .attr("class", "chart-viz__gen-dot" + (isRoot ? " is-root" : ""))
        .attr("r", rNode(s.words))
        .on("mouseover", function () {
          info.innerHTML = `<h4>${escapeHTML(s.name)} · ${s.year}</h4>
            <div class="detail">${s.words.toLocaleString()} words${isRoot ? " · model text" : ""}</div>`;
        })
        .on("mousemove", (event) => placeTimelineCard(info, container, event))
        .on("mouseout", hideCard);
      node.append("text").attr("class", "chart-viz__gen-label")
        .attr("x", rNode(s.words) + 7).attr("y", 4).text(s.name);
    });
  }

  // (The former standalone "borrowed-passage drill" renderer was merged
  // into drawMatrix: clicking a matrix cell now opens a modal with that
  // pair's copied passages. The .chart-viz__reuse-passages styles it reuses
  // remain in the stylesheet.)

  // ── Signature-phrase concordance ────────────────────────────────────
  // A ranked table of the phrases that recur across the most bills — the
  // boilerplate DNA of the model legislation. cfg: none required.
  function drawConcordance(container, cfg, raw, info) {
    if (info) info.style.display = "none";
    const names = new Map((raw.states || []).map((s) => [s.slug, s.name]));
    const sigs = (raw.signatures || []).slice();

    const table = document.createElement("table");
    table.className = "chart-viz__concordance";
    table.innerHTML =
      `<thead><tr><th>Shared five-word phrase</th><th class="num">Bills</th><th>Appears in</th></tr></thead>`;
    const tb = document.createElement("tbody");
    sigs.forEach((s) => {
      const chips = s.states.map((sl) =>
        `<span class="chart-viz__concordance-chip">${escapeHTML(names.get(sl) || sl)}</span>`).join("");
      const tr = document.createElement("tr");
      tr.innerHTML =
        `<td class="chart-viz__concordance-phrase">“${escapeHTML(s.text)}”</td>` +
        `<td class="num"><span class="chart-viz__concordance-count">${s.count}</span></td>` +
        `<td>${chips}</td>`;
      tb.appendChild(tr);
    });
    table.appendChild(tb);
    container.appendChild(table);
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

    // Extract per-panel data. Null y-values are KEPT: the line
    // generator's .defined() breaks the path there, and null runs
    // render as explicit "data gap" bands (below) rather than being
    // silently bridged — panels with different coverage (e.g. a series
    // that starts later or was discontinued) stay visually honest.
    panels.forEach((p) => {
      p.data = series.map((d) => ({
        x: +d[x],
        y: (d[p.field] == null || d[p.field] === "") ? null : +d[p.field] / p.scale,
      })).filter((d) => !isNaN(d.x)).sort((a, b) => a.x - b.x);
    });

    const W = 1200;
    const panelH = 180;
    const panelGap = 52;   // generous breathing room between multiples
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

      // Presidential administration bands — rendered behind gridlines.
      // Visibility toggled by the button appended after the SVG.
      if (cfg.adminbands) {
        const [xMin, xMax] = d3.extent(allX);
        const bandsG = g.append("g")
          .attr("class", "chart-viz__admin-bands")
          .attr("pointer-events", "none");
        ADMINISTRATIONS.forEach((a) => {
          const bx0 = Math.max(a.start, xMin);
          const bx1 = Math.min(a.end, xMax + 1);
          if (bx0 >= bx1) return;
          bandsG.append("rect")
            .attr("class", "chart-viz__admin-band chart-viz__admin-band--" + a.party)
            .attr("x", xScale(bx0))
            .attr("y", 0)
            .attr("width", Math.max(0, xScale(bx1) - xScale(bx0)))
            .attr("height", panelH);
        });
      }

      // Gridlines
      g.append("g").attr("class", "chart-viz__grid")
        .selectAll("line")
        .data(yScale.ticks(4))
        .join("line")
        .attr("x1", 0).attr("x2", innerW)
        .attr("y1", (t) => yScale(t)).attr("y2", (t) => yScale(t));

      // Explicit bands over runs of null values (same treatment as
      // drawBars) so a panel whose series starts late, ends early, or
      // has a hole reads as "not measured", not as zero.
      const gaps = [];
      let gapStart = null;
      p.data.forEach((d) => {
        if (d.y == null) { if (gapStart === null) gapStart = d.x; }
        else if (gapStart !== null) { gaps.push([gapStart, d.x]); gapStart = null; }
      });
      if (gapStart !== null && p.data.length) gaps.push([gapStart, p.data[p.data.length - 1].x]);
      gaps.forEach(([a, b]) => {
        g.append("rect")
          .attr("class", "chart-viz__gap")
          .attr("x", xScale(a))
          .attr("y", 0)
          .attr("width", xScale(b) - xScale(a))
          .attr("height", panelH);
        if (xScale(b) - xScale(a) > 70) {
          g.append("text")
            .attr("class", "chart-viz__gap-label")
            .attr("x", (xScale(a) + xScale(b)) / 2)
            .attr("y", panelH / 2 + 4)
            .attr("text-anchor", "middle")
            .text("data gap");
        }
      });

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

    // Toggle button for administration bands
    if (cfg.adminbands) {
      const btn = document.createElement("button");
      btn.className = "chart-viz__admin-toggle";
      btn.setAttribute("aria-pressed", "false");
      btn.textContent = "Show administrations";
      btn.addEventListener("click", () => {
        const on = container.classList.toggle("is-admin-bands");
        btn.setAttribute("aria-pressed", String(on));
        btn.textContent = on ? "Hide administrations" : "Show administrations";
      });
      container.appendChild(btn);
    }

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
          if (!pt || pt.y == null) {
            trackerDots[pi].style("display", "none");
            return `<div class="detail"><strong style="color:${pg.p.color}">${pg.p.label}:</strong> —</div>`;
          }
          trackerDots[pi]
            .style("display", null)
            .attr("cx", cx)
            .attr("cy", pg.top + pg.yScale(pt.y));
          return `<div class="detail"><strong style="color:${pg.p.color}">${pg.p.label}:</strong> ${fmtOf(pg.p.format)(pt.y)}${pg.p.unit}</div>`;
        }).join("");

        // Administration row — only shown when bands are visible
        let adminRow = "";
        if (cfg.adminbands && container.classList.contains("is-admin-bands")) {
          const adm = ADMINISTRATIONS.find((a) => snapX >= a.start && snapX < a.end);
          if (adm) {
            const col = adm.party === "republican" ? "#a94b2b" : "#1f2a44";
            adminRow = `<div class="detail chart-viz__admin-row"><span class="chart-viz__admin-dot" style="background:${col}"></span>${adm.name} (${adm.party === "republican" ? "R" : "D"}) · ${adm.start}–${adm.end}</div>`;
          }
        }

        info.innerHTML = `<h4>${snapX}</h4>${rows}${adminRow}`;
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
