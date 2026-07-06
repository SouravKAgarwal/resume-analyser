import "server-only";

import mammoth from "mammoth";
import { extractText, getDocumentProxy } from "unpdf";

export type ResumeFileType = "pdf" | "docx";

const MAX_CHARS = 60_000;

export function detectFileType(fileName: string, mime?: string): ResumeFileType | null {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".pdf") || mime === "application/pdf") return "pdf";
  if (
    lower.endsWith(".docx") ||
    mime ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    return "docx";
  }
  return null;
}

/** Downloads the uploaded file and extracts plain text from it. */
export async function extractResumeText(
  fileUrl: string,
  fileType: ResumeFileType,
): Promise<string> {
  const res = await fetch(fileUrl);
  if (!res.ok) {
    throw new Error(`Failed to download resume file (${res.status})`);
  }
  const buffer = await res.arrayBuffer();

  let text: string;
  if (fileType === "pdf") {
    const pdf = await getDocumentProxy(new Uint8Array(buffer));
    const result = await extractText(pdf, { mergePages: true });
    text = result.text;
  } else {
    const result = await mammoth.extractRawText({
      buffer: Buffer.from(buffer),
    });
    text = result.value;
  }

  const normalized = text.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  if (normalized.length < 100) {
    throw new Error(
      "Could not extract enough text from this file. If it is a scanned document, please upload a text-based PDF or DOCX.",
    );
  }
  return normalized.slice(0, MAX_CHARS);
}
