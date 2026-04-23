#!/usr/bin/env python3
"""Build ``static/data/cosponsorship-network.json``.

A legislator-level network built from shared cosponsorships on federal-
public-lands bills across recent Congresses. Two legislators connect if
they cosponsored the same bill; the edge weight is the count of shared
cosponsorships across the full set.

Data sources:

  108th Congress and later (2003–present):
    GPO ``govinfo.gov`` BILLSTATUS bulk data (free, no key required).
    URL pattern:
      https://www.govinfo.gov/bulkdata/BILLSTATUS/{congress}/{type}/
      BILLSTATUS-{congress}{type}{number}.xml

  Pre-108th Congress (through 93rd Congress, 1973):
    ``api.congress.gov`` v3 JSON API (free, requires API key).
    Set the key in the environment:
      export CONGRESS_API_KEY=your_key_here
    Keys are available at https://api.congress.gov/sign-up/

Curated bill list focuses on the transfer, disposal, grazing, and
Antiquities-Act-reform bills that sit in the Sagebrush-rebellion policy
lineage. Adjust ``BILLS`` below to extend.

Run: ``python scripts/build_cosponsorship_network.py``
"""

from __future__ import annotations

import json
import os
import sys
import time
import urllib.error
import xml.etree.ElementTree as ET
from collections import Counter, defaultdict

from _common import DATA_DIR, fetch, write_json

BULK        = "https://www.govinfo.gov/bulkdata/BILLSTATUS"
API_BASE    = "https://api.congress.gov/v3"
API_KEY     = os.environ.get("CONGRESS_API_KEY", "")

