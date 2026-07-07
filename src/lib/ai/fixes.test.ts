import { describe, it, expect } from "vitest";
import { formatFixes } from "@/lib/ai/fixes";
import type { AnalysisResult } from "@/lib/schemas/resume";

const base = {
  score: 60,
  explanation: "",
  strengths: [],
  weaknesses: [],
  suggestions: [],
};

const analysis = {
  overallScore: 62,
  verdict: "",
  sections: {
    ats: { ...base, weaknesses: ["No standard headings"] },
    formatting: base,
    grammar: base,
    readability: base,
    keywords: base,
    experience: { ...base, weaknesses: ["Bullets lack metrics"] },
    projects: base,
    skills: base,
    impact: base,
    professionalism: base,
  },
  keywordAnalysis: { strong: [], weak: [], overused: [], missing: [] },
  topFixes: [
    { priority: "high", issue: "No metrics", fix: "Add numbers to bullets" },
  ],
} as unknown as AnalysisResult;

describe("formatFixes", () => {
  it("lists topFixes and section weaknesses", () => {
    const text = formatFixes(analysis);
    expect(text).toContain("No metrics");
    expect(text).toContain("Add numbers to bullets");
    expect(text).toContain("Bullets lack metrics");
    expect(text).toContain("No standard headings");
  });

  it("handles a null analysis", () => {
    expect(formatFixes(null)).toMatch(/no prior analysis/i);
  });
});
