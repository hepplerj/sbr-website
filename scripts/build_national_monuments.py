#!/usr/bin/env python3
"""Build ``static/data/national-monuments.json``.

A curated dataset of national monuments proclaimed under the Antiquities
Act of 1906, framed for the project's argument: the Act's grant of
*unilateral presidential* designation power is exactly the federal-
overreach grievance that animates the sagebrush rebellions, and the
Bears Ears / Grand Staircase reduce-then-restore saga (2017 → 2021) is
its modern climax.

Two record sets:

  - **monuments** — one record per designation:
      name, year, president, party, acres, agency, states, west, status,
      note. `acres` is the *proclaimed* acreage at designation.
  - **modifications** — later boundary changes (reductions, restorations,
      expansions) that reference a monument by name, with the year, the
      acting president, and the resulting acreage.

Scope + accuracy notes
-----------------------
This is a CURATED SELECTION of analytically significant designations,
not the complete ~160-monument list. It emphasizes the large Western
land monuments, the controversial ones, and every designation that was
later modified — the records that bear on the rebellion story. The
canonical complete list (with authoritative acreages and modification
histories) is the Congressional Research Service report **R41330,
"National Monuments and the Antiquities Act."**

Acreages are PROCLAIMED figures rounded to the nearest readable value
and should be verified against R41330 and the proclamation texts before
this leaves draft. The 1978 Alaska designations (15 monuments, ~56M
acres total, proclaimed in a single day during the ANILCA standoff) are
represented by the major individual units; the aggregate is noted in the
sightline narrative.

Sources to verify against:
  - CRS R41330, "National Monuments and the Antiquities Act"
  - NPS and BLM national-monument unit lists
  - Proclamation texts (Federal Register / govinfo.gov)

This script embeds its data (like build_timeline.py) rather than
fetching — there is no single clean API for Antiquities Act monuments.

Run: ``python scripts/build_national_monuments.py``
"""

from __future__ import annotations

from _common import DATA_DIR, write_json

