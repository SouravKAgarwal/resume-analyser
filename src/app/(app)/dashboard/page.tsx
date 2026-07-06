import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/session";
import { getDashboardData } from "@/features/resumes/queries";
import { ScoreRing, scoreColor } from "@/components/scores/score";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FileText, Plus, Sparkles, Target, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Dashboard" };

const dateFmt = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

export default async function DashboardPage() {
  const user = await requireUser();
  const { resumes, recentAnalyses, recentMatches, scoreHistory } =
    await getDashboardData(user.id);

  const latestScore = recentAnalyses[0]?.overallScore;
  const firstScore = scoreHistory[0]?.overallScore;
  const trend =
    latestScore !== undefined && firstScore !== undefined && scoreHistory.length > 1
      ? latestScore - firstScore
      : null;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Welcome back, {user.name.split(" ")[0]}</h1>
          <p className="text-muted-foreground">
            Track your resume scores and keep improving.
          </p>
        </div>
        <Button asChild>
          <Link href="/resumes">
            <Plus className="size-4" aria-hidden /> Upload resume
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription className="flex items-center gap-2">
              <FileText className="size-4" aria-hidden /> Resumes
            </CardDescription>
            <CardTitle className="text-3xl tabular-nums">{resumes}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription className="flex items-center gap-2">
              <Sparkles className="size-4" aria-hidden /> Latest ATS score
            </CardDescription>
            <CardTitle
              className={cn(
                "text-3xl tabular-nums",
                latestScore !== undefined && scoreColor(latestScore),
              )}
            >
              {latestScore ?? "—"}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription className="flex items-center gap-2">
              <TrendingUp className="size-4" aria-hidden /> Improvement
            </CardDescription>
            <CardTitle
              className={cn(
                "text-3xl tabular-nums",
                trend !== null && (trend >= 0 ? "text-emerald-500" : "text-red-500"),
              )}
            >
              {trend === null ? "—" : `${trend >= 0 ? "+" : ""}${trend}`}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="size-4" aria-hidden /> Recent analyses
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentAnalyses.length === 0 ? (
              <p className="text-muted-foreground py-6 text-center text-sm">
                No analyses yet. Upload a resume and run your first analysis.
              </p>
            ) : (
              <ul className="divide-y">
                {recentAnalyses.map((a) => (
                  <li key={a.id}>
                    <Link
                      href={`/analyses/${a.id}`}
                      className="hover:bg-muted/50 -mx-2 flex items-center justify-between gap-3 rounded-md px-2 py-3 transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium">{a.resume.title}</p>
                        <p className="text-muted-foreground text-xs">
                          {dateFmt.format(a.createdAt)}
                        </p>
                      </div>
                      <ScoreRing score={a.overallScore} size={56} strokeWidth={5} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="size-4" aria-hidden /> Recent job matches
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentMatches.length === 0 ? (
              <p className="text-muted-foreground py-6 text-center text-sm">
                No job matches yet. Open a resume and paste a job description.
              </p>
            ) : (
              <ul className="divide-y">
                {recentMatches.map((m) => (
                  <li key={m.id}>
                    <Link
                      href={`/matches/${m.id}`}
                      className="hover:bg-muted/50 -mx-2 flex items-center justify-between gap-3 rounded-md px-2 py-3 transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium">
                          {m.jobDescription.title}
                          {m.jobDescription.company && (
                            <span className="text-muted-foreground">
                              {" "}
                              · {m.jobDescription.company}
                            </span>
                          )}
                        </p>
                        <p className="text-muted-foreground truncate text-xs">
                          vs {m.resume.title} · {dateFmt.format(m.createdAt)}
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
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
