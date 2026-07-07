import { z } from "zod";

const str = z.string().nullish().transform((v) => v ?? undefined);

export const parsedResumeSchema = z.object({
  personal: z.object({
    name: str,
    email: str,
    phone: str,
    location: str,
    portfolio: str,
    github: str,
    linkedin: str,
  }),
  summary: str,
  education: z
    .array(
      z.object({
        institution: str,
        degree: str,
        field: str,
        startDate: str,
        endDate: str,
        grade: str,
      }),
    )
    .default([]),
  experience: z
    .array(
      z.object({
        company: str,
        title: str,
        location: str,
        startDate: str,
        endDate: str,
        bullets: z.array(z.string()).default([]),
      }),
    )
    .default([]),
  projects: z
    .array(
      z.object({
        name: str,
        description: str,
        technologies: z.array(z.string()).default([]),
        bullets: z.array(z.string()).default([]),
        link: str,
      }),
    )
    .default([]),
  skills: z
    .array(
      z.object({
        category: z.string(),
        items: z.array(z.string()).default([]),
      }),
    )
    .default([]),
  certifications: z.array(z.string()).default([]),
  achievements: z.array(z.string()).default([]),
  languages: z.array(z.string()).default([]),
  publications: z.array(z.string()).default([]),
  volunteer: z.array(z.string()).default([]),
});

export type ParsedResume = z.infer<typeof parsedResumeSchema>;

const sectionScoreSchema = z.object({
  score: z.number().min(0).max(100),
  explanation: z.string(),
  strengths: z.array(z.string()).default([]),
  weaknesses: z.array(z.string()).default([]),
  suggestions: z.array(z.string()).default([]),
});

export type SectionScore = z.infer<typeof sectionScoreSchema>;

export const analysisResultSchema = z.object({
  overallScore: z.number().min(0).max(100),
  verdict: z.string().describe("2-3 sentence overall assessment"),
  sections: z.object({
    ats: sectionScoreSchema,
    formatting: sectionScoreSchema,
    grammar: sectionScoreSchema,
    readability: sectionScoreSchema,
    keywords: sectionScoreSchema,
    experience: sectionScoreSchema,
    projects: sectionScoreSchema,
    skills: sectionScoreSchema,
    impact: sectionScoreSchema,
    professionalism: sectionScoreSchema,
  }),
  keywordAnalysis: z.object({
    strong: z.array(z.string()).default([]),
    weak: z.array(z.string()).default([]),
    overused: z.array(z.string()).default([]),
    missing: z.array(z.string()).default([]),
  }),
  topFixes: z
    .array(
      z.object({
        priority: z.enum(["high", "medium", "low"]),
        issue: z.string(),
        fix: z.string(),
      }),
    )
    .default([]),
});

export type AnalysisResult = z.infer<typeof analysisResultSchema>;

export const jobMatchResultSchema = z.object({
  matchScore: z.number().min(0).max(100),
  verdict: z.string(),
  requiredSkills: z.array(z.string()).default([]),
  matchedSkills: z.array(z.string()).default([]),
  missingSkills: z.array(z.string()).default([]),
  missingKeywords: z.array(z.string()).default([]),
  recommendations: z.array(z.string()).default([]),
  tailoredSummary: z
    .string()
    .describe("A resume summary rewritten to target this job"),
});

export type JobMatchResult = z.infer<typeof jobMatchResultSchema>;

export const structuredResumeSchema = parsedResumeSchema.extend({
  headline: z
    .string()
    .nullish()
    .transform((v) => v ?? undefined),
});

export type StructuredResume = z.infer<typeof structuredResumeSchema>;

export const rewriteResultSchema = z.object({
  resume: structuredResumeSchema,
  notes: z.array(z.string()).default([]),
});

export type RewriteResult = z.infer<typeof rewriteResultSchema>;

export const REWRITE_STYLES = {
  ats: "ATS Optimized",
  frontend: "Frontend Developer",
  backend: "Backend Developer",
  fullstack: "Full Stack Developer",
  swe: "Software Engineer",
  startup: "Startup",
  enterprise: "Enterprise",
  internship: "Internship",
  senior: "Senior Engineer",
} as const;

export type RewriteStyle = keyof typeof REWRITE_STYLES;
