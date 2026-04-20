#!/usr/bin/env python3
"""Build ``static/data/timeline.json``.

Institutional chronology of federal public-lands policy in the United
States, from the 1872 establishment of Yellowstone through the 2021
restoration of Bears Ears. Four lanes of events:

  - **agency** — creation of federal land-managing bodies
  - **law** — statutes that define the legal framework
  - **proclamation** — presidential / secretarial actions
  - **rebellion** — sagebrush-rebellion movement episodes

Hand-curated from multiple authoritative sources:
  - Congressional Research Service reports (R42346 on federal land
    ownership; R41330 on Antiquities Act; RL34273 on FLPMA)
  - Agency official histories (NPS, USFS, BLM, FWS)
  - R. McGreggor Cawley, *Federal Land, Western Anger* (1993)
  - James R. Skillen, *This Land Is My Land* (2020)

Run: ``python scripts/build_timeline.py``
"""

from __future__ import annotations

from _common import DATA_DIR, write_json

# (year, type, title, description)
EVENTS = [
    # ─── Foundational (pre-1900) ────────────────────────────────────
    (1872, "proclamation", "Yellowstone National Park",
     "First national park in the world, established by Congress during the Grant administration. Sets the precedent for federal land withdrawal from the public domain for preservation."),

    # ─── Progressive Era (1900–1920) ────────────────────────────────
    (1905, "agency", "USDA Forest Service created",
     "Gifford Pinchot's Bureau of Forestry is reorganized as the Forest Service and takes over the forest reserves from the Department of the Interior. Pinchot's 'wise use' philosophy shapes a century of multiple-use management."),
    (1906, "law", "Antiquities Act",
     "Authorizes the president to proclaim national monuments by executive order, without Congressional consent. Will become the single most politically contested public-lands authority a century later."),
    (1908, "proclamation", "Grand Canyon National Monument",
     "Theodore Roosevelt proclaims 1.2 million acres of the Grand Canyon under the Antiquities Act. First large-acreage monument, later upheld by the Supreme Court in Cameron v. United States (1920)."),
    (1916, "agency", "National Park Service created",
     "Organic Act establishes the NPS to administer the national parks and monuments. Stephen Mather becomes first director."),

    # ─── New Deal era (1930–1945) ───────────────────────────────────
    (1934, "law", "Taylor Grazing Act",
     "Ends the open-range era by establishing federal grazing districts on public land. Creates the Grazing Service (later BLM) and the allotment/permit system that becomes the core grievance of the Sagebrush Rebellion four decades later."),
    (1937, "law", "Bankhead-Jones Farm Tenant Act",
     "Title III authorizes federal purchase of 'submarginal' farmland during the Dust Bowl. Eventually results in 5.5 million acres of National Grasslands and Land Utilization Projects under USFS management."),

    # ─── Postwar era (1945–1970) ────────────────────────────────────
    (1946, "agency", "Bureau of Land Management created",
     "Truman administration merges the General Land Office (1812) and the Grazing Service (1934) into a single agency. BLM inherits ~245 million acres of surface land and 700 million acres of subsurface mineral estate."),
    (1946, "rebellion", "First Sagebrush Rebellion",
     "After World War II, BLM cuts permitted grazing animals on overstocked public ranges. Livestock-industry leaders — organized through the American National Livestock Association and National Wool Growers Association — meet in Salt Lake City to push for privatization or state transfer of federal grazing lands. Historians later identify this as the 'first Sagebrush Rebellion.'"),
    (1947, "rebellion", "DeVoto's \u201cThe West Against Itself\u201d",
     "Bernard DeVoto publishes the first of two scathing Harper's essays exposing the livestock lobby's effort to privatize the federal range. A 1948 follow-up, 'Sacred Cows and Public Lands,' helps galvanize public opposition and is widely credited with defeating the transfer effort."),
    (1948, "rebellion", "McCarran hearings conclude",
     "Senator Pat McCarran's (D-NV) three-year Senate subcommittee investigation into BLM grazing reductions ends without producing transfer legislation. The first Sagebrush Rebellion fails — but establishes the rhetorical and political repertoire that 1979 revives."),
    (1960, "law", "Multiple-Use Sustained-Yield Act",
     "Codifies 'multiple use' as the statutory mandate for national forests. Grazing, timber, watershed, wildlife, and recreation are to be managed in balanced combination — a framing the sagebrush coalition later claims is violated by wilderness designations."),
    (1960, "proclamation", "National Grasslands designated",
     "Secretary of Agriculture Ezra Taft Benson designates 3.8 million acres of Bankhead-Jones Title III lands as National Grasslands. Most of the remaining Land Utilization Project acreage passes to BLM or FWS."),
    (1964, "law", "Wilderness Act",
     "After a decade of legislative fights, Congress creates the National Wilderness Preservation System. 9.1 million acres of 'untrammeled' wild land are designated immediately; the act becomes the legal structure the sagebrush coalition spends the next sixty years trying to unwind."),
    (1969, "law", "NEPA",
     "National Environmental Policy Act requires environmental impact statements for major federal actions. Gives environmental groups a procedural tool for challenging grazing, mining, and logging decisions on federal land."),

    # ─── Environmental decade (1970–1980) ───────────────────────────
    (1973, "law", "Endangered Species Act",
     "Federal protection for threatened and endangered species and their habitat. Over time the ESA becomes a key constraint on grazing, mining, and oil-and-gas activity on federal land — and a primary legislative target of the 1990s–2000s Wise Use movement."),
    (1976, "law", "FLPMA",
     "Federal Land Policy and Management Act establishes BLM's statutory mission: retain and manage public lands in federal ownership for multiple use. The retention clause — 'the public lands be retained in Federal ownership' — is the exact premise the Sagebrush Rebellion challenges three years later."),
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

    # ─── Patriot / Bundy era (2008–2020) ────────────────────────────
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


def main() -> None:
    events = []
    for year, kind, title, desc in EVENTS:
        events.append({
            "year":        year,
            "type":        kind,
            "title":       title,
            "description": desc,
        })
    # Chronological sort
    events.sort(key=lambda e: (e["year"], e["type"]))

    out = {
        "title": "Federal public-lands chronology, 1872–2024",
        "source": (
            "Hand-curated from Congressional Research Service reports "
            "(R42346, R41330, RL34273), agency official histories, "
            "Cawley (1993), Skillen (2020), and the secondary sources "
            "in this project's bibliography."
        ),
        "lanes": [
            {"key": "agency",       "label": "Land agencies",
             "note": "Creation of federal land-managing bodies"},
            {"key": "law",          "label": "Statutes",
             "note": "Laws that define the legal framework"},
            {"key": "proclamation", "label": "Proclamations",
             "note": "Presidential or secretarial orders"},
            {"key": "rebellion",    "label": "Sagebrush rebellions",
             "note": "Movement events from 1946 forward"},
        ],
        "events": events,
    }
    write_json(DATA_DIR / "timeline.json", out)
    print(f"events: {len(events)}")


if __name__ == "__main__":
    main()
