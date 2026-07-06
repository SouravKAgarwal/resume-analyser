import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/session";
import { getResumes } from "@/features/resumes/queries";
import { ResumeUploader } from "@/components/resumes/resume-uploader";
import { scoreColor } from "@/components/scores/score";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FileText } from "lucide-react";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "My resumes" };

const dateFmt = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

export default async function ResumesPage() {
  const user = await requireUser();
  const resumes = await getResumes(user.id);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">My resumes</h1>
        <p className="text-muted-foreground">
          Upload a new version or open one to analyze it.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upload a resume</CardTitle>
          <CardDescription>
            PDF or DOCX. We extract the text, structure it, and get it ready for analysis.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResumeUploader />
        </CardContent>
      </Card>

      {resumes.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {resumes.map((r) => {
            const latest = r.analyses[0];
            return (
              <Link key={r.id} href={`/resumes/${r.id}`}>
                <Card className="hover:border-primary/40 h-full transition-colors">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="flex min-w-0 items-center gap-2 text-base">
                        <FileText className="size-4 shrink-0" aria-hidden />
                        <span className="truncate">{r.title}</span>
                      </CardTitle>
                      <Badge variant="outline" className="uppercase">
                        {r.fileType}
                      </Badge>
                    </div>
                    <CardDescription>
                      v{r.version} · {dateFmt.format(r.createdAt)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {latest ? (
                      <p className="text-sm">
                        Latest score{" "}
                        <span className={cn("font-bold tabular-nums", scoreColor(latest.overallScore))}>
                          {latest.overallScore}/100
                        </span>
                      </p>
                    ) : (
                      <p className="text-muted-foreground text-sm">Not analyzed yet</p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
