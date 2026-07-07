import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/session";
import { getResumes } from "@/features/resumes/queries";
import { scoreVar } from "@/components/scores/score";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus } from "lucide-react";

export const metadata: Metadata = {
  title: "My resumes",
  description: "Your uploaded resumes and their latest ATS readings.",
};

const dateFmt = new Intl.DateTimeFormat("en-IN", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

export default async function ResumesPage() {
  const user = await requireUser();
  const resumes = await getResumes(user.id);

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <span className="label-mono">Intake</span>
          <h1 className="text-3xl font-semibold">My resumes</h1>
          <p className="text-muted-foreground">
            Open one to run a reading, or upload a new version.
          </p>
        </div>
        <Button asChild>
          <Link href="/resumes/upload">
            <Plus className="size-4" aria-hidden /> Upload resume
          </Link>
        </Button>
      </div>

      {resumes.length === 0 ? (
        <Card className="border-dashed shadow-none">
          <CardContent className="text-muted-foreground flex flex-col items-center gap-4 py-14 text-center text-sm">
            <p>No resumes yet. Upload your first one to run a reading.</p>
            <Button asChild>
              <Link href="/resumes/upload">
                <Plus className="size-4" aria-hidden /> Upload resume
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
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
                        <CardTitle className="min-w-0 truncate text-base">
                          {r.title}
                        </CardTitle>
                        <span className="label-mono shrink-0">
                          {r.fileType}
                        </span>
                      </div>
                      <p className="text-muted-foreground font-mono text-xs">
                        v{r.version} · {dateFmt.format(new Date(r.createdAt))}
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
                            <span className="text-muted-foreground text-sm">
                              /100
                            </span>
                          </span>
                        </div>
                      ) : (
                        <p className="text-muted-foreground text-sm">
                          Not analyzed yet
                        </p>
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
