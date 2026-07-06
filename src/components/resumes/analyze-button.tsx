"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { runAnalysis } from "@/features/resumes/actions";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

export function AnalyzeButton({ resumeId }: { resumeId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [running, setRunning] = useState(false);

  const busy = pending || running;

  return (
    <Button
      disabled={busy}
      onClick={() => {
        setRunning(true);
        startTransition(async () => {
          const result = await runAnalysis(resumeId);
          setRunning(false);
          if (result.ok) {
            router.push(`/analyses/${result.data.analysisId}`);
          } else {
            toast.error(result.error);
          }
        });
      }}
    >
      {busy ? (
        <>
          <Loader2 className="size-4 animate-spin" aria-hidden />
          Analyzing… this can take up to a minute
        </>
      ) : (
        <>
          <Sparkles className="size-4" aria-hidden />
          Run AI analysis
        </>
      )}
    </Button>
  );
}
