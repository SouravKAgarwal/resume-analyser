import { cn } from "@/lib/utils";

export function scoreColor(score: number) {
  if (score >= 80) return "text-emerald-500";
  if (score >= 60) return "text-amber-500";
  return "text-red-500";
}

export function scoreStroke(score: number) {
  if (score >= 80) return "stroke-emerald-500";
  if (score >= 60) return "stroke-amber-500";
  return "stroke-red-500";
}

export function scoreLabel(score: number) {
  if (score >= 85) return "Excellent";
  if (score >= 70) return "Good";
  if (score >= 55) return "Needs work";
  return "Weak";
}

/** SVG circular score gauge — renders on the server, no JS shipped. */
export function ScoreRing({
  score,
  size = 120,
  strokeWidth = 10,
  className,
}: {
  score: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, score));
  const offset = circumference * (1 - clamped / 100);

  return (
    <div
      className={cn("relative inline-flex items-center justify-center", className)}
      role="img"
      aria-label={`Score: ${clamped} out of 100`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className="stroke-muted"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={cn("transition-[stroke-dashoffset] duration-700", scoreStroke(clamped))}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn("text-3xl font-bold tabular-nums", scoreColor(clamped))}>
          {clamped}
        </span>
        <span className="text-muted-foreground text-xs">/ 100</span>
      </div>
    </div>
  );
}

export function ScoreBar({ label, score }: { label: string; score: number }) {
  const clamped = Math.max(0, Math.min(100, score));
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className={cn("font-semibold tabular-nums", scoreColor(clamped))}>
          {clamped}
        </span>
      </div>
      <div
        className="bg-muted h-2 overflow-hidden rounded-full"
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
      >
        <div
          className={cn(
            "h-full rounded-full",
            clamped >= 80 ? "bg-emerald-500" : clamped >= 60 ? "bg-amber-500" : "bg-red-500",
          )}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
