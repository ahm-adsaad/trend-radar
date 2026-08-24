/**
 * The LLM authority boundary.
 *
 * An LLM is used in this system for judgment and prose ONLY: naming a trend,
 * describing its mechanic, assessing brand fit. It is never the source of
 * record for URLs, IDs, counts, dates, or provenance — those come from
 * measured data or they render as "—". Every judgment response is validated
 * against a closed schema before anything downstream may read it; free-text
 * fields are carried as prose and never parsed for facts.
 *
 * This module defines the contract and ships a deterministic mock judge so
 * the demo runs offline. A real deployment implements `Judge` against its
 * LLM provider of choice.
 */

export interface TrendJudgment {
  /** display name for the trend — prose, invented by the model, labeled as such */
  name: string;
  /** one-line description of the participation mechanic — prose */
  mechanic: string;
  /** closed enum — validated, the only machine-read field */
  brandFit: "fit" | "unfit" | "review";
}

const BRAND_FIT_VALUES = new Set(["fit", "unfit", "review"]);

/** Reject anything that does not conform exactly to the closed schema. */
export function validateJudgment(raw: unknown): TrendJudgment {
  if (typeof raw !== "object" || raw === null) {
    throw new Error("judgment must be an object");
  }
  const r = raw as Record<string, unknown>;
  if (typeof r.name !== "string" || r.name.length === 0 || r.name.length > 80) {
    throw new Error("judgment.name must be a non-empty string ≤ 80 chars");
  }
  if (typeof r.mechanic !== "string" || r.mechanic.length > 300) {
    throw new Error("judgment.mechanic must be a string ≤ 300 chars");
  }
  if (typeof r.brandFit !== "string" || !BRAND_FIT_VALUES.has(r.brandFit)) {
    throw new Error("judgment.brandFit must be one of fit|unfit|review");
  }
  return {
    name: r.name,
    mechanic: r.mechanic,
    brandFit: r.brandFit as TrendJudgment["brandFit"],
  };
}

/**
 * Brand profile — configuration, not code. A deployment describes the brand
 * it filters for; nothing brand-specific lives in the pipeline itself.
 */
export interface BrandProfile {
  voice: string;
  /** content categories barred from every surface, e.g. gambling */
  barredCategories: string[];
  region: string;
}

export interface Judge {
  judge(anchorTitle: string, profile: BrandProfile): Promise<unknown>;
}

/** Offline stand-in used by the demo; a real Judge calls an LLM. */
export class MockJudge implements Judge {
  async judge(anchorTitle: string, _profile: BrandProfile): Promise<unknown> {
    return {
      name: anchorTitle.replace(/\s*\(demo\)\s*$/i, ""),
      mechanic: "Creators reuse the anchor sound with their own twist (synthetic demo judgment).",
      brandFit: "review",
    };
  }
}
