import type { AnalysisResult } from "@/lib/schemas/resume";

/** Flattens an analysis into a prompt-ready list of concrete issues to fix. */
export function formatFixes(analysis: AnalysisResult | null): string {
  if (!analysis) return "No prior analysis available — apply general best practices.";

  const fixes = analysis.topFixes.map(
    (f) => `- [${f.priority}] ${f.issue} → ${f.fix}`,
  );
  const weaknesses = Object.entries(analysis.sections).flatMap(([name, s]) =>
    s.weaknesses.map((w) => `- (${name}) ${w}`),
  );

  const all = [...fixes, ...weaknesses];
  return all.length ? all.join("\n") : "No specific issues flagged.";
}
