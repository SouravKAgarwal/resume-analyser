"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileDown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { RewriteResult } from "@/lib/schemas/resume";
import { downloadRewritePdf, downloadRewriteDocx } from "@/lib/export/resume-doc";

type Fmt = "pdf" | "docx";

export function RewriteDownload({ title, content }: { title: string; content: RewriteResult }) {
  const [busy, setBusy] = useState<Fmt | null>(null);

  const run = (fmt: Fmt, fn: (t: string, c: RewriteResult) => Promise<void>) => async () => {
    setBusy(fmt);
    try {
      await fn(title, content);
    } catch {
      toast.error(`Couldn't build the ${fmt.toUpperCase()} file.`);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button size="sm" variant="outline" disabled={busy !== null} onClick={run("pdf", downloadRewritePdf)}>
        {busy === "pdf" ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <FileDown className="size-4" aria-hidden />}
        PDF
      </Button>
      <Button size="sm" variant="outline" disabled={busy !== null} onClick={run("docx", downloadRewriteDocx)}>
        {busy === "docx" ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <FileDown className="size-4" aria-hidden />}
        DOCX
      </Button>
    </div>
  );
}
