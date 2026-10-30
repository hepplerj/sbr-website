"""Harvest the *American Cattle Producer* OCR corpus and build term-frequency series.

The magazine (1919-1961, published as *The Producer* until the mid-1930s) was
the official organ of the American National Live Stock Association — the
organized cattle industry talking to itself, monthly, across the Taylor
Grazing Act, the Grazing Service/BLM consolidation, the 1946-47 "land grab"
campaign, and the postwar grazing-fee fights.

Sources:
- archive.org collection ``pub_american-beef-producer`` (508 issues).
  Item list via https://archive.org/advancedsearch.php
  Per-issue OCR text via https://archive.org/download/{id}/{id}_djvu.txt
  All downloads cached under scripts/.cache/producer/ so reruns are local-only
  (~100 MB total, one-time).

Output: static/data/producer-terms.json — yearly word totals plus, for every
term in LEXICON, raw counts and rates per 10,000 words, grouped by concept.

Lexicon design notes (read before editing):
- Terms are grouped into *concept clusters* because the period vocabulary is
  not ours: what we would call climate stress appears as "drouth" (the
  dominant period spelling), "dry years," "dust"; what we would call
  desertification appears — if at all — as range "depletion" or the advancing
  "desert." Keep clusters period-faithful and let the per-term series show
  which word carries each concept in which decade.
- Patterns are matched against lowercased, dehyphenated OCR text. Keep them
  lowercase, use \b word boundaries, and prefer explicit alternations over
  broad stems (e.g. "regimentation" not "regiment" — the latter is a wartime
  military word).
- Known impurities, accepted deliberately: "desert" catches the verb rarely;
  "allotments" includes Indian allotment references; "conservation" spans
  both the industry's own usage and its enemies'. The per-term series make
  these auditable.
"""

from __future__ import annotations

import concurrent.futures
import json
import re
import sys
import time
import urllib.parse
from pathlib import Path

from _common import DATA_DIR, ROOT, fetch, write_json

CACHE = ROOT / "scripts" / ".cache" / "producer"
TXT_DIR = CACHE / "txt"
COLLECTION = "pub_american-beef-producer"
WORKERS = 6

# concept id, concept label, [(term id, term label, regex), ...]
LEXICON = [
    ("aridity", "Aridity & dry years", [
        ("drought", "drought / drouth", r"\b(?:droughts?|drouths?|drouthy)\b"),
        ("dust", "dust storms / dust bowl", r"\bdust\s+(?:storms?|bowl)\b"),
        ("desert", "desert / desertification", r"\bdesert(?:s|ification)?\b"),
        ("arid", "arid / semiarid", r"\b(?:semi-?\s?)?arid(?:ity)?\b"),
        ("dry-years", "dry years / spells / seasons", r"\bdry\s+(?:years?|seasons?|spells?)\b"),
    ]),
    ("range-health", "Range condition", [
        ("overgrazing", "overgrazing", r"\bover-?graz\w+\b"),
        ("erosion", "erosion / eroded", r"\b(?:erosions?|eroded?|eroding)\b"),
        ("depletion", "depletion / depleted", r"\bdeplet\w+\b"),
        ("carrying-capacity", "carrying capacity", r"\bcarrying\s+capacity\b"),
        ("reseeding", "reseeding", r"\bre-?seed\w+\b"),
        ("range-improvement", "range improvement", r"\brange\s+improvements?\b"),
        ("conservation", "conservation", r"\bconservation\b"),
    ]),
    ("federal-machinery", "Federal land machinery", [
        ("taylor-act", "Taylor Grazing Act", r"\btaylor\s+grazing\b"),
        ("forest-service", "Forest Service", r"\bforest\s+service\b"),
        ("grazing-service", "Grazing Service", r"\bgrazing\s+service\b"),
        ("blm", "Bureau of Land Management", r"\bbureau\s+of\s+land\s+management\b"),
        ("grazing-fees", "grazing fees", r"\bgrazing\s+fees?\b"),
        ("grazing-permits", "grazing permits", r"\bgrazing\s+permits?\b"),
        ("allotments", "allotments", r"\ballotments?\b"),
        ("public-domain", "public domain", r"\bpublic\s+domain\b"),
    ]),
    ("anti-federal", "Anti-federal rhetoric", [
        ("bureaucrat", "bureaucrat / bureaucracy", r"\bbureaucra\w+\b"),
        ("federal-control", "federal / government control", r"\b(?:federal|government)\s+control\b"),
        ("states-rights", "states' rights", r"\bstates?['’\s]{1,3}rights\b"),
        ("land-grab", "land grab", r"\bland\s+grab\w*\b"),
        ("socialism", "socialism / socialistic", r"\bsociali[sz]\w+\b|\bsocialis(?:m|t|ts|tic)\b"),
        ("regimentation", "regimentation", r"\bregimentation\b"),
        ("confiscation", "confiscation / confiscatory", r"\bconfiscat\w+\b"),
    ]),
    ("tenure", "Land tenure & transfer", [
        ("public-lands", "public lands", r"\bpublic\s+lands?\b"),
        ("private-ownership", "private ownership", r"\bprivate\s+ownership\b"),
        ("state-ownership", "state ownership", r"\bstate\s+ownership\b"),
        ("homestead", "homestead", r"\bhomestead\w*\b"),
    ]),
    # "wolf" was audited and dropped: its 1953 peak was a nostalgia column
    # ("The Early Day Wolf") plus supply ads calling cattle grubs "wolves."
    # Nested phrases ("predator control" also matches "predator") mean the
    # cluster aggregate can double-count slightly; per-term series are exact.
    ("predators-pests", "Predators & pests", [
        ("coyote", "coyote", r"\bcoyotes?\b"),
        ("predator", "predator / predatory animals", r"\bpredator\w*\b|\bpredatory\s+animals?\b"),
        ("prairie-dog", "prairie dogs", r"\bprairie\s+dogs?\b"),
        ("rodent", "rodents", r"\brodents?\b"),
        ("predator-control", "predatory animal / rodent control", r"\bpredat\w+\s+animal\s+control\b|\bpredator\s+control\b|\brodent\s+control\b"),
        ("bounty", "bounty / bounties", r"\bbount(?:y|ies)\b"),
        ("poison-campaign", "strychnine / 1080 / getters / poisoned bait", r"\bstrychnine\b|\b(?:compound\s+)?1080\b|\bcoyote\s+getters?\b|\bpoisoned\s+baits?\b"),
        ("biological-survey", "Biological Survey", r"\bbiological\s+survey\b"),
        ("poison-plants", "poisonous plants / larkspur / locoweed", r"\bpoison\w*\s+plants?\b|\blarkspur\b|\bloco\s?weed\b"),
    ]),
    ("water", "Water", [
        ("irrigation", "irrigation", r"\birrigat\w+\b"),
        ("reclamation", "reclamation", r"\breclamation\b"),
        ("water-rights", "water rights", r"\bwater\s+rights?\b"),
    ]),
]