# Bills included. Each entry: (congress, chamber-type, number, short-label).
# Chamber types: "hr" (House bill), "s" (Senate bill), "hjres"/"sjres" (joint res).
#
# Routing: congress >= 108 → govinfo BILLSTATUS XML (no key needed)
#          congress <  108 → api.congress.gov JSON (requires CONGRESS_API_KEY)
# Each entry: (congress, chamber-type, number, short-label, category).
# Categories: "disposal" | "grazing" | "antiquities" | "wilderness" | "esa"
BILLS = [
    # ── Pre-108th: Sagebrush Rebellion era ──────────────────────────────────
    (96,  "s",  1680,  "Western Lands Distribution & Regional Equalization (96th, Laxalt)", "disposal"),
    (96,  "s",  2762,  "Federal Lands Disposal — Nevada (96th, Laxalt)",                   "disposal"),
    (107, "hr", 3808,  "Consistent Public Land Laws Enforcement (107th)",                   "disposal"),

    # ── 108th–109th — the Pombo Natural Resources chair years ───────────────
    (108, "hr", 1153,  "America's Wilderness Protection (108th, Otter)",                    "wilderness"),
    (108, "hr", 2966,  "Right-to-Ride Livestock on Federal Lands (108th)",                  "grazing"),
    (108, "hr", 3324,  "Voluntary Grazing Permit Buyout (108th)",                           "grazing"),
    (109, "hr", 1370,  "Federal Land Asset Inventory Reform (109th, Pearce)",               "disposal"),
    (109, "hr", 3463,  "Action Plan for Public Lands & Education (109th, Bishop)",          "disposal"),
    (109, "s",  781,   "Right-to-Ride Livestock on Federal Land (109th)",                   "grazing"),
    (109, "s",  2569,  "Action Plan for Public Lands & Education (109th, Hatch)",           "disposal"),
    (109, "hr", 3824,  "ESA Recovery Collaboration (109th, Pombo)",                         "esa"),

    # ── 110th–113th — early transfer-advocacy lineage ───────────────────────
    (110, "hr", 3614,  "Action Plan for Public Lands & Education (110th, Bishop)",          "disposal"),
    (110, "s",  3133,  "Responsible Ownership of Public Land (110th)",                      "disposal"),
    (110, "hr", 6300,  "Dona Ana County Rangeland Preservation (110th, Pearce)",            "grazing"),
    (111, "hr", 5339,  "Disposal of Excess Federal Lands (111th, Chaffetz)",                "disposal"),
    (112, "s",  635,   "Disposal of Excess Federal Lands (112th, Lee)",                     "disposal"),
    (112, "hr", 1126,  "Disposal of Excess Federal Lands (112th, Chaffetz)",                "disposal"),
    (112, "hr", 1581,  "Wilderness & Roadless Area Release (112th, McCarthy)",              "wilderness"),
    (112, "s",  1087,  "Wilderness & Roadless Area Release (112th, Barrasso)",              "wilderness"),
    (113, "hr", 1459,  "Antiquities transparency (113th, Bishop)",                          "antiquities"),
    (113, "hr", 2657,  "Disposal of Excess Federal Lands (113th, Chaffetz)",                "disposal"),

    # ── 114th–115th — post-Bunkerville legislative push ─────────────────────
    (114, "hr", 5780,  "Utah Public Lands Initiative (114th, Bishop)",                      "disposal"),
    (114, "hr", 3650,  "State National Forest Management (114th, Young)",                   "disposal"),
    (114, "hr", 2316,  "Wildlife Management Reform (114th)",                                "esa"),
    (114, "s",  361,   "Disposal of Excess Federal Lands (114th, Lee)",                     "disposal"),
    (115, "hr", 621,   "Disposal of Excess Federal Lands (115th, Chaffetz)",                "disposal"),
    (115, "hr", 622,   "Local Enforcement for Local Lands (115th, Chaffetz)",               "disposal"),
    (115, "hr", 2284,  "National Monument Designation Transparency (115th, Labrador)",      "antiquities"),
    (115, "hr", 2230,  "Grazing Improvement Act (115th)",                                   "grazing"),
    (115, "hr", 3990,  "National Monument Creation & Protection (115th, Bishop)",           "antiquities"),
    (115, "s",  132,   "National Monument Designation Transparency (115th, Crapo)",         "antiquities"),
    (115, "s",  273,   "Greater Sage-Grouse Protection (115th, Risch)",                     "esa"),

    # ── 116th–118th — the Trump/Biden/post-Trump era ─────────────────────────
    (116, "hr", 3225,  "Antiquities Act amendments (116th)",                                "antiquities"),
    (116, "hr", 1664,  "National Monument CAP Act (116th, Bishop)",                         "antiquities"),
    (117, "hr", 3113,  "State Land Management (117th)",                                     "disposal"),
    (117, "s",  1264,  "Resiliency for Ranching (117th, Barrasso)",                         "grazing"),
    (118, "hr", 1435,  "State Transfer Reaffirmation (118th)",                              "disposal"),
    (118, "hr", 7430,  "Public Lands in Public Hands (118th, Zinke)",                       "disposal"),
    (118, "hr", 5499,  "Congressional Oversight of Antiquities Act (118th)",                "antiquities"),
    (118, "s",  2820,  "Congressional Oversight of Antiquities Act (118th, Lee)",           "antiquities"),
    (118, "s",  3322,  "Ranching Without Red Tape (118th, Barrasso)",                       "grazing"),
]

# Minimum shared-cosponsorship count for an edge to appear in the viz.
EDGE_MIN_WEIGHT = 2

# Only keep legislators who cosponsored at least this many bills in the set.
NODE_MIN_BILLS = 2


# ── govinfo (108th+) ─────────────────────────────────────────────────────────

def govinfo_url(congress: int, btype: str, number: int) -> str:
    return f"{BULK}/{congress}/{btype}/BILLSTATUS-{congress}{btype}{number}.xml"


def parse_bill_xml(xml_text: str) -> dict:
    """Parse BILLSTATUS XML → {title, primary, cosponsors}."""
    root = ET.fromstring(xml_text)
    def g(el, tag):
        child = el.find(tag)
        return child.text if child is not None and child.text else ""
    def record(item: ET.Element) -> dict:
        return {
            "bioguide": g(item, "bioguideId"),
            "name":     g(item, "fullName"),
            "first":    g(item, "firstName"),
            "last":     g(item, "lastName"),
            "party":    g(item, "party"),
            "state":    g(item, "state"),
            "district": g(item, "district"),
        }
    primary    = [record(i) for i in root.findall(".//sponsors/item")]
    cosponsors = [record(i) for i in root.findall(".//cosponsors/item")]
    title_el   = root.find(".//title")
    title      = title_el.text if title_el is not None and title_el.text else ""
    return {"title": title, "primary": primary, "cosponsors": cosponsors}


