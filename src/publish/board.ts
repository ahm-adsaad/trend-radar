import type { Figure, Trend } from "../types.js";

/**
 * Publishing layer: turn pipeline output into rendered board rows.
 *
 * The honesty rules concentrate here:
 * - unknown renders "—", never 0, never a fabricated number;
 * - every figure prints alongside its basis so the reader knows which
 *   instrument produced it (measured series vs observation counter);
 * - carried cards are labeled carried; nothing pretends to be fresher than
 *   its evidence.
 */

export function renderFigure(f: Figure, unit = ""): string {
  if (f.value === null || f.basis === "unavailable") return "—";
  const tag = f.basis === "measured" ? "" : ` [${f.basis}]`;
  return `${formatNumber(f.value)}${unit}${tag}`;
}

export function formatNumber(n: number): string {
  if (Math.abs(n) >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return `${n}`;
}

export interface BoardRow {
  name: string;
  stage: string;
  momentum: string;
  viewsPerWeek: string;
  dispersion: string;
  witness: string;
}

export function toBoardRow(t: Trend): BoardRow {
  return {
    name: t.name,
    stage: t.stage,
    momentum: renderFigure(t.momentumPerDayPct, "%/day"),
    viewsPerWeek: renderFigure(t.viewsPerWeek, " views/wk"),
    dispersion:
      t.dispersion.verdict === "insufficient-data"
        ? "—"
        : `${t.dispersion.verdict} (${t.dispersion.uniqueCreators} creators)`,
    witness: t.stageWitness ?? "",
  };
}

export function renderBoard(trends: Trend[]): string {
  const rows = trends.map(toBoardRow);
  const headers = ["Trend", "Stage", "Momentum", "Views/wk", "Creator breadth", "Stage witness"];
  const table = [
    headers,
    ...rows.map((r) => [r.name, r.stage, r.momentum, r.viewsPerWeek, r.dispersion, r.witness]),
  ];
  const widths = headers.map((_, c) => Math.max(...table.map((row) => row[c]!.length)));
  return table
    .map((row, i) => {
      const line = row.map((cell, c) => cell.padEnd(widths[c]!)).join("  ");
      return i === 0 ? `${line}\n${widths.map((w) => "-".repeat(w)).join("  ")}` : line;
    })
    .join("\n");
}
