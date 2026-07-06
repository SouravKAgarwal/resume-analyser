"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { detectFileType, extractResumeText } from "@/lib/parsing/extract-text";
import {
  analyzeResume,
  matchJobDescription,
  parseResume,
  rewriteResume,
  AI_MODEL,
} from "@/lib/ai/resume-ai";
import { REWRITE_STYLES, type RewriteStyle } from "@/lib/schemas/resume";

type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string };

function fail(e: unknown): { ok: false; error: string } {
  const message =
    e instanceof Error ? e.message : "Something went wrong. Please try again.";
  console.error("[action]", e);
  return { ok: false, error: message };
}

const processUploadSchema = z.object({
  fileUrl: z.string().url(),
  fileKey: z.string().min(1),
  fileName: z.string().min(1).max(255),
  fileSize: z.number().int().positive().max(8 * 1024 * 1024),
  fileMime: z.string().optional(),
});

/**
 * Called after UploadThing finishes uploading. Downloads the file,
 * extracts text, parses it with AI, and stores the resume.
 */
export async function processUpload(
  input: z.infer<typeof processUploadSchema>,
): Promise<ActionResult<{ resumeId: string }>> {
  try {
    const user = await requireUser();
    const parsed = processUploadSchema.parse(input);

    const fileType = detectFileType(parsed.fileName, parsed.fileMime);
    if (!fileType) {
      return { ok: false, error: "Only PDF and DOCX files are supported." };
    }

    const rawText = await extractResumeText(parsed.fileUrl, fileType);
    const structured = await parseResume(rawText).catch(() => null);

    const count = await prisma.resume.count({ where: { userId: user.id } });
    const resume = await prisma.resume.create({
      data: {
        userId: user.id,
        title: parsed.fileName.replace(/\.(pdf|docx)$/i, ""),
        fileName: parsed.fileName,
        fileUrl: parsed.fileUrl,
        fileKey: parsed.fileKey,
        fileType,
        fileSize: parsed.fileSize,
        rawText,
        parsed: structured ?? undefined,
        version: count + 1,
      },
    });

    revalidatePath("/dashboard");
    revalidatePath("/resumes");
    return { ok: true, data: { resumeId: resume.id } };
  } catch (e) {
    return fail(e);
  }
}

/** Runs the full AI analysis for a resume and stores the result. */
export async function runAnalysis(
  resumeId: string,
): Promise<ActionResult<{ analysisId: string }>> {
  try {
    const user = await requireUser();
    const resume = await prisma.resume.findFirst({
      where: { id: resumeId, userId: user.id },
    });
    if (!resume) return { ok: false, error: "Resume not found." };

    const result = await analyzeResume(resume.rawText);
    const analysis = await prisma.analysis.create({
      data: {
        resumeId: resume.id,
        userId: user.id,
        overallScore: Math.round(result.overallScore),
        result,
        model: AI_MODEL,
      },
    });

    revalidatePath("/dashboard");
    revalidatePath(`/resumes/${resume.id}`);
    return { ok: true, data: { analysisId: analysis.id } };
  } catch (e) {
    return fail(e);
  }
}

const jobMatchSchema = z.object({
  resumeId: z.string().min(1),
  title: z.string().min(2).max(200),
  company: z.string().max(200).optional(),
  content: z.string().min(50).max(20_000),
});

/** Matches a resume against a pasted job description. */
export async function runJobMatch(
  input: z.infer<typeof jobMatchSchema>,
): Promise<ActionResult<{ matchId: string }>> {
  try {
    const user = await requireUser();
    const parsed = jobMatchSchema.parse(input);

    const resume = await prisma.resume.findFirst({
      where: { id: parsed.resumeId, userId: user.id },
    });
    if (!resume) return { ok: false, error: "Resume not found." };

    const result = await matchJobDescription(resume.rawText, parsed.content);

    const jd = await prisma.jobDescription.create({
      data: {
        userId: user.id,
        title: parsed.title,
        company: parsed.company,
        content: parsed.content,
        extracted: { requiredSkills: result.requiredSkills },
      },
    });
    const match = await prisma.jobMatch.create({
      data: {
        resumeId: resume.id,
        jobDescriptionId: jd.id,
        userId: user.id,
        matchScore: Math.round(result.matchScore),
        result,
      },
    });

    revalidatePath("/dashboard");
    revalidatePath(`/resumes/${resume.id}`);
    return { ok: true, data: { matchId: match.id } };
  } catch (e) {
    return fail(e);
  }
}

const rewriteSchema = z.object({
  resumeId: z.string().min(1),
  style: z.enum(Object.keys(REWRITE_STYLES) as [RewriteStyle, ...RewriteStyle[]]),
  section: z.enum(["full", "summary", "experience", "projects", "skills"]),
});

/** Generates an AI rewrite of a resume section in a chosen style. */
export async function runRewrite(
  input: z.infer<typeof rewriteSchema>,
): Promise<ActionResult<{ rewriteId: string }>> {
  try {
    const user = await requireUser();
    const parsed = rewriteSchema.parse(input);

    const resume = await prisma.resume.findFirst({
      where: { id: parsed.resumeId, userId: user.id },
    });
    if (!resume) return { ok: false, error: "Resume not found." };

    const result = await rewriteResume(
      resume.rawText,
      parsed.style,
      parsed.section,
    );
    const rewrite = await prisma.rewrite.create({
      data: {
        resumeId: resume.id,
        userId: user.id,
        style: parsed.style,
        section: parsed.section,
        content: result,
      },
    });

    revalidatePath(`/resumes/${resume.id}`);
    return { ok: true, data: { rewriteId: rewrite.id } };
  } catch (e) {
    return fail(e);
  }
}

/** Deletes a resume and all dependent records (cascade). */
export async function deleteResume(resumeId: string): Promise<void> {
  const user = await requireUser();
  await prisma.resume.deleteMany({
    where: { id: resumeId, userId: user.id },
  });
  revalidatePath("/dashboard");
  revalidatePath("/resumes");
  redirect("/resumes");
}
