import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/session";
import { getResumes } from "@/features/resumes/queries";
import { ResumeUploader } from "@/components/resumes/resume-uploader";
import { scoreVar } from "@/components/scores/score";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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
    <div className="space-y-10">
      <div className="space-y-1">
        <span className="label-mono">Intake</span>
        <h1 className="text-3xl font-semibold">My resumes</h1>
        <p className="text-muted-foreground">Upload a new version, or open one to run a reading.</p>
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

      {resumes.length > 0 && (
        <div className="space-y-4">
          <h2 className="label-mono">On file ({resumes.length})</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {resumes.map((r) => {
              const latest = r.analyses[0];
              return (
                <Link key={r.id} href={`/resumes/${r.id}`} className="group">
                  <Card className="hover:border-foreground/30 h-full transition-colors">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="min-w-0 truncate text-base">{r.title}</CardTitle>
                        <span className="label-mono shrink-0">{r.fileType}</span>
                      </div>
                      <p className="text-muted-foreground font-mono text-xs">
                        v{r.version} · {dateFmt.format(r.createdAt)}
                      </p>
                    </CardHeader>
                    <CardContent>
                      {latest ? (
                        <div className="flex items-baseline gap-2">
                          <span className="label-mono">Latest</span>
                          <span
                            className="font-mono text-2xl font-semibold tabular-nums"
                            style={{ color: scoreVar(latest.overallScore) }}
                          >
                            {latest.overallScore}
                            <span className="text-muted-foreground text-sm">/100</span>
                          </span>
                        </div>
                      ) : (
                        <p className="text-muted-foreground text-sm">Not analyzed yet</p>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
