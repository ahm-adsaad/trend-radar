import type { Anchor, Figure } from "../types.js";

/**
 * Momentum: "+N%/day" view growth, with the censored-sample rule.
 *
 * The trap this module exists to avoid: when a source caps or truncates its
 * pull, share/growth metrics computed from the returned slice describe the
 * slice, not the trend. A capped pull that happens to return mostly-old
 * videos looks "dead"; one that returns mostly-new videos looks "exploding".
 * Neither is evidence about the sound.
 *
 * Rule: on capped pulls, the pipeline's own cross-run observation counter
 * (distinct videos seen using the anchor, accumulated over runs) is the
 * authority — in BOTH directions. It can promote an anchor the capped
 * series makes look flat, and it can refuse a promotion the capped series
 * makes look hot. The published figure then carries basis "counter" so the
 * reader knows which instrument produced it.
 */

/** Day-over-day growth from the last two series points, as a percentage. */
function seriesMomentum(anchor: Anchor): number | null {
  const pts = anchor.series.filter((p) => !p.capped && p.views !== null);
  if (pts.length < 2) return null;
  const prev = pts[pts.length - 2]!.views!;
  const last = pts[pts.length - 1]!.views!;
  if (prev <= 0) return null;
  return ((last - prev) / prev) * 100;
}

/** Growth of the cross-run observation counter, normalized per day. */
function counterMomentum(anchor: Anchor, daysBetweenRuns = 1): number | null {
  if (anchor.observedVideosPrev === null || anchor.observedVideosPrev <= 0) {
    return null;
  }
  const delta = anchor.observedVideos - anchor.observedVideosPrev;
  return (delta / anchor.observedVideosPrev / daysBetweenRuns) * 100;
}

export function isCapped(anchor: Anchor): boolean {
  const last = anchor.series[anchor.series.length - 1];
  return last !== undefined && last.capped;
}

/**
 * The published momentum figure. Never invents: if neither instrument can
 * speak, the figure is null/unavailable and renders as "—".
 */
export function momentum(anchor: Anchor): Figure {
  if (isCapped(anchor)) {
    const c = counterMomentum(anchor);
    return c === null
      ? { value: null, basis: "unavailable" }
      : { value: round1(c), basis: "counter" };
  }
  const m = seriesMomentum(anchor);
  return m === null
    ? { value: null, basis: "unavailable" }
    : { value: round1(m), basis: "measured" };
}

/** Views accumulated over the trailing 7 days, when the series supports it. */
export function viewsPerWeek(anchor: Anchor): Figure {
  const pts = anchor.series.filter((p) => !p.capped && p.views !== null);
  if (pts.length < 8) return { value: null, basis: "unavailable" };
  const weekAgo = pts[pts.length - 8]!.views!;
  const now = pts[pts.length - 1]!.views!;
  return { value: now - weekAgo, basis: "measured" };
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
