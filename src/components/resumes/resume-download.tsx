"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileDown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getOriginalResumeUrl, downloadResumeDocx } from "@/features/resumes/actions";

type Fmt = "pdf" | "docx";

export function ResumeDownload({ resumeId }: { resumeId: string }) {
  const [busy, setBusy] = useState<Fmt | null>(null);

  const onPdf = async () => {
    setBusy("pdf");
    const res = await getOriginalResumeUrl(resumeId);
    setBusy(null);
    if (res.ok) window.open(res.data.url, "_blank", "noopener,noreferrer");
    else toast.error(res.error);
  };

  const onDocx = async () => {
    setBusy("docx");
    const res = await downloadResumeDocx(resumeId);
    setBusy(null);
    if (!res.ok) return toast.error(res.error);
    const bytes = Uint8Array.from(atob(res.data.base64), (c) => c.charCodeAt(0));
    const blob = new Blob([bytes], {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = res.data.fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex items-center gap-2">
      <Button size="sm" variant="outline" disabled={busy !== null} onClick={onPdf}>
        {busy === "pdf" ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <FileDown className="size-4" aria-hidden />}
        PDF
      </Button>
      <Button size="sm" variant="outline" disabled={busy !== null} onClick={onDocx}>
        {busy === "docx" ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <FileDown className="size-4" aria-hidden />}
        DOCX
      </Button>
    </div>
  );
}
