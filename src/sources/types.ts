import type { Anchor } from "../types.js";

/**
 * SignalSource — the single seam between the pipeline and the outside world.
 *
 * Everything downstream (lifecycle staging, momentum, dispersion, publishing)
 * consumes this interface and is agnostic to where the signals came from.
 * A deployment wires in whatever sources it is licensed and permitted to use:
 * official platform APIs (e.g. the TikTok Business API — see
 * `tiktok-business.ts`), first-party analytics exports, or licensed data
 * providers. This repository ships one concrete implementation — a synthetic
 * generator (`mock.ts`) — so the whole pipeline runs end-to-end with no
 * credentials and no live platform access.
 *
 * Design notes baked into the contract:
 * - Sources report `capped: true` on truncated slices instead of pretending
 *   the slice is the population (see momentum.ts for why this matters).
 * - Anchor IDs are opaque strings, never numbers.
 * - A source that fails must throw; it must never return a thin or partial
 *   result that could silently overwrite a good store downstream.
 */
export interface SignalSource {
  /** Human-readable name, used only in provenance/logging. */
  readonly name: string;

  /**
   * Broad scan: enumerate currently notable anchors cheaply.
   * This is the wide, shallow collector.
   */
  scan(): Promise<Anchor[]>;

  /**
   * Deep pull: fetch full series + creator observations for one anchor.
   * This is the narrow, expensive collector — call it only for anchors the
   * scan (or a prior run) made interesting.
   */
  pull(anchorId: string): Promise<Anchor>;
}
