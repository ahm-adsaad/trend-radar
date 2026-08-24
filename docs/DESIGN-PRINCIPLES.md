# Design principles

The rules below were forged in production, mostly by getting them wrong
first. They are enforced in code, not in a style guide.

## 1. Never invent

Nothing on a published surface is ever guessed. A figure the instruments
cannot produce renders as "—" — never 0, never an estimate, never a
plausible-looking placeholder. This sounds obvious; the discipline is in the
long tail (a `heat()` bin that silently paints a blank as cold, a formatter
that turns `null` into `0%`).

## 2. Every figure carries provenance

A number without a basis is not publishable. The `Figure` type — `{ value,
basis }` — makes this structural: renderers can only print what they can
attribute (measured series, observation counter, carried-over) and readers
always see which instrument spoke.

## 3. Describe the slice you got, not the population you wanted

When a source caps or truncates a pull, ratios computed on the returned
slice describe the slice. The censored-sample rule (see
`src/pipeline/momentum.ts`): on capped pulls, cross-run observation counters
are the lifecycle authority in both directions — they can rescue an anchor a
capped slice makes look dead, and refuse one it makes look hot.

## 4. Stages are tags, not gates

Lifecycle stage tells the reader where a trend is; it never decides whether
the trend exists. Discarding by stage silently deletes the early ambiguous
cases a radar exists for. Related: evergreen library anchors are *stock*, not
adoption curves — flat is their healthy state, and they must never read
"cooling", nor be counted as deaths.

## 5. Claims expire with their evidence

A board card carried past surface churn keeps its place but loses its
strongest claim: carried cards never say "rising", because rising is a claim
about fresh evidence. Reconciliation is downward-only for the same reason —
counter-evidence can demote a claim, but absence of counter-evidence never
promotes one.

## 6. The LLM writes prose, the pipeline owns facts

Models name trends, describe mechanics, and exercise judgment — through
closed schemas. They are never the source of record for IDs, URLs, counts,
dates, or provenance. Off-schema output is rejected at the boundary, not
patched up.

## 7. Self-calibrating over magic constants — with hard bounds

Thresholds calibrate from measured base rates where possible (spend
ceilings from trailing windows, floors from observed distributions). But
every self-calibrating value gets a hard cap it cannot ratchet past, because
the day the calibration input is unreachable is exactly the day the value
goes wrong.

## 8. Degrade honestly

A failed collection never overwrites the last good store. Surfaces show the
last good data with a stale badge — stale-and-labeled beats fresh-looking
and wrong, and both beat empty.

## 9. Brand is configuration

Brand voice, barred content categories, and target regions live in a profile
object, not in pipeline code. Safety screens (content categories barred from
every surface, stricter classes barred from prominent surfaces only) key off
the profile, so one codebase serves any brand.
