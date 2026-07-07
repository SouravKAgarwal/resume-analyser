"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { dashboardTag, resumesTag } from "@/features/resumes/queries";
import { utapi } from "@/lib/uploadthing-server";
import { UTFile } from "uploadthing/server";
import { detectFileType, extractResumeText } from "@/lib/parsing/extract-text";
import {
  renderResumePdf,
  renderResumeText,
  renderResumeDocx,
} from "@/lib/export/render-resume";
import {
  analyzeResume,
  matchJobDescription,
  parseResume,
  rewriteResume,
  AI_MODEL,
} from "@/lib/ai/resume-ai";
import {
  REWRITE_STYLES,
  type RewriteStyle,
  type StructuredResume,
  type AnalysisResult,
} from "@/lib/schemas/resume";

type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string };

function fail(e: unknown): { ok: false; error: string } {
  const message =
    e instanceof Error ? e.message : "Something went wrong. Please try again.";
  console.error("[action]", e);
  return { ok: false, error: message };
}

// Only accept URLs served by UploadThing — the server fetches this URL, so an
// unrestricted value would be an SSRF vector.
const isUploadThingUrl = (u: string) => {
  try {
    const { protocol, hostname } = new URL(u);
    return (
      protocol === "https:" &&
      (hostname === "utfs.io" || hostname.endsWith(".ufs.sh"))
    );
  } catch {
    return false;
  }
};

const processUploadSchema = z.object({
  fileUrl: z.string().url().refine(isUploadThingUrl, "Unrecognized file host."),
  fileKey: z.string().min(1).max(255),
  fileName: z.string().min(1).max(255),
  fileSize: z
    .number()
    .int()
    .positive()
    .max(8 * 1024 * 1024),
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

    revalidateTag(dashboardTag(user.id), "minutes");
    revalidateTag(resumesTag(user.id), "minutes");
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

    revalidateTag(dashboardTag(user.id), "minutes");
    revalidateTag(resumesTag(user.id), "minutes");
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

    revalidateTag(dashboardTag(user.id), "minutes");
    revalidatePath("/dashboard");
    revalidatePath(`/resumes/${resume.id}`);
    return { ok: true, data: { matchId: match.id } };
  } catch (e) {
    return fail(e);
  }
}

const rewriteSchema = z.object({
  resumeId: z.string().min(1),
  style: z.enum(
    Object.keys(REWRITE_STYLES) as [RewriteStyle, ...RewriteStyle[]],
  ),
  focus: z.enum(["full", "summary", "experience", "projects", "skills"]),
});

/**
 * Generates a rewrite and commits it as a new child resume (a branch of the
 * source), then runs analysis on the branch so the improved score is visible.
 */