# ── Designations ───────────────────────────────────────────────────
# (name, year, president, party, acres, agency, states, west, status, note)
#   party:  "R" | "D"
#   agency: managing agency at/after designation (NPS, BLM, USFS, FWS)
#   west:   in an 11-Western-state + Alaska footprint (the sagebrush geography)
#   status: active | reduced | restored | redesignated | abolished
M = [
    # ── Theodore Roosevelt (R), 1906–1909 — the first burst ─────────
    ("Devils Tower", 1906, "Theodore Roosevelt", "R", 1347, "NPS", ["WY"], True, "active",
     "The first national monument, proclaimed three months after the Antiquities Act passed."),
    ("El Morro", 1906, "Theodore Roosevelt", "R", 1279, "NPS", ["NM"], True, "active", ""),
    ("Montezuma Castle", 1906, "Theodore Roosevelt", "R", 840, "NPS", ["AZ"], True, "active", ""),
    ("Petrified Forest", 1906, "Theodore Roosevelt", "R", 60776, "NPS", ["AZ"], True, "redesignated",
     "Later enlarged and redesignated a national park (1962)."),
    ("Chaco Canyon", 1907, "Theodore Roosevelt", "R", 10643, "NPS", ["NM"], True, "active", ""),
    ("Gila Cliff Dwellings", 1907, "Theodore Roosevelt", "R", 160, "USFS", ["NM"], True, "active", ""),
    ("Grand Canyon", 1908, "Theodore Roosevelt", "R", 808120, "NPS", ["AZ"], True, "redesignated",
     "Roosevelt's most aggressive use of the Act — protecting 800,000+ acres as a 'monument.' "
     "Upheld by the Supreme Court in 1920 (Cameron v. United States); redesignated a national park in 1919."),
    ("Muir Woods", 1908, "Theodore Roosevelt", "R", 295, "NPS", ["CA"], True, "active", ""),
    ("Pinnacles", 1908, "Theodore Roosevelt", "R", 2080, "NPS", ["CA"], True, "redesignated",
     "Redesignated a national park in 2013."),
    ("Mount Olympus", 1909, "Theodore Roosevelt", "R", 615000, "NPS", ["WA"], True, "redesignated",
     "Core of present-day Olympic National Park (1938)."),

    # ── Taft / Wilson / Harding / Coolidge (R/D), 1910s–1920s ───────
    ("Dinosaur", 1915, "Woodrow Wilson", "D", 80, "NPS", ["CO", "UT"], True, "active",
     "Later vastly enlarged; the proposed Echo Park dam here became a landmark 1950s conservation fight."),
    ("Carlsbad Cave", 1923, "Calvin Coolidge", "R", 720, "NPS", ["NM"], True, "redesignated",
     "Redesignated Carlsbad Caverns National Park (1930)."),
    ("Bryce Canyon", 1923, "Warren Harding", "R", 7440, "NPS", ["UT"], True, "redesignated",
     "Redesignated a national park (1928)."),
    ("Glacier Bay", 1925, "Calvin Coolidge", "R", 1820000, "NPS", ["AK"], True, "redesignated",
     "Redesignated a national park under ANILCA (1980)."),

    # ── Hoover (R), 1933 — large Western desert monuments ───────────
    ("Death Valley", 1933, "Herbert Hoover", "R", 1601800, "NPS", ["CA", "NV"], True, "redesignated",
     "Redesignated a national park (1994)."),
    ("Saguaro", 1933, "Herbert Hoover", "R", 53510, "NPS", ["AZ"], True, "redesignated",
     "Redesignated a national park (1994)."),

    # ── FDR (D), 1936–1943 ──────────────────────────────────────────
    ("Joshua Tree", 1936, "Franklin D. Roosevelt", "D", 825000, "NPS", ["CA"], True, "redesignated",
     "Redesignated a national park (1994)."),
    ("Organ Pipe Cactus", 1937, "Franklin D. Roosevelt", "D", 330000, "NPS", ["AZ"], True, "active", ""),
    ("Capitol Reef", 1937, "Franklin D. Roosevelt", "D", 37060, "NPS", ["UT"], True, "redesignated",
     "Redesignated a national park (1971)."),
    ("Jackson Hole", 1943, "Franklin D. Roosevelt", "D", 221000, "NPS", ["WY"], True, "redesignated",
     "Bitterly contested — Wyoming's delegation responded by amending the Antiquities Act in 1950 to bar "
     "any further monuments in Wyoming without Congress. Folded into Grand Teton National Park (1950)."),

    # ── Eisenhower / JFK / LBJ (R/D), 1950s–1960s ───────────────────
    ("Marble Canyon", 1969, "Lyndon B. Johnson", "D", 26000, "NPS", ["AZ"], True, "redesignated",
     "Added to Grand Canyon National Park (1975)."),

    # ── Carter (D), 1978 — the Alaska monuments ─────────────────────
    # 15 monuments, ~56M acres, proclaimed Dec 1, 1978 during the ANILCA
    # standoff. Major individual units below; the wave is described in
    # the sightline narrative.
    ("Wrangell–St. Elias", 1978, "Jimmy Carter", "D", 10950000, "NPS", ["AK"], True, "redesignated",
     "Part of Carter's December 1978 Alaska designations; redesignated a national park under ANILCA (1980)."),
    ("Gates of the Arctic", 1978, "Jimmy Carter", "D", 8220000, "NPS", ["AK"], True, "redesignated",
     "December 1978 Alaska designation; national park under ANILCA (1980)."),
    ("Misty Fjords", 1978, "Jimmy Carter", "D", 2285000, "USFS", ["AK"], True, "active",
     "December 1978 Alaska designation, managed by the Forest Service in the Tongass."),
    ("Admiralty Island", 1978, "Jimmy Carter", "D", 1100000, "USFS", ["AK"], True, "active",
     "December 1978 Alaska designation, Tongass National Forest."),
    ("Katmai (expansion)", 1978, "Jimmy Carter", "D", 1370000, "NPS", ["AK"], True, "redesignated",
     "One of the 1978 Alaska monument actions; national park under ANILCA (1980)."),

    # ── Reagan (R) & Bush I (R), 1981–1993 ──────────────────────────
    # Notable for what is ABSENT: the sagebrush-aligned Reagan
    # administration proclaimed no new national monuments.

    # ── Clinton (D), 1996–2001 — the modern wave ────────────────────
    ("Grand Staircase–Escalante", 1996, "Bill Clinton", "D", 1700000, "BLM", ["UT"], True, "reduced",
     "Announced from the Arizona rim during the 1996 campaign — the first major BLM-managed monument and a "
     "lasting Utah grievance. Reduced by Trump (2017), restored by Biden (2021)."),
    ("Grand Canyon–Parashant", 2000, "Bill Clinton", "D", 1014000, "BLM", ["AZ"], True, "active", ""),
    ("Canyons of the Ancients", 2000, "Bill Clinton", "D", 164000, "BLM", ["CO"], True, "active", ""),
    ("Cascade–Siskiyou", 2000, "Bill Clinton", "D", 53000, "BLM", ["OR"], True, "active",
     "Later expanded by Obama (2017)."),
    ("Hanford Reach", 2000, "Bill Clinton", "D", 195000, "FWS", ["WA"], True, "active", ""),
    ("Ironwood Forest", 2000, "Bill Clinton", "D", 129000, "BLM", ["AZ"], True, "active", ""),
    ("Carrizo Plain", 2001, "Bill Clinton", "D", 204000, "BLM", ["CA"], True, "active", ""),
    ("Vermilion Cliffs", 2000, "Bill Clinton", "D", 280000, "BLM", ["AZ"], True, "active", ""),
    ("Upper Missouri River Breaks", 2001, "Bill Clinton", "D", 375000, "BLM", ["MT"], True, "active", ""),
    ("Sonoran Desert", 2001, "Bill Clinton", "D", 486000, "BLM", ["AZ"], True, "active", ""),
    ("Giant Sequoia", 2000, "Bill Clinton", "D", 328000, "USFS", ["CA"], True, "active", ""),

    # ── Bush II (R), 2001–2009 — mostly marine ──────────────────────
    # Bush used the Act overwhelmingly for vast *marine* monuments
    # (Papahanaumokuakea, 2006; Pacific Remote Islands, Marianas Trench,
    # Rose Atoll, 2009), which sit outside this terrestrial Western
    # dataset. He proclaimed essentially no large Western land monuments.

    # ── Obama (D), 2009–2017 ────────────────────────────────────────
    ("Rio Grande del Norte", 2013, "Barack Obama", "D", 242000, "BLM", ["NM"], True, "active", ""),
    ("Organ Mountains–Desert Peaks", 2014, "Barack Obama", "D", 496000, "BLM", ["NM"], True, "active", ""),
    ("San Gabriel Mountains", 2014, "Barack Obama", "D", 346000, "USFS", ["CA"], True, "active", ""),
    ("Basin and Range", 2015, "Barack Obama", "D", 704000, "BLM", ["NV"], True, "active", ""),
    ("Berryessa Snow Mountain", 2015, "Barack Obama", "D", 331000, "BLM", ["CA"], True, "active", ""),
    ("Browns Canyon", 2015, "Barack Obama", "D", 21000, "BLM", ["CO"], True, "active", ""),
    ("Gold Butte", 2016, "Barack Obama", "D", 300000, "BLM", ["NV"], True, "active",
     "Adjacent to the Bundy ranch near Bunkerville — designated two years after the 2014 armed standoff over "
     "unpaid grazing fees on the surrounding BLM land."),
    ("Bears Ears", 2016, "Barack Obama", "D", 1351849, "BLM", ["UT"], True, "reduced",
     "Proposed by a coalition of five tribes; the flashpoint of the modern monument fight. Reduced ~85% by "
     "Trump (2017), restored by Biden (2021)."),
    ("Mojave Trails", 2016, "Barack Obama", "D", 1600000, "BLM", ["CA"], True, "active", ""),
    ("Sand to Snow", 2016, "Barack Obama", "D", 154000, "BLM", ["CA"], True, "active", ""),

    # ── Biden (D), 2021–2024 — restorations + new designations ──────
    ("Camp Hale–Continental Divide", 2022, "Joseph R. Biden", "D", 53800, "USFS", ["CO"], True, "active", ""),
    ("Avi Kwa Ame", 2023, "Joseph R. Biden", "D", 506000, "BLM", ["NV"], True, "active",
     "Proposed by the Fort Mojave and other tribes."),
    ("Baaj Nwaavjo I'tah Kukveni–Grand Canyon", 2023, "Joseph R. Biden", "D", 917000, "BLM", ["AZ"], True, "active",
     "Protects lands around the Grand Canyon long sought by regional tribes; opposed by Arizona's mining interests."),
]

