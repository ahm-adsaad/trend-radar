import type { Anchor, DispersionVerdict } from "../types.js";

/**
 * Creator breadth. A trend carried by many unrelated creators is a cultural
 * wave; the same view count concentrated in one account is that account's
 * audience, not a trend. The verdict feeds ranking, never admission.
 */

export interface DispersionThresholds {
  /** below this many observed creators, refuse to issue a verdict */
  minCreators: number;
  /** top creator owning more than this share reads as concentrated */
  concentratedShare: number;
}

export const DEFAULT_DISPERSION: DispersionThresholds = {
  minCreators: 20,
  concentratedShare: 0.35,
};

export function dispersion(
  anchor: Anchor,
  t: DispersionThresholds = DEFAULT_DISPERSION,
): DispersionVerdict {
  const unique = anchor.creators.length;
  if (unique < t.minCreators) {
    // Not enough evidence for a verdict. Saying "insufficient" is honest;
    // guessing "concentrated" from a thin sample would punish small pulls.
    return { uniqueCreators: unique, topCreatorShare: null, verdict: "insufficient-data" };
  }
  const total = anchor.creators.reduce((s, c) => s + c.videoCount, 0);
  const top = Math.max(...anchor.creators.map((c) => c.videoCount));
  const share = total > 0 ? top / total : null;
  return {
    uniqueCreators: unique,
    topCreatorShare: share === null ? null : Math.round(share * 1000) / 1000,
    verdict:
      share !== null && share > t.concentratedShare ? "concentrated" : "dispersed",
  };
}
