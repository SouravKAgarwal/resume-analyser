"use client";

import { useState, useTransition } from "react";
import { deleteResume } from "@/features/resumes/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, Trash2 } from "lucide-react";

export function DeleteResumeButton({ resumeId }: { resumeId: string }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Trash2 className="size-4" aria-hidden /> Delete
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete this resume?</DialogTitle>
          <DialogDescription>
            This permanently removes the resume, its analyses, job matches, and
            rewrites. This cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={pending}
            onClick={() => startTransition(() => deleteResume(resumeId))}
          >
            {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
            Delete resume
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
