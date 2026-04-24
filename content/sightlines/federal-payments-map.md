---
title: "Federal Payments by County"
date: 2026-04-21
lede: "The county-level map of federal payments to counties."
weight: 22
draft: false
viz: map
themes: [public-lands, rural-economy]
regions: [great-plains, intermountain-west, pacific, national]
map:
  center: [41.0, -112.0]
  zoom: 5
  legendtitle: "Payment (thousands, 2020 $)"
  infotitle: "County payments"
  infoprompt: "Pick a program and year, then hover a county for its payment that year."
  layers:
    - src: /data/ftm-counties.geojson
      style: sage
      label: "Counties"
      labelfield: name
      popupnote: "Follow the Money — Taylor et al. 2016"
  paymentsviz:
    layerindex: 0
    manifesturl: /data/ftm-payments-manifest.json
    srctemplate: /data/ftm-payments-{slug}.json
    fipsfield: fips
    default: PILT
    year: 2010
---

> This is a recreation of a map from historian Jay Taylor's *[Follow the Money](https://followthemoney.stanford.edu)*. Since that project stopped working, I grabbed their open data to roughly re-create the map you see here. The fuller history of PILT and historical claims about the program are best read in Jay's project.

This map recreates a version of the work completed by historian Jay Taylor: every county in the eleven western states to look at federal-payment histories at the county-year-program scale. Each county is shaded by the amount it received from the selected program in the selected year, expressed in thousands of 2020 dollars. Counties that received nothing that year show a muted gray; counties that received the bulk of a program's disbursements in that year show the darkest rust.

Use the Program dropdown in the bottom-left to switch which revenue-sharing or in-lieu-of-taxes program is being mapped. Use the Year slider to move through time. The fiscal pattern of PILT is charted in the aggregated [line chart](../federal-payments/).

For a full history of these programs, read *[Follow the Money](https://followthemoney.stanford.edu)*.

## Data and method

- **Source**: Taylor, Joseph E., III, Krista Fryauff, Erik Steiner, Celena Allen, Alex Sherman, and Zephyr Frank. *Follow the Money: A Spatial History of In-Lieu Programs for Western Federal Lands.* Spatial History Project, CESTA, Stanford University, 1 June 2016. Licensed CC BY-NC 4.0.
- **Payments file**: the project's `Federal_Program_History_2020_Dollars_JAY_TAYLOR.csv`, re-shaped into ten per-program JSON files (one per federal program). Amounts are rounded to thousands of dollars. Each program file is loaded on demand when the user selects it from the dropdown.
- **County geometry**: US Census Bureau TIGERweb Generalized_ACS2023 cartographic boundaries at 1:20M scale, filtered to the eleven states in the dataset.

## Bibliography

“An Act Authorizing the Secretary of the Interior to Enter into a Cooperative Agreement or Agreements with the State of Montana and Private Owners of Lands within the State of Montana for Grazing and Range Development, and for Other Purposes.” Public Law 70-210. <http://legisworks.org/sal/45/stats/STATUTE-45-Pg380b.pdf> (accessed 23 April 2026).

“An Act to Amend the Act Entitled ‘An Act to Stop Injury to the Public Grazing Lands by Preventing Overgrazing and Soil Deterioration, to Provide for Their Orderly Use, Improvement, and Development, to Stabilize the Livestock Industry Dependent upon the Public Range, and for Other Purposes’, Approved June 28, 1934 (48 Stat. 1269).” Public Law 74-827. <http://legisworks.org/sal/49/stats/STATUTE-49-Pg1976.pdf> (accessed 23 April 2026).

“An Act to Amend the Taylor Grazing Act of June 28, 1934 (48 Stat. 1269), as Amended June 26, 1936 (49 Stat. 1976).” Public Law 80-376. <http://legisworks.org/congress/80/publaw-376.pdf> (accessed 23 April 2026).

“An Act to Authorize and Direct that Certain Lands Exclusively Administered by the Secretary of the Interior Be Classified in Order to Provide for Their Disposal or Interim Management under Principles of Multiple Use and to Produce a Sustained Yield of Products and Services, and for Other Purposes.” Public Law 88-607. <https://www.gpo.gov/fdsys/pkg/STATUTE-78/pdf/STATUTE-78-Pg986.pdf> (accessed 23 April 2026).

“An Act to Provide for Stock-Raising Homesteads, and for Other Purposes.” Public Law 64-290. <http://legisworks.org/sal/39/stats/STATUTE-39-Pg862.pdf> (accessed 23 April 2026).

“An Act to Require the Protection, Management, and Control of Wild Free-Roaming Horses and Burros on Public Lands.” Public Law 92-195. <https://www.gpo.gov/fdsys/pkg/STATUTE-85/pdf/STATUTE-85-Pg649.pdf> (accessed 23 April 2026).

“An Act to Stop Injury to the Public Grazing Lands by Preventing Overgrazing and Soil Deterioration, to Provide for Their Orderly Use, Improvement, and Development, to Stabilize the Livestock Industry Dependent upon the Public Range, and for Other Purposes.” Public Law 73-482. <http://legisworks.org/sal/48/stats/STATUTE-48-Pg1269.pdf> (accessed 23 April 2026).
