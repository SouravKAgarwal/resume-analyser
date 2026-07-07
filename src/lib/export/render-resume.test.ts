import { describe, it, expect } from "vitest";
import { renderResumeText } from "@/lib/export/render-resume";
import { structuredResumeSchema } from "@/lib/schemas/resume";

const sample = structuredResumeSchema.parse({
  personal: {
    name: "Ada Lovelace",
    email: "ada@example.com",
    phone: "555-0100",
    github: "github.com/ada",
  },
  headline: "Full Stack Engineer",
  summary: "Builds reliable web systems.",
  experience: [
    {
      company: "Acme",
      title: "Senior Engineer",
      startDate: "2021",
      endDate: "Present",
      bullets: ["Cut latency 40%", "Led a team of 4"],
    },
  ],
  skills: [{ category: "Languages", items: ["TypeScript", "Python"] }],
  education: [{ institution: "MIT", degree: "BSc", field: "CS" }],
});

describe("renderResumeText", () => {
  it("puts name, headline and contact on the first lines", () => {
    const text = renderResumeText(sample);
    const lines = text.split("\n");
    expect(lines[0]).toBe("Ada Lovelace");
    expect(lines[1]).toBe("Full Stack Engineer");
    expect(lines[2]).toContain("ada@example.com");
    expect(lines[2]).toContain("github.com/ada");
  });

  it("renders experience with bullets and skills as category lines", () => {
    const text = renderResumeText(sample);
    expect(text).toContain("EXPERIENCE");
    expect(text).toContain("Senior Engineer — Acme");
    expect(text).toContain("- Cut latency 40%");
    expect(text).toContain("Languages: TypeScript, Python");
  });

  it("omits empty sections and collapses blank runs", () => {
    const text = renderResumeText(
      structuredResumeSchema.parse({ personal: { name: "X" } }),
    );
    expect(text).not.toContain("EXPERIENCE");
    expect(text).not.toMatch(/\n{3,}/);
  });
});
