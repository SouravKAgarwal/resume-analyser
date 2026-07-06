import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/session";
import { getAnalysis } from "@/features/resumes/queries";
import { ScoreGauge, ScoreMeter, scoreLabel } from "@/components/scores/score";
import type { AnalysisResult } from "@/lib/schemas/resume";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = { title: "Analysis report" };

const SECTION_LABELS: Record<string, string> = {
  ats: "ATS compatibility",
  formatting: "Formatting",
  grammar: "Grammar",
  readability: "Readability",
  keywords: "Keywords",
  experience: "Experience",
  projects: "Projects",
  skills: "Skills",
  impact: "Impact & metrics",
  professionalism: "Professionalism",
};

const PRIORITY_VAR: Record<string, string> = {
  high: "var(--score-poor)",
  medium: "var(--score-warn)",
  low: "var(--score-good)",
};

export default async function AnalysisPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const analysis = await getAnalysis(user.id, id);
  if (!analysis) notFound();

  const result = analysis.result as AnalysisResult;
  const sections = Object.entries(result.sections) as [
    keyof typeof SECTION_LABELS,
    AnalysisResult["sections"]["ats"],
  ][];

  return (
    <div className="space-y-8">
      <Link
        href={`/resumes/${analysis.resume.id}`}
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm transition-colors"
      >
        <ArrowLeft className="size-4" aria-hidden /> {analysis.resume.title}
      </Link>

      {/* Overall reading */}
      <Card className="graph-grid overflow-hidden">
        <CardContent className="flex flex-col items-center gap-8 py-8 sm:flex-row sm:items-center sm:py-10">
          <ScoreGauge score={result.overallScore} size={220} />
          <div className="flex-1 space-y-3 text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center gap-3 sm:justify-start">
              <span className="label-mono">Overall reading</span>
            </div>
            <h1 className="text-3xl font-semibold">{scoreLabel(result.overallScore)}</h1>
            <p className="text-muted-foreground max-w-prose leading-relaxed">{result.verdict}</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Dimensions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {sections.map(([key, s]) => (
              <ScoreMeter key={key} label={SECTION_LABELS[key] ?? key} score={s.score} />
            ))}
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-base">Top fixes</CardTitle>
            <p className="text-muted-foreground text-sm">Ordered by impact — start at the top.</p>
          </CardHeader>
          <CardContent>
            <ol className="space-y-3">
              {result.topFixes.map((fix, i) => (
                <li key={i} className="border-border flex items-start gap-3 rounded-md border p-3">
                  <span
                    className="mt-0.5 shrink-0 border-l-2 pl-2 font-mono text-[0.65rem] font-medium uppercase tracking-wider"
                    style={{ borderColor: PRIORITY_VAR[fix.priority], color: PRIORITY_VAR[fix.priority] }}
                  >
                    {fix.priority}
                  </span>
                  <div className="min-w-0 space-y-1 text-sm">
                    <p className="font-medium">{fix.issue}</p>
                    <p className="text-muted-foreground">{fix.fix}</p>
                  </div>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Keyword analysis</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {(
            [
              ["Strong", result.keywordAnalysis.strong, "var(--score-good)"],
              ["Weak", result.keywordAnalysis.weak, "var(--score-warn)"],
              ["Overused", result.keywordAnalysis.overused, "var(--score-warn)"],
              ["Missing", result.keywordAnalysis.missing, "var(--score-poor)"],
            ] as const
          ).map(([label, words, tone]) => (
            <div key={label}>
              <h3 className="label-mono mb-2.5">{label}</h3>
              <div className="flex flex-wrap gap-1.5">
                {words.length === 0 ? (
                  <span className="text-muted-foreground text-sm">None found</span>
                ) : (
                  words.map((w) => (
                    <span
                      key={w}
                      className="rounded-[3px] border px-1.5 py-0.5 text-xs"
                      style={{ borderColor: tone, color: tone }}
                    >
                      {w}
                    </span>
                  ))
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h2 className="font-display text-3xl font-bold tracking-tight">Section detail</h2>
        {sections.map(([key, s]) => (
          <Card key={key}>
            <CardHeader>
              <div className="flex items-center gap-4">
                <ScoreGauge score={s.score} size={104} />
                <div>
                  <CardTitle className="text-base">{SECTION_LABELS[key] ?? key}</CardTitle>
                  <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
                    {s.explanation}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="grid gap-6 lg:grid-cols-3">
              <Column tone="var(--score-good)" title="Strengths" items={s.strengths} empty="None identified" />
              <Column tone="var(--score-warn)" title="Weaknesses" items={s.weaknesses} empty="None identified" />
              <Column tone="var(--foreground)" title="Suggestions" items={s.suggestions} empty="None" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function Column({
  tone,
  title,
  items,
  empty,
}: {
  tone: string;
  title: string;
  items: string[];
  empty: string;
}) {
  return (
    <div>
      <h3 className="label-mono mb-2.5 flex items-center gap-2">
        <span className="inline-block size-2 rounded-[1px]" style={{ backgroundColor: tone }} />
        {title}
      </h3>
      <ul className="text-muted-foreground space-y-1.5 text-sm leading-relaxed">
        {items.length === 0 && <li>{empty}</li>}
        {items.map((item, i) => (
          <li key={i} className="border-border border-l pl-3">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
