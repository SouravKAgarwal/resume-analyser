import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/session";
import { getResume } from "@/features/resumes/queries";
import { AnalyzeButton } from "@/components/resumes/analyze-button";
import { JobMatchForm } from "@/components/resumes/job-match-form";
import { RewriteForm } from "@/components/resumes/rewrite-form";
import { DeleteResumeButton } from "@/components/resumes/delete-resume-button";
import { DownloadOriginalButton } from "@/components/resumes/download-original-button";
import { ResumeDownload } from "@/components/resumes/resume-download";
import { scoreVar } from "@/components/scores/score";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const metadata: Metadata = { title: "Resume" };

const dateFmt = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

export default async function ResumePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const resume = await getResume(user.id, id);
  if (!resume) notFound();

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <span className="label-mono">Specimen</span>
          <h1 className="truncate text-3xl font-semibold">{resume.title}</h1>
          <p className="text-muted-foreground font-mono text-xs">
            v{resume.version} · {resume.fileName} ·{" "}
            {(resume.fileSize / 1024).toFixed(0)} KB ·{" "}
            {resume.fileType.toUpperCase()}
          </p>
          {resume.source === "rewrite" && resume.parent && (
            <p className="text-muted-foreground text-xs">
              Branched from{" "}
              <Link href={`/resumes/${resume.parent.id}`} className="underline">
                {resume.parent.title}
              </Link>{" "}
              · v{resume.parent.version}
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ResumeDownload resumeId={resume.id} />
          <DownloadOriginalButton resumeId={resume.id} />
          <DeleteResumeButton resumeId={resume.id} />
          <AnalyzeButton resumeId={resume.id} />
        </div>
      </div>

      <Tabs defaultValue="analyses">
        <TabsList
          variant="line"
          className="border-border h-auto w-full justify-start gap-6 rounded-none border-b pb-0"
        >
          <TabsTrigger value="analyses" className="flex-none px-0 pb-2.5">
            Analyses
          </TabsTrigger>
          <TabsTrigger value="match" className="flex-none px-0 pb-2.5">
            Job match
          </TabsTrigger>
          <TabsTrigger value="rewrite" className="flex-none px-0 pb-2.5">
            Rewrite
          </TabsTrigger>
        </TabsList>

        <TabsContent value="analyses" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Analysis history</CardTitle>
              <p className="text-muted-foreground text-sm">
                Every run is saved so you can track improvement across versions.
              </p>
            </CardHeader>
            <CardContent>
              {resume.analyses.length === 0 ? (
                <p className="text-muted-foreground py-6 text-center text-sm">
                  No analyses yet — run your first reading above.
                </p>
              ) : (
                <ul className="divide-border divide-y">
                  {resume.analyses.map((a) => (
                    <li key={a.id}>
                      <Link
                        href={`/analyses/${a.id}`}
                        className="hover:bg-secondary -mx-3 flex items-center justify-between gap-3 rounded-md px-3 py-3 transition-colors"
                      >
                        <div>
                          <p className="font-medium">
                            {dateFmt.format(new Date(a.createdAt))}
                          </p>
                        </div>
                        <span
                          className="font-mono text-lg font-semibold tabular-nums"
                          style={{ color: scoreVar(a.overallScore) }}
                        >
                          {a.overallScore}
                          <span className="text-muted-foreground text-sm">
                            /100
                          </span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="match" className="mt-6 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Match against a job description
              </CardTitle>
              <p className="text-muted-foreground text-sm">
                Paste a posting to see your match score, missing keywords, and
                tailored recommendations.
              </p>
            </CardHeader>
            <CardContent>
              <JobMatchForm resumeId={resume.id} />
            </CardContent>
          </Card>

          {resume.jobMatches.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Previous matches</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="divide-border divide-y">
                  {resume.jobMatches.map((m) => (
                    <li key={m.id}>
                      <Link
                        href={`/matches/${m.id}`}
                        className="hover:bg-secondary -mx-3 flex items-center justify-between gap-3 rounded-md px-3 py-3 transition-colors"
                      >
                        <div className="min-w-0">
                          <p className="truncate font-medium">
                            {m.jobDescription.title}
                            {m.jobDescription.company &&
                              ` · ${m.jobDescription.company}`}
                          </p>
                          <p className="text-muted-foreground font-mono text-xs">
                            {dateFmt.format(new Date(m.createdAt))}
                          </p>
                        </div>
                        <span
                          className="font-mono text-lg font-semibold tabular-nums"
                          style={{ color: scoreVar(m.matchScore) }}
                        >
                          {m.matchScore}
                          <span className="text-muted-foreground text-sm">
                            %
                          </span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="rewrite" className="mt-6 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Rewrite</CardTitle>
              <p className="text-muted-foreground text-sm">
                Pick a target style and section. The rewrite comes back with
                stronger, ATS-friendly wording.
              </p>
            </CardHeader>
            <CardContent>
              <RewriteForm resumeId={resume.id} />
            </CardContent>
          </Card>

          {resume.children.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Branches</CardTitle>
                <p className="text-muted-foreground text-sm">
                  Each rewrite is committed as a new resume version you can open,
                  download, and analyze on its own.
                </p>
              </CardHeader>
              <CardContent>
                <ul className="divide-border divide-y">
                  {resume.children.map((c) => {
                    const score = c.analyses[0]?.overallScore;
                    return (
                      <li key={c.id}>
                        <Link
                          href={`/resumes/${c.id}`}
                          className="hover:bg-secondary -mx-3 flex items-center justify-between gap-3 rounded-md px-3 py-3 transition-colors"
                        >
                          <div className="min-w-0">
                            <p className="truncate font-medium">{c.title}</p>
                            <p className="text-muted-foreground font-mono text-xs">
                              v{c.version} · {dateFmt.format(new Date(c.createdAt))}
                            </p>
                          </div>
                          {typeof score === "number" && (
                            <span
                              className="font-mono text-lg font-semibold tabular-nums"
                              style={{ color: scoreVar(score) }}
                            >
                              {score}
                              <span className="text-muted-foreground text-sm">/100</span>
                            </span>
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
