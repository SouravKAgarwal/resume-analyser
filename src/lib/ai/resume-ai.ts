import "server-only";

import { createHash } from "crypto";
import { generateJSON, AI_MODEL } from "@/lib/ai/client";
import { cached } from "@/lib/redis";
import {
  analysisResultSchema,
  jobMatchResultSchema,
  parsedResumeSchema,
  rewriteResultSchema,
  REWRITE_STYLES,
  type AnalysisResult,
  type JobMatchResult,
  type ParsedResume,
  type RewriteResult,
  type RewriteStyle,
} from "@/lib/schemas/resume";

export { AI_MODEL };

const hash = (s: string) => createHash("sha256").update(s).digest("hex").slice(0, 24);

const DAY = 60 * 60 * 24;

export async function parseResume(rawText: string): Promise<ParsedResume> {
  return cached(`parse:${hash(rawText)}`, 7 * DAY, () =>
    generateJSON({
      system:
        "You are an expert resume parser. Extract structured data from resume text exactly as written — do not invent information. Use null for missing fields and [] for missing lists.",
      prompt: `Parse this resume into JSON with this shape:
{
  "personal": {"name", "email", "phone", "location", "portfolio", "github", "linkedin"},
  "summary": string|null,
  "education": [{"institution", "degree", "field", "startDate", "endDate", "grade"}],
  "experience": [{"company", "title", "location", "startDate", "endDate", "bullets": [string]}],
  "projects": [{"name", "description", "technologies": [string], "bullets": [string], "link"}],
  "skills": [{"category": string, "items": [string]}],
  "certifications": [string],
  "achievements": [string],
  "languages": [string],
  "publications": [string],
  "volunteer": [string]
}

RESUME TEXT:
"""
${rawText}
"""`,
      schema: parsedResumeSchema,
    }),
  );
}

export async function analyzeResume(rawText: string): Promise<AnalysisResult> {
  return cached(`analysis:${hash(rawText)}:${AI_MODEL}`, 7 * DAY, () =>
    generateJSON({
      system: `You are a senior technical recruiter and ATS expert with 15 years of experience screening software engineering resumes. You give honest, specific, actionable feedback — never generic advice. Every score must be justified by concrete evidence from the resume. Be strict: an average resume scores 55-70, only exceptional resumes score above 85.`,
      prompt: `Analyze this resume thoroughly. Score each dimension 0-100 and explain WHY, citing specific lines from the resume. For every weakness give a concrete fix.

Return JSON with this exact shape:
{
  "overallScore": number,
  "verdict": "2-3 sentence honest overall assessment",
  "sections": {
    "ats": {"score", "explanation", "strengths": [], "weaknesses": [], "suggestions": []},
    "formatting": {...same shape},
    "grammar": {...},
    "readability": {...},
    "keywords": {...},
    "experience": {...},
    "projects": {...},
    "skills": {...},
    "impact": {...measurable achievements, metrics, quantification},
    "professionalism": {...tone, consistency, contact info, links}
  },
  "keywordAnalysis": {"strong": [], "weak": [], "overused": [], "missing": []},
  "topFixes": [{"priority": "high"|"medium"|"low", "issue": string, "fix": string}]
}

Evaluation criteria:
- ats: section ordering, standard headings, parseable structure, keyword density, length
- formatting: consistency, white space, bullet structure, dates alignment
- grammar: errors, spelling, passive voice, weak verbs, long sentences, repetition
- readability: scannability, sentence length, jargon balance
- keywords: programming languages, frameworks, cloud, databases, tools vs modern hiring trends
- experience: impact, ownership, metrics, action verbs, career progression
- projects: tech stack depth, complexity, business value, measurable outcomes
- skills: categorization, relevance, missing in-demand technologies
- impact: quantified achievements (numbers, %, scale)
- professionalism: contact info completeness, links, tone, consistency

Include 5-10 topFixes ordered by priority.

RESUME TEXT:
"""
${rawText}
"""`,
      schema: analysisResultSchema,
      maxTokens: 16384,
    }),
  );
}

export async function matchJobDescription(
  rawText: string,
  jobDescription: string,
): Promise<JobMatchResult> {
  return cached(
    `match:${hash(rawText)}:${hash(jobDescription)}`,
    7 * DAY,
    () =>
      generateJSON({
        system:
          "You are an expert technical recruiter who evaluates how well a candidate's resume matches a specific job description. Be precise and honest — base everything on evidence from both texts.",
        prompt: `Compare this resume against the job description.

Return JSON:
{
  "matchScore": number 0-100,
  "verdict": "2-3 sentence honest assessment of fit",
  "requiredSkills": [all skills/technologies the job requires],
  "matchedSkills": [required skills clearly present in the resume],
  "missingSkills": [required skills absent from the resume],
  "missingKeywords": [important JD keywords/phrases the resume should include],
  "recommendations": [5-8 specific changes to improve the match],
  "tailoredSummary": "a rewritten professional summary targeting this exact job"
}

JOB DESCRIPTION:
"""
${jobDescription.slice(0, 12_000)}
"""

RESUME TEXT:
"""
${rawText}
"""`,
        schema: jobMatchResultSchema,
        maxTokens: 8192,
      }),
  );
}

const SECTION_INSTRUCTIONS: Record<string, string> = {
  full: "Rewrite the entire resume: headline, summary, and every section (experience, projects, skills, education, achievements).",
  summary: "Rewrite only the professional headline and summary.",
  experience:
    "Rewrite only the work experience section — every role, every bullet.",
  projects: "Rewrite only the projects section — every project, every bullet.",
  skills:
    "Rewrite only the skills section — recategorize and reorder for maximum relevance.",
};

export async function rewriteResume(
  rawText: string,
  style: RewriteStyle,
  section: keyof typeof SECTION_INSTRUCTIONS,
): Promise<RewriteResult> {
  const styleLabel = REWRITE_STYLES[style];
  return cached(
    `rewrite:${hash(rawText)}:${style}:${section}`,
    7 * DAY,
    () =>
      generateJSON({
        system: `You are an elite resume writer specializing in software engineering resumes. You write ATS-friendly, achievement-oriented content: strong action verbs, quantified impact, no fluff, no first-person pronouns. Target style: "${styleLabel}". Never invent employers, dates, or credentials — but you may sharpen wording and reasonably infer metrics phrasing like "improving performance" only when the original implies it.`,
        prompt: `${SECTION_INSTRUCTIONS[section]}

Return JSON:
{
  "headline": "professional headline (or null if not applicable)",
  "summary": "rewritten summary (or null if not applicable)",
  "sections": [{"title": "section name", "content": ["rewritten line or bullet", ...]}],
  "notes": ["what you changed and why", ...]
}

ORIGINAL RESUME:
"""
${rawText}
"""`,
        schema: rewriteResultSchema,
        temperature: 0.4,
        maxTokens: 12288,
      }),
  );
}
