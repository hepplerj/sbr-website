---
title: "Regional Temperature: Plains, Southwest, Northwest, West"
date: 2026-05-21
lede: "Annual temperature anomalies for the four NOAA climate regions covering the American West and Plains, 1895–2024."
weight: 32
draft: false
viz: chart
themes: [climate, dust-bowl, farm-crisis]
regions: [national, northern-plains, southern-plains, intermountain-west, pacific-northwest]
chart:
  src: /data/regions-temperature.json
  type: stripes-stacked
  datapath: regions
  serieslabel: label
  seriesdata: data
  field: anomaly
  xfield: year
  palette: temp
  domain: [-4, 4]
  title: "Regional annual temperature anomaly, 1895–2024"
  unitshort: "°F"
  infotitle: "Regional temperature"
  infoprompt: "Hover a stripe for a region's year-over-year anomaly."
  periods:
    - { start: 1930, end: 1940, label: "Dust Bowl",
        description: "A decade of severe drought and topsoil erosion across the southern Plains. Visible in this chart as a sustained brown band on the Plains row, with regional variation by year." }
    - { start: 1980, end: 1987, label: "Farm Crisis",
        description: "Land-value collapse and export-market downturn push roughly 250,000 farms out of business. The Northern Plains drought of 1988 sits at the back end of this period." }
    - { start: 2000, end: 2024, label: "Western megadrought",
        description: "The driest two-decade stretch in the West due to sustained warming intensified by hotter air pulling more moisture from soil and snowpack." }
    
---

This chart uses the four NOAA climate regions to render each year of mean temperature as a vertical stripe, color-encoded by anomaly against a 1901–2000 baseline: blue for cooler, rust for warmer. Read alongside the [regional-precipitation chart](/sightlines/regional-precipitation/), it completes the picture of a western climate that's changing. The warming is universal but the *pace* differs. The Northern Rockies & Plains have warmed the most in absolute terms, posting the largest single-year anomalies of the four regions. 

Comparing the regional warming against the [CONUS temperature stripes](../temperature-history/) makes plain that the West has warmed faster than the country as a whole.

## Why this matters

Temperature is one half of the climate change story. While complaints about wet and dry years are perhaps the most common and visible manifestations of a changing climate, sustained warming is what turns a dry year into a crisis. Hotter air pulls more moisture out of soil, snowpack, and vegetation; precipitation deficits add to the damage.

For the public-lands politics, federal range-management decisions--- stocking rates, drought deferments, allotment closures---are made against local climate conditions. A rancher in the Northern Rockies experiences a different climate trajectory than one in the desert Southwest. 

## Data and method

- **Source**: NOAA NCEI Climate at a Glance, regional time series (nClimDiv), annual mean temperature computed by averaging monthly values (January–December).
- **Regions**: code `105` Northern Rockies & Plains (MT, WY, NE, ND, SD); `107` Southwest (AZ, CO, NM, UT); `108` Northwest (ID, OR, WA); `109` West (CA, NV). These are NOAA-defined aggregations, not project-specific ones.

## Companion views

- **[Regional Precipitation](/sightlines/regional-precipitation/)**: the same four regions, the moisture half of the story.
- **[A Century of Warming](/sightlines/temperature-history/)**: the contiguous-US temperature stripes, the national-scale version of this chart.
- **[A Drying West](/sightlines/precipitation-history/)**: national precipitation anomalies.
