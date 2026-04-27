#!/usr/bin/env python3
"""Build ``static/data/timeline.json``.

Institutional chronology of federal public-lands policy in the United
States, from the 1785 Land Ordinance through the present. Four lanes
of point events plus an "era" strip for multi-year periods:

  - **agency** — creation of federal land-managing bodies
  - **law** — statutes, treaties, and major court decisions
  - **proclamation** — presidential / secretarial / executive actions
  - **rebellion** — sagebrush-rebellion and broader movement episodes
  - **era** (span) — multi-year periods that frame everything else

Hand-curated from multiple sources:
  - Congressional Research Service reports (R42346, R41330, RL34273)
  - Agency official histories (NPS, USFS, BLM, FWS, BIA, BOR, NOAA)
  - R. McGreggor Cawley, *Federal Land, Western Anger* (1993)
  - James R. Skillen, *This Land Is My Land* (2020)
  - Wilson, *America's Public Lands* (2014)

Run: ``python scripts/build_timeline.py``
"""

from __future__ import annotations

from _common import DATA_DIR, write_json

# Point events: (year, type, title, description)
EVENTS = [
    # ─── Founding-era public-domain policy (pre-1860) ───────────────
    (1785, "law", "Land Ordinance",
     "Continental Congress establishes the rectangular survey system for the public domain — six-mile-square townships subdivided into 36 sections — and provides for sale of public lands. Lays the cadastral grid still legible across the West today."),
    (1824, "agency", "Bureau of Indian Affairs",
     "Established under the War Department by Secretary John C. Calhoun (transferred to Interior in 1849). Administers tribal trust land — eventually 55 million surface acres and 57 million subsurface — under the federal trust responsibility."),
    (1841, "law", "Preemption Act",
     "Allows squatters who had improved unsurveyed federal land to purchase up to 160 acres at the minimum government price ($1.25/acre) before public auction. The first major statutory recognition of de-facto settler use of the public domain."),
    (1849, "agency", "Department of the Interior",
     "Created by Congress to consolidate the General Land Office, the Office of Indian Affairs, the Patent Office, and the Pension Office. Becomes the umbrella agency for most federal land management for the next 175 years."),

    # ─── Civil War / Reconstruction land legislation ────────────────
    (1862, "law", "Homestead Act",
     "Grants 160 acres of public land to any settler who improves it for five years. Distributes ~270 million acres over the act's lifetime — about 10 % of the land area of the United States. Defines the cultural script of 'free land' that later sagebrush politics rests on."),
    (1862, "law", "Morrill Act",
     "Grants public land to states for the establishment of agricultural and mechanical colleges. Funds the land-grant university system, including the agricultural research extension that later supports much commodity farming."),
    (1872, "law", "General Mining Law",
     "Allows U.S. citizens to stake mining claims on most federal land, with patenting rights to subsurface minerals at $2.50–$5.00 per acre. Still in force today, more or less unchanged since the Grant administration."),
    (1872, "proclamation", "Yellowstone National Park",
     "First national park in the world, established by Congress during the Grant administration. Sets the precedent for federal land withdrawal from the public domain for preservation."),
    (1877, "law", "Desert Land Act",
     "Allows individual claims of up to 640 acres of arid land at $1.25/acre, conditional on irrigation within three years. Vast tracts pass into private hands across Nevada, Utah, Wyoming, Idaho, and the Dakotas — often through dummy entrymen for cattle and railroad interests."),
    (1878, "law", "Timber and Stone Act",
     "Authorizes 160-acre claims of forested land 'unfit for cultivation' at $2.50/acre. Effectively the West-Coast counterpart to the Homestead Act for timber land. Heavily abused by Pacific Northwest timber companies."),
    (1879, "proclamation", "First Public Land Commission",
     "John Wesley Powell, Clarence King, and others examine the public land system and recommend an arid-lands classification scheme. The recommendations are largely ignored, but the report shapes generations of land-policy critique."),

    # ─── Progressive Era (1880s–1916) ───────────────────────────────
    (1881, "agency", "USDA Division of Forestry",
     "Predecessor to the Forest Service. Begins as a small advisory bureau under USDA; transferred briefly to Interior; reorganized as the Bureau of Forestry in 1901 and finally the Forest Service in 1905."),
    (1891, "law", "Forest Reserve Act",
     "Authorizes the president to withdraw forested public land from settlement and create 'forest reserves.' Harrison and Cleveland use it to set aside ~17 million acres; Theodore Roosevelt withdraws another 132 million between 1901 and 1907."),
    (1902, "agency", "Bureau of Reclamation",
     "Newlands Reclamation Act creates the Reclamation Service (renamed Bureau of Reclamation in 1923) to build dams and irrigation works in the West. Becomes the largest wholesaler of water in the United States and the second-largest hydropower producer."),
    (1903, "proclamation", "Second Public Land Commission",
     "Theodore Roosevelt convenes a second public-lands review under Gifford Pinchot. Produces recommendations against further disposal of forested land and toward the conservation framework that defines Progressive-Era public-lands policy."),
    (1905, "agency", "USDA Forest Service created",
     "Gifford Pinchot's Bureau of Forestry is reorganized as the Forest Service and takes over the forest reserves from the Department of the Interior. Pinchot's 'wise use' philosophy shapes a century of multiple-use management."),
    (1906, "law", "Antiquities Act",
     "Authorizes the president to proclaim national monuments by executive order, without Congressional consent. Will become the single most politically contested public-lands authority a century later."),
    (1908, "proclamation", "Grand Canyon National Monument",
     "Theodore Roosevelt proclaims 1.2 million acres of the Grand Canyon under the Antiquities Act. First large-acreage monument, later upheld by the Supreme Court in Cameron v. United States (1920)."),
    (1911, "law", "Weeks Act",
     "Authorizes federal purchase of forested land in the East to establish national forests. Extends the federal-forest model from withdrawal of public-domain land to active acquisition of private land — the legal basis for most national forests east of the Mississippi."),
    (1911, "law", "United States v. Grimaud",
     "The Supreme Court upholds the Forest Service's authority to issue grazing permits and impose criminal penalties for unauthorized grazing. Establishes the constitutional basis for administrative regulation of public lands."),
    (1916, "agency", "National Park Service created",
     "Organic Act establishes the NPS to administer the national parks and monuments. Stephen Mather becomes first director."),

    # ─── New Deal era (1929–1945) ───────────────────────────────────
    (1929, "proclamation", "Committee on Public Domain (Garfield)",
     "Hoover convenes the third public-lands commission under James R. Garfield. Recommends transferring the remaining public domain to the states. Defeated by the onset of the Depression and bipartisan opposition; the Taylor Grazing Act follows instead."),
    (1933, "proclamation", "Executive Order 6166",
     "FDR consolidates the National Park Service, transferring all national monuments (including those administered by USFS and the War Department) into the NPS. Reshapes the agency map of federal preservation."),
    (1934, "law", "Taylor Grazing Act",
     "Ends the open-range era by establishing federal grazing districts on public land. Creates the Grazing Service (later BLM) and the allotment/permit system that becomes the core grievance of the Sagebrush Rebellion four decades later."),
    (1935, "proclamation", "USFS \u201c10 a.m. policy\u201d",
     "Forest Service adopts the policy of suppressing every wildfire by 10 a.m. the day after detection. Defines federal fire management for the next four decades; the resulting fuel buildup is implicated in the catastrophic fire seasons of the late twentieth century."),
    (1937, "law", "Bankhead-Jones Farm Tenant Act",
     "Title III authorizes federal purchase of 'submarginal' farmland during the Dust Bowl. Eventually results in 5.5 million acres of National Grasslands and Land Utilization Projects under USFS management."),
    (1940, "agency", "U.S. Fish and Wildlife Service",
     "Reorganization Plan III merges the Bureau of Fisheries (Commerce, 1871) and the Bureau of Biological Survey (Agriculture, 1885) into the Fish and Wildlife Service under Interior. Manages 560+ National Wildlife Refuges across roughly 150 million acres."),

    # ─── Postwar era (1945–1970) ────────────────────────────────────
    (1946, "agency", "Bureau of Land Management created",
     "Truman administration merges the General Land Office (1812) and the Grazing Service (1934) into a single agency. BLM inherits ~245 million acres of surface land and 700 million acres of subsurface mineral estate."),
    (1946, "rebellion", "First Sagebrush Rebellion",
     "After World War II, BLM cuts permitted grazing animals on overstocked public ranges. Livestock-industry leaders — organized through the American National Livestock Association and National Wool Growers Association — meet in Salt Lake City to push for privatization or state transfer of federal grazing lands. Historians later identify this as the 'first Sagebrush Rebellion.'"),
    (1947, "agency", "Department of Defense",
     "National Security Act consolidates the Department of War, Department of the Navy, and the new Department of the Air Force into the National Military Establishment (renamed DoD in 1949). Holds withdrawal authority over significant tracts for training ranges and installations."),
    (1947, "rebellion", "DeVoto's \u201cThe West Against Itself\u201d",
     "Bernard DeVoto publishes the first of two scathing Harper's essays exposing the livestock lobby's effort to privatize the federal range. A 1948 follow-up, 'Sacred Cows and Public Lands,' helps galvanize public opposition and is widely credited with defeating the transfer effort."),
    (1948, "rebellion", "McCarran hearings conclude",
     "Senator Pat McCarran's (D-NV) three-year Senate subcommittee investigation into BLM grazing reductions ends without producing transfer legislation. The first Sagebrush Rebellion fails — but establishes the rhetorical and political repertoire that 1979 revives."),
    (1960, "law", "Multiple-Use Sustained-Yield Act",
     "Codifies 'multiple use' as the statutory mandate for national forests. Grazing, timber, watershed, wildlife, and recreation are to be managed in balanced combination — a framing the sagebrush coalition later claims is violated by wilderness designations."),
    (1960, "proclamation", "National Grasslands designated",
     "Secretary of Agriculture Ezra Taft Benson designates 3.8 million acres of Bankhead-Jones Title III lands as National Grasslands. Most of the remaining Land Utilization Project acreage passes to BLM or FWS."),
    (1963, "law", "Clean Air Act",
     "Original Clean Air Act establishes the federal role in air-quality regulation; subsequent amendments (1970, 1977, 1990) build the modern framework. Becomes a recurring constraint on coal leasing and surface-mining decisions on federal land."),
    (1964, "law", "Wilderness Act",
     "After a decade of legislative fights, Congress creates the National Wilderness Preservation System. 9.1 million acres of 'untrammeled' wild land are designated immediately; the act becomes the legal structure the sagebrush coalition spends the next sixty years trying to unwind."),
    (1964, "proclamation", "Public Land Law Review Commission",
     "Fourth public-lands commission, chaired by Wayne Aspinall (D-CO). Final report ('One Third of the Nation's Land,' 1970) recommends both retention of the public lands and a comprehensive statutory framework for their management — the conceptual frame that becomes FLPMA in 1976."),
    (1968, "rebellion", "\u201cThe Tragedy of the Commons\u201d published",
     "Garrett Hardin's *Science* essay frames overgrazing of unowned land as an inevitable failure mode. The metaphor is influential — and disputed — in subsequent grazing-policy debates. Elinor Ostrom's later research challenges its core claims."),
    (1969, "law", "NEPA",
     "National Environmental Policy Act requires environmental impact statements for major federal actions. Gives environmental groups a procedural tool for challenging grazing, mining, and logging decisions on federal land."),

    # ─── Environmental decade (1970–1980) ───────────────────────────
    (1970, "agency", "Environmental Protection Agency",
     "Nixon-era reorganization consolidates federal pollution-control authorities into a single agency. Becomes the primary federal regulator of air, water, hazardous waste, and pesticide use across the public lands."),
    (1970, "agency", "NOAA",
     "Reorganization Plan No. 4 creates the National Oceanic and Atmospheric Administration in the Department of Commerce. Manages marine national monuments and a network of marine sanctuaries; key data steward for climate-at-a-glance products."),
    (1970, "agency", "DOE Legacy Management",
     "Department of Energy origins (formalized 1977) include responsibility for the Manhattan Project / Cold War legacy: ~100 sites of radioactive and chemical contamination across the country, many on or adjacent to federal land."),
    (1971, "law", "Wild Free-Roaming Horses and Burros Act",
     "Federal protection for free-roaming horses and burros on BLM and Forest Service land. Generates a permanent population-management problem and recurring litigation; the BLM today manages roughly 80,000 horses on the range against a target of 27,000."),
    (1971, "proclamation", "RARE I",
     "First Roadless Area Review and Evaluation by the Forest Service: an inventory of national-forest lands without roads, intended to guide wilderness recommendations. Criticized as too conservative; superseded by RARE II in 1979."),
    (1972, "proclamation", "Forest Service \u201clet burn\u201d policy",
     "Reverses the 1935 '10 a.m. policy' — naturally ignited fires can be allowed to burn under prescribed conditions. The pendulum-swing on fire suppression continues for decades, with the 1988 Yellowstone fires as a turning point."),
    (1973, "law", "Endangered Species Act",
     "Federal protection for threatened and endangered species and their habitat. Over time the ESA becomes a key constraint on grazing, mining, and oil-and-gas activity on federal land — and a primary legislative target of the 1990s–2000s Wise Use movement."),
    (1975, "rebellion", "*The Monkey Wrench Gang* published",
     "Edward Abbey's novel about saboteurs targeting infrastructure in the desert Southwest. Inspires the founding of Earth First! in 1980 and a generation of direct-action environmentalism that the sagebrush coalition treats as evidence of urban-elite contempt for rural communities."),
    (1976, "law", "FLPMA",
     "Federal Land Policy and Management Act establishes BLM's statutory mission: retain and manage public lands in federal ownership for multiple use. The retention clause — 'the public lands be retained in Federal ownership' — is the exact premise the Sagebrush Rebellion challenges three years later."),
    (1976, "proclamation", "RARE II",
     "Carter-era second Roadless Area Review under the Forest Service. Identifies 62 million acres of inventoried roadless area; recommends 15 million for wilderness designation. Result: decades of litigation and the eventual 2001 Roadless Area Conservation Rule."),
    (1979, "rebellion", "Nevada AB 413 · Sagebrush Rebellion",
     "The Nevada legislature passes Assembly Bill 413 asserting state ownership over 48 million acres of BLM land. Sponsored by Assemblyman Dean Rhoads. Immediately inspires similar legislation in Utah, Wyoming, Arizona, and New Mexico."),
    (1980, "law", "ANILCA",
     "Alaska National Interest Lands Conservation Act withdraws 104 million acres in Alaska into conservation-system units, doubling the national park system. The largest single federal land conservation action in U.S. history; later cited by rebels as the paradigm case of federal overreach."),

    # ─── Reagan–Bush–Clinton era (1980–2000) ────────────────────────
    (1981, "proclamation", "James Watt becomes Interior Secretary",
     "Reagan's first Interior Secretary, former Mountain States Legal Foundation president. Pursues federal-land privatization and coal-leasing agendas. Resigns in 1983 after controversies."),
    (1988, "rebellion", "Wise Use Multiple-Use Strategy Conference",
     "Ron Arnold and Alan Gottlieb convene a three-day meeting in Reno that launches the Wise Use movement — the institutional bridge between the 1979 Sagebrush Rebellion and the 1990s county-supremacy fights."),
    (1994, "rebellion", "Nye County bulldozer incident",
     "Nevada county commissioner Richard Carver bulldozes a Forest Service road, claiming county jurisdiction over federal land. Becomes the iconic incident of the county-supremacy movement and leads to U.S. v. Nye County."),
    (1996, "proclamation", "Grand Staircase-Escalante Monument",
     "Bill Clinton proclaims 1.88 million acres of southern Utah under the Antiquities Act, announced from the Grand Canyon's South Rim in Arizona. Opposed by Utah's entire Congressional delegation. Becomes the defining grievance of the modern sagebrush caucus."),
    (2000, "proclamation", "Clinton's monument burst",
     "In his final year, Clinton proclaims fifteen more national monuments, mostly on BLM land in the West (Canyons of the Ancients, Ironwood Forest, Sonoran Desert, Vermilion Cliffs, Grand Canyon-Parashant, and others). No precedent exists for the pace or acreage."),

    # ─── Patriot / Bundy era (2008–2024) ────────────────────────────
    (2009, "rebellion", "Oath Keepers founded",
     "Stewart Rhodes founds the Oath Keepers, a patriot-movement organization centered on law-enforcement and military members. Later a visible presence at Bunkerville (2014) and the Malheur occupation (2016)."),
    (2009, "law", "Omnibus Public Land Management Act",
     "Single statute designating 2 million acres of new wilderness across nine Western states — the largest wilderness-act expansion since the 1984 California Wilderness Act."),
    (2012, "rebellion", "Utah HB 148 Transfer of Public Lands Act",
     "Utah state legislature demands that the federal government transfer 31 million acres of public land to state control by December 2014. Sponsored by Ken Ivory, who then founds the American Lands Council to carry the model bill to other Western legislatures."),
    (2014, "rebellion", "Bunkerville standoff",
     "Cliven Bundy's unpaid BLM grazing fees (accumulating since 1989) prompt a federal cattle-impoundment operation. Armed supporters, including Oath Keepers and militia figures, converge on the Bundy ranch outside Las Vegas. BLM backs down."),
    (2016, "rebellion", "Malheur occupation",
     "Ammon Bundy leads a small armed group in taking over the Malheur National Wildlife Refuge in eastern Oregon for forty-one days. LaVoy Finicum is killed by law enforcement at a roadblock. Federal trials produce mixed verdicts."),
    (2016, "proclamation", "Bears Ears National Monument",
     "Obama proclaims 1.35 million acres of southeastern Utah under the Antiquities Act in December, after years of tribal coalition advocacy. Opposed by Utah's Republican delegation and the sagebrush caucus."),
    (2017, "proclamation", "Bears Ears reduced 85%",
     "Trump issues a presidential proclamation reducing Bears Ears to 202,000 acres, along with a parallel reduction of Grand Staircase-Escalante. Lawsuits immediately follow, arguing the Antiquities Act does not authorize downward-revision."),
    (2021, "proclamation", "Bears Ears restored",
     "Biden restores Bears Ears and Grand Staircase-Escalante to their pre-2017 boundaries. No other national monument has been reduced and restored in the act's 115-year history."),
    (2023, "proclamation", "Avi Kwa Ame + Baaj Nwaavjo I'tah Kukveni",
     "Biden proclaims two new national monuments with tribal-nation-led coalitions: Avi Kwa Ame (506,000 acres in Nevada, Fort Mojave leadership) and Baaj Nwaavjo I'tah Kukveni (918,000 acres around the Grand Canyon, eleven-tribe coalition)."),
]


