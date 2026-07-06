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
import { RewriteDownload } from "@/components/resumes/rewrite-download";
import { scoreVar } from "@/components/scores/score";
import { REWRITE_STYLES, type RewriteResult, type RewriteStyle } from "@/lib/schemas/resume";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

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
            v{resume.version} · {resume.fileName} · {(resume.fileSize / 1024).toFixed(0)} KB · {resume.fileType.toUpperCase()}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <DownloadOriginalButton resumeId={resume.id} />
          <DeleteResumeButton resumeId={resume.id} />
          <AnalyzeButton resumeId={resume.id} />
        </div>
      </div>

      <Tabs defaultValue="analyses">
        <TabsList variant="line" className="border-border h-auto w-full justify-start gap-6 rounded-none border-b pb-0">
          <TabsTrigger value="analyses" className="flex-none px-0 pb-2.5">Analyses</TabsTrigger>
          <TabsTrigger value="match" className="flex-none px-0 pb-2.5">Job match</TabsTrigger>
          <TabsTrigger value="rewrite" className="flex-none px-0 pb-2.5">Rewrite</TabsTrigger>
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
                          <p className="font-medium">{dateFmt.format(a.createdAt)}</p>
                        </div>
                        <span
                          className="font-mono text-lg font-semibold tabular-nums"
                          style={{ color: scoreVar(a.overallScore) }}
                        >
                          {a.overallScore}
                          <span className="text-muted-foreground text-sm">/100</span>
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
              <CardTitle className="text-base">Match against a job description</CardTitle>
              <p className="text-muted-foreground text-sm">
                Paste a posting to see your match score, missing keywords, and tailored
                recommendations.
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
                            {m.jobDescription.company && ` · ${m.jobDescription.company}`}
                          </p>
                          <p className="text-muted-foreground font-mono text-xs">
                            {dateFmt.format(m.createdAt)}
                          </p>
                        </div>
                        <span
                          className="font-mono text-lg font-semibold tabular-nums"
                          style={{ color: scoreVar(m.matchScore) }}
                        >
                          {m.matchScore}
                          <span className="text-muted-foreground text-sm">%</span>
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
                Pick a target style and section. The rewrite comes back with stronger,
                ATS-friendly wording.
              </p>
            </CardHeader>
            <CardContent>
              <RewriteForm resumeId={resume.id} />
            </CardContent>
          </Card>

          {resume.rewrites.map((rw) => {
            const content = rw.content as RewriteResult;
            return (
              <Card key={rw.id}>
                <CardHeader>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="space-y-1">
                      <CardTitle className="text-base">
                        {REWRITE_STYLES[rw.style as RewriteStyle] ?? rw.style} ·{" "}
                        <span className="capitalize">{rw.section}</span>
                      </CardTitle>
                      <span className="text-muted-foreground font-mono text-xs">
                        {dateFmt.format(rw.createdAt)}
                      </span>
                    </div>
                    <RewriteDownload title={resume.title} content={content} />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {content.headline && <p className="text-lg font-semibold">{content.headline}</p>}
                  {content.summary && <p className="text-sm leading-relaxed">{content.summary}</p>}
                  {content.sections.map((s, i) => (
                    <div key={i} className="space-y-2">
                      <h3 className="font-semibold">{s.title}</h3>
                      <ul className="space-y-1 text-sm leading-relaxed">
                        {s.content.map((line, j) => (
                          <li key={j} className="border-border border-l pl-3">
                            {line}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                  {content.notes.length > 0 && (
                    <>
                      <Separator />
                      <div>
                        <h3 className="label-mono mb-2">What changed</h3>
                        <ul className="text-muted-foreground space-y-1 text-xs leading-relaxed">
                          {content.notes.map((n, i) => (
                            <li key={i} className="border-border border-l pl-3">
                              {n}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>
      </Tabs>
    </div>
  );
}
