// ─────────────────────────────────────────────
// Between the Fences — D3 map renderer (AlbersUSA, TopoJSON)
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

    function renderLegend(features) {
      const presentLc = new Set(features.map((f) => lookup(f.properties[cfg.colorfield])));
      const order = cfg.legendorder || Object.keys(palette).filter((k) => k !== "default");
      const entries = order.filter((k) => presentLc.has(lookup(k)));
      const title = cfg.legendtitle || "Managing agency";
      const items = entries.map((k) => {
        const sw = palette[lookup(k)] || unknown;
        const lbl = labels[lookup(k)] || k;
        return `<div class="legend-item"><span class="legend-swatch" style="background:${sw}"></span>${lbl}</div>`;
      });
      legend.innerHTML = `<h4>${title}</h4>${items.join("")}`;
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
