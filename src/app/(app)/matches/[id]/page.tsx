import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/session";
import { getJobMatch } from "@/features/resumes/queries";
import { ScoreRing } from "@/components/scores/score";
import type { JobMatchResult } from "@/lib/schemas/resume";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft, CheckCircle2, Lightbulb, XCircle } from "lucide-react";

export const metadata: Metadata = { title: "Job match report" };

export default async function MatchPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const match = await getJobMatch(user.id, id);
  if (!match) notFound();

  const result = match.result as JobMatchResult;

  return (
    <div className="space-y-6">
      <Link
        href={`/resumes/${match.resume.id}`}
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm transition-colors"
      >
        <ArrowLeft className="size-4" aria-hidden /> Back to {match.resume.title}
      </Link>

      <Card>
        <CardContent className="flex flex-col items-center gap-6 py-6 sm:flex-row sm:items-start">
          <ScoreRing score={result.matchScore} size={140} strokeWidth={12} />
          <div className="flex-1 space-y-2 text-center sm:text-left">
            <h1 className="text-2xl font-bold">
              {match.jobDescription.title}
              {match.jobDescription.company && (
                <span className="text-muted-foreground">
                  {" "}
                  · {match.jobDescription.company}
                </span>
              )}
            </h1>
            <p className="text-muted-foreground leading-relaxed">{result.verdict}</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="size-5 text-emerald-500" aria-hidden />
              Matched skills ({result.matchedSkills.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-1.5">
            {result.matchedSkills.length === 0 ? (
              <p className="text-muted-foreground text-sm">No matches found.</p>
            ) : (
              result.matchedSkills.map((s) => (
                <Badge key={s} variant="outline" className="border-emerald-500/40">
                  {s}
                </Badge>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <XCircle className="size-5 text-red-500" aria-hidden />
              Missing skills ({result.missingSkills.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-1.5">
            {result.missingSkills.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                Nothing missing — great coverage!
              </p>
            ) : (
              result.missingSkills.map((s) => (
                <Badge key={s} variant="outline" className="border-red-500/40">
                  {s}
                </Badge>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {result.missingKeywords.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Keywords to add</CardTitle>
            <CardDescription>
              Work these into your resume where they truthfully apply.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-1.5">
            {result.missingKeywords.map((k) => (
              <Badge key={k} variant="secondary">
                {k}
              </Badge>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="size-5 text-sky-500" aria-hidden />
            Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed">
            {result.recommendations.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tailored summary for this job</CardTitle>
          <CardDescription>
            Drop-in replacement for your professional summary.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <blockquote className="border-primary/40 border-l-4 pl-4 text-sm leading-relaxed italic">
            {result.tailoredSummary}
          </blockquote>
        </CardContent>
      </Card>
    </div>
  );
}