# ── Congress.gov API (pre-108th) ─────────────────────────────────────────────

def fetch_bill_api(congress: int, btype: str, number: int) -> dict:
    """Fetch bill data from api.congress.gov → {title, primary, cosponsors}.

    Returns the same structure as parse_bill_xml() so both sources feed the
    same downstream pipeline.
    """
    if not API_KEY:
        raise RuntimeError(
            "CONGRESS_API_KEY env var not set — required for pre-108th bills. "
            "Get a free key at https://api.congress.gov/sign-up/"
        )

    base = f"{API_BASE}/bill/{congress}/{btype}/{number}"

    # Primary sponsor lives on the bill record itself
    bill_data = json.loads(fetch(f"{base}?api_key={API_KEY}&format=json"))
    bill      = bill_data.get("bill", {})
    title     = bill.get("title", "")

    def norm(s: dict, is_sponsor: bool = False) -> dict:
        district = s.get("district")
        return {
            "bioguide": s.get("bioguideId", ""),
            "name":     s.get("fullName", ""),
            "first":    s.get("firstName", ""),
            "last":     s.get("lastName", ""),
            "party":    s.get("party", ""),
            "state":    s.get("state", ""),
            "district": str(district) if district is not None else "",
        }

    primary = [norm(s, is_sponsor=True) for s in bill.get("sponsors", [])]

    # Cosponsors are paginated; fetch all pages
    cosponsors: list[dict] = []
    limit, offset = 250, 0
    while True:
        url  = f"{base}/cosponsors?api_key={API_KEY}&format=json&limit={limit}&offset={offset}"
        data = json.loads(fetch(url))
        for s in data.get("cosponsors", []):
            if not s.get("sponsorshipWithdrawnDate"):
                cosponsors.append(norm(s))
        total  = data.get("pagination", {}).get("count", 0)
        offset += limit
        if offset >= total:
            break
        time.sleep(0.2)  # gentle rate-limiting

    return {"title": title, "primary": primary, "cosponsors": cosponsors}


# ── Main pipeline ─────────────────────────────────────────────────────────────

