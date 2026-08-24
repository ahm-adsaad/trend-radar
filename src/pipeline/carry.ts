import type { Stage } from "../types.js";

/**
 * Board carry-forward. Surfaces churn: a trend can drop out of a source's
 * chart for a day and come back. Membership on the published board is
 * therefore lifecycle-driven, not surface-driven — a card stays until the
 * evidence says the trend actually ended, and while it is being carried it
 * says so.
 *
 * Rules:
 * - A card leaves only on: counter flat two consecutive runs, an explicit
 *   cooling read, or exceeding the max carry age.
 * - Evergreen cards never carry (stock does not "end"; it just stops being
 *   worth a slot when it stops moving).
 * - A carried card may never claim "rising" — carrying means we did NOT
 *   re-observe it this run, and rising is a claim about fresh evidence.
 */

export interface MemberState {
  key: string;
  stage: Stage;
  /** consecutive runs with a flat observation counter */
  flatRuns: number;
  /** runs since the trend was last directly observed on a surface */
  carriedRuns: number;
}

export interface CarryPolicy {
  maxFlatRuns: number;
  maxCarriedRuns: number;
}

export const DEFAULT_CARRY: CarryPolicy = { maxFlatRuns: 2, maxCarriedRuns: 14 };

export type CarryDecision =
  | { keep: true; carried: boolean; stage: Stage }
  | { keep: false; reason: "flat-twice" | "stale" | "evergreen-lapsed" };

export function decideCarry(
  member: MemberState,
  observedThisRun: boolean,
  policy: CarryPolicy = DEFAULT_CARRY,
): CarryDecision {
  if (observedThisRun) {
    return { keep: true, carried: false, stage: member.stage };
  }
  if (member.stage === "evergreen") {
    return { keep: false, reason: "evergreen-lapsed" };
  }
  if (member.flatRuns >= policy.maxFlatRuns) {
    return { keep: false, reason: "flat-twice" };
  }
  if (member.carriedRuns >= policy.maxCarriedRuns) {
    return { keep: false, reason: "stale" };
  }
  // Carried cards demote a "rising" claim to "peaking": we have no fresh
  // evidence of rise, and the board never asserts what it did not observe.
  const stage: Stage = member.stage === "rising" ? "peaking" : member.stage;
  return { keep: true, carried: true, stage };
}
