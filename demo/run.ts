/**
 * End-to-end demo on synthetic data only.
 *
 *   npm run demo
 *
 * Wires: MockSource → momentum/lifecycle/dispersion → judgment boundary →
 * rendered board. No credentials, no network, no real platform data.
 */
import { MockSource } from "../src/sources/mock.js";
import { momentum, viewsPerWeek } from "../src/pipeline/momentum.js";
import { stageOf } from "../src/pipeline/lifecycle.js";
import { dispersion } from "../src/pipeline/dispersion.js";
import { reconcileStage } from "../src/pipeline/reconcile.js";
import { MockJudge, validateJudgment, type BrandProfile } from "../src/judgment/boundary.js";
import { renderBoard } from "../src/publish/board.js";
import type { Trend } from "../src/types.js";

const profile: BrandProfile = {
  voice: "warm, understated, product-agnostic (demo profile)",
  barredCategories: ["gambling", "tobacco"],
  region: "configurable-per-deployment",
};

const source = new MockSource();
const judge = new MockJudge();

const anchors = await source.scan();
const trends: Trend[] = [];

for (const anchor of anchors) {
  const judgment = validateJudgment(await judge.judge(anchor.title, profile));
  const stage = stageOf(anchor);
  // Demo: each trend has one anchor, so reconciliation is a pass-through;
  // with multi-anchor topics it demotes unsupported "rising" claims.
  const reconciled = reconcileStage(stage, [{ anchorId: anchor.id, stage }]);
  trends.push({
    key: anchor.id,
    name: judgment.name,
    anchorIds: [anchor.id],
    stage: reconciled.stage,
    momentumPerDayPct: momentum(anchor),
    viewsPerWeek: viewsPerWeek(anchor),
    dispersion: dispersion(anchor),
    stageWitness: reconciled.stageWitness,
  });
}

console.log("trend-radar demo board (synthetic data)\n");
console.log(renderBoard(trends));
console.log(
  "\nNote the capped-pull row: its series is unusable, so momentum comes from",
);
console.log(
  "the cross-run observation counter and is labeled [counter]; nothing is invented.",
);
