#!/usr/bin/env python3
"""Build ``static/data/legislation-textreuse.json``.

Text-reuse analysis of the state "sagebrush" public-lands bills
transcribed in ``legislation.md`` (one ``# State`` H1 per bill). These
bills are widely understood to copy Nevada's 1979 Sagebrush Rebellion
act (AB 413); this pipeline measures how much, and exactly where.

For every bill and every pair of bills it computes:

- **Cosine similarity** on TF-IDF term vectors — overall vocabulary
  overlap, a "distant reading" of how alike two bills read.
- **Jaccard similarity** on word 5-shingles — shared *phrasing*, which
  is the sharper signal for verbatim borrowing.
- **Shared passages** — the actual contiguous runs of copied text
  (≥ MIN_PASSAGE tokens), reconstructed from matching shingles.
- **Signature phrases** — shingles that recur across many bills, i.e.
  the boilerplate DNA of the model legislation.

Everything is emitted into one JSON so multiple visualizations (a
similarity matrix, a borrowed-passage drill, a genealogy network, a
signature-phrase concordance) can be built without re-analyzing.

Pure stdlib — no numpy/scikit. Run: ``python scripts/build_legislation_textreuse.py``
"""

from __future__ import annotations

import math
import re
from collections import Counter

from _common import DATA_DIR, write_json

# legislation.md lives at the repo root, one level up from scripts/.
SRC = DATA_DIR.parent.parent / "legislation.md"

SHINGLE_K = 5          # words per shingle for phrasing similarity
MIN_PASSAGE = 8        # min tokens for a reported shared passage
SIG_MIN_STATES = 3     # a "signature" phrase appears in ≥ this many bills
# Every shared passage of >= MIN_PASSAGE words is kept (no top-N cap):
# the drill shows the complete set, longest first, and the UI scrolls.

# Curated enactment / introduction years, confirmed by Jason. The regex
# `yearguess` below catches statute citations, not bill dates, so these
# override it wherever present. Arizona is still to be confirmed.
YEARS = {
    "nevada": 1979,        # AB 413, introduced Feb 15 1979
    "new-mexico": 1980,    # Laws 1980, Ch. 153 (HB 79), approved Mar 5 1980
    "wyoming": 1980,       # Enrolled Act 38 (HB 6), 45th Legislature 1980
    "utah": 1980,
    "arizona": 1980,
    "north-dakota": 1981,  # HCR 3036, passed Mar 25 1981
    "south-dakota": 1981,  # SB 131, 56th Session (vetoed)
    "alaska": 1982,        # Ballot Measure No. 5
}


