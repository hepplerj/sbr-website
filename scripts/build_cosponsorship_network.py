#!/usr/bin/env python3
"""Build ``static/data/cosponsorship-network.json``.

A legislator-level network built from shared cosponsorships on federal-
public-lands bills across recent Congresses. Two legislators connect if
they cosponsored the same bill; the edge weight is the count of shared
cosponsorships across the full set.

Data source: GPO ``govinfo.gov`` BILLSTATUS bulk data (free, public, no
API key). URL pattern:

    https://www.govinfo.gov/bulkdata/BILLSTATUS/{congress}/{type}/
    BILLSTATUS-{congress}{type}{number}.xml

Curated bill list focuses on the transfer, disposal, grazing, and
Antiquities-Act-reform bills that sit in the Sagebrush-rebellion policy
lineage. Adjust ``BILLS`` below to extend.

Run: ``python scripts/build_cosponsorship_network.py``
"""

from __future__ import annotations

import sys
import urllib.error
import xml.etree.ElementTree as ET
from collections import Counter, defaultdict

from _common import DATA_DIR, fetch, write_json

BULK = "https://www.govinfo.gov/bulkdata/BILLSTATUS"

# Bills included. Each entry: (congress, chamber-type, number, short-label).
# Chamber types: "hr" (House bill), "s" (Senate bill), "hjres"/"sjres" (joint res).
#
# Curated for the transfer, disposal, grazing, Antiquities-reform, and
# sage-grouse/ESA-flexibility lineage — the legislative face of the
# sagebrush-rebellion policy space across 110th–118th Congresses (2007–2024).
# Labels are editorial; titles come from the fetched data. Expanding this
# list is the primary way to extend the network.
BILLS = [
    # 108th–109th — the Pombo Natural Resources chair years
    (108, "hr", 1153,  "America's Wilderness Protection (108th, Otter)"),
    (109, "hr", 3463,  "Action Plan for Public Lands & Education (109th, Bishop)"),
    (109, "s",  2569,  "Action Plan for Public Lands & Education (109th, Hatch)"),
    (109, "hr", 3824,  "ESA Recovery Collaboration (109th, Pombo)"),

    # 110th–113th — early transfer-advocacy lineage
    (110, "hr", 6300,  "Dona Ana County Rangeland Preservation (110th, Pearce)"),
    (111, "hr", 5339,  "Disposal of Excess Federal Lands (111th, Chaffetz)"),
    (112, "s",  635,   "Disposal of Excess Federal Lands (112th, Lee)"),
    (112, "hr", 1126,  "Disposal of Excess Federal Lands (112th, Chaffetz)"),
    (112, "hr", 1581,  "Wilderness & Roadless Area Release (112th, McCarthy)"),
    (112, "s",  1087,  "Wilderness & Roadless Area Release (112th, Barrasso)"),
    (113, "hr", 1459,  "Antiquities transparency (113th, Bishop)"),
    (113, "hr", 2657,  "Disposal of Excess Federal Lands (113th, Chaffetz)"),

    # 114th–115th — post-Bunkerville legislative push
    (114, "hr", 5780,  "Utah Public Lands Initiative (114th, Bishop)"),
    (114, "hr", 3650,  "State National Forest Management (114th, Young)"),
    (114, "hr", 2316,  "Wildlife Management Reform (114th)"),
    (114, "s",  361,   "Disposal of Excess Federal Lands (114th, Lee)"),
    (115, "hr", 621,   "Disposal of Excess Federal Lands (115th, Chaffetz)"),
    (115, "hr", 622,   "Local Enforcement for Local Lands (115th, Chaffetz)"),
    (115, "hr", 2284,  "National Monument Designation Transparency (115th, Labrador)"),
    (115, "hr", 2230,  "Grazing Improvement Act (115th)"),
    (115, "hr", 3990,  "National Monument Creation & Protection (115th, Bishop)"),
    (115, "s",  132,   "National Monument Designation Transparency (115th, Crapo)"),
    (115, "s",  273,   "Greater Sage-Grouse Protection (115th, Risch)"),

    # 116th–118th — the Trump/Biden/post-Trump era
    (116, "hr", 3225,  "Antiquities Act amendments (116th)"),
    (116, "hr", 1664,  "National Monument CAP Act (116th, Bishop)"),
    (117, "hr", 3113,  "State Land Management (117th)"),
    (117, "s",  1264,  "Resiliency for Ranching (117th, Barrasso)"),
    (118, "hr", 1435,  "State Transfer Reaffirmation (118th)"),
    (118, "hr", 7430,  "Public Lands in Public Hands (118th, Zinke)"),
    (118, "hr", 5499,  "Congressional Oversight of Antiquities Act (118th)"),
    (118, "s",  2820,  "Congressional Oversight of Antiquities Act (118th, Lee)"),
    (118, "s",  3322,  "Ranching Without Red Tape (118th, Barrasso)"),
]

# Minimum shared-cosponsorship count for an edge to appear in the viz.
# Filters out incidental single-bill pairings and keeps the graph legible.
EDGE_MIN_WEIGHT = 2

# Only keep legislators who cosponsored at least this many bills in the set.
# Two-bill threshold shows the full caucus — anyone who appears more than
# once, which includes the recurring core plus the wider ring of
# cross-aisle and one-issue signatories whose pattern is itself revealing.
NODE_MIN_BILLS = 2


def bill_url(congress: int, btype: str, number: int) -> str:
    return f"{BULK}/{congress}/{btype}/BILLSTATUS-{congress}{btype}{number}.xml"