WORD_RE = re.compile(r"[a-z]{2,}")

# Tokens for the top-terms / keyness tables: 3-20 letters, minus stopwords.
# The stopword list mixes standard English function words with corpus
# boilerplate (masthead words like "vol"/"iss", generic verbs, honorifics).
TOK_RE = re.compile(r"[a-z]{3,20}")
STOPWORDS = frozenset("""
a about above after again against all also am an and any are as at be because
been before being below between both but by can cannot could did do does doing
down during each few for from further had has have having he her here hers
herself him himself his how i if in into is it its itself just me more most my
myself no nor not now of off on once only or other our ours ourselves out over
own same she should so some such than that the their theirs them themselves
then there these they this those through to too under until up very was we were
what when where which while who whom why will with you your yours yourself
yourselves one two three four five six seven eight nine ten first second last
many much may might must shall upon per cent would said says say made make
making new time year years day days way well get got go going come came mr mrs
dr vol iss inc co page pages
""".split())

DECADES = [
    ("1919-29", 1919, 1929),
    ("1930s", 1930, 1939),
    ("1940s", 1940, 1949),
    ("1950s", 1950, 1959),
    ("1960-61", 1960, 1961),
]


def decade_of(year: int) -> str:
    for did, lo, hi in DECADES:
        if lo <= year <= hi:
            return did
    raise ValueError(year)


def keyness_tables(dec_counts: dict[str, dict[str, int]]) -> dict:
    """Overall top terms plus per-decade distinctive terms (log-likelihood).

    A term is "distinctive" for a decade when it is overrepresented there
    relative to the rest of the corpus; G2 ranks how surprising the excess is.
    The 200-occurrence floor keeps OCR junk and one-off proper names out.
    """
    import math

    total: dict[str, int] = {}
    for c in dec_counts.values():
        for w, f in c.items():
            total[w] = total.get(w, 0) + f
    n_all = sum(total.values())

    overall = [
        {"term": w, "count": c, "rate": round(c / n_all * 10_000, 1)}
        for w, c in sorted(total.items(), key=lambda kv: -kv[1])[:30]
    ]

    decades = []
    for did, _, _ in DECADES:
        c = dec_counts[did]
        n = sum(c.values())
        rest_n = n_all - n
        scored = []
        for w, f in c.items():
            if f < 200:
                continue
            rf = total[w] - f
            e1 = n * (f + rf) / n_all
            e2 = rest_n * (f + rf) / n_all
            g2 = 2 * (f * math.log(f / e1) + (rf * math.log(rf / e2) if rf else 0))
            if f / n > (rf / rest_n if rest_n else 0):
                scored.append((g2, w, f / n * 10_000))
        scored.sort(reverse=True)
        decades.append(
            {
                "id": did,
                "tokens": n,
                "terms": [
                    {"term": w, "rate": round(r, 1), "g2": round(g2, 0)}
                    for g2, w, r in scored[:15]
                ],
            }
        )
    return {"overall": overall, "decades": decades, "tokens": n_all}


