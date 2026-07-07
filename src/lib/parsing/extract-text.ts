import "server-only";

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

/**
 * Sniffs the real type from the leading bytes — the name/MIME can lie.
 * PDF starts with "%PDF"; DOCX is a ZIP container starting with "PK\x03\x04".
 */
export function sniffFileType(bytes: Uint8Array): ResumeFileType | null {
  if (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) {
    return "pdf";
  }
  if (bytes[0] === 0x50 && bytes[1] === 0x4b && (bytes[2] === 0x03 || bytes[2] === 0x05 || bytes[2] === 0x07)) {
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
  if (buffer.byteLength > 8 * 1024 * 1024) {
    throw new Error("File is too large. The limit is 8 MB.");
  }

  // Verify the real bytes match the declared type before parsing.
  const sniffed = sniffFileType(new Uint8Array(buffer.slice(0, 8)));
  if (sniffed !== fileType) {
    throw new Error(
      "This file's contents don't match its extension. Upload a genuine PDF or DOCX.",
    );
  }

  // Parsers are heavy and each only handles one format — load on demand so
  // they never weigh on unrelated server code paths.
  let text: string;
  if (fileType === "pdf") {
    const { extractText, getDocumentProxy } = await import("unpdf");
    const pdf = await getDocumentProxy(new Uint8Array(buffer));
    const result = await extractText(pdf, { mergePages: true });
    text = result.text;
  } else {
    const { default: mammoth } = await import("mammoth");
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
