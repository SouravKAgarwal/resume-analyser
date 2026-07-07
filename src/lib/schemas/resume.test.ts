import { describe, it, expect } from "vitest";
import { rewriteResultSchema, structuredResumeSchema } from "@/lib/schemas/resume";

describe("rewriteResultSchema", () => {
  it("parses a full structured resume with notes", () => {
    const parsed = rewriteResultSchema.parse({
      resume: {
        personal: { name: "Ada Lovelace", email: "ada@example.com" },
        headline: "Full Stack Engineer",
        summary: "Builds things.",
        experience: [
          { company: "Acme", title: "Engineer", bullets: ["Shipped X"] },
        ],
        skills: [{ category: "Languages", items: ["TypeScript"] }],
      },
      notes: ["Quantified impact"],
    });
    expect(parsed.resume.personal.name).toBe("Ada Lovelace");
    expect(parsed.resume.headline).toBe("Full Stack Engineer");
    expect(parsed.resume.experience[0].bullets).toEqual(["Shipped X"]);
    expect(parsed.notes).toEqual(["Quantified impact"]);
  });

  it("defaults missing lists and notes", () => {
    const parsed = rewriteResultSchema.parse({
      resume: { personal: {} },
    });
    expect(parsed.resume.experience).toEqual([]);
    expect(parsed.resume.skills).toEqual([]);
    expect(parsed.notes).toEqual([]);
    expect(parsed.resume.headline).toBeUndefined();
  });

  it("structuredResumeSchema keeps personal contact fields", () => {
    const r = structuredResumeSchema.parse({
      personal: { name: "X", github: "gh/x" },
    });
    expect(r.personal.github).toBe("gh/x");
  });
});
