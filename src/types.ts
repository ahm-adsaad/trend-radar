/**
 * Core domain types.
 *
 * Two rules shape everything here:
 *
 * 1. Every published figure carries provenance. A number without a `basis`
 *    cannot reach a rendered surface; an unknown value renders as "—",
 *    never as 0 and never as a guess.
 *
 * 2. Lifecycle stages are descriptive tags, not admission gates. A trend is
 *    never dropped because of its stage; the stage tells the reader where
 *    the trend is in its life, and ranking decides prominence.
 */

/** Lifecycle stage of a trend. Tags, not gates. */
export type Stage = "rising" | "peaking" | "cooling" | "evergreen";

/** How a figure was obtained. Consumers must surface this next to the number. */
export type Basis =
  | "measured" // computed from observed series data
  | "counter" // derived from cross-run observation counters (see momentum.ts)
  | "carried" // held over from a previous run (see carry.ts)
  | "unavailable"; // not obtainable — renders as "—"

/** A figure with provenance. `value: null` + basis "unavailable" renders "—". */
export interface Figure {
  value: number | null;
  basis: Basis;
}

/** One observation of an anchor at a point in time. */
export interface SeriesPoint {
  /** ISO date (UTC day) of the observation. */
  date: string;
  /** Cumulative view count reported by the source, if available. */
  views: number | null;
  /** Cumulative video count reported by the source, if available. */
  videos: number | null;
  /**
   * True when the source returned a capped/truncated slice rather than the
   * full population. Share-of-slice metrics computed from a capped pull
   * describe the returned slice, not the trend — see momentum.ts.
   */
  capped: boolean;
}

/** A creator observed participating in a trend. */
export interface CreatorObservation {
  creatorId: string;
  videoCount: number;
}

/**
 * The unit of trend detection: an anchor (typically a sound) plus everything
 * observed about it. Anchor IDs are opaque strings — some platforms use
 * 64-bit integer IDs that overflow JavaScript's safe-integer range when
 * parsed from JSON, so IDs are never treated as numbers.
 */
export interface Anchor {
  id: string;
  title: string;
  series: SeriesPoint[];
  creators: CreatorObservation[];
  /**
   * Count of distinct videos observed using this anchor across all runs.
   * Maintained by the pipeline, not the source: on capped pulls this
   * counter — not the source's totals — is the lifecycle authority.
   */
  observedVideos: number;
  /** observedVideos as of the previous run, for delta-based momentum. */
  observedVideosPrev: number | null;
}

/** A named trend built on top of one or more anchors. */
export interface Trend {
  key: string;
  name: string;
  anchorIds: string[];
  stage: Stage;
  momentumPerDayPct: Figure;
  viewsPerWeek: Figure;
  dispersion: DispersionVerdict;
  /** Which anchor's evidence determined the stage (provenance). */
  stageWitness: string | null;
}

/** Creator-breadth verdict for a trend. */
export interface DispersionVerdict {
  uniqueCreators: number;
  topCreatorShare: number | null;
  verdict: "dispersed" | "concentrated" | "insufficient-data";
}
