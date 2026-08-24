# Architecture

This document describes the shape of the production system this repository
distills. Vendor- and client-specific details are deliberately omitted; the
code here re-implements the transferable core on synthetic data.

## The two-collector split

The single most important structural decision. Trend detection wants two
contradictory things: breadth (see everything moving) and depth (per-anchor
time series, creator lists, exemplar clips). Doing both in one pass is
unaffordable, so the system splits them:

- **Scan** — wide and cheap. Enumerate currently notable anchors from chart
  and discovery surfaces. Output: candidate anchor IDs plus coarse signals.
- **Pull** — narrow and expensive. For anchors the scan (or a prior run's
  board) made interesting, fetch full series and participation evidence.

The scan decides *where to spend*; the pull produces *the evidence*. Both
sit behind the `SignalSource` interface, so the pipeline never knows which
API or provider produced a given anchor.

## Run model

Collection runs on a daily schedule (multiple lanes: chart scan, deep pulls,
keyword surfaces, competitor observation), writing to a Postgres warm store.
The web dashboard reads the warm store at request time; a committed JSON
snapshot serves as the last-rung fallback so a collection failure degrades to
*stale-but-labeled* rather than empty. A failed pull never overwrites the
last good store — the surface shows the last good data plus a stale badge.

## Spend governance

Per-call data costs make an unsupervised collector a liability. The
production system's spend layer, summarized:

- a **day ledger**: every lane records its calls and cost per UTC day;
- a **per-lane day interlock**: a lane that already ran today refuses to run
  again, which also makes retries idempotent instead of multiplicative;
- a **self-calibrating daily ceiling**: expected spend calibrates from a
  trailing window of measured days rather than a hand-tuned constant, and is
  clamped to a hard cap so a ledger outage can never uncork the budget.

The principle generalizes: budgets should calibrate from measured reality,
but every self-calibrating value needs a hard bound it cannot ratchet past.

## Gates vs. ranking

Two different kinds of decision, kept strictly apart:

- **Gates** decide admission (is this a coherent trend at all? is it safe for
  every surface?). Gates are few, and lifecycle stage is never one of them.
- **Ranking** decides prominence (momentum, breadth, prized format classes).
  Evidence that a trend is *interesting* boosts rank; its absence never
  deletes the trend.

Collapsing these — using a ranking signal as an admission gate — was the root
cause of the worst misses observed in production, because it silently
discards exactly the early, ambiguous trends a radar exists to catch.

## The judgment layer

LLM calls are used for naming, describing mechanics, and brand-fit
assessment — prose and closed enums only (see `src/judgment/boundary.ts`).
Judgments are cached keyed on a `JUDGMENT_VERSION` that is bumped whenever a
prompt changes, so cached prose is never silently produced by a prompt the
team no longer runs. Brand specifics live in a configuration profile, not in
pipeline code: the same system serves any brand by swapping the profile.