# ── Modifications ──────────────────────────────────────────────────
# Later boundary changes referencing a monument by name.
# (name, year, president, party, kind, to_acres, note)
#   kind: reduction | restoration | expansion
MODS = [
    ("Grand Staircase–Escalante", 2017, "Donald Trump", "R", "reduction", 1003863,
     "Cut roughly in half — the largest rollback of monument protection in U.S. history, alongside Bears Ears."),
    ("Bears Ears", 2017, "Donald Trump", "R", "reduction", 201876,
     "Cut ~85%, from 1.35M to ~202,000 acres. Immediately litigated by tribes and conservation groups."),
    ("Bears Ears", 2021, "Joseph R. Biden", "D", "restoration", 1361000,
     "Restored and slightly enlarged the original boundary."),
    ("Grand Staircase–Escalante", 2021, "Joseph R. Biden", "D", "restoration", 1870000,
     "Restored the full Clinton-era boundary."),
    ("Cascade–Siskiyou", 2017, "Barack Obama", "D", "expansion", 113000,
     "Expanded by ~48,000 acres in the final days of the Obama administration."),
]


def main() -> None:
    monuments = [
        {
            "name": name, "year": year, "president": pres, "party": party,
            "acres": acres, "agency": agency, "states": states,
            "west": west, "status": status, "note": note,
        }
        for (name, year, pres, party, acres, agency, states, west, status, note) in M
    ]
    modifications = [
        {
            "name": name, "year": year, "president": pres, "party": party,
            "kind": kind, "acres": acres, "note": note,
        }
        for (name, year, pres, party, kind, acres, note) in MODS
    ]

    out = {
        "title": "National Monuments under the Antiquities Act",
        "source": (
            "Curated selection of significant Antiquities Act designations. Verify against "
            "Congressional Research Service report R41330, 'National Monuments and the Antiquities Act,' "
            "plus NPS/BLM unit lists and proclamation texts. Acreages are proclaimed figures, approximate."
        ),
        "monuments": sorted(monuments, key=lambda d: (d["year"], -d["acres"])),
        "modifications": sorted(modifications, key=lambda d: d["year"]),
    }
    write_json(DATA_DIR / "national-monuments.json", out)


if __name__ == "__main__":
    main()
