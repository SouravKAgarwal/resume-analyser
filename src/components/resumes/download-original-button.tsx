"use client";

import { useState } from "react";
import { getOriginalResumeUrl } from "@/features/resumes/actions";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";

/** Fetches a signed URL on demand, then opens the original file. */
export function DownloadOriginalButton({ resumeId }: { resumeId: string }) {
  const [busy, setBusy] = useState(false);

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        const res = await getOriginalResumeUrl(resumeId);
        setBusy(false);
        if (res.ok) {
          window.open(res.data.url, "_blank", "noopener,noreferrer");
        } else {
          toast.error(res.error);
        }
      }}
    >
      {busy ? (
        <Loader2 className="size-4 animate-spin" aria-hidden />
      ) : (
        <Download className="size-4" aria-hidden />
      )}
      Original
    </Button>
  );
}
