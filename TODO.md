# TODO

Running list of flagged work. Not a commitment — a reminder of what the
various About panels promised as "future work" so we don't lose track.
Add / cross off freely.

## Networks

### Cosponsorship backfill (pre-2003)
GPO `govinfo.gov` BILLSTATUS bulk data effectively starts at the 108th
Congress. The Chenoweth / Hansen / Pombo-early-career / Cubin era
(103rd–107th, 1993–2002) is substantive for this project — Wise Use to
County Supremacy is the bridge it covers — and needs a different source.

- [ ] Get a free Congress.gov API key (`api.congress.gov/sign-up`).
- [ ] Add a `CONGRESS_API_KEY` env-var branch to
      `scripts/build_cosponsorship_network.py` that falls back to
      Congress.gov when BILLSTATUS 404s.
- [ ] Identify and add ~15–20 bills from 103rd–107th. Candidates worth
      tracking down:
      - Helen Chenoweth-Hage (R-ID, 1995–2001) — multiple ESA /
        grazing / wilderness-rollback bills
      - Jim Hansen (R-UT, 1981–2003) — Utah public-lands consolidation,
        RS 2477, antiquities reform
      - Richard Pombo (R-CA, 1993–2007) — ESA rewrite attempts
        (H.R. 2911 in 105th, H.R. 1101 in 106th, H.R. 1100 in 107th —
        all returned 404 from BILLSTATUS in testing)
      - Barbara Cubin (R-WY, 1995–2009) — grazing, mineral leases
      - Chris Cannon (R-UT, 1997–2009)
