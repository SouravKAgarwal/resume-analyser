import Link from "next/link";
import { getSession } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  FileSearch,
  Gauge,
  PenLine,
  ScanSearch,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";

const FEATURES = [
  {
    icon: Gauge,
    title: "ATS compatibility score",
    description:
      "See exactly how applicant tracking systems read your resume — section order, headings, keywords, and length.",
  },
  {
    icon: ScanSearch,
    title: "10-dimension deep analysis",
    description:
      "Formatting, grammar, readability, impact, projects, skills and more — each scored with evidence, not guesses.",
  },
  {
    icon: Target,
    title: "Job description matching",
    description:
      "Paste any job posting and instantly see your match score, missing skills, and the keywords to add.",
  },
  {
    icon: PenLine,
    title: "AI rewrites in your style",
    description:
      "Rewrite your summary, experience, or entire resume — ATS optimized, or tailored for frontend, backend, senior roles and more.",
  },
  {
    icon: TrendingUp,
    title: "Track improvement over time",
    description:
      "Every analysis is saved. Watch your score climb as you apply fixes across versions.",
  },
  {
    icon: Sparkles,
    title: "Explanations, not just scores",
    description:
      "Every score comes with strengths, weaknesses, and concrete fixes — like feedback from a senior recruiter.",
  },
];

export default async function HomePage() {
  const session = await getSession();
  const isAuthed = !!session?.user;
  const cta = isAuthed ? "/dashboard" : "/sign-up";

  return (
    <div className="flex min-h-svh flex-col">
      <header className="border-b">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <FileSearch className="size-5" aria-hidden />
            AI Resume Analyzer
          </Link>
          <nav className="flex items-center gap-2">
            {isAuthed ? (
              <Button asChild>
                <Link href="/dashboard">Dashboard</Link>
              </Button>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link href="/sign-in">Sign in</Link>
                </Button>
                <Button asChild>
                  <Link href="/sign-up">Get started</Link>
                </Button>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="mx-auto w-full max-w-6xl px-4 py-20 text-center sm:py-28">
          <Badge variant="secondary" className="mb-4">
            <Sparkles className="size-3.5" aria-hidden />
            Recruiter-grade AI feedback
          </Badge>
          <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight text-balance sm:text-6xl">
            Know exactly how recruiters see your resume
          </h1>
          <p className="text-muted-foreground mx-auto mt-6 max-w-2xl text-lg text-balance">
            Upload your resume and get an honest ATS score, a 10-dimension
            analysis, job-specific matching, and AI rewrites — with the
            reasoning behind every recommendation.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Button size="lg" asChild>
              <Link href={cta}>Analyze my resume</Link>
            </Button>
            {!isAuthed && (
              <Button size="lg" variant="outline" asChild>
                <Link href="/sign-in">Sign in</Link>
              </Button>
            )}
          </div>
        </section>

        <section className="bg-muted/40 border-y">
          <div className="mx-auto grid w-full max-w-6xl gap-4 px-4 py-16 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <Card key={f.title}>
                <CardHeader>
                  <f.icon className="text-primary mb-2 size-6" aria-hidden />
                  <CardTitle className="text-base">{f.title}</CardTitle>
                  <CardDescription className="leading-relaxed">
                    {f.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-4 py-20 text-center">
          <h2 className="text-3xl font-bold">Stop guessing. Start interviewing.</h2>
          <p className="text-muted-foreground mx-auto mt-4 max-w-xl">
            It takes under a minute to upload a resume and get your first full
            analysis.
          </p>
          <Button size="lg" className="mt-6" asChild>
            <Link href={cta}>Get your free analysis</Link>
          </Button>
        </section>
      </main>

      <footer className="border-t">
        <div className="text-muted-foreground mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-6 text-sm">
          <p>AI Resume Analyzer</p>
          <p>Built with Next.js · Powered by AI</p>
        </div>
      </footer>
    </div>
  );
}
