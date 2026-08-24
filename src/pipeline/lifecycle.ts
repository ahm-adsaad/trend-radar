import type { Anchor, Stage } from "../types.js";
import { isCapped, momentum } from "./momentum.js";

/**
 * Lifecycle staging. Stages are TAGS the reader uses to interpret a trend —
 * they are never admission gates and never a reason to discard.
 *
 * Thresholds here are deliberately simple and centralized so a deployment
 * can calibrate them against its own observed base rates rather than
 * inheriting magic constants.
 */

export interface StageThresholds {
  /** momentum (%/day) at or above which a trend reads as rising */
  risingPct: number;
  /** momentum (%/day) at or below which a trend reads as cooling */
  coolingPct: number;
  /** cumulative views above which a flat trend reads as evergreen stock */
  evergreenViews: number;
}

export const DEFAULT_THRESHOLDS: StageThresholds = {
  risingPct: 5,
  coolingPct: 0.5,
  evergreenViews: 500_000_000,
};

export function stageOf(
  anchor: Anchor,
  t: StageThresholds = DEFAULT_THRESHOLDS,
): Stage {
  const m = momentum(anchor);

  // Evergreen: a large standing library sound. Flat is its normal state —
  // it is stock, not a dying adoption curve, so it must never read "cooling".
  const lastViews = [...anchor.series]
    .reverse()
    .find((p) => p.views !== null)?.views;
  if (
    !isCapped(anchor) &&
    lastViews !== undefined &&
    lastViews !== null &&
    lastViews >= t.evergreenViews &&
    m.value !== null &&
    m.value < t.risingPct
  ) {
    return "evergreen";
  }

  if (m.value === null) return "peaking"; // no instrument → neutral middle, never a guess of motion
  if (m.value >= t.risingPct) return "rising";
  if (m.value <= t.coolingPct) return "cooling";
  return "peaking";
}
