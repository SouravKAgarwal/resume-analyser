"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { runRewrite } from "@/features/resumes/actions";
import { REWRITE_STYLES, type RewriteStyle } from "@/lib/schemas/resume";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, PenLine } from "lucide-react";
import { toast } from "sonner";

const SECTIONS = {
  full: "Entire resume",
  summary: "Summary",
  experience: "Work experience",
  projects: "Projects",
  skills: "Skills",
} as const;

export function RewriteForm({ resumeId }: { resumeId: string }) {
  const router = useRouter();
  const [style, setStyle] = useState<RewriteStyle>("ats");
  const [section, setSection] = useState<keyof typeof SECTIONS>("full");
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);
  const loading = pending || busy;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Optimization style</Label>
          <Select value={style} onValueChange={(v) => setStyle(v as RewriteStyle)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(REWRITE_STYLES).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Section</Label>
          <Select
            value={section}
            onValueChange={(v) => setSection(v as keyof typeof SECTIONS)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(SECTIONS).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <Button
        disabled={loading}
        onClick={() => {
          setBusy(true);
          startTransition(async () => {
            const result = await runRewrite({ resumeId, style, section });
            setBusy(false);
            if (result.ok) {
              toast.success("Rewrite generated");
              router.refresh();
            } else {
              toast.error(result.error);
            }
          });
        }}
      >
        {loading ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden />
            Rewriting…
          </>
        ) : (
          <>
            <PenLine className="size-4" aria-hidden />
            Generate rewrite
          </>
        )}
      </Button>
    </div>
  );
}
