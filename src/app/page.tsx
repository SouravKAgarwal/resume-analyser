import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getSession } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { ScoreGauge, ScoreMeter } from "@/components/scores/score";
import { GaugeMark } from "@/components/scores/gauge-mark";
import Image from "next/image";
import { Read, Upload, Rewrite } from "@/assets";

// Illustrative reading shown on the landing gauge — not a real analysis.
const SAMPLE = [
  { label: "ATS compatibility", score: 82 },
  { label: "Impact & metrics", score: 58 },
  { label: "Keywords", score: 64 },
  { label: "Formatting", score: 91 },
];

const DIMENSIONS = [
  "ATS compatibility",
  "Formatting",
  "Grammar",
  "Readability",
  "Keywords",
  "Experience",
  "Projects",
  "Skills",
  "Impact & metrics",
  "Professionalism",
];

const STEPS = [
  {
    n: "01",
    title: "Upload",
    src: Upload,
    body: "Drop in a PDF or DOCX. We pull the text and rebuild its structure the way a parser sees it.",
  },
  {
    n: "02",
    title: "Read",
    src: Read,
    body: "Ten dimensions are scored against recruiter and ATS criteria, then reported on one /100 scale.",
  },
  {
    n: "03",
    title: "Rewrite",
    src: Rewrite,
    body: "Turn the weakest sections into stronger, ATS-friendly wording — then measure again.",
  },
];

export default async function HomePage() {
  const session = await getSession();
  const isAuthed = !!session?.user;
  const cta = isAuthed ? "/dashboard" : "/sign-up";

  return (
    <div className="flex min-h-svh flex-col">
      <header className="border-border border-b">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <GaugeMark className="size-5" />
            <span className="font-display font-semibold tracking-tight">
              Resume Bench
            </span>
          </div>
          <div className="flex items-center gap-2">
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
          </div>
        </div>
      </header>

      {/* Hero — the gauge is the thesis */}
      <section className="border-border graph-grid border-b">
        <div className="mx-auto grid w-full max-w-6xl gap-12 px-6 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-24">
          <div className="space-y-7">
            <span className="label-mono">Resume · Parse · Score</span>
            <h1 className="font-display text-4xl leading-[1.05] font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">
              Read your resume the way the machine does.
            </h1>
            <p className="text-muted-foreground max-w-md text-lg leading-relaxed">
              Before a recruiter ever sees it, an applicant tracking system
              reads your resume and scores it. Resume Bench puts that reading on
              a dial — one number out of a hundred, and exactly what moves it.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Button asChild size="lg">
                <Link href={cta}>
                  {isAuthed ? "Go to your bench" : "Get your reading"}
                  <ArrowRight aria-hidden />
                </Link>
              </Button>
              {!isAuthed && (
                <Button asChild size="lg" variant="outline">
                  <Link href="/sign-in">Sign in</Link>
                </Button>
              )}
            </div>
          </div>

          {/* Instrument panel */}
          <div className="border-border bg-card rounded-lg border p-6 sm:p-8">
            <div className="flex items-center justify-between">
              <span className="label-mono">Reading</span>
              <span className="label-mono">Specimen · v3</span>
            </div>
            <div className="flex justify-center py-4">
              <ScoreGauge score={74} size={280} />
            </div>
            <div className="border-border mt-2 space-y-3 border-t pt-6">
              {SAMPLE.map((d) => (
                <ScoreMeter key={d.label} label={d.label} score={d.score} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* What it measures */}
      <section className="border-border border-b">
        <div className="mx-auto w-full max-w-6xl px-6 py-16">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="space-y-2">
              <span className="label-mono">The scale</span>
              <h2 className="font-display text-3xl font-semibold tracking-tight">
                Ten dimensions, one number
              </h2>
            </div>
            <p className="text-muted-foreground max-w-sm text-sm leading-relaxed">
              Every reading breaks down into the same ten dimensions, so you can
              see precisely where the score comes from — and what to fix first.
            </p>
          </div>
          <ul className="border-border mt-10 grid grid-cols-1 gap-px overflow-hidden rounded-lg border sm:grid-cols-2 lg:grid-cols-5">
            {DIMENSIONS.map((d, i) => (
              <li key={d} className="bg-card p-5">
                <div className="label-mono">
                  {String(i + 1).padStart(2, "0")}
                </div>
                <div className="mt-2 font-medium">{d}</div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* How it works — a real sequence, so it is numbered */}
      <section className="border-border border-b">
        <div className="mx-auto w-full max-w-6xl px-6 py-16">
          <span className="label-mono">The bench</span>
          <div className="mt-8 grid gap-8 md:grid-cols-3 md:gap-0">
            {STEPS.map((s, i) => (
              <div
                key={s.n}
                className={
                  i === 0
                    ? "space-y-3 md:pr-8"
                    : "border-border space-y-3 md:border-l md:pr-8 md:pl-8"
                }
              >
                <span className="font-mono text-4xl font-semibold tabular-nums">
                  {s.n}
                </span>
                <div className="flex items-center mt-4 ">
                  <span
                    className="border-border bg-secondary/40 flex items-center justify-center overflow-hidden rounded-md border"
                    aria-hidden
                  >
                    <Image
                      src={s.src}
                      alt=""
                      width={300}
                      height={200}
                      className="object-contain"
                    />
                  </span>
                </div>
                <h3 className="font-display text-xl font-semibold">
                  {s.title}
                </h3>
                <p className="text-muted-foreground max-w-xs text-sm leading-relaxed">
                  {s.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Close */}
      <section className="border-border border-b">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-start gap-6 px-6 py-16 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-display max-w-lg text-3xl font-semibold tracking-tight text-balance">
            Put your resume on the bench.
          </h2>
          <Button asChild size="lg">
            <Link href={cta}>
              {isAuthed ? "Go to your bench" : "Get your reading"}
              <ArrowRight aria-hidden />
            </Link>
          </Button>
        </div>
      </section>

      <footer className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-8">
        <div className="flex items-center gap-2">
          <GaugeMark className="size-4" />
          <span className="font-mono text-xs">Resume Bench</span>
        </div>
        <span className="label-mono">Read · Score · Rewrite</span>
      </footer>
    </div>
  );
}