def parse_bill(xml_text: str) -> dict:
    """Parse BILLSTATUS XML. Return title plus primary sponsor and
    cosponsor lists separately so we can track sponsor role per legislator."""
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
    title_el = root.find(".//title")
    title = title_el.text if title_el is not None and title_el.text else ""
    return {"title": title, "primary": primary, "cosponsors": cosponsors}


def main() -> None:
    legislator: dict[str, dict] = {}                  # bioguide → attrs
    bill_cosps: dict[tuple, list[str]] = {}           # bill_key → list[bioguide (all participants)]
    bill_title: dict[tuple, str] = {}                 # bill_key → cleaned title
    bill_primary: dict[tuple, str | None] = {}        # bill_key → primary-sponsor bioguide
    leg_bills: dict[str, list[tuple]] = {}            # bioguide → list of (bill_key, role)

    for congress, btype, number, label in BILLS:
        url = bill_url(congress, btype, number)
        try:
            body = fetch(url)
        except urllib.error.HTTPError as err:
            print(f"  skip {label!s:50s} [{err.code}]", file=sys.stderr)
            continue
        try:
            parsed = parse_bill(body)
        except ET.ParseError as err:
            print(f"  skip {label!s:50s} [parse error: {err}]", file=sys.stderr)
            continue
        bkey = (congress, btype, number, label)
        bill_title[bkey] = (parsed.get("title") or "").strip()
        primary_people = parsed["primary"]
        cosponsors = parsed["cosponsors"]
        bill_primary[bkey] = primary_people[0]["bioguide"] if primary_people else None
        total = len(primary_people) + len(cosponsors)
        print(f"  {congress}-{btype}-{number}: {total:3d} (co)sponsors  [{label}]", file=sys.stderr)

        bioguide_ids: list[str] = []
        # Track primary sponsor first
        for s in primary_people:
            bid = s["bioguide"]
            if not bid:
                continue
            bioguide_ids.append(bid)
            _ensure_leg(legislator, bid, s)
            leg_bills.setdefault(bid, []).append((bkey, "sponsor"))
        # Then cosponsors
        for s in cosponsors:
            bid = s["bioguide"]
            if not bid:
                continue
            bioguide_ids.append(bid)
            _ensure_leg(legislator, bid, s)
            leg_bills.setdefault(bid, []).append((bkey, "cosponsor"))

        bill_cosps[bkey] = bioguide_ids

    # Per-legislator bill counts
    bill_count: Counter = Counter()
    for bids in bill_cosps.values():
        for b in set(bids):
            bill_count[b] += 1

    # Keep the active caucus
    kept_ids = {b for b, n in bill_count.items() if n >= NODE_MIN_BILLS}
    kept_ids |= {sponsors[0] for sponsors in bill_cosps.values() if sponsors}  # always keep primary sponsors

    # Build pairwise shared-cosponsorship counts, restricted to kept legislators
    shared: Counter = Counter()
    for bids in bill_cosps.values():
        kept = sorted(b for b in set(bids) if b in kept_ids)
        for i in range(len(kept)):
            for j in range(i + 1, len(kept)):
                shared[(kept[i], kept[j])] += 1

    # Assemble nodes + links
    nodes = []
    for bid in sorted(kept_ids):
        leg = legislator.get(bid)
        if not leg:
            continue
        # Per-legislator bill list, ordered by congress then bill number
        cosponsored = []
        for (bkey, role) in sorted(leg_bills.get(bid, []), key=lambda x: (x[0][0], x[0][1], x[0][2])):
            c, t, n, lbl = bkey
            cosponsored.append({
                "congress": c,
                "type":     t,
                "number":   n,
                "label":    lbl,
                "title":    bill_title.get(bkey, ""),
                "role":     role,
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

    # Drop nodes that aren't touched by any edge (isolated legislators only
    # cosponsored bills whose other cosponsors didn't cross our threshold)
    in_edges = {n for e in links for n in (e["source"], e["target"])}
    nodes = [n for n in nodes if n["id"] in in_edges]

    out = {
        "title": "Cosponsorship network on federal public-lands bills",
        "source": (
            "GPO govinfo.gov BILLSTATUS bulk data. Nodes are legislators who "
            f"cosponsored at least {NODE_MIN_BILLS} bills in the curated set; "
            f"edges connect pairs sharing {EDGE_MIN_WEIGHT} or more "
            "cosponsorships. See scripts/build_cosponsorship_network.py for "
            "the bill list."
        ),
        "bills": [
            {
                "congress": c, "type": t, "number": n, "label": lbl,
                "cosponsor_count": len(bill_cosps.get((c, t, n, lbl), [])),
            }
            for (c, t, n, lbl) in [(b[0], b[1], b[2], b[3]) for b in BILLS]
        ],
        "nodes": nodes,
        "links": links,
    }
    write_json(DATA_DIR / "cosponsorship-network.json", out)

    print(f"\n{len(nodes)} legislators, {len(links)} edges "
          f"(weights ≥ {EDGE_MIN_WEIGHT})", file=sys.stderr)


def clean_name(full: str, first: str, last: str) -> str:
    """Render as "J. Bishop" — shorter than the full govinfo form. Some
    bulk records use ALL CAPS for the last name; fix that."""
    def tc(s: str) -> str:
        # Title-case but preserve punctuation like "O'Rourke" or "Mc-"
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
    state = leg["state"]
    district = leg["district"]
    chamber = "Sen." if not district else f"Rep., {state}-{district}"
    party = {"R": "R", "D": "D", "I": "I"}.get(leg["party"], "")
    tail = f"{party}-{state}" if party else state
    return f"{chamber} ({tail}) · {n_bills} bills in set"


if __name__ == "__main__":
    main()
