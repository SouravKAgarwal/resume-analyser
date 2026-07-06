"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UploadDropzone } from "@/lib/uploadthing";
import { processUpload } from "@/features/resumes/actions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";

const SPECS = ["PDF", "DOCX", "≤ 8 MB", "1 file"];

/** Drafting glyph: a document sliding into an intake tray. Matches GaugeMark. */
function IntakeGlyph({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 13V3" />
      <path d="M8.5 6.5 12 3l3.5 3.5" />
      <path d="M4 14v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4" />
    </svg>
  );
}

export function ResumeUploader() {
  const router = useRouter();
  const [processing, setProcessing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="border-border bg-card overflow-hidden rounded-lg border">
      {/* header strip */}
      <div className="border-border flex items-center justify-between border-b px-4 py-2.5">
        <span className="label-mono">Upload specimen</span>
        <span className="label-mono">Intake</span>
      </div>

      {uploading ? (
        /* upload state — network transfer, determinate progress bar */
        <div className="graph-grid flex min-h-64 flex-col items-center justify-center gap-5 px-6 py-14 text-center">
          <span className="border-border bg-card text-foreground flex size-14 items-center justify-center rounded-full border">
            <IntakeGlyph className="size-6" />
          </span>
          <div className="space-y-1">
            <p className="font-display text-lg font-semibold">Uploading…</p>
            <p className="text-muted-foreground max-w-xs truncate text-sm">
              {fileName}
            </p>
          </div>
          <div className="w-full max-w-xs space-y-1.5">
            <div
              className="bg-secondary relative h-2 overflow-hidden rounded-[2px]"
              role="progressbar"
              aria-valuenow={Math.round(progress)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Upload progress"
            >
              <div
                className="bg-primary h-full rounded-[2px] transition-[width] duration-200 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="label-mono block text-right tabular-nums">
              {Math.round(progress)}%
            </span>
          </div>
        </div>
      ) : processing ? (
        /* reading state — same frame, live readout */
        <div className="graph-grid flex min-h-64 flex-col items-center justify-center gap-4 px-6 py-14 text-center">
          <span className="border-border bg-card text-foreground flex size-14 items-center justify-center rounded-full border">
            <Loader2 className="size-6 animate-spin" aria-hidden />
          </span>
          <div className="space-y-1">
            <p className="font-display text-lg font-semibold">
              Reading your resume…
            </p>
            <p className="text-muted-foreground mx-auto max-w-xs text-sm leading-relaxed">
              Extracting the text and rebuilding its structure. Takes a few
              seconds.
            </p>
          </div>
        </div>
      ) : (
        <UploadDropzone
          endpoint="resumeUploader"
          onBeforeUploadBegin={(files) => {
            setError(null);
            setFileName(files[0]?.name ?? null);
            setProgress(0);
            setUploading(true);
            return files;
          }}
          onUploadProgress={(p) => setProgress(p)}
          onClientUploadComplete={async (files) => {
            const file = files[0];
            if (!file) {
              setUploading(false);
              return;
            }
            setUploading(false);
            setProcessing(true);
            const result = await processUpload({
              fileUrl: file.ufsUrl,
              fileKey: file.key,
              fileName: file.name,
              fileSize: file.size,
              fileMime: file.type,
            });
            if (result.ok) {
              router.push(`/resumes/${result.data.resumeId}`);
            } else {
              setProcessing(false);
              setError(result.error);
            }
          }}
          onUploadError={(e) => {
            setUploading(false);
            setError(e.message);
          }}
          config={{ mode: "auto" }}
          appearance={{
            container:
              "graph-grid group m-0 flex min-h-64 flex-col items-center justify-center gap-4 rounded-none border-0 px-6 py-14 ut-uploading:opacity-70 ut-readying:opacity-70",
            uploadIcon:
              "text-muted-foreground group-hover:text-foreground transition-colors",
            label:
              "font-display text-lg font-semibold text-foreground hover:text-foreground mt-0",
            allowedContent: "label-mono mt-1",
            button:
              "mt-5 bg-primary text-primary-foreground text-sm font-medium h-9 px-4 rounded-md after:bg-foreground/20 focus-within:ring-2 focus-within:ring-ring ut-uploading:bg-primary/80",
          }}
          content={{
            uploadIcon: (
              <span className="border-border bg-card mb-1 flex size-14 items-center justify-center rounded-full border transition-colors group-hover:border-foreground/40">
                <IntakeGlyph className="size-6" />
              </span>
            ),
            label: "Drop a resume here, or click to browse",
            allowedContent: "PDF / DOCX · up to 8 MB",
            button: ({ ready }) => (ready ? "Choose file" : "Preparing…"),
          }}
        />
      )}

      {/* spec footer */}
      <div className="border-border flex flex-wrap items-center gap-2 border-t px-4 py-2.5">
        {SPECS.map((s) => (
          <span
            key={s}
            className="label-mono border-border rounded-[3px] border px-2 py-0.5"
          >
            {s}
          </span>
        ))}
      </div>

      {error && (
        <div className="px-4 pb-4">
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      )}
    </div>
  );
}
