import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/session";
import { getDashboardData } from "@/features/resumes/queries";
import { ScoreGauge, scoreVar } from "@/components/scores/score";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus } from "lucide-react";

export const metadata: Metadata = { title: "Dashboard" };

const dateFmt = new Intl.DateTimeFormat("en-IN", {
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
    latestScore !== undefined &&
    firstScore !== undefined &&
    scoreHistory.length > 1
      ? latestScore - firstScore
      : null;

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <span className="label-mono">Bench</span>
          <h1 className="text-3xl font-semibold">
            {user.name.split(" ")[0]}&rsquo;s resumes
          </h1>
        </div>
        <Button asChild>
          <Link href="/resumes">
            <Plus className="size-4" aria-hidden /> Upload resume
          </Link>
        </Button>
      </div>

      {/* Instrument readouts */}
      <div className="border-border grid grid-cols-1 divide-y rounded-md border sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        <Readout label="Resumes on file" value={String(resumes)} />
        <Readout
          label="Latest reading"
          value={latestScore ?? "—"}
          suffix={latestScore !== undefined ? "/100" : undefined}
          color={latestScore !== undefined ? scoreVar(latestScore) : undefined}
        />
        <Readout
          label="Change over time"
          value={trend === null ? "—" : `${trend >= 0 ? "+" : ""}${trend}`}
          color={
            trend !== null
              ? trend >= 0
                ? "var(--score-good)"
                : "var(--score-poor)"
              : undefined
          }
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <section className="space-y-4">
          <h2 className="label-mono">Recent analyses</h2>
          {recentAnalyses.length === 0 ? (
            <Empty>
              No analyses yet. Upload a resume and run your first reading.
            </Empty>
          ) : (
            <ul className="border-border divide-border divide-y rounded-md border">
              {recentAnalyses.map((a) => (
                <li key={a.id}>
                  <Link
                    href={`/analyses/${a.id}`}
                    className="hover:bg-secondary flex items-center justify-between gap-3 px-4 py-3 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">{a.resume.title}</p>
                      <p className="text-muted-foreground font-mono text-xs">
                        {dateFmt.format(new Date(a.createdAt))}
                      </p>
                    </div>
                    <ScoreGauge
                      score={a.overallScore}
                      size={72}
                      className="shrink-0"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="space-y-4">
          <h2 className="label-mono">Recent job matches</h2>
          {recentMatches.length === 0 ? (
            <Empty>
              No job matches yet. Open a resume and paste a job description.
            </Empty>
          ) : (
            <ul className="border-border divide-border divide-y rounded-md border">
              {recentMatches.map((m) => (
                <li key={m.id}>
                  <Link
                    href={`/matches/${m.id}`}
                    className="hover:bg-secondary flex items-center justify-between gap-3 px-4 py-3 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">
                        {m.jobDescription.title}
                        {m.jobDescription.company && (
                          <span className="text-muted-foreground font-normal">
                            {" "}
                            · {m.jobDescription.company}
                          </span>
                        )}
                      </p>
                      <p className="text-muted-foreground truncate font-mono text-xs">
                        vs {m.resume.title} ·{" "}
                        {dateFmt.format(new Date(m.createdAt))}
                      </p>
                    </div>
                    <span
                      className="shrink-0 font-mono text-lg font-semibold tabular-nums"
                      style={{ color: scoreVar(m.matchScore) }}
                    >
                      {m.matchScore}
                      <span className="text-muted-foreground text-xs">%</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function Readout({
  label,
  value,
  suffix,
  color,
}: {
  label: string;
  value: string | number;
  suffix?: string;
  color?: string;
}) {
  return (
    <div className="px-5 py-6">
      <div className="label-mono">{label}</div>
      <div
        className="mt-2 font-mono text-4xl font-semibold tabular-nums"
        style={color ? { color } : undefined}
      >
        {value}
        {suffix && (
          <span className="text-muted-foreground text-base font-medium">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <Card className="border-dashed shadow-none">
      <CardContent className="text-muted-foreground py-10 text-center text-sm">
        {children}
      </CardContent>
    </Card>
  );
}
