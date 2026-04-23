// sightlines-map.js — filter logic + mini region map for the Sightlines index page.
//
// Replaces the inline <script> in sightlines/list.html for both theme-pill filtering
// and the new region mini-map. Depends on D3 (global) and topojson-client (global),
// both loaded by head.html when .IsSection && .Section == "sightlines".
//
// Hugo lowercases frontmatter keys — all data-* attributes and data-value slugs use
// lowercase-hyphenated strings (e.g. "northern-plains", not "Northern Plains").

(function () {
  // ── Region taxonomy ──────────────────────────────────────────────────────────
  // FIPS IDs are strings "01".."72" in us-atlas. +id gives the numeric value.
  var FIPS_REGION = {
    30: "northern-plains",   // MT
    38: "northern-plains",   // ND
    46: "northern-plains",   // SD
    31: "northern-plains",   // NE
    20: "southern-plains",   // KS
    40: "southern-plains",   // OK
    48: "southern-plains",   // TX
    16: "intermountain-west",// ID
    49: "intermountain-west",// UT
    32: "intermountain-west",// NV
     8: "rocky-mountain",    // CO
    56: "rocky-mountain",    // WY
     4: "southwest",         // AZ
    35: "southwest",         // NM
    53: "pacific-northwest", // WA
    41: "pacific-northwest", // OR
     6: "pacific-southwest", // CA
  };

  var REGION_COLOR = {
    "northern-plains":   "#b8a55a",
    "southern-plains":   "#c06b45",
    "intermountain-west":"#4e8055",
    "rocky-mountain":    "#5278a0",
    "southwest":         "#9b4e4e",
    "pacific-northwest": "#3a7268",
    "pacific-southwest": "#7a5e9a",
  };

  var REGION_LABEL = {
    "northern-plains":   "Northern Plains",
    "southern-plains":   "Southern Plains",
    "intermountain-west":"Intermountain West",
    "rocky-mountain":    "Rocky Mountain",
    "southwest":         "Southwest",
    "pacific-northwest": "Pacific Northwest",
    "pacific-southwest": "Pacific Southwest",
  };

  // Ordered for display in legend
  var REGION_ORDER = [
    "northern-plains", "southern-plains",
    "intermountain-west", "rocky-mountain", "southwest",
    "pacific-northwest", "pacific-southwest",
  ];

  // ── Shared filter state ───────────────────────────────────────────────────────
  var active = { theme: new Set(), region: new Set() };

  var cards  = document.querySelectorAll(".sightlines-card");
  var groups = document.querySelectorAll(".sightlines-group");

  function refresh() {
    // Theme pills
    var themePillGroups = document.querySelectorAll(
      '.sightlines-filter__pills[data-dimension="theme"]'
    );
    themePillGroups.forEach(function (pg) {
      pg.querySelectorAll(".sightlines-filter__pill").forEach(function (p) {
        var v   = p.dataset.value;
        var on  = v === "" ? active.theme.size === 0 : active.theme.has(v);
        p.classList.toggle("is-active", on);
        p.setAttribute("aria-pressed", on ? "true" : "false");
      });
    });

    // Cards
    cards.forEach(function (c) {
      var ct = (c.dataset.themes  || "").split(",").filter(Boolean);
      var cr = (c.dataset.regions || "").split(",").filter(Boolean);
      var tOK = active.theme.size  === 0 || ct.some(function (t) { return active.theme.has(t); });
      var rOK = active.region.size === 0 || cr.some(function (r) { return active.region.has(r); });
      c.classList.toggle("is-hidden", !(tOK && rOK));
    });

    // Groups
    groups.forEach(function (g) {
      var shown = g.querySelectorAll(".sightlines-card:not(.is-hidden)").length;
      g.classList.toggle("is-hidden", shown === 0);
    });

    // Map visual state
    updateMapState();

    // Legend pills
    updateLegendState();
  }

  // ── Theme pills ───────────────────────────────────────────────────────────────
  document.querySelectorAll('.sightlines-filter__pills[data-dimension="theme"]')
    .forEach(function (pg) {
      pg.querySelectorAll(".sightlines-filter__pill").forEach(function (p) {
        p.addEventListener("click", function () {
          var v = p.dataset.value;
          if (v === "") { active.theme.clear(); }
          else if (active.theme.has(v)) { active.theme.delete(v); }
          else { active.theme.add(v); }
          refresh();
        });
      });
    });

  // ── Mini region map ───────────────────────────────────────────────────────────
  var mapContainer = document.getElementById("sightlines-region-map");
  if (!mapContainer) return;

  var statePaths = null;   // D3 selection of <path> elements

  function fillFor(fipsNum) {
    var region = FIPS_REGION[fipsNum];
    if (!region) return "#ddd8ce";
    if (active.region.size === 0) return REGION_COLOR[region];
    return active.region.has(region) ? REGION_COLOR[region] : "#ddd8ce";
  }

  function updateMapState() {
    if (!statePaths) return;
    statePaths.attr("fill", function (d) { return fillFor(+d.id); });
  }

  function toggleRegion(slug) {
    if (active.region.has(slug)) { active.region.delete(slug); }
    else { active.region.add(slug); }
    refresh();
  }

  function updateLegendState() {
    var legend = document.getElementById("sightlines-region-legend");
    if (!legend) return;
    legend.querySelectorAll(".sightlines-region-chip").forEach(function (btn) {
      var slug = btn.dataset.region;
      var on   = active.region.size === 0 ? false : active.region.has(slug);
      btn.classList.toggle("is-active", on);
      btn.setAttribute("aria-pressed", on ? "true" : "false");
    });
    // "All" button
    var allBtn = legend.querySelector(".sightlines-region-chip--all");
    if (allBtn) {
      var allOn = active.region.size === 0;
      allBtn.classList.toggle("is-active", allOn);
      allBtn.setAttribute("aria-pressed", allOn ? "true" : "false");
    }
  }

  function buildLegend() {
    var legend = document.getElementById("sightlines-region-legend");
    if (!legend) return;

    var allBtn = document.createElement("button");
    allBtn.type = "button";
    allBtn.className = "sightlines-region-chip sightlines-region-chip--all is-active";
    allBtn.dataset.region = "";
    allBtn.setAttribute("aria-pressed", "true");
    allBtn.textContent = "All regions";
    allBtn.addEventListener("click", function () {
      active.region.clear();
      refresh();
    });
    legend.appendChild(allBtn);

    REGION_ORDER.forEach(function (slug) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "sightlines-region-chip";
      btn.dataset.region = slug;
      btn.setAttribute("aria-pressed", "false");

      var dot = document.createElement("span");
      dot.className = "sightlines-region-chip__dot";
      dot.style.background = REGION_COLOR[slug];

      btn.appendChild(dot);
      btn.appendChild(document.createTextNode(REGION_LABEL[slug]));

      btn.addEventListener("click", function () { toggleRegion(slug); });
      legend.appendChild(btn);
    });
  }

  // Render SVG map
  if (typeof d3 === "undefined" || typeof topojson === "undefined") return;

  buildLegend();

  d3.json("/data/states.json").then(function (topo) {
    var W = 960, H = 600;

    var projection = d3.geoAlbersUsa()
      .scale(1280)
      .translate([W / 2, H / 2]);

    var path = d3.geoPath(projection);

    var svg = d3.select(mapContainer).append("svg")
      .attr("viewBox", "0 0 " + W + " " + H)
      .attr("preserveAspectRatio", "xMidYMid meet")
      .style("width", "100%")
      .style("height", "auto")
      .attr("role", "img")
      .attr("aria-label", "Map of the American West divided into regions. Click a region to filter visualizations.");

    var states = topojson.feature(topo, topo.objects.states);

    var g = svg.append("g");
    statePaths = g.selectAll("path")
      .data(states.features)
      .join("path")
      .attr("d", path)
      .attr("fill", function (d) { return fillFor(+d.id); })
      .attr("stroke", "#fff")
      .attr("stroke-width", 0.6)
      .attr("stroke-linejoin", "round")
      .style("cursor", function (d) {
        return FIPS_REGION[+d.id] ? "pointer" : "default";
      })
      .on("click", function (event, d) {
        var region = FIPS_REGION[+d.id];
        if (!region) return;
        toggleRegion(region);
      });

    statePaths.append("title").text(function (d) {
      var region = FIPS_REGION[+d.id];
      return region ? REGION_LABEL[region] : "";
    });
  });
})();