def load_manifest() -> list[dict]:
    """Item list for the collection: identifier, date, year. Cached."""
    dest = CACHE / "manifest.json"
    if dest.exists():
        return json.loads(dest.read_text())
    params = urllib.parse.urlencode(
        {
            "q": f"collection:{COLLECTION}",
            "fl[]": ["identifier", "date", "year", "title"],
            "rows": 2000,
            "output": "json",
        },
        doseq=True,
    )
    body = fetch(f"https://archive.org/advancedsearch.php?{params}")
    docs = json.loads(body)["response"]["docs"]
    docs.sort(key=lambda d: d.get("date", ""))
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_text(json.dumps(docs, indent=1))
    print(f"manifest: {len(docs)} issues", file=sys.stderr)
    return docs


def download_issue(identifier: str) -> Path:
    """Fetch one issue's OCR text into the cache; retry transient failures."""
    dest = TXT_DIR / f"{identifier}.txt"
    if dest.exists() and dest.stat().st_size > 0:
        return dest
    url = f"https://archive.org/download/{identifier}/{identifier}_djvu.txt"
    for attempt in range(5):
        try:
            fetch(url, dest=dest, binary=True)
            return dest
        except Exception as exc:  # noqa: BLE001 — retry any transport error
            if attempt == 4:
                raise
            wait = 2**attempt
            print(f"  retry {identifier} in {wait}s ({exc})", file=sys.stderr)
            time.sleep(wait)
    return dest


def clean(raw: str) -> str:
    """Lowercase, rejoin linebreak-hyphenated words, collapse whitespace."""
    text = raw.lower()
    text = re.sub(r"-\s*\n\s*", "", text)  # "graz-\ning" -> "grazing"
    return re.sub(r"\s+", " ", text)


def main() -> None:
    docs = load_manifest()
    ids = [d["identifier"] for d in docs]

    with concurrent.futures.ThreadPoolExecutor(WORKERS) as pool:
        done = 0
        for _ in pool.map(download_issue, ids):
            done += 1
            if done % 50 == 0:
                print(f"downloaded {done}/{len(ids)}", file=sys.stderr)

    patterns = [
        (cid, tid, re.compile(rx))
        for cid, _, terms in LEXICON
        for tid, _, rx in terms
    ]

    years = sorted({int(d["year"]) for d in docs if d.get("year")})
    yi = {y: i for i, y in enumerate(years)}
    words = [0] * len(years)
    issues = [0] * len(years)
    counts = {(cid, tid): [0] * len(years) for cid, tid, _ in patterns}

    dec_counts: dict[str, dict[str, int]] = {did: {} for did, _, _ in DECADES}
    for d in docs:
        if not d.get("year"):
            continue
        year = int(d["year"])
        i = yi[year]
        text = clean((TXT_DIR / f"{d['identifier']}.txt").read_text(errors="replace"))
        words[i] += len(WORD_RE.findall(text))
        issues[i] += 1
        for cid, tid, rx in patterns:
            counts[(cid, tid)][i] += len(rx.findall(text))
        dc = dec_counts[decade_of(year)]
        for tok in TOK_RE.findall(text):
            if tok not in STOPWORDS:
                dc[tok] = dc.get(tok, 0) + 1

    def rates(row: list[int]) -> list[float]:
        return [round(c / w * 10_000, 3) if w else 0.0 for c, w in zip(row, words)]

    concepts = []
    for cid, clabel, terms in LEXICON:
        agg = [0] * len(years)
        out_terms = []
        for tid, tlabel, _ in terms:
            row = counts[(cid, tid)]
            agg = [a + c for a, c in zip(agg, row)]
            out_terms.append({"id": tid, "label": tlabel, "counts": row, "rate": rates(row)})
        concepts.append(
            {"id": cid, "label": clabel, "rate": rates(agg), "counts": agg, "terms": out_terms}
        )

    write_json(
        DATA_DIR / "producer-terms.json",
        {
            "source": "American Cattle Producer (archive.org: pub_american-beef-producer)",
            "unit": "per 10,000 words",
            "years": years,
            "issues": issues,
            "words": words,
            "concepts": concepts,
            "topterms": keyness_tables(dec_counts),
        },
    )

    total_words = sum(words)
    print(f"{sum(issues)} issues, {total_words:,} words, {years[0]}-{years[-1]}", file=sys.stderr)


if __name__ == "__main__":
    main()
