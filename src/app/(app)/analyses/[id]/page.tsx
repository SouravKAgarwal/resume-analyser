import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/session";
import { getAnalysis } from "@/features/resumes/queries";
import { ScoreRing, ScoreBar, scoreLabel } from "@/components/scores/score";
import type { AnalysisResult } from "@/lib/schemas/resume";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  CheckCircle2,
  Lightbulb,
  TriangleAlert,
} from "lucide-react";
import { cn } from "@/lib/utils";

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

const PRIORITY_STYLES: Record<string, string> = {
  high: "bg-red-500/10 text-red-600 dark:text-red-400",
  medium: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  low: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
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
    <div className="space-y-6">
      <Link
        href={`/resumes/${analysis.resume.id}`}
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm transition-colors"
      >
        <ArrowLeft className="size-4" aria-hidden /> Back to {analysis.resume.title}
      </Link>

      <Card>
        <CardContent className="flex flex-col items-center gap-6 py-6 sm:flex-row sm:items-start">
          <ScoreRing score={result.overallScore} size={140} strokeWidth={12} />
          <div className="flex-1 space-y-2 text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <h1 className="text-2xl font-bold">
                {scoreLabel(result.overallScore)}
              </h1>
              {analysis.model && (
                <Badge variant="outline">{analysis.model}</Badge>
              )}
            </div>
            <p className="text-muted-foreground leading-relaxed">{result.verdict}</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Score breakdown</CardTitle>
            <CardDescription>How each dimension contributes.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {sections.map(([key, s]) => (
              <ScoreBar key={key} label={SECTION_LABELS[key] ?? key} score={s.score} />
            ))}
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Top fixes</CardTitle>
            <CardDescription>
              Ordered by impact — start at the top.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {result.topFixes.map((fix, i) => (
                <li key={i} className="flex items-start gap-3 rounded-lg border p-3">
                  <span
                    className={cn(
                      "mt-0.5 rounded-full px-2 py-0.5 text-xs font-semibold capitalize",
                      PRIORITY_STYLES[fix.priority],
                    )}
                  >
                    {fix.priority}
                  </span>
                  <div className="min-w-0 space-y-1 text-sm">
                    <p className="font-medium">{fix.issue}</p>
                    <p className="text-muted-foreground">{fix.fix}</p>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Keyword analysis</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {(
            [
              ["Strong", result.keywordAnalysis.strong, "border-emerald-500/40"],
              ["Weak", result.keywordAnalysis.weak, "border-amber-500/40"],
              ["Overused", result.keywordAnalysis.overused, "border-orange-500/40"],
              ["Missing", result.keywordAnalysis.missing, "border-red-500/40"],
            ] as const
          ).map(([label, words, border]) => (
            <div key={label}>
              <h3 className="mb-2 text-sm font-semibold">{label}</h3>
              <div className="flex flex-wrap gap-1.5">
                {words.length === 0 ? (
                  <span className="text-muted-foreground text-sm">None found</span>
                ) : (
                  words.map((w) => (
                    <Badge key={w} variant="outline" className={border}>
                      {w}
                    </Badge>
                  ))
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div>
        <h2 className="mb-3 text-xl font-bold">Section details</h2>
        <Tabs defaultValue={sections[0]?.[0]}>
          <TabsList className="h-auto flex-wrap">
            {sections.map(([key, s]) => (
              <TabsTrigger key={key} value={key}>
                {SECTION_LABELS[key] ?? key}
                <span className="text-muted-foreground ml-1 tabular-nums">
                  {s.score}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>
          {sections.map(([key, s]) => (
            <TabsContent key={key} value={key} className="mt-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <ScoreRing score={s.score} size={72} strokeWidth={7} />
                    <div>
                      <CardTitle>{SECTION_LABELS[key] ?? key}</CardTitle>
                      <CardDescription className="mt-1 leading-relaxed">
                        {s.explanation}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="grid gap-6 lg:grid-cols-3">
                  <div>
                    <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
                      <CheckCircle2 className="size-4 text-emerald-500" aria-hidden />
                      Strengths
                    </h3>
                    <ul className="text-muted-foreground list-disc space-y-1.5 pl-5 text-sm">
                      {s.strengths.length === 0 && <li>None identified</li>}
                      {s.strengths.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
                      <TriangleAlert className="size-4 text-amber-500" aria-hidden />
                      Weaknesses
                    </h3>
                    <ul className="text-muted-foreground list-disc space-y-1.5 pl-5 text-sm">
                      {s.weaknesses.length === 0 && <li>None identified</li>}
                      {s.weaknesses.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
                      <Lightbulb className="size-4 text-sky-500" aria-hidden />
                      Suggestions
                    </h3>
                    <ul className="text-muted-foreground list-disc space-y-1.5 pl-5 text-sm">
                      {s.suggestions.length === 0 && <li>None</li>}
                      {s.suggestions.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}