def main() -> None:
    legislator:    dict[str, dict]        = {}
    bill_cosps:    dict[tuple, list[str]] = {}
    bill_title:    dict[tuple, str]       = {}
    bill_category: dict[tuple, str]       = {}
    bill_primary:  dict[tuple, str | None] = {}
    leg_bills:     dict[str, list[tuple]] = {}

    for congress, btype, number, label, category in BILLS:
        try:
            if congress >= 108:
                body   = fetch(govinfo_url(congress, btype, number))
                parsed = parse_bill_xml(body)
            else:
                parsed = fetch_bill_api(congress, btype, number)
        except (urllib.error.HTTPError, urllib.error.URLError) as err:
            print(f"  skip {label!s:50s} [{err}]", file=sys.stderr)
            continue
        except ET.ParseError as err:
            print(f"  skip {label!s:50s} [parse error: {err}]", file=sys.stderr)
            continue
        except RuntimeError as err:
            print(f"  ERROR: {err}", file=sys.stderr)
            sys.exit(1)

        bkey = (congress, btype, number, label)
        bill_title[bkey]    = (parsed.get("title") or "").strip()
        bill_category[bkey] = category
        primary_people     = parsed["primary"]
        cosponsors         = parsed["cosponsors"]
        bill_primary[bkey] = primary_people[0]["bioguide"] if primary_people else None
        total              = len(primary_people) + len(cosponsors)
        src = "api" if congress < 108 else "govinfo"
        print(f"  [{src}] {congress}-{btype}-{number}: {total:3d} (co)sponsors  [{label}]",
              file=sys.stderr)

        bioguide_ids: list[str] = []
        for s in primary_people:
            bid = s["bioguide"]
            if not bid: continue
            bioguide_ids.append(bid)
            _ensure_leg(legislator, bid, s)
            leg_bills.setdefault(bid, []).append((bkey, "sponsor"))
        for s in cosponsors:
            bid = s["bioguide"]
            if not bid: continue
            bioguide_ids.append(bid)
            _ensure_leg(legislator, bid, s)
            leg_bills.setdefault(bid, []).append((bkey, "cosponsor"))

        bill_cosps[bkey] = bioguide_ids

    # Per-legislator bill counts
    bill_count: Counter = Counter()
    for bids in bill_cosps.values():
        for b in set(bids):
            bill_count[b] += 1

    kept_ids = {b for b, n in bill_count.items() if n >= NODE_MIN_BILLS}
    kept_ids |= {sponsors[0] for sponsors in bill_cosps.values() if sponsors}

    # Pairwise shared-cosponsorship edges
    shared: Counter = Counter()
    for bids in bill_cosps.values():
        kept = sorted(b for b in set(bids) if b in kept_ids)
        for i in range(len(kept)):
            for j in range(i + 1, len(kept)):
                shared[(kept[i], kept[j])] += 1

    nodes = []
    for bid in sorted(kept_ids):
        leg = legislator.get(bid)
        if not leg: continue
        cosponsored = []
        for (bkey, role) in sorted(leg_bills.get(bid, []),
                                   key=lambda x: (x[0][0], x[0][1], x[0][2])):
            c, t, n, lbl = bkey
            cosponsored.append({
                "congress": c, "type": t, "number": n, "label": lbl,
                "title": bill_title.get(bkey, ""), "role": role,
                "category": bill_category.get(bkey, ""),
            })
        nodes.append({
            **leg,
            "type":        party_to_type(leg["party"]),
            "role":        describe_legislator(leg, bill_count[bid]),
            "bills":       bill_count[bid],
            "cosponsored": cosponsored,
        })

    links = [
        {"source": a, "target": b, "weight": w, "type": "cosponsored"}
        for (a, b), w in shared.items() if w >= EDGE_MIN_WEIGHT
    ]

    in_edges = {n for e in links for n in (e["source"], e["target"])}
    nodes    = [n for n in nodes if n["id"] in in_edges]

    out = {
        "title": "Cosponsorship network on federal public-lands bills",
        "source": (
            "GPO govinfo.gov BILLSTATUS (108th Congress+) and api.congress.gov "
            f"(pre-108th). Nodes: legislators cosponsoring ≥{NODE_MIN_BILLS} "
            f"bills; edges: pairs sharing ≥{EDGE_MIN_WEIGHT} cosponsorships. "
            "See scripts/build_cosponsorship_network.py for the bill list."
        ),
        "bills": [
            {
                "congress": c, "type": t, "number": n, "label": lbl,
                "category": cat,
                "cosponsor_count": len(bill_cosps.get((c, t, n, lbl), [])),
            }
            for (c, t, n, lbl, cat) in BILLS
        ],
        "nodes": nodes,
        "links": links,
    }
    write_json(DATA_DIR / "cosponsorship-network.json", out)
    print(f"\n{len(nodes)} legislators, {len(links)} edges "
          f"(weights ≥ {EDGE_MIN_WEIGHT})", file=sys.stderr)


def clean_name(full: str, first: str, last: str) -> str:
    def tc(s: str) -> str:
        return s[:1].upper() + s[1:].lower() if s.isupper() else s
    initial = (first[:1].upper() + ".") if first else ""
    return f"{initial} {tc(last)}".strip()


def _ensure_leg(registry: dict[str, dict], bid: str, record: dict) -> None:
    if bid in registry:
        return
    registry[bid] = {
        "id":       bid,
        "label":    clean_name(record["name"], record["first"], record["last"]),
        "party":    record["party"] or "",
        "state":    record["state"] or "",
        "district": record["district"] or "",
    }


def party_to_type(party: str) -> str:
    return {"R": "republican", "D": "democrat", "I": "independent"}.get(party, "other")


def describe_legislator(leg: dict, n_bills: int) -> str:
    state    = leg["state"]
    district = leg["district"]
    chamber  = "Sen." if not district else f"Rep., {state}-{district}"
    party    = {"R": "R", "D": "D", "I": "I"}.get(leg["party"], "")
    tail     = f"{party}-{state}" if party else state
    return f"{chamber} ({tail}) · {n_bills} bills in set"


if __name__ == "__main__":
    main()