# Spans: multi-year entries that render either as an "era" strip above
# the swim-lanes (type: "era") or as a capsule on an existing lane.
# Order is start-year ascending.
PERIODS = [
    ("proclamation", 1862, 1870, "Federal Railroad Grants",
     "Pacific Railroad Acts and successor grants distribute roughly 175 million acres of public land to railroad companies — about a tenth of the contiguous United States. Creates the checkerboard ownership pattern still visible across the West."),
    ("era", 1930, 1940, "Dust Bowl",
     "A decade of severe drought and topsoil erosion across the southern Plains, accelerated by sodbuster farming on marginal grasslands. Frames the policy moment of the Taylor Grazing Act (1934) and the Bankhead-Jones Farm Tenant Act (1937)."),
    ("proclamation", 1933, 1942, "Civilian Conservation Corps",
     "FDR-era public-works program putting roughly 3 million young men to work on national forests, parks, and grasslands — fire roads, erosion control, plantings, structures still in use a century later. The largest single labor force ever applied to federal land."),
    ("rebellion", 1979, 1982, "Second Sagebrush Rebellion",
     "The peak years of the state-transfer movement following Nevada AB 413. Six Western states pass companion legislation; Reagan promises to be 'one of you' as a 'sagebrush rebel'; the movement loses momentum after FLPMA litigation fails and James Watt's privatization push collapses."),
    ("era", 1980, 1987, "Farm Crisis",
     "Collapse in farmland values and farm-export markets after the early-1980s commodity-price drop. Roughly 250,000 farms lost in the window. The bankruptcy gap on the farm-bankruptcies chart sits inside this period."),
    ("rebellion", 1988, 2000, "Wise Use movement",
     "Loose coalition of property-rights, multiple-use, and county-supremacy groups bridging the 1979 Sagebrush Rebellion and the 2010s land-transfer push. Active through the Chenoweth/Hansen/Pombo congressional era."),
]


