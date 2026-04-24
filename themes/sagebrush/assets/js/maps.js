// ─────────────────────────────────────────────
// Governing Ground — map renderer
// Config is read from a <script type="application/json" id="{mapId}-config">
// tag sitting next to the map container, bypassing the HTML minifier's
// JS handling. Supports two shapes:
//   1. Single-layer:  { src, valuefield, labelfield, ... }
//   2. Multi-layer:   { layers: [ {src, style, label, ...}, ... ], center, zoom }
// Note: all config keys are lowercase because Hugo's .Params
// lowercases frontmatter keys, and the shortcode follows suit.
// Hooks into any element with data-viz="map" on the page.
// ─────────────────────────────────────────────

(function () {
  "use strict";

  if (typeof L === "undefined") return;

  // ─── Style presets — keyed to the site palette ──────────────────────
  // Each preset defines default + highlight style. Use "context" for
  // non-interactive background layers; the rest are for thematic layers.
  const presets = {
    context: {
      interactive: false,
      style: { color: "#8a7cb8", weight: 0.4, opacity: 0.4, fillColor: "#c4b8e0", fillOpacity: 0.3 },
    },
    sage: {
      style:     { color: "#4a5640", weight: 0.6, opacity: 0.9, fillColor: "#a8b394", fillOpacity: 0.45 },
      highlight: { color: "#4a5640", weight: 2.0, fillOpacity: 0.7 },
    },
    green: {
      style:     { color: "#2c6e3f", weight: 0.75, opacity: 0.9, fillColor: "#4a9e5c", fillOpacity: 0.5 },
      highlight: { color: "#1a4d2e", weight: 2.0, fillOpacity: 0.7 },
    },
    gold: {
      style:     { color: "#8b6914", weight: 0.75, opacity: 0.85, fillColor: "#c9a94e", fillOpacity: 0.45 },
      highlight: { color: "#6b4f0a", weight: 2.0, fillOpacity: 0.65 },
    },
    rust: {
      style:     { color: "#7c3519", weight: 0.75, opacity: 0.9, fillColor: "#a94b2b", fillOpacity: 0.5 },
      highlight: { color: "#5a2411", weight: 2.0, fillOpacity: 0.7 },
    },
    navy: {
      style:     { color: "#1f2a44", weight: 0.75, opacity: 0.9, fillColor: "#2f3e62", fillOpacity: 0.45 },
      highlight: { color: "#141c30", weight: 2.0, fillOpacity: 0.65 },
    },
  };

  // Choropleth ramp for valuefield-driven layers (cream → rust).
  // Colors at 7 stops; positions computed from layer.domain at render
  // time so the same ramp works for percentages (federal-ownership),
  // years (wilderness designations), counts, etc.
  const ramp = [
    "#f5efe1", // cream
    "#e5d6b3",
    "#d1b587",
    "#b88c5d",
    "#9a6439",
    "#7c3519", // rust-dark
    "#5a1f0a",
  ];
  // Default domain kept for the existing federal-ownership map.
  const DEFAULT_DOMAIN = [5, 100];

  const basemap = {
    url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>',
    subdomains: "abcd",
    maxZoom: 19,
  };

  function fmt(n, digits) {
    if (n == null || isNaN(n)) return "—";
    return Number(n).toLocaleString(undefined, { maximumFractionDigits: digits ?? 1 });
  }

  function rampColor(v, domain) {
    const [lo, hi] = domain || DEFAULT_DOMAIN;
    if (v == null || isNaN(v)) return ramp[0];
    const t = Math.max(0, Math.min(1, (v - lo) / (hi - lo)));
    const idx = Math.min(ramp.length - 1, Math.floor(t * ramp.length));
    return ramp[idx];
  }

  // Sqrt-scaled radius for proportional-symbol maps. domain = [min, max]
  // on the property; range = [rmin, rmax] in pixels. Sensible defaults
  // so a caller can just pass a value.
  function sqrtRadius(v, domain, range) {
    const [vmin, vmax] = domain || [0, 1e7];
    const [rmin, rmax] = range  || [4, 18];
    if (v == null || isNaN(v)) return rmin;
    const t = Math.sqrt(Math.max(0, v - vmin) / Math.max(1, vmax - vmin));
    return rmin + Math.min(1, t) * (rmax - rmin);
  }

  // Normalize a single-layer config to the layers-array shape.
  function normalize(cfg) {
    if (!cfg) return { layers: [] };
    if (cfg.layers) return cfg;
    if (cfg.src) {
      return Object.assign({}, cfg, {
        layers: [
          {
            src: cfg.src,
            style: "sage",
            label: cfg.infotitle || "",
            labelfield: cfg.labelfield,
            valuefield: cfg.valuefield,
            valueunit: cfg.valueunit,
            popupnote: cfg.popupnote,
            legendtitle: cfg.legendtitle,
            choropleth: !!cfg.valuefield,
            fallbacklabel: cfg.fallbacklabel,
          },
        ],
      });
    }
    return { layers: [] };
  }

  // ─── Per-container initialization ───────────────────────────────────
  function initMap(container) {
    const id = container.id;
    const configEl = document.getElementById(id + "-config");
    let raw = {};
    if (configEl) {
      try { raw = JSON.parse(configEl.textContent); }
      catch (err) { console.error("Invalid map config for", id, err); }
    }
    // Skip — another renderer (e.g. d3-maps.js) will handle this one.
    if (raw.renderer && raw.renderer !== "leaflet") return;
    if (container.dataset.initialized === "true") return;
    container.dataset.initialized = "true";
    const cfg = normalize(raw);

    container.innerHTML = "";
    container.classList.add("viz-embed__frame--live");

    const mapOpts = {
      zoomControl: true,
      scrollWheelZoom: cfg.fullbleed === true,
    };
    // Accept center as [lat, lon] or "lat,lon"
    let center = cfg.center;
    if (typeof center === "string") center = center.split(",").map(Number);
    mapOpts.center = (Array.isArray(center) && center.length === 2) ? center : [42.0, -112.0];
    mapOpts.zoom = cfg.zoom != null ? Number(cfg.zoom) : 5;

    const map = L.map(container, mapOpts);

    if (!cfg.fullbleed) {
      map.on("click", () => map.scrollWheelZoom.enable());
      map.on("mouseout", () => map.scrollWheelZoom.disable());
    }

    L.tileLayer(basemap.url, {
      attribution: basemap.attribution,
      subdomains: basemap.subdomains,
      maxZoom: basemap.maxZoom,
    }).addTo(map);

    // Hover info panel
    const info = L.control({ position: "topright" });
    info.onAdd = function () {
      this._div = L.DomUtil.create("div", "info-panel");
      this.update();
      return this._div;
    };
    info.update = function (label, detail) {
      if (!label) {
        this._div.innerHTML = `<h4>${cfg.infotitle || "Hover a feature"}</h4><div class="detail">${
          cfg.infoprompt || "Details will appear here."
        }</div>`;
        return;
      }
      this._div.innerHTML = `<h4>${label}</h4>${detail ? `<div class="detail">${detail}</div>` : ""}`;
    };
    info.addTo(map);

    // Load all layers, then render in order
    const rendered = [];
    const overlays = {};
    let anyChoropleth = false;

    Promise.all(cfg.layers.map((l) => fetch(l.src).then((r) => r.json().then((data) => ({ layer: l, data })))))
      .then((loaded) => {
        // Render bottom-up (first in array = bottom of the stack)
        loaded.forEach(({ layer, data }) => {
          const preset = presets[layer.style] || presets.sage;
          const isContext = preset.interactive === false;
          if (layer.choropleth) anyChoropleth = true;

          const geoOpts = {
            style: (feat) => styleFeature(feat, layer, preset),
            interactive: !isContext,
            onEachFeature: isContext ? undefined : (feat, lyr) => {
              bindFeature(feat, lyr, { map, info, layer, preset, getLayer: () => geo });
            },
          };
          // Point features: render as circle markers, optionally sized
          // from a property named in `layer.pointsize`. sqrt-scaling
          // accommodates the huge dynamic range of area-valued data.
          if (layer.pointsize || layer.pointradius) {
            geoOpts.pointToLayer = (feat, latlng) => {
              const props = feat.properties || {};
              const radius = layer.pointradius
                || sqrtRadius(props[layer.pointsize], layer.pointdomain, layer.pointradiusrange);
              const fillColor = layer.choropleth
                ? rampColor(props[layer.valuefield], layer.domain)
                : preset.style.fillColor;
              return L.circleMarker(latlng, {
                radius,
                color:       preset.style.color,
                weight:      preset.style.weight || 1,
                opacity:     preset.style.opacity || 0.9,
                fillColor,
                fillOpacity: preset.style.fillOpacity || 0.6,
              });
            };
          }
          const geo = L.geoJSON(data, geoOpts).addTo(map);
          rendered.push({ layer, geo });
          // Layers opt-in to the toggle control via their `label`. A
          // layer can hide from the control (still on the map, just not
          // toggleable) by setting `hidefromcontrol: true`.
          if (layer.label && !layer.hidefromcontrol) overlays[layer.label] = geo;
        });

        // Fit to the topmost non-context layer, or all thematic bounds —
        // but only when the config doesn't supply an explicit center/zoom.
        if (!cfg.center) {
          const thematic = rendered.filter((r) => (presets[r.layer.style] || presets.sage).interactive !== false);
          if (thematic.length) {
            try {
              const group = L.featureGroup(thematic.map((r) => r.geo));
              map.fitBounds(group.getBounds(), { padding: [30, 30] });
            } catch (_) {}
          }
        }

        // Layer control: shown when there are multiple labeled overlays,
        // when the config explicitly asks for it, or when at least one
        // layer opted out with `hidefromcontrol: true` (signals the
        // author wants the remaining layers individually toggleable).
        const anyHidden = rendered.some((r) => r.layer.hidefromcontrol);
        if (Object.keys(overlays).length > 1 || cfg.forcelayercontrol ||
            (anyHidden && Object.keys(overlays).length > 0)) {
          L.control.layers(null, overlays, { position: "topright", collapsed: false }).addTo(map);
        }

        // Legend
        renderLegend(map, cfg, rendered, anyChoropleth);

        // Optional state-selector: swaps the data src of a designated
        // layer when the user picks a different state. Config:
        //   cfg.stateselector = {
        //     label, default, layerindex, srctemplate,
        //     options: [{ code, name }], centers: { CODE: [lat, lon, zoom] }
        //   }
        if (cfg.stateselector) {
          attachStateSelector(map, cfg, rendered, overlays, info);
        }

        // Optional program-selector + year-slider for the Follow-the-Money
        // map: a choropleth that swaps what field is plotted based on
        // (program, year). Config:
        //   cfg.paymentsviz = {
        //     layerindex,  // which layer in cfg.layers carries the county polygons
        //     manifesturl, // manifest with { programs: [...], years: [lo, hi] }
        //     srctemplate, // per-program JSON url, with {slug} token
        //     default,     // program code to show initially
        //     year,        // initial year
        //     fipsfield,   // property name on county feature that holds the FIPS
        //   }
        if (cfg.paymentsviz) {
          attachPaymentsViz(map, cfg, rendered, info);
        }
      })
      .catch((err) => {
        container.classList.add("viz-embed__frame--error");
        container.innerHTML = `<div class="viz-embed__error">Map could not load: ${err.message}</div>`;
      });
  }

  function styleFeature(feature, layer, preset) {
    const base = Object.assign({}, preset.style);
    if (layer.choropleth && layer.valuefield) {
      base.fillColor = rampColor(feature.properties[layer.valuefield], layer.domain);
      base.fillOpacity = 0.7;
    }
    return base;
  }

  function featureLabel(props, layer) {
    const name = layer.labelfield ? props[layer.labelfield] : (props.name || props.NAME);
    return name || layer.fallbacklabel || layer.label || "Feature";
  }

  function featureDetail(props, layer) {
    if (!layer.valuefield) return "";
    const v = props[layer.valuefield];
    const unit = layer.valueunit || "";
    return `${fmt(v)}${unit}`;
  }

  // Render a key/value block in the popup from layer.popupfields.
  // Each entry: { field, label?, unit?, format? } — format "int" adds
  // thousands separators; anything else is shown as-is.
  function popupRows(props, layer) {
    const fields = layer.popupfields;
    if (!Array.isArray(fields) || !fields.length) return "";
    const rows = fields.map((f) => {
      const raw = props[f.field];
      if (raw == null || raw === "") return "";
      let val = raw;
      if (f.format === "int") val = Number(raw).toLocaleString();
      const unit = f.unit ? ` ${f.unit}` : "";
      const label = f.label || f.field;
      return `<div class="map-popup__row"><span class="map-popup__key">${label}</span><span class="map-popup__val">${val}${unit}</span></div>`;
    }).filter(Boolean).join("");
    return rows ? `<div class="map-popup__rows">${rows}</div>` : "";
  }

  function bindFeature(feature, lyr, ctx) {
    const { map, info, layer, preset, getLayer } = ctx;
    const p = feature.properties || {};
    const label = featureLabel(p, layer);
    const detail = featureDetail(p, layer);
    const rows = popupRows(p, layer);

    // Optional per-feature prose body — named via layer.popupbodyfield.
    // Rendered as a flowing paragraph, not a grid row, so long blurbs
    // don't get squeezed into a narrow column.
    const bodyText = layer.popupbodyfield ? (p[layer.popupbodyfield] || "") : "";
    const body = bodyText ? `<div class="map-popup__body">${bodyText}</div>` : "";

    const popup = `
      <div class="map-popup">
        <h3>${label}</h3>
        ${detail ? `<div class="map-popup__value">${detail}</div>` : ""}
        ${body}
        ${rows}
        ${layer.popupnote ? `<div class="map-popup__note">${layer.popupnote}</div>` : ""}
      </div>
    `;
    lyr.bindPopup(popup);

    const highlight = preset.highlight || {};
    lyr.on({
      mouseover: (e) => {
        e.target.setStyle(highlight);
        if (e.target.bringToFront) e.target.bringToFront();
        info.update(label, detail);
      },
      mouseout: (e) => {
        getLayer().resetStyle(e.target);
        info.update();
      },
      click: (e) => {
        // Polygons have getBounds(); circleMarkers use getLatLng + zoom.
        if (e.target.getBounds)      map.fitBounds(e.target.getBounds(), { padding: [40, 40] });
        else if (e.target.getLatLng) map.setView(e.target.getLatLng(), Math.max(map.getZoom(), 7));
      },
    });
  }

  function renderLegend(map, cfg, rendered, hasChoropleth) {
    if (!rendered.length) return;
    const legend = L.control({ position: "bottomright" });
    legend.onAdd = function () {
      const div = L.DomUtil.create("div", "legend");
      const title = cfg.legendtitle || (hasChoropleth ? "Legend" : "Layers");

      // If any layer is a choropleth, show the ramp with per-layer domain
      if (hasChoropleth) {
        const cho = rendered.find((r) => r.layer.choropleth);
        const unit = cho?.layer.valueunit || "";
        const domain = cho?.layer.domain || DEFAULT_DOMAIN;
        const [lo, hi] = domain;
        const n = ramp.length;
        const items = ramp.map((color, i) => {
          const a = lo + (hi - lo) * (i / n);
          const b = lo + (hi - lo) * ((i + 1) / n);
          // Integer-friendly formatting for years; keep decimals for percentages
          const fmt = (x) => Number.isInteger(lo) && Number.isInteger(hi)
            ? String(Math.round(x))
            : x.toFixed(1);
          return `<div class="legend-item"><span class="legend-swatch" style="background:${color}"></span>${fmt(a)}–${fmt(b)}${unit}</div>`;
        });
        div.innerHTML = `<h4>${title}</h4>${items.join("")}`;
        return div;
      }

      // Otherwise, swatch per thematic layer
      const items = rendered
        .filter((r) => (presets[r.layer.style] || presets.sage).interactive !== false)
        .concat(rendered.filter((r) => (presets[r.layer.style] || presets.sage).interactive === false))
        .map((r) => {
          const p = presets[r.layer.style] || presets.sage;
          return `<div class="legend-item"><span class="legend-swatch" style="background:${p.style.fillColor};border-color:${p.style.color}"></span>${r.layer.label || ""}</div>`;
        });
      div.innerHTML = `<h4>${title}</h4>${items.join("")}`;
      return div;
    };
    legend.addTo(map);
  }

  // ─── State-selector control ─────────────────────────────────────────
  // A top-left Leaflet control that offers a dropdown of states; on
  // change, the target layer's src swaps to the per-state file and the
  // map pans to that state's center.
  function attachStateSelector(map, cfg, rendered, overlays, info) {
    const ss = cfg.stateselector;
    const idx = ss.layerindex != null ? Number(ss.layerindex) : 0;
    const target = rendered[idx];
    if (!target) return;

    const ctl = L.control({ position: "topleft" });
    ctl.onAdd = function () {
      const div = L.DomUtil.create("div", "map-stateselector leaflet-bar");
      const label = ss.label || "State";
      const options = (ss.options || []).map((o) =>
        `<option value="${o.code}"${o.code === ss.default ? " selected" : ""}>${o.name}</option>`
      ).join("");
      div.innerHTML = `<label>${label}<select>${options}</select></label>`;
      L.DomEvent.disableClickPropagation(div);
      L.DomEvent.disableScrollPropagation(div);
      div.querySelector("select").addEventListener("change", (e) => {
        swapState(e.target.value);
      });
      return div;
    };
    ctl.addTo(map);

    function swapState(code) {
      const src = ss.srctemplate.replace("{state}", code.toLowerCase());
      const layer = Object.assign({}, target.layer, { src });
      const preset = presets[layer.style] || presets.sage;

      fetch(src)
        .then((r) => r.json())
        .then((data) => {
          // Remove old, add new
          map.removeLayer(target.geo);
          if (target.layer.label && overlays[target.layer.label]) {
            delete overlays[target.layer.label];
          }
          const geoOpts = {
            style: (feat) => styleFeature(feat, layer, preset),
            onEachFeature: (feat, lyr) => {
              bindFeature(feat, lyr, { map, info, layer, preset, getLayer: () => target.geo });
            },
          };
          const geo = L.geoJSON(data, geoOpts).addTo(map);
          target.geo = geo;
          target.layer = layer;
          if (layer.label) overlays[layer.label] = geo;

          // Pan to the state's center, if provided
          const center = ss.centers && ss.centers[code];
          if (Array.isArray(center) && center.length >= 2) {
            const [lat, lon, z] = center;
            map.setView([lat, lon], z != null ? z : map.getZoom());
          } else {
            try { map.fitBounds(geo.getBounds(), { padding: [30, 30] }); } catch (_) {}
          }
        })
        .catch((err) => console.error("State swap failed:", err));
    }
  }

  // ─── Payments-viz (Follow the Money county choropleth) ─────────────
  // A dedicated controller for the FTM county-choropleth sightline.
  // Renders a bottom control bar with: program <select>, year <input
  // type=range>, year-label, and a compact legend built from the
  // selected program's max value. On program change we lazy-fetch
  // /data/ftm-payments-<slug>.json (~5–150 KB each) and re-style the
  // county layer; on year change we re-style in place (no fetch).
  function attachPaymentsViz(map, cfg, rendered, info) {
    const pv = cfg.paymentsviz;
    const idx = pv.layerindex != null ? Number(pv.layerindex) : 0;
    const target = rendered[idx];
    if (!target) return;
    const fipsfield = pv.fipsfield || "fips";
    const layer = target.layer;

    // Per-program payments cache. key = program code.
    const cache = new Map();
    // Active state
    let program = pv.default;
    let year    = pv.year;
    let manifest = null;
    let maxVal = 1;   // per-program global max (for fixed color domain)

    // Build the bottom control bar as a Leaflet control so it sits over
    // the map cleanly; we rely on panning being via wheel+pinch, so a
    // bottom-anchored panel is OK.
    const ctl = L.control({ position: "bottomleft" });
    ctl.onAdd = function () {
      const div = L.DomUtil.create("div", "map-payments-ctl leaflet-bar");
      div.innerHTML = `
        <div class="map-payments-ctl__row">
          <label class="map-payments-ctl__field">
            <span>Program</span>
            <select class="map-payments-ctl__program"></select>
          </label>
          <label class="map-payments-ctl__field map-payments-ctl__field--year">
            <span>Year <strong class="map-payments-ctl__year-label"></strong></span>
            <input type="range" class="map-payments-ctl__year" />
          </label>
        </div>
        <div class="map-payments-ctl__legend"></div>
      `;
      L.DomEvent.disableClickPropagation(div);
      L.DomEvent.disableScrollPropagation(div);
      return div;
    };
    ctl.addTo(map);

    const ctlEl = map.getContainer().querySelector(".map-payments-ctl");
    const selProgram = ctlEl.querySelector(".map-payments-ctl__program");
    const rngYear = ctlEl.querySelector(".map-payments-ctl__year");
    const lblYear = ctlEl.querySelector(".map-payments-ctl__year-label");
    const legendEl = ctlEl.querySelector(".map-payments-ctl__legend");

    // ── Helpers ─────────────────────────────────────────────────────
    function loadProgram(code) {
      if (cache.has(code)) return Promise.resolve(cache.get(code));
      const slug = code.replace(/\//g, "-").replace(/ /g, "_");
      const url = pv.srctemplate.replace("{slug}", slug);
      return fetch(url).then((r) => r.json()).then((pj) => {
        // Expand interleaved [year, v, year, v, ...] into a year→value map
        const out = { program: pj.program, label: pj.label, unit: pj.unit,
                      year_range: pj.year_range, max_value: pj.max_value,
                      counties: {} };
        for (const [fips, pairs] of Object.entries(pj.counties || {})) {
          const m = {};
          for (let i = 0; i < pairs.length; i += 2) m[pairs[i]] = pairs[i + 1];
          out.counties[fips] = m;
        }
        cache.set(code, out);
        return out;
      });
    }

    // Four-stop sequential ramp (cream → rust), bucketed on sqrt scale
    // so small/medium counties don't vanish under one big spike.
    const paymentRamp = ramp; // reuse module-level ramp
    function paymentColor(v, vmax) {
      // No-payment tone: warm bone, warm enough to read against Positron
      // grey but muted enough that it reads as a "below threshold" signal.
      if (v == null || v <= 0) return "#d9d2c4";
      const t = Math.sqrt(Math.max(0, v)) / Math.sqrt(Math.max(1, vmax));
      const idx = Math.min(paymentRamp.length - 1, Math.floor(t * paymentRamp.length));
      return paymentRamp[idx];
    }

    // Style a county for the current (program, year). Extracted so both
    // the initial draw and mouseout can use it — Leaflet's resetStyle
    // only knows the layer's preset default, not our choropleth color.
    function styleCounty(feat) {
      const data = cache.get(program);
      if (!data) return (presets[layer.style] || presets.sage).style;
      const p = feat.properties || {};
      const fips = p[fipsfield];
      const v = fips && data.counties[fips] ? data.counties[fips][year] : 0;
      return {
        fillColor: paymentColor(v, maxVal),
        fillOpacity: v > 0 ? 0.85 : 0.55,
        weight: 0.5,
        color: "#8a8076",   // warm tan border, legible on Positron
        opacity: 0.9,
      };
    }

    function restyle() {
      const data = cache.get(program);
      if (!data) return;
      maxVal = data.max_value || 1;
      target.geo.setStyle(styleCounty);

      target.geo.eachLayer((lyr) => {
        const f = lyr.feature;
        const p = f.properties || {};
        const fips = p[fipsfield];
        const v = fips && data.counties[fips] ? data.counties[fips][year] : 0;
        const name = p.name || p.NAME || fips || "County";
        const formatted = v > 0 ? `$${(v).toLocaleString()}K (2020 dollars)` : "no payment reported";
        lyr.unbindPopup();
        lyr.bindPopup(
          `<div class="map-popup"><h3>${name}</h3>` +
          `<div class="map-popup__value">${data.label}, ${year}</div>` +
          `<div class="map-popup__note">${formatted}</div></div>`
        );
        lyr.off("mouseover").off("mouseout");
        lyr.on("mouseover", (e) => {
          e.target.setStyle({ weight: 1.8, color: "#2a2a2a" });
          if (e.target.bringToFront) e.target.bringToFront();
          info.update(name, `${data.label}, ${year}: ${formatted}`);
        });
        lyr.on("mouseout", (e) => {
          e.target.setStyle(styleCounty(e.target.feature));
          info.update();
        });
      });
      renderPaymentsLegend(data, maxVal);
    }

    function renderPaymentsLegend(data, vmax) {
      const nBuckets = paymentRamp.length;
      const label = data.label || program;
      // Sqrt-buckets from 0 → vmax
      const items = paymentRamp.map((color, i) => {
        const lo = Math.round(Math.pow((i)     / nBuckets, 2) * vmax);
        const hi = Math.round(Math.pow((i + 1) / nBuckets, 2) * vmax);
        return `<div class="legend-item"><span class="legend-swatch" style="background:${color}"></span>$${lo.toLocaleString()}–$${hi.toLocaleString()}K</div>`;
      });
      legendEl.innerHTML = `<h4>${label}</h4>${items.join("")}`;
    }

    function bootstrap() {
      // 1) Get manifest → fill the program <select>
      fetch(pv.manifesturl).then((r) => r.json()).then((mf) => {
        manifest = mf;
        selProgram.innerHTML = mf.programs.map((pr) =>
          `<option value="${pr.code}"${pr.code === program ? " selected" : ""}>${pr.label}</option>`
        ).join("");
        const [yrLo, yrHi] = mf.years;
        rngYear.min = String(yrLo);
        rngYear.max = String(yrHi);
        rngYear.value = String(year);
        lblYear.textContent = String(year);

        // 2) Load initial program + restyle
        loadProgram(program).then(() => restyle());

        // 3) Wire events
        selProgram.addEventListener("change", (e) => {
          program = e.target.value;
          loadProgram(program).then(() => restyle());
        });
        rngYear.addEventListener("input", (e) => {
          year = +e.target.value;
          lblYear.textContent = String(year);
          restyle();
        });
      }).catch((err) => console.error("Payments viz init failed:", err));
    }

    bootstrap();
  }

  // ─── Boot ───────────────────────────────────────────────────────────
  function boot() {
    document.querySelectorAll('[data-viz="map"]').forEach(initMap);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