# A slug per state for palette/lookup stability on the JS side.
def slug(name: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")


def parse_states(md: str) -> list[dict]:
    """Split legislation.md into one record per ``# State`` H1 block."""
    blocks = re.split(r"(?m)^#\s+(.+?)\s*$", md)
    # re.split with a capture group yields [pre, name1, body1, name2, body2, ...]
    states = []
    for i in range(1, len(blocks), 2):
        name = blocks[i].strip()
        body = blocks[i + 1]
        years = [int(y) for y in re.findall(r"\b(19\d{2}|20\d{2})\b", body)
                 if 1970 <= int(y) <= 2025]
        states.append({
            "name": name,
            "slug": slug(name),
            "year": min(years) if years else None,
            "body": body,
        })
    return states


_WORD = re.compile(r"[a-z0-9]+")
# Structural / boilerplate stopwords that would drown the signal in
# cosine space. Kept OUT of shingles too? No — shingles need verbatim
# runs, so stopwords stay in the token stream; this set is used only to
# down-weight the TF-IDF vocabulary.
STOP = set("""a an the of to in and or for by with as is are be been being that this
these those it its on at from which who whom shall may must not no any all such other
under upon within into is was were with without their his her they them he she we our
""".split())


def tokenize(body: str) -> list[str]:
    """Markdown-stripped lowercase word tokens, in order (verbatim stream)."""
    text = re.sub(r"[#*_>`\-]", " ", body)          # strip md markup
    return _WORD.findall(text.lower())


def shingles(tokens: list[str], k: int = SHINGLE_K) -> list[str]:
    return [" ".join(tokens[i:i + k]) for i in range(len(tokens) - k + 1)]


def tfidf_vectors(token_lists: list[list[str]]) -> list[dict]:
    n = len(token_lists)
    df: Counter = Counter()
    tfs = []
    for toks in token_lists:
        tf = Counter(t for t in toks if t not in STOP)
        tfs.append(tf)
        df.update(tf.keys())
    vecs = []
    for tf in tfs:
        total = sum(tf.values()) or 1
        vec = {t: (c / total) * math.log(n / df[t]) for t, c in tf.items() if df[t] < n}
        vecs.append(vec)
    return vecs


def cosine(a: dict, b: dict) -> float:
    if not a or not b:
        return 0.0
    common = set(a) & set(b)
    dot = sum(a[t] * b[t] for t in common)
    na = math.sqrt(sum(v * v for v in a.values()))
    nb = math.sqrt(sum(v * v for v in b.values()))
    return dot / (na * nb) if na and nb else 0.0


def shared_passages(tok_a: list[str], set_b: set[str], k: int = SHINGLE_K) -> list[str]:
    """Contiguous runs in A whose k-shingles all appear in B → copied text."""
    marked = [False] * len(tok_a)
    for i in range(len(tok_a) - k + 1):
        if " ".join(tok_a[i:i + k]) in set_b:
            for j in range(i, i + k):
                marked[j] = True
    passages, run = [], []
    for idx, m in enumerate(marked):
        if m:
            run.append(tok_a[idx])
        elif run:
            if len(run) >= MIN_PASSAGE:
                passages.append(" ".join(run))
            run = []
    if len(run) >= MIN_PASSAGE:
        passages.append(" ".join(run))
    passages.sort(key=lambda p: -len(p.split()))
    return passages


def main() -> None:
    md = SRC.read_text(encoding="utf-8")
    states = parse_states(md)
    # Attach curated years; fall back to name-sort ordering for any bill
    # still lacking a confirmed year so the guess never drives chronology.
    for s in states:
        s["yearfinal"] = YEARS.get(s["slug"])
    states.sort(key=lambda s: (s["yearfinal"] or 9999, s["name"]))
    n = len(states)

    tokens = [tokenize(s["body"]) for s in states]
    shing = [set(shingles(t)) for t in tokens]
    vecs = tfidf_vectors(tokens)

    meta = [{
        "name": s["name"], "slug": s["slug"],
        "year": s["yearfinal"], "yearguess": s["year"],
        "words": len(tokens[i]),
    } for i, s in enumerate(states)]

    # Pairwise matrices + passage drill.
    cos = [[0.0] * n for _ in range(n)]
    jac = [[0.0] * n for _ in range(n)]
    pairs = []
    for i in range(n):
        cos[i][i] = jac[i][i] = 1.0
        for j in range(i + 1, n):
            c = round(cosine(vecs[i], vecs[j]), 4)
            inter = len(shing[i] & shing[j])
            union = len(shing[i] | shing[j]) or 1
            jv = round(inter / union, 4)
            cos[i][j] = cos[j][i] = c
            jac[i][j] = jac[j][i] = jv
            # Containment: fraction of each bill's phrasing found in the
            # other. Asymmetric — the higher value points from the more-
            # contained (often earlier/source) bill into the larger one,
            # a better directional signal than symmetric Jaccard.
            contain_a = round(inter / (len(shing[i]) or 1), 4)   # A's phrasing present in B
            contain_b = round(inter / (len(shing[j]) or 1), 4)   # B's phrasing present in A
            # Report the copied runs as they appear in the LATER bill
            # (the copier) when years are known; otherwise fall back to
            # the larger bill.
            yi, yj = states[i]["yearfinal"], states[j]["yearfinal"]
            if yi is not None and yj is not None and yi != yj:
                later = i if yi > yj else j
            else:
                later = i if len(tokens[i]) >= len(tokens[j]) else j
            source_set = shing[j] if later == i else shing[i]
            psg = shared_passages(tokens[later], source_set)
            pairs.append({
                "a": states[i]["slug"], "b": states[j]["slug"],
                "cosine": c, "jaccard": jv,
                "containab": contain_a, "containba": contain_b,
                "sharedshingles": inter,
                "passages": psg,
            })

    # Signature phrases: shingles present in ≥ SIG_MIN_STATES bills.
    shingle_states: dict[str, set[int]] = {}
    for i, sset in enumerate(shing):
        for sh in sset:
            shingle_states.setdefault(sh, set()).add(i)
    sigs = [{
        "text": sh,
        "states": sorted(states[i]["slug"] for i in idxs),
        "count": len(idxs),
    } for sh, idxs in shingle_states.items() if len(idxs) >= SIG_MIN_STATES]
    # Rank by breadth (how many bills), then length; drop near-duplicate
    # overlapping shingles by keeping the longest per starting bigram.
    sigs.sort(key=lambda s: (-s["count"], -len(s["text"])))

    out = {
        "title": "Text reuse among state sagebrush public-lands bills",
        "source": (
            "Computed from legislation.md (transcribed state bills). "
            "Cosine on TF-IDF term vectors; Jaccard + shared passages on "
            f"{SHINGLE_K}-word shingles. Nevada AB 413 (1979) is the model text."
        ),
        "method": {
            "shingle_k": SHINGLE_K, "min_passage": MIN_PASSAGE,
            "signature_min_states": SIG_MIN_STATES,
        },
        "states": meta,
        "cosine": cos,
        "jaccard": jac,
        "pairs": pairs,
        "signatures": sigs[:60],
    }
    write_json(DATA_DIR / "legislation-textreuse.json", out)
    # Console summary so the analytical signal is visible on build.
    names = ", ".join(m["name"] + (" (%s)" % m["year"] if m["year"] else " (year?)") for m in meta)
    print("  %d bills: %s" % (n, names))
    top = sorted(pairs, key=lambda p: -p["jaccard"])[:5]
    print("  top phrase-sharing pairs (Jaccard):")
    for p in top:
        print(f"    {p['a']} ~ {p['b']}: jaccard {p['jaccard']}, cosine {p['cosine']}, {p['sharedshingles']} shared 5-grams")


if __name__ == "__main__":
    main()
