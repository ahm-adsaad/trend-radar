import type { SignalSource } from "./types.js";
import type { Anchor, SeriesPoint } from "../types.js";

/**
 * Synthetic signal source. Generates deterministic, obviously-fake demo data
 * (seeded PRNG, `demo-sound-*` IDs) covering the archetypes the pipeline has
 * to handle:
 *
 *  - a riser: steep, accelerating adoption
 *  - a peaker: growth flattening after a spike
 *  - an evergreen: huge, old, flat
 *  - a capped pull: the source truncates its slice, so naive share metrics lie
 *
 * Nothing here is real platform data.
 */

/** Small deterministic PRNG (mulberry32) so demo output is reproducible. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function isoDay(daysAgo: number): string {
  const d = new Date(Date.UTC(2026, 0, 30));
  d.setUTCDate(d.getUTCDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

interface Archetype {
  id: string;
  title: string;
  startViews: number;
  /** day-over-day view growth for each of the last 8 days, oldest first */
  growthPct: number[];
  capped: boolean;
  creators: number;
  topCreatorVideos: number;
  observedVideos: number;
  observedVideosPrev: number | null;
}

const ARCHETYPES: Archetype[] = [
  {
    id: "demo-sound-riser",
    title: "Synthetic Riser (demo)",
    startViews: 2_000_000,
    growthPct: [4, 6, 9, 13, 18, 24, 31, 38],
    capped: false,
    creators: 240,
    topCreatorVideos: 9,
    observedVideos: 3_400,
    observedVideosPrev: 2_150,
  },
  {
    id: "demo-sound-peaker",
    title: "Synthetic Peaker (demo)",
    startViews: 80_000_000,
    growthPct: [22, 17, 11, 6, 3, 1.5, 1, 0.8],
    capped: false,
    creators: 1_900,
    topCreatorVideos: 12,
    observedVideos: 41_000,
    observedVideosPrev: 40_600,
  },
  {
    id: "demo-sound-evergreen",
    title: "Synthetic Evergreen (demo)",
    startViews: 900_000_000,
    growthPct: [0.4, 0.3, 0.4, 0.3, 0.3, 0.4, 0.3, 0.3],
    capped: false,
    creators: 5_200,
    topCreatorVideos: 20,
    observedVideos: 210_000,
    observedVideosPrev: 209_400,
  },
  {
    id: "demo-sound-capped",
    title: "Synthetic Capped Pull (demo)",
    startViews: 12_000_000,
    // the source truncates: reported series is flat noise, useless
    growthPct: [0, 0.1, 0, 0.1, 0, 0, 0.1, 0],
    capped: true,
    creators: 60,
    topCreatorVideos: 4,
    observedVideos: 5_800,
    observedVideosPrev: 4_700,
  },
];

function buildAnchor(a: Archetype, rand: () => number): Anchor {
  const series: SeriesPoint[] = [];
  let views = a.startViews;
  for (let i = 0; i < a.growthPct.length; i++) {
    const g = a.growthPct[i]!;
    views = Math.round(views * (1 + g / 100));
    series.push({
      date: isoDay(a.growthPct.length - 1 - i),
      views: a.capped ? null : views,
      videos: a.capped ? null : Math.round(views / 4_000),
      capped: a.capped,
    });
  }
  const creators = Array.from({ length: a.creators }, (_, i) => ({
    creatorId: `demo-creator-${a.id}-${i}`,
    videoCount: i === 0 ? a.topCreatorVideos : 1 + Math.floor(rand() * 2),
  }));
  return {
    id: a.id,
    title: a.title,
    series,
    creators,
    observedVideos: a.observedVideos,
    observedVideosPrev: a.observedVideosPrev,
  };
}

export class MockSource implements SignalSource {
  readonly name = "synthetic-demo";
  private readonly rand: () => number;

  constructor(seed = 42) {
    this.rand = mulberry32(seed);
  }

  async scan(): Promise<Anchor[]> {
    return ARCHETYPES.map((a) => buildAnchor(a, this.rand));
  }

  async pull(anchorId: string): Promise<Anchor> {
    const a = ARCHETYPES.find((x) => x.id === anchorId);
    if (!a) throw new Error(`unknown demo anchor: ${anchorId}`);
    return buildAnchor(a, this.rand);
  }
}
