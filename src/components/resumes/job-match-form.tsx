"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { runJobMatch } from "@/features/resumes/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Target } from "lucide-react";
import { toast } from "sonner";

export function JobMatchForm({ resumeId }: { resumeId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setBusy(true);
    startTransition(async () => {
      const result = await runJobMatch({
        resumeId,
        title: String(form.get("title") ?? ""),
        company: String(form.get("company") ?? "") || undefined,
        content: String(form.get("content") ?? ""),
      });
      setBusy(false);
      if (result.ok) {
        router.push(`/matches/${result.data.matchId}`);
      } else {
        toast.error(result.error);
      }
    });
  }

  const loading = pending || busy;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="jd-title">Job title</Label>
          <Input id="jd-title" name="title" required placeholder="Senior Frontend Engineer" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="jd-company">Company (optional)</Label>
          <Input id="jd-company" name="company" placeholder="Acme Corp" />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="jd-content">Job description</Label>
        <Textarea
          id="jd-content"
          name="content"
          required
          minLength={50}
          rows={8}
          placeholder="Paste the full job description here…"
        />
      </div>
      <Button type="submit" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden />
            Matching…
          </>
        ) : (
          <>
            <Target className="size-4" aria-hidden />
            Match against this job
          </>
        )}
      </Button>
    </form>
  );
}
