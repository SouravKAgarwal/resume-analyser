import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/session";
import { getResume } from "@/features/resumes/queries";
import { AnalyzeButton } from "@/components/resumes/analyze-button";
import { JobMatchForm } from "@/components/resumes/job-match-form";
import { RewriteForm } from "@/components/resumes/rewrite-form";
import { DeleteResumeButton } from "@/components/resumes/delete-resume-button";
import { scoreColor } from "@/components/scores/score";
import { REWRITE_STYLES, type RewriteResult, type RewriteStyle } from "@/lib/schemas/resume";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ExternalLink, FileText, PenLine, Sparkles, Target } from "lucide-react";
import { cn } from "@/lib/utils";

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
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <FileText className="size-6 shrink-0" aria-hidden />
            <span className="truncate">{resume.title}</span>
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            v{resume.version} · {resume.fileName} ·{" "}
            {(resume.fileSize / 1024).toFixed(0)} KB ·{" "}
            <a
              href={resume.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground inline-flex items-center gap-1 underline"
            >
              View file <ExternalLink className="size-3" aria-hidden />
            </a>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DeleteResumeButton resumeId={resume.id} />
          <AnalyzeButton resumeId={resume.id} />
        </div>
      </div>

      <Tabs defaultValue="analyses">
        <TabsList>
          <TabsTrigger value="analyses">
            <Sparkles className="size-4" aria-hidden /> Analyses
          </TabsTrigger>
          <TabsTrigger value="match">
            <Target className="size-4" aria-hidden /> Job match
          </TabsTrigger>
          <TabsTrigger value="rewrite">
            <PenLine className="size-4" aria-hidden /> AI rewrite
          </TabsTrigger>
        </TabsList>

        <TabsContent value="analyses" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Analysis history</CardTitle>
              <CardDescription>
                Every run is saved so you can track improvement across versions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {resume.analyses.length === 0 ? (
                <p className="text-muted-foreground py-6 text-center text-sm">
                  No analyses yet — run your first AI analysis above.
                </p>
              ) : (
                <ul className="divide-y">
                  {resume.analyses.map((a) => (
                    <li key={a.id}>
                      <Link
                        href={`/analyses/${a.id}`}
                        className="hover:bg-muted/50 -mx-2 flex items-center justify-between gap-3 rounded-md px-2 py-3 transition-colors"
                      >
                        <div>
                          <p className="font-medium">{dateFmt.format(a.createdAt)}</p>
                          {a.model && (
                            <p className="text-muted-foreground text-xs">{a.model}</p>
                          )}
                        </div>
                        <span
                          className={cn(
                            "text-lg font-bold tabular-nums",
                            scoreColor(a.overallScore),
                          )}
                        >
                          {a.overallScore}/100
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="match" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Match against a job description</CardTitle>
              <CardDescription>
                Paste a job posting to see your match score, missing keywords, and
                tailored recommendations.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <JobMatchForm resumeId={resume.id} />
            </CardContent>
          </Card>

          {resume.jobMatches.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Previous matches</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="divide-y">
                  {resume.jobMatches.map((m) => (
                    <li key={m.id}>
                      <Link
                        href={`/matches/${m.id}`}
                        className="hover:bg-muted/50 -mx-2 flex items-center justify-between gap-3 rounded-md px-2 py-3 transition-colors"
                      >
                        <div className="min-w-0">
                          <p className="truncate font-medium">
                            {m.jobDescription.title}
                            {m.jobDescription.company &&
                              ` · ${m.jobDescription.company}`}
                          </p>
                          <p className="text-muted-foreground text-xs">
                            {dateFmt.format(m.createdAt)}
                          </p>
                        </div>
                        <Badge
                          variant="secondary"
                          className={cn("tabular-nums", scoreColor(m.matchScore))}
                        >
                          {m.matchScore}%
                        </Badge>
                      </Link>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="rewrite" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI rewrite</CardTitle>
              <CardDescription>
                Pick a target style and section — the AI rewrites it with stronger,
                ATS-friendly wording.
              </CardDescription>
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
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-base">
                      {REWRITE_STYLES[rw.style as RewriteStyle] ?? rw.style} ·{" "}
                      <span className="capitalize">{rw.section}</span>
                    </CardTitle>
                    <CardDescription>{dateFmt.format(rw.createdAt)}</CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {content.headline && (
                    <p className="text-lg font-semibold">{content.headline}</p>
                  )}
                  {content.summary && (
                    <p className="text-sm leading-relaxed">{content.summary}</p>
                  )}
                  {content.sections.map((s, i) => (
                    <div key={i} className="space-y-2">
                      <h3 className="font-semibold">{s.title}</h3>
                      <ul className="list-disc space-y-1 pl-5 text-sm leading-relaxed">
                        {s.content.map((line, j) => (
                          <li key={j}>{line}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                  {content.notes.length > 0 && (
                    <>
                      <Separator />
                      <div>
                        <h3 className="mb-1 text-sm font-semibold">What changed</h3>
                        <ul className="text-muted-foreground list-disc space-y-1 pl-5 text-xs">
                          {content.notes.map((n, i) => (
                            <li key={i}>{n}</li>
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
