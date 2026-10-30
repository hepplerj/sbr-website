# plan/

Working notes for *Governing Ground* that don't belong in code, commit
messages, or GitHub Issues. The point is a clean handoff: any new
session (or collaborator) should be able to read `STATUS.md` and know
exactly where things stand without replaying a conversation.

## What goes where

Three homes for "not-yet-code," each with a distinct job — keep them
from duplicating each other:

| Home | Holds | Example |
|------|-------|---------|
| **GitHub Issues** | Discrete, actionable, taggable work | "Add scroll-zoom to networks.js" (labeled `networks`, `tier-2`) |
| **`plan/`** (this folder) | Narrative status, design specs, decision logs — too ephemeral or too prose-y to be an issue | "Which of the five climate views do we keep?" |
| **Memory** (`.claude/.../memory/`) | Durable cross-session *facts* about the user/project | "Use `/usr/bin/python3` — homebrew Python lacks working expat" |

Rule of thumb: if it's a **task**, open an issue. If it's a **fact**,
write a memory. If it's **"where are we / why did we choose this,"** it
lives here.

## Files

- **`STATUS.md`** — the living handoff. Current branch, what's built,
  committed vs uncommitted, and the open decisions. Update it as work
  lands or decisions get made; it should never be more than a few
  commits stale.
- **`roadmap.md`** — design-level direction and parked ideas that
  aren't broken into issues yet.

## Conventions

- These are human-and-AI shared working docs — not published content, so
  the [AI bright line](../CLAUDE.md#ai-disclosure) (narrative prose is
  human-authored) doesn't apply here.
- Prefer editing an existing entry over appending; stale planning is
  worse than none. When a decision is made, fold the outcome into the
  relevant doc and delete the open-question.
