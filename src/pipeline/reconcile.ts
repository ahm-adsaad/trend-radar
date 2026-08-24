import type { Stage } from "../types.js";

/**
 * Cross-anchor stage reconciliation.
 *
 * A topic-level trend aggregates several anchors, and topic-level heuristics
 * can read "rising" while the topic's own anchor evidence reads cooling or
 * evergreen. When the two disagree, the anchor evidence wins — but only
 * downward:
 *
 * - refutation DEMOTES (rising → peaking), it never discards the trend;
 * - anchor evidence never PROMOTES a topic (a hot sound does not prove the
 *   topic built on it is hot);
 * - the reconciled stage records which anchor's evidence decided it
 *   (`stageWitness`), so the demotion is auditable on the surface.
 */

export interface ReconcileResult {
  stage: Stage;
  stageWitness: string | null;
}

export function reconcileStage(
  topicStage: Stage,
  anchorStages: Array<{ anchorId: string; stage: Stage }>,
): ReconcileResult {
  if (topicStage !== "rising") {
    return { stage: topicStage, stageWitness: null };
  }
  const refuter = anchorStages.find(
    (a) => a.stage === "cooling" || a.stage === "evergreen",
  );
  if (refuter) {
    return { stage: "peaking", stageWitness: refuter.anchorId };
  }
  return { stage: "rising", stageWitness: null };
}