- [ ] Alternative route: the
      [@unitedstates/congress](https://github.com/unitedstates/congress)
      community archive mirrors back to the 93rd Congress. Would need
      resurrection from a fork.

### Bridging the Rebellions extensions
- [ ] Archival correspondence layer — weight ties by documented
      contact (letters, phone logs, membership rosters). Needs archival
      research.
- [ ] Rank-and-file participants at Bunkerville / Malheur — currently
      only leaders and founders are nodes.
- [ ] Opposition networks — environmental groups, federal agencies,
      ranchers who rejected the transfer argument, tribal nations.
- [ ] Time-weighted edges — "Mack founded CSPOA" and "CSPOA supported
      Bunkerville" render as equivalent even though separated by years.

### Other network analyses (flagged in earlier conversation)
- [ ] **Conservative legal foundation board overlaps** (Tier 2) —
      ProPublica Nonprofit Explorer + IRS 990 data for MSLF, PLF,
      Heritage, Cato, Heartland, Buckeye Institute. Cross-match board
      members and grantors.
- [ ] **Organizational lineage tree** (Tier 2) — directed tree showing
      Wise Use → ALAA → People for the West → Sagebrush Coalition →
      Citizens for Constitutional Freedom. Needs a new viz type
      (D3 `tree` / `cluster`) rather than force layout.

## Maps

Ranked in order of project relevance (Tier 1 is highest).

### Tier 1
- [ ] **Railroad land grants, 1862–1871** — BLM GLO records. The origin
      of the literal checkerboard. Structurally explains why the
      Federal Lands map looks the way it does.
- [ ] **Wilderness areas, 1964–present** — Wilderness.net download.
      Timeline-colored by designation year to parallel the rebellion
      chronology.
- [ ] **National monuments, 1906–present** — NPS + Antiquities Act
      lists. Bears Ears 2016 and Grand Staircase-Escalante 1996 are
      particularly load-bearing for the project's late-period arc.
- [ ] **Homestead patents by county** — BLM GLO records, 1863–1986.
      Shows where settlement succeeded vs. failed — the pre-history of
      federal-land persistence.

### Tier 2
- [ ] **MTBS fire perimeters, 1984–present** — fire is the other half
      of the aridification story.
- [ ] **US Drought Monitor archive, 2000–present** — week-by-week
      drought categories at county resolution. Animate or small-
      multiples at key moments.
- [ ] **Indigenous homelands + tribal lands** — Native Land Digital API
      + BIA trust-lands data. The federal-land story usually omits
      that these lands were first dispossessed.
- [ ] **BLM grazing allotments** — BLM GeoPlatform. Individual
      allotments are where most rancher grievances actually live
      (Gold Butte, Malheur-adjacent).

### Tier 3
- [ ] Mining claims (BLM LR2000)
- [ ] Oil & gas leases on federal land
- [ ] Bureau of Reclamation dams & reservoirs
- [ ] Congressional voting on public-lands bills (geographic projection)

## Climate / charts

- [ ] **Regional temperature stacked stripes** — data already built at
      `static/data/regions-temperature.json`. Just needs a content page
      at `content/sightlines/regional-temperature.md`.
- [ ] **State-level climate grid** — Nebraska, Montana, Nevada, the
      full fifteen-state panel. NOAA's `/cag/statewide/time-series/`
      endpoint works with state codes.
- [ ] **PDSI (Palmer Drought Severity Index)** stripes — drought-
      specific index that blends temperature and precipitation. NOAA
      publishes by climate division.

## Farm bankruptcies

- [ ] **Rate-normalized filings** — per thousand farms, from USDA
      Census of Agriculture farm counts (by county, every 5 years).
      Currently raw counts — normalization would correct for state
      size and make the cross-state comparison honest.

## Maps — Federal Lands refresh

- [ ] Replace the 14-state `federal-lands.geojson` state-level
      choropleth with PAD-US county-level data. Current file is a
      starter dataset.
- [ ] **Refresh `fedland.topojson`** (US Federal Lands by Agency).
      Current file is a 2014 PAD-US snapshot, pre-projected to 960×500
      AlbersUSA so the D3 renderer can use a null projection. Probed a
      "cheap" refresh via the BLM SMA LimitedScale FeatureServer — it
      works but yields ~9 MB of GeoJSON even at 0.03° simplification
      (vs. 3.3 MB currently) because the vendor-generalized data still
      carries high vertex counts. Full refresh needs mapshaper (outside
      the stdlib-only pipeline) to dissolve and re-simplify.
      Candidate middle path: keep the 2014 base, add a current
      National Monuments overlay from NPS + BLM NLCS services — this
      captures the biggest post-2014 delta (Bears Ears / Grand
      Staircase churn, Castle Mountains, etc.) at ~200 KB of
      additional data. Noted for revisit.

## Sources / bibliography

- [ ] **Archival collections page** — stub exists at
      `/sources/_index.md`. Fill out with the archives consulted
      (Nevada State Library, American Heritage Center, BLM historical
      records, Stanford Conservative Legal Foundations collection).
- [ ] **BibTeX entries without cite keys** — the Zotero export dropped
      keys. Currently auto-generated by `build_bibliography.py` on each
      run. Re-export with Better BibTeX → "Export with citation keys"
      for stable human-readable keys, then switch the script to
      preserve them.
- [ ] **`{{< cite >}}` shortcode in narratives** — infrastructure is
      ready; as narrative drafts come through, wire up inline
      citations so they link to the sources page.

## Content

- [ ] **Coalition network** (`content/sightlines/coalition.md`) — still
      `draft: true`. The 1979–81 Sagebrush Rebellion coalition graph
      placeholder. Needs real data assembled from Cawley, Skillen,
      press of the period.
- [ ] **Narrative essays** — introduction and Malheur stub are drafts;
      the chronology between (Taylor Grazing, Bankhead-Jones,
      1970s-80s administrative politics, Wise Use, 1990s county
      supremacy, Bundy Ranch) is all to be written.

## Infrastructure

- [ ] **Cache-busting for static data files** — append a build-time
      query string to JSON URLs in the sightlines config so browser
      cache doesn't serve stale data across rebuilds. Not critical
      during development but worth doing before first real deploy.
- [ ] **Search (Pagefind)** — static-site-friendly, works with Hugo.
      Would give readers a way to find bills, legislators, places
      across the whole site.
- [ ] **Favicon and social preview image**.
- [ ] **RSS feed tuning** — currently default Hugo RSS; probably want
      to limit to narrative essays, not every sightline.