def main() -> None:
    events = []
    for year, kind, title, desc in EVENTS:
        events.append({
            "year":        year,
            "type":        kind,
            "title":       title,
            "description": desc,
        })
    for kind, start, end, title, desc in PERIODS:
        events.append({
            "type":        kind,
            "start":       start,
            "end":         end,
            "title":       title,
            "description": desc,
        })
    # Chronological sort — points by year, spans by start year.
    def sort_key(e):
        y = e.get("year", e.get("start", 0))
        return (y, e["type"])
    events.sort(key=sort_key)

    out = {
        "title": "Federal public-lands chronology, 1785–2024",
        "source": (
            "Hand-curated from Congressional Research Service reports "
            "(R42346, R41330, RL34273), agency official histories, "
            "Cawley (1993), Skillen (2020), Wilson (2014), and the "
            "secondary sources in this project's bibliography."
        ),
        "lanes": [
            {"key": "agency",       "label": "Land agencies",
             "note": "Creation of federal land-managing bodies"},
            {"key": "law",          "label": "Statutes",
             "note": "Laws, treaties, and major court decisions"},
            {"key": "proclamation", "label": "Proclamations",
             "note": "Presidential or secretarial orders and commissions"},
            {"key": "rebellion",    "label": "Movements & moments",
             "note": "Sagebrush rebellions and broader movement events"},
        ],
        "events": events,
    }
    write_json(DATA_DIR / "timeline.json", out)
    print(f"events: {len([e for e in events if 'year' in e])} points, "
          f"{len([e for e in events if 'start' in e])} spans")


if __name__ == "__main__":
    main()