export async function runRewrite(
  input: z.infer<typeof rewriteSchema>,
): Promise<ActionResult<{ resumeId: string }>> {
  try {
    const user = await requireUser();
    const parsed = rewriteSchema.parse(input);

    const resume = await prisma.resume.findFirst({
      where: { id: parsed.resumeId, userId: user.id },
    });
    if (!resume) return { ok: false, error: "Resume not found." };

    const latestAnalysis = await prisma.analysis.findFirst({
      where: { resumeId: resume.id, userId: user.id },
      orderBy: { createdAt: "desc" },
      select: { result: true },
    });

    const source = (resume.parsed as StructuredResume | null) ?? resume.rawText;
    const { resume: structured, notes } = await rewriteResume(
      source,
      parsed.style,
      parsed.focus,
      (latestAnalysis?.result as AnalysisResult) ?? null,
    );

    // Render + store the branch's PDF so it downloads and re-extracts like any resume.
    const pdfBytes = await renderResumePdf(structured);
    const styleLabel = REWRITE_STYLES[parsed.style];
    const baseName = `${resume.title} - ${styleLabel}`.slice(0, 90);
    const file = new UTFile([pdfBytes as unknown as BlobPart], `${baseName}.pdf`, {
      type: "application/pdf",
    });
    const uploaded = await utapi.uploadFiles(file);
    if (uploaded.error || !uploaded.data) {
      return { ok: false, error: "Could not store the rewritten resume file." };
    }

    const rawText = renderResumeText(structured);

    const child = await prisma.resume.create({
      data: {
        userId: user.id,
        title: baseName,
        fileName: `${baseName}.pdf`,
        fileUrl: uploaded.data.ufsUrl,
        fileKey: uploaded.data.key,
        fileType: "pdf",
        fileSize: pdfBytes.byteLength,
        rawText,
        parsed: structured,
        version: resume.version + 1,
        parentId: resume.id,
        source: "rewrite",
      },
    });

    await prisma.rewrite.create({
      data: {
        resumeId: resume.id,
        userId: user.id,
        style: parsed.style,
        section: parsed.focus,
        content: { notes },
        childResumeId: child.id,
      },
    });

    // Auto-analyze the branch once so the user immediately sees its score.
    try {
      const analysisResult = await analyzeResume(child.rawText);
      await prisma.analysis.create({
        data: {
          resumeId: child.id,
          userId: user.id,
          overallScore: Math.round(analysisResult.overallScore),
          result: analysisResult,
          model: AI_MODEL,
        },
      });
    } catch (e) {
      console.error("[runRewrite] auto-analysis failed", e);
      // Non-fatal: the branch still exists and can be analyzed manually.
    }

    revalidateTag(dashboardTag(user.id), "minutes");
    revalidateTag(resumesTag(user.id), "minutes");
    revalidatePath("/dashboard");
    revalidatePath("/resumes");
    revalidatePath(`/resumes/${resume.id}`);
    revalidatePath(`/resumes/${child.id}`);
    return { ok: true, data: { resumeId: child.id } };
  } catch (e) {
    return fail(e);
  }
}

/** Mints a short-lived signed URL to download the user's original uploaded file. */
export async function getOriginalResumeUrl(
  resumeId: string,
): Promise<ActionResult<{ url: string }>> {
  try {
    const user = await requireUser();
    const resume = await prisma.resume.findFirst({
      where: { id: resumeId, userId: user.id },
      select: { fileKey: true },
    });
    if (!resume) return { ok: false, error: "Resume not found." };
    if (!resume.fileKey)
      return { ok: false, error: "No stored file for this resume." };

    const res = await utapi.getSignedURL(resume.fileKey, {
      expiresIn: 60 * 60,
    });
    const url =
      (res as { ufsUrl?: string; url?: string }).ufsUrl ??
      (res as { url?: string }).url;
    if (!url) return { ok: false, error: "Could not create a download link." };
    return { ok: true, data: { url } };
  } catch (e) {
    return fail(e);
  }
}

/** Renders the resume's stored structured data to a DOCX on demand. */
export async function downloadResumeDocx(
  resumeId: string,
): Promise<ActionResult<{ fileName: string; base64: string }>> {
  try {
    const user = await requireUser();
    const resume = await prisma.resume.findFirst({
      where: { id: resumeId, userId: user.id },
      select: { title: true, parsed: true },
    });
    if (!resume) return { ok: false, error: "Resume not found." };
    if (!resume.parsed)
      return {
        ok: false,
        error: "This resume has no structured data to export.",
      };

    const bytes = await renderResumeDocx(resume.parsed as StructuredResume);
    const base64 = Buffer.from(bytes).toString("base64");
    const fileName = `${resume.title}.docx`.replace(/[^\w.\- ]+/g, "_");
    return { ok: true, data: { fileName, base64 } };
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
  revalidateTag(dashboardTag(user.id), "minutes");
  revalidateTag(resumesTag(user.id), "minutes");
  revalidatePath("/dashboard");
  revalidatePath("/resumes");
  redirect("/resumes");
}
