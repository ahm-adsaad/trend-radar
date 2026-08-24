import type { SignalSource } from "./types.js";
import type { Anchor } from "../types.js";

/**
 * Integration point for the official TikTok Business API
 * (https://business-api.tiktok.com — requires an approved developer app).
 *
 * This adapter is intentionally a stub in the portfolio build: wiring it up
 * requires app credentials and an approved scope, and the demo is designed
 * to run with zero credentials. It exists to show where an official-API
 * source plugs into the SignalSource seam.
 *
 * Notes for a real implementation:
 * - The Business API surfaces hashtag-level trend data; sound-level and
 *   video-level signals need other licensed sources, which is exactly why
 *   the pipeline is written against SignalSource rather than any one API.
 * - Tokens are long-lived; store them as deployment secrets, never in the
 *   repository and never inlined into client bundles at build time.
 */
export class TikTokBusinessSource implements SignalSource {
  readonly name = "tiktok-business-api";

  constructor(private readonly accessToken: string) {
    if (!accessToken) {
      throw new Error(
        "TikTokBusinessSource requires an access token from an approved developer app",
      );
    }
  }

  async scan(): Promise<Anchor[]> {
    throw new Error(
      "Not wired in the portfolio build — run the demo with the mock source instead",
    );
  }

  async pull(_anchorId: string): Promise<Anchor> {
    throw new Error(
      "Not wired in the portfolio build — run the demo with the mock source instead",
    );
  }
}
