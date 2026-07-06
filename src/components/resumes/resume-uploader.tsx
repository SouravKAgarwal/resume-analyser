"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UploadDropzone } from "@/lib/uploadthing";
import { processUpload } from "@/features/resumes/actions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";

export function ResumeUploader() {
  const router = useRouter();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (processing) {
    return (
      <div className="border-muted-foreground/25 flex min-h-48 flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-8 text-center">
        <Loader2 className="text-primary size-8 animate-spin" aria-hidden />
        <div>
          <p className="font-medium">Parsing your resume…</p>
          <p className="text-muted-foreground text-sm">
            Extracting text and structuring your data. This takes a few seconds.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <UploadDropzone
        endpoint="resumeUploader"
        onClientUploadComplete={async (files) => {
          const file = files[0];
          if (!file) return;
          setError(null);
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
        onUploadError={(e) => setError(e.message)}
        config={{ mode: "auto" }}
        appearance={{
          container:
            "border-dashed border rounded-lg border-muted-foreground/25 bg-background py-10",
          label: "text-foreground",
          allowedContent: "text-muted-foreground",
          button:
            "bg-primary text-primary-foreground text-sm font-medium px-4 after:bg-primary/80",
        }}
        content={{
          label: "Drop your resume here or click to browse",
          allowedContent: "PDF or DOCX, up to 8MB",
        }}
      />
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
