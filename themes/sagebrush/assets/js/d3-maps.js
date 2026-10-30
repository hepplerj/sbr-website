// ─────────────────────────────────────────────
// Governing Ground — D3 map renderer (AlbersUSA, TopoJSON)
// Sister module to maps.js. Activates on elements with
// data-viz="map" whose config.renderer === "d3".
//
// Config shape (lowercase to match Hugo's .Params lowercasing):
//   {
//     renderer: "d3",
//     src: "/data/fedland.topojson",
//     statesobject: "states",    // topojson object key for state polygons
//     dataobject:   "fedland",   // topojson object key for the thematic polygons
//     colorfield:   "type",      // property on data features to color by
//     palette:      { BLM: "#...", USFS: "#...", default: "#..." },
//     labels:       { BLM: "Bureau of Land Management", ... },
//     infotitle:    "US federal lands",
//     infoprompt:   "Hover a parcel..."
//   }
// ─────────────────────────────────────────────

(function () {
  "use strict";
  if (typeof d3 === "undefined" || typeof topojson === "undefined") return;

  // The fedland.topojson is already pre-projected to AlbersUSA screen
  // coordinates for a 960x500 canvas (see its `transform` block). We render
  // with a null/identity projection; applying another projection would mangle it.
  const VIEW_W = 960;
  const VIEW_H = 500;

  function initMap(container) {
    if (container.dataset.initialized === "true") return;

    const id = container.id;
    const configEl = document.getElementById(id + "-config");
    if (!configEl) return;

    let cfg;
    try { cfg = JSON.parse(configEl.textContent); }
    catch (err) { console.error("Invalid D3 map config for", id, err); return; }

    if (cfg.renderer !== "d3") return;
    if (cfg.mode === "timeline") return initTimeline(container, cfg);
    container.dataset.initialized = "true";
    container.classList.add("viz-embed__frame--live", "d3-map");
    container.innerHTML = "";

    // Hugo lowercases .Params keys, so palette/label entries arrive as
    // {blm: "#...", fs: "#..."}, while the topojson data's `type` property
    // is uppercase ("BLM", "FS"). Normalize both sides to lowercase on lookup.
    const palette = lowerKeys(cfg.palette || {});
    const labels  = lowerKeys(cfg.labels  || {});
    const unknown = palette.default || "#c4b8e0";
    const lookup  = (code) => String(code || "").toLowerCase();

    const svg = d3.select(container).append("svg")
      .attr("viewBox", `0 0 ${VIEW_W} ${VIEW_H}`)
      .attr("preserveAspectRatio", "xMidYMid meet")
      .attr("role", "img")
      .attr("aria-label", cfg.infotitle || "Federal lands map");

    const gBase   = svg.append("g").attr("class", "d3-map__base");
    const gData   = svg.append("g").attr("class", "d3-map__data");
    const gBounds = svg.append("g").attr("class", "d3-map__bounds");

    const info = document.createElement("div");
    info.className = "info-panel d3-map__info";
    info.innerHTML = infoHTML(cfg);
    container.appendChild(info);

    const legend = document.createElement("div");
    legend.className = "legend d3-map__legend";
    container.appendChild(legend);

    d3.json(cfg.src)
      .then((topo) => render(topo))
      .catch((err) => {
        container.classList.add("viz-embed__frame--error");
        container.innerHTML = `<div class="viz-embed__error">Map could not load: ${err.message}</div>`;
      });

    function render(topo) {
      const states = topojson.feature(topo, topo.objects[cfg.statesobject || "states"]);
      const data   = topojson.feature(topo, topo.objects[cfg.dataobject   || "fedland"]);

      // Identity path — data is pre-projected into the viewBox coordinate space.
      const path = d3.geoPath();

      // States fill (soft paper) + thematic polygons on top
      gBase.selectAll("path.d3-map__state")
        .data(states.features)
        .join("path")
        .attr("class", "d3-map__state")
        .attr("d", path);

      gData.selectAll("path.d3-map__feature")
        .data(data.features)
        .join("path")
        .attr("class", (d) => "d3-map__feature feat-" + safe(d.properties[cfg.colorfield]))
        .attr("d", path)
        .attr("fill", (d) => palette[lookup(d.properties[cfg.colorfield])] || unknown)
        .on("mouseover", function (event, d) {
          d3.select(this).classed("is-hover", true);
          updateInfo(d.properties);
        })
        .on("mouseout", function () {
          d3.select(this).classed("is-hover", false);
          updateInfo();
        });

      // State boundaries on top
      gBounds.append("path")
        .attr("class", "d3-map__state-boundary")
        .datum(topojson.mesh(topo, topo.objects[cfg.statesobject || "states"], (a, b) => a !== b))
        .attr("d", path);

      // National boundary
      gBounds.append("path")
        .attr("class", "d3-map__national-boundary")
        .datum(topojson.mesh(topo, topo.objects[cfg.statesobject || "states"], (a, b) => a === b))
        .attr("d", path);

      renderLegend(data.features);
    }

    function updateInfo(props) {
      if (!props) { info.innerHTML = infoHTML(cfg); return; }
      const code = props[cfg.colorfield];
      const name = labels[lookup(code)] || code || "Federal parcel";
      info.innerHTML = `<h4>${name}</h4>${code ? `<div class="detail">${code}</div>` : ""}`;
    }

    // Active-agency filter: when a legend item is clicked, only that
    // agency's polygons stay full-opacity; everything else dims.
    // Click the same item again (or the legend title/"All") to clear.
    let activeCode = null;

    function applyFilter() {
      gData.selectAll("path.d3-map__feature")
        .classed("is-dim",   (d) => activeCode != null && lookup(d.properties[cfg.colorfield]) !== activeCode)
        .classed("is-focus", (d) => activeCode != null && lookup(d.properties[cfg.colorfield]) === activeCode);
      legend.querySelectorAll(".legend-item").forEach((el) => {
        const code = el.dataset.code || "";
        const on = activeCode != null && code === activeCode;
        el.classList.toggle("is-active",  on);
        el.classList.toggle("is-inactive", activeCode != null && !on);
        el.setAttribute("aria-pressed", on ? "true" : "false");
      });
    }

    function renderLegend(features) {
      const presentLc = new Set(features.map((f) => lookup(f.properties[cfg.colorfield])));
      const pool = cfg.legendorder || Object.keys(palette).filter((k) => k !== "default");
      // Sort alphabetically by display label (falling back to the code).
      const entries = pool
        .filter((k) => presentLc.has(lookup(k)))
        .sort((a, b) => {
          const la = (labels[lookup(a)] || a).toLowerCase();
          const lb = (labels[lookup(b)] || b).toLowerCase();
          return la.localeCompare(lb);
        });
      const title = cfg.legendtitle || "Managing agency";
      const items = entries.map((k) => {
        const code = lookup(k);
        const sw = palette[code] || unknown;
        const lbl = labels[code] || k;
        return `<button type="button" class="legend-item" data-code="${code}" aria-pressed="false"><span class="legend-swatch" style="background:${sw}"></span>${lbl}</button>`;
      });
      legend.innerHTML = `<h4>${title}</h4>${items.join("")}<button type="button" class="legend-reset" hidden>Clear filter</button>`;

      legend.querySelectorAll(".legend-item").forEach((el) => {
        el.addEventListener("click", () => {
          const code = el.dataset.code;
          activeCode = (activeCode === code) ? null : code;
          legend.querySelector(".legend-reset").hidden = (activeCode == null);
          applyFilter();
        });
      });
      const resetBtn = legend.querySelector(".legend-reset");
      resetBtn.addEventListener("click", () => {
        activeCode = null;
        resetBtn.hidden = true;
        applyFilter();
      });
    }
  }

  // ── Timeline mode ───────────────────────────
  // mode: "timeline" — point tracts (lon/lat) over us-atlas states, fitted
  // to a set of focus states, with a year playhead. This one uses a real
  // geoAlbers projection; it never touches the pre-projected fedland file.
  //   statessrc: "/data/states.json"
  //   src:       { fields: [...lon, lat, acres, year...], tracts: [[...]] }
  //   focus:     ["30", "38", ...]   state FIPS to fit the view to and tally
  //   start:     1930                first year on the slider
  //   color:     "#1f6b66"           older tracts; newly acquired draw in --rust
  //   windows:   [0, 10, 1]          0 = cumulative, n = acquired in last n years
  function initTimeline(container, cfg) {
    container.dataset.initialized = "true";
    container.classList.add("viz-embed__frame--live", "d3-map", "d3-map--timeline");
    container.innerHTML = "";

    const canvas = document.createElement("canvas");
    canvas.setAttribute("role", "img");
    canvas.setAttribute("aria-label", cfg.infotitle || "Easement tracts over time");
    container.appendChild(canvas);

    const info = document.createElement("div");
    info.className = "info-panel d3-map__info";
    container.appendChild(info);

    const windows = cfg.windows || [0, 10, 1];
    const winLabel = (n) => n === 0 ? "All acquired to date" : n === 1 ? "Acquired that year" : `Acquired in last ${n} years`;
    const controls = document.createElement("div");
    controls.className = "info-panel d3-map__timeline";
    controls.innerHTML = `
      <button type="button" class="d3-map__play" aria-label="Play">▶</button>
      <input type="range" class="d3-map__year" aria-label="Year">
      <select class="d3-map__window" aria-label="Which tracts to show">
        ${windows.map((n) => `<option value="${n}">${winLabel(n)}</option>`).join("")}
      </select>`;
    container.appendChild(controls);
    const playBtn = controls.querySelector(".d3-map__play");
    const slider  = controls.querySelector(".d3-map__year");
    const winSel  = controls.querySelector(".d3-map__window");

    const css = getComputedStyle(container);
    const col = (v, fb) => css.getPropertyValue(v).trim() || fb;
    const C = {
      bg: col("--paper", "#f1ebdb"), land: col("--faint", "#ddd4bd"), focus: col("--panel", "#e9e1cd"),
      rule: col("--rule", "#cdc2a9"), ink: col("--ink", "#28323b"),
      old: cfg.color || "#1f6b66", fresh: col("--rust", "#a2502c"),
    };
    const focusIds = new Set((cfg.focus || []).map(String));

    Promise.all([d3.json(cfg.statessrc || "/data/states.json"), d3.json(cfg.src)])
      .then(([topo, data]) => setup(topo, data))
      .catch((err) => {
        container.classList.add("viz-embed__frame--error");
        container.innerHTML = `<div class="viz-embed__error">Map could not load: ${err.message}</div>`;
      });

    function setup(topo, data) {
      const states = topojson.feature(topo, topo.objects.states).features;
      const focus  = states.filter((f) => focusIds.has(String(f.id)));
      const mesh   = topojson.mesh(topo, topo.objects.states, (a, b) => a !== b);
      const F = Object.fromEntries(data.fields.map((f, i) => [f, i]));
      const tracts = data.tracts.filter((t) => t[F.year] != null);
      const years  = tracts.map((t) => t[F.year]);
      const start  = cfg.start || d3.min(years);
      const end    = d3.max(years);

      slider.min = start; slider.max = end; slider.value = start;
      let pts = [];

      function layout() {
        const w = container.clientWidth, h = container.clientHeight;
        const dpr = window.devicePixelRatio || 1;
        canvas.width = w * dpr; canvas.height = h * dpr;
        canvas.style.width = w + "px"; canvas.style.height = h + "px";
        canvas.getContext("2d").setTransform(dpr, 0, 0, dpr, 0, 0);

        const pad = Math.min(w, h) * 0.06;
        const projection = d3.geoAlbers()
          .fitExtent([[pad, pad], [w - pad, h - pad - controls.offsetHeight]], { type: "FeatureCollection", features: focus });
        const path = d3.geoPath(projection);

        // Native point-in-polygon on an unscaled scratch canvas tells us which
        // tracts sit inside the focus states (for the tallies).
        const focusPath = new Path2D(path({ type: "FeatureCollection", features: focus }));
        const hit = document.createElement("canvas").getContext("2d");
        pts = [];
        for (const t of tracts) {
          const p = projection([t[F.lon], t[F.lat]]);
          if (!p || p[0] < -10 || p[1] < -10 || p[0] > w + 10 || p[1] > h + 10) continue;
          const acres = t[F.acres] || 0;
          pts.push({ x: p[0], y: p[1], year: t[F.year], acres,
                     r: Math.min(6, 0.7 + Math.sqrt(acres) / 12),
                     inFocus: hit.isPointInPath(focusPath, p[0], p[1]) });
        }
        pts.sort((a, b) => a.year - b.year);
        layout.paths = {
          land: new Path2D(path({ type: "FeatureCollection", features: states })),
          focus: focusPath,
          mesh: new Path2D(path(mesh)),
        };
        draw();
      }

      function draw() {
        const ctx = canvas.getContext("2d");
        const w = container.clientWidth, h = container.clientHeight;
        const year = +slider.value, win = +winSel.value;
        const from = win === 0 ? -Infinity : year - win + 1;
        const P = layout.paths;

        ctx.fillStyle = C.bg; ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = C.land; ctx.fill(P.land);
        ctx.fillStyle = C.focus; ctx.fill(P.focus);
        ctx.strokeStyle = C.bg; ctx.lineWidth = 1; ctx.stroke(P.mesh);
        ctx.strokeStyle = C.ink; ctx.lineWidth = 1.2; ctx.stroke(P.focus);

        let n = 0, acres = 0;
        for (const p of pts) {
          if (p.year > year) break;
          if (p.year < from) continue;
          const fresh = p.year === year;
          ctx.globalAlpha = fresh ? 0.95 : 0.55;
          ctx.fillStyle = fresh ? C.fresh : C.old;
          ctx.beginPath(); ctx.arc(p.x, p.y, fresh ? p.r + 1 : p.r, 0, 2 * Math.PI); ctx.fill();
          if (p.inFocus) { n++; acres += p.acres; }
        }
        ctx.globalAlpha = 1;

        const fmt = d3.format(",");
        info.innerHTML = `<h4>${year}</h4><div class="detail">${winLabel(win)}: <strong>${fmt(n)}</strong> tracts,
          <strong>${fmt(Math.round(acres))}</strong> acres in ${cfg.focuslabel || "the highlighted states"}.
          <span style="color:${C.fresh}">●</span> acquired in ${year}</div>`;
      }

      let timer = null;
      function stop() { clearInterval(timer); timer = null; playBtn.textContent = "▶"; playBtn.setAttribute("aria-label", "Play"); }
      playBtn.addEventListener("click", () => {
        if (timer) return stop();
        if (+slider.value >= end) slider.value = start;
        playBtn.textContent = "❚❚"; playBtn.setAttribute("aria-label", "Pause");
        timer = setInterval(() => {
          if (+slider.value >= end) return stop();
          slider.value = +slider.value + 1; draw();
        }, cfg.speed || 200);
      });
      slider.addEventListener("input", () => { stop(); draw(); });
      winSel.addEventListener("change", draw);

      let resizeTimer;
      new ResizeObserver(() => { clearTimeout(resizeTimer); resizeTimer = setTimeout(layout, 100); }).observe(container);
      layout();
    }
  }

  function infoHTML(cfg) {
    return `<h4>${cfg.infotitle || "Hover a parcel"}</h4><div class="detail">${
      cfg.infoprompt || "Details will appear here."
    }</div>`;
  }

  function safe(s) { return String(s || "unknown").replace(/[^a-z0-9]/gi, ""); }

  function lowerKeys(obj) {
    const out = {};
    for (const k in obj) out[k.toLowerCase()] = obj[k];
    return out;
  }

  function boot() {
    document.querySelectorAll('[data-viz="map"]').forEach(initMap);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
