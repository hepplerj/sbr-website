---
title: "Data"
heading: "Data behind the project"
lede: "The datasets that feed every map, chart, and network on this site — what they are, where they come from, and how to cite them if you use them yourself."
---

All of the data below is fetched, cleaned, and cached by a Python pipeline in the [`scripts/`](https://github.com/hepplerj/sbr-website/tree/main/scripts) directory of this project's repository. Each build script is stdlib-only and idempotent: point it at an environment with Python 3.9+ and it reproduces the JSON or GeoJSON that the site serves at `/data/`. The sources are public; I only transform, aggregate, and re-serve. Future work will include citations to archival reproductions of data that I draw together.

## Federal lands

`federal-lands.geojson`: State-level polygons for the 14 westernmost contiguous states, joined with federal-ownership share by state drawn from CRS Report R42346 (*Federal Land Ownership: Overview and Data*, Carol Hardy Vincent et al., Congressional Research Service). State boundary geometry is courtesy of [PublicaMundi/MappingAPI](https://github.com/PublicaMundi/MappingAPI). The choropleth on the [Federal Lands sightline](/sightlines/federal-lands/) displays ownership share from this join.

`fedland.topojson`: PAD-US (Protected Areas Database of the United States) federal-ownership polygons, pre-projected to AlbersUSA at 960×500 for web delivery. This is the file behind the [US Federal Lands by Agency](/sightlines/us-federal-lands/) D3 map. It is 2014-vintage and a little stale at the edges — a refresh from the current PAD-US release is flagged in [TODO.md](https://github.com/hepplerj/sbr-website/blob/main/TODO.md).

`grazing-districts.geojson`: 93 Bureau of Land Management Taylor Grazing Act district boundary polygons, fetched from the [BLM Egis ArcGIS FeatureServer](https://services1.arcgis.com/KbxwQRRfWyEYLgp4/arcgis/rest/services/Taylor_Grazing_Act_District_Boundaries_Polygons/FeatureServer/0). Properties: district name, number, state, BLM acreage, effective date. Geometry simplified to ~0.01° for web delivery. Feeds the [Taylor Grazing Districts](/sightlines/grazing-districts/) map.

`grazing-allotments-<state>.geojson` (×10): Per-state files of BLM grazing-allotment polygons — the fine-grained unit below the TGA districts. Ten states (AZ, CA, CO, ID, MT, NM, NV, OR, UT, WY) totaling roughly 21,700 allotments. Fetched from the [BLM National Grazing Allotment Polygons FeatureServer](https://services1.arcgis.com/KbxwQRRfWyEYLgp4/arcgis/rest/services/BLM_Natl_Grazing_Allotment_Polygons/FeatureServer/1), split per state. Feeds the [BLM Grazing Allotments by State](/sightlines/grazing-allotments/) map.

`usfs-allotments.geojson`: 8,440 US Forest Service range allotment polygons, nationwide. Fetched from the USFS Enterprise Data Warehouse (`EDW_RangeManagement_01/MapServer/0`, Range_Allotment layer), paginated in 2,000-feature batches. Properties: allotment name, administering ranger district, livestock class flags (cattle/sheep/goats/horses/bison), GIS acreage, most recent NEPA-decision fiscal year. Feeds the [USFS Range Allotments](/sightlines/usfs-range-allotments/) map.

`national_grasslands.geojson`, `land_utilization_projects.geojson`, `federal_lands.geojson` (Bankhead-Jones): USFS-administered national grasslands, historic Bankhead-Jones land-utilization project boundaries, and surrounding federal-ownership context. Sourced from the USFS Enterprise Data Warehouse via the author's earlier [Bankhead-Jones](https://bankhead-jones.jasonheppler.org/) project; re-mirrored here for stability. Feeds the [Bankhead-Jones Projects](/sightlines/bankhead-jones/) map.

## Climate and environment

`conus-temperature.json`, `conus-precipitation.json`: Monthly-to-annual temperature and precipitation series for the contiguous United States (NOAA region 110), 1895–present. Fetched from the [NOAA NCEI "Climate at a Glance"](https://www.ncei.noaa.gov/access/monitoring/climate-at-a-glance/) national time-series API. Baselined to the 20th-century mean for the anomaly presentation on the [CONUS Climate](/sightlines/conus-temperature/) stripes chart.

`regions-temperature.json`, `regions-precipitation.json`: The same NOAA NCEI "Climate at a Glance" product, this time for four climate regions relevant to the sagebrush story: Northern Rockies and Plains, Southwest, Northwest, and West. Feeds the regional-comparison stripes chart.

## Rural economy

`farm-bankruptcies.json`: Annual US farm bankruptcy filings, 1898–present, drawn from [Robert Dinterman's](https://github.com/rdinter/historical-bankruptcies) compilation (Stam ERS historical series plus the US Courts Table F-2 monthly series). Feeds the [Farm Bankruptcies](/sightlines/farm-bankruptcies/) chart.

`farm-consolidation.json`: Number of US farms (1910–present) and average farm size (1950–present), fetched from the [USDA NASS QuickStats API](https://quickstats.nass.usda.gov/api) (requires a free `NASS_API_KEY` environment variable). Both series indexed to 1950 = 100 on the [Farm Consolidation](/sightlines/farm-consolidation/) chart.

`follow-the-money.json`: An annual re-aggregation of the [*Follow the Money*](https://web.stanford.edu/group/spatialhistory/FollowTheMoney/) county-level federal-payments dataset, summed across all western counties and split by program. Ten revenue-sharing and in-lieu-of-taxes programs, 1906–2020, expressed in 2020 dollars.

> Taylor, Joseph E., III, Krista Fryauff, Erik Steiner, Celena Allen, Alex Sherman, and Zephyr Frank. *Follow the Money: A Spatial History of In-Lieu Programs for Western Federal Lands.* Spatial History Project, CESTA, Stanford University, 1 June 2016. Licensed CC BY-NC 4.0.

Feeds the [Federal Payments to Western Counties](/sightlines/federal-payments/) chart and [Federal Payments by County](/sightlines/federal-payments-map/) map.

## Politics and law

`cosponsorship-network.json`: Bill-cosponsorship network for a curated set of 32 federal public-lands bills across the 108th–118th Congresses, fetched from the [GPO govinfo.gov BILLSTATUS](https://www.govinfo.gov/bulkdata/BILLSTATUS) bulk-XML feed (free, no API key). Each node is a legislator who cosponsored at least two bills; each edge is a bill-level cosponsorship tie. Feeds the [Cosponsorship Network](/sightlines/cosponsorship-network/) visualization.

`timeline.json`: Hand-curated 33-event chronology of federal public-lands governance, 1872–2024, organized into four swim lanes (agencies, laws, proclamations, rebellions). Not drawn from any single source; references are in [`scripts/build_timeline.py`](https://github.com/hepplerj/sbr-website/blob/main/scripts/build_timeline.py). Feeds the [Federal Public-Lands Timeline](/sightlines/timeline/) visualization.

## Reproducing

```sh
git clone https://github.com/hepplerj/sbr-website.git
cd sbr-website
make data           # build everything
make grazing-districts   # rebuild a single dataset
```

Scripts write to `static/data/` (runtime JS fetches) and `data/` (Hugo build-time reads). See [`scripts/README.md`](https://github.com/hepplerj/sbr-website/blob/main/scripts/README.md) for the full table.
