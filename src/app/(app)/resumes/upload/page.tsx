import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/session";
import { ResumeUploader } from "@/components/resumes/resume-uploader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Upload resume",
  description:
    "Upload a PDF or DOCX resume. We extract the text, structure it, and prepare it for an ATS reading.",
};

export default async function UploadResumePage() {
  await requireUser();

  return (
    <div className="space-y-10">
      <div className="space-y-1">
        <Link
          href="/resumes"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm transition-colors"
        >
          <ArrowLeft className="size-4" aria-hidden /> My resumes
        </Link>
        <span className="label-mono">Intake</span>
        <h1 className="text-3xl font-semibold">Upload a resume</h1>
        <p className="text-muted-foreground">
          Drop in a new version, then open it to run a reading.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Upload a resume</CardTitle>
          <p className="text-muted-foreground text-sm">
            PDF or DOCX. We extract the text, structure it, and prepare it for analysis.
          </p>
        </CardHeader>
        <CardContent>
          <ResumeUploader />
        </CardContent>
      </Card>
    </div>
  );
}
