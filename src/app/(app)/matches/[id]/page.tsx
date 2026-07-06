import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/session";
import { getJobMatch } from "@/features/resumes/queries";
import { ScoreGauge } from "@/components/scores/score";
import type { JobMatchResult } from "@/lib/schemas/resume";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

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
    <div className="space-y-8">
      <Link
        href={`/resumes/${match.resume.id}`}
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm transition-colors"
      >
        <ArrowLeft className="size-4" aria-hidden /> {match.resume.title}
      </Link>

      <Card className="graph-grid overflow-hidden">
        <CardContent className="flex flex-col items-center gap-8 py-8 sm:flex-row sm:items-center sm:py-10">
          <ScoreGauge score={result.matchScore} size={220} />
          <div className="flex-1 space-y-3 text-center sm:text-left">
            <span className="label-mono">Match against posting</span>
            <h1 className="text-2xl font-semibold">
              {match.jobDescription.title}
              {match.jobDescription.company && (
                <span className="text-muted-foreground font-normal">
                  {" "}
                  · {match.jobDescription.company}
                </span>
              )}
            </h1>
            <p className="text-muted-foreground max-w-prose leading-relaxed">{result.verdict}</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <SkillList
          tone="var(--score-good)"
          title={`Matched skills (${result.matchedSkills.length})`}
          skills={result.matchedSkills}
          empty="No matches found."
        />
        <SkillList
          tone="var(--score-poor)"
          title={`Missing skills (${result.missingSkills.length})`}
          skills={result.missingSkills}
          empty="Nothing missing — great coverage."
        />
      </div>

      {result.missingKeywords.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Keywords to add</CardTitle>
            <p className="text-muted-foreground text-sm">
              Work these in where they truthfully apply.
            </p>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-1.5">
            {result.missingKeywords.map((k) => (
              <span key={k} className="bg-secondary rounded-[3px] px-1.5 py-0.5 text-xs">
                {k}
              </span>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm leading-relaxed">
            {result.recommendations.map((r, i) => (
              <li key={i} className="border-border border-l pl-3">
                {r}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tailored summary for this job</CardTitle>
          <p className="text-muted-foreground text-sm">
            Drop-in replacement for your professional summary.
          </p>
        </CardHeader>
        <CardContent>
          <blockquote className="border-foreground/70 border-l-2 pl-4 text-sm leading-relaxed">
            {result.tailoredSummary}
          </blockquote>
        </CardContent>
      </Card>
    </div>
  );
}

function SkillList({
  tone,
  title,
  skills,
  empty,
}: {
  tone: string;
  title: string;
  skills: string[];
  empty: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <span className="inline-block size-2.5 rounded-[1px]" style={{ backgroundColor: tone }} />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-1.5">
        {skills.length === 0 ? (
          <p className="text-muted-foreground text-sm">{empty}</p>
        ) : (
          skills.map((s) => (
            <span key={s} className="rounded-[3px] border px-1.5 py-0.5 text-xs" style={{ borderColor: tone }}>
              {s}
            </span>
          ))
        )}
      </CardContent>
    </Card>
  );
}
