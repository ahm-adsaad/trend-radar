import { test } from "node:test";
import assert from "node:assert/strict";

import { MockSource } from "../src/sources/mock.js";
import { momentum, viewsPerWeek } from "../src/pipeline/momentum.js";
import { stageOf } from "../src/pipeline/lifecycle.js";
import { dispersion } from "../src/pipeline/dispersion.js";
import { decideCarry } from "../src/pipeline/carry.js";
import { reconcileStage } from "../src/pipeline/reconcile.js";
import { validateJudgment } from "../src/judgment/boundary.js";
import { renderFigure } from "../src/publish/board.js";

const anchors = await new MockSource().scan();
const byId = new Map(anchors.map((a) => [a.id, a]));

test("capped pulls use the observation counter, not the series", () => {
  const capped = byId.get("demo-sound-capped")!;
  const m = momentum(capped);
  assert.equal(m.basis, "counter");
  assert.ok(m.value !== null && m.value > 0, "counter delta should read positive");
  // and the series-only figures refuse to speak rather than lie
  assert.equal(viewsPerWeek(capped).basis, "unavailable");
});

test("stages: riser rises, evergreen never reads cooling", () => {
  assert.equal(stageOf(byId.get("demo-sound-riser")!), "rising");
  assert.equal(stageOf(byId.get("demo-sound-evergreen")!), "evergreen");
  assert.equal(stageOf(byId.get("demo-sound-peaker")!), "peaking");
});

test("dispersion refuses a verdict on thin samples", () => {
  const thin = { ...byId.get("demo-sound-riser")!, creators: [] };
  assert.equal(dispersion(thin).verdict, "insufficient-data");
});

test("carried cards never claim rising; flat-twice retires", () => {
  const kept = decideCarry(
    { key: "t", stage: "rising", flatRuns: 0, carriedRuns: 1 },
    false,
  );
  assert.deepEqual(kept, { keep: true, carried: true, stage: "peaking" });

  const retired = decideCarry(
    { key: "t", stage: "peaking", flatRuns: 2, carriedRuns: 1 },
    false,
  );
  assert.deepEqual(retired, { keep: false, reason: "flat-twice" });
});

test("reconciliation demotes rising on a cooling anchor, never promotes", () => {
  const demoted = reconcileStage("rising", [{ anchorId: "a1", stage: "cooling" }]);
  assert.deepEqual(demoted, { stage: "peaking", stageWitness: "a1" });

  const untouched = reconcileStage("cooling", [{ anchorId: "a1", stage: "rising" }]);
  assert.deepEqual(untouched, { stage: "cooling", stageWitness: null });
});

test("judgment boundary rejects off-schema output", () => {
  assert.throws(() => validateJudgment({ name: "x", mechanic: "y", brandFit: "definitely!" }));
  assert.throws(() => validateJudgment("just prose"));
});

test("unknown renders as em dash, never zero", () => {
  assert.equal(renderFigure({ value: null, basis: "unavailable" }), "—");
});
