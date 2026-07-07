import { cn } from "@/lib/utils";
import type { CSSProperties } from "react";

/* ---- Score scale ---------------------------------------------------------
   Thresholds: >=80 good, >=60 warn, else poor. The gauge and every meter
   read from the same zones, so color always means the same thing. */

export type ScoreZone = "good" | "warn" | "poor";

export function scoreZone(score: number): ScoreZone {
  if (score >= 80) return "good";
  if (score >= 60) return "warn";
  return "poor";
}

/** CSS custom-property reference for a score, usable in color/fill/stroke. */
export function scoreVar(score: number): string {
  return `var(--score-${scoreZone(score)})`;
}

export function scoreLabel(score: number): string {
  if (score >= 85) return "Excellent";
  if (score >= 70) return "Good";
  if (score >= 55) return "Needs work";
  return "Weak";
}

// Point on the dial for a given score. 0 -> left (180deg), 100 -> right (0deg).
function polar(cx: number, cy: number, r: number, score: number) {
  const a =
    (180 * (1 - Math.max(0, Math.min(100, score)) / 100) * Math.PI) / 180;
  return [cx + r * Math.cos(a), cy - r * Math.sin(a)] as const;
}

function arc(cx: number, cy: number, r: number, s0: number, s1: number) {
  const [x0, y0] = polar(cx, cy, r, s0);
  const [x1, y1] = polar(cx, cy, r, s1);
  return `M${x0.toFixed(2)} ${y0.toFixed(2)} A${r} ${r} 0 0 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`;
}

/**
 * Precision dial gauge — a 180° instrument with a zoned scale, a needle,
 * tick marks, and a numeric readout. Renders entirely on the server; no JS,
 * no animation. This is the product's signature element.
 */
export function ScoreGauge({
  score,
  size = 240,
  showScale,
  className,
}: {
  score: number;
  size?: number;
  showScale?: boolean;
  className?: string;
}) {
  const value = Math.round(Math.max(0, Math.min(100, score)));
  const withScale = showScale ?? size >= 150;
  const color = scoreVar(value);

  // Internal coordinate system: 200 wide, baseline low, readout below.
  const cx = 100;
  const cy = 104;
  const r = 84;
  const trackW = 6;
  const [nx, ny] = polar(cx, cy, r - 22, value); // needle tip

  const majors = [0, 20, 40, 60, 80, 100];
  const minors = [10, 30, 50, 70, 90];

  return (
    <div
      className={cn("inline-flex max-w-full flex-col items-center", className)}
      role="img"
      aria-label={`Score ${value} out of 100`}
    >
      <svg
        width={size}
        height={size * 0.75}
        viewBox="0 0 200 150"
        fill="none"
        className="h-auto max-w-full"
        aria-hidden
      >
        {/* neutral track */}
        <path
          d={arc(cx, cy, r, 0, 100)}
          stroke="var(--border)"
          strokeWidth={trackW}
          strokeLinecap="round"
        />

        {/* tick marks crossing the scale */}
        {[...majors, ...minors].map((t) => {
          const major = majors.includes(t);
          const [ox, oy] = polar(cx, cy, r + (major ? 6 : 4), t);
          const [ix, iy] = polar(cx, cy, r - (major ? 7 : 4), t);
          return (
            <line
              key={t}
              x1={ix.toFixed(2)}
              y1={iy.toFixed(2)}
              x2={ox.toFixed(2)}
              y2={oy.toFixed(2)}
              stroke="var(--muted-foreground)"
              strokeWidth={major ? 1.25 : 0.75}
              opacity={major ? 0.7 : 0.45}
            />
          );
        })}

        {/* value arc — draws from 0 to value on load, its stroke shifting from
           the low-end color up to the final zone color as it sweeps. */}
        <path
          className="arc-sweep"
          d={arc(cx, cy, r, 0, value)}
          pathLength={100}
          stroke={color}
          strokeWidth={trackW}
          strokeLinecap="round"
          style={
            {
              ["--arc-from" as string]: "var(--score-poor)",
              ["--arc-to" as string]: color,
            } as CSSProperties
          }
        />

        {/* scale numerals */}
        {withScale &&
          majors.map((t) => {
            const [lx, ly] = polar(cx, cy, r - 20, t);
            return (
              <text
                key={t}
                x={lx.toFixed(2)}
                y={(ly + 3).toFixed(2)}
                textAnchor="middle"
                fontSize="8"
                fontFamily="var(--font-mono)"
                fill="var(--muted-foreground)"
              >
                {t}
              </text>
            );
          })}

        {/* needle + hub — only on the full-size instrument; compact reads by arc alone */}
        {withScale && (
          <g
            className="needle-sweep"
            style={
              {
                transformOrigin: `${cx}px ${cy}px`,
                // start pinned at score 0 (points left), sweep to value
                ["--needle-start" as string]: `${-1.8 * value}deg`,
              } as CSSProperties
            }
          >
            <line
              x1={cx}
              y1={cy}
              x2={nx.toFixed(2)}
              y2={ny.toFixed(2)}
              stroke="var(--foreground)"
              strokeWidth={2.5}
              strokeLinecap="round"
            />
            <circle cx={cx} cy={cy} r={7} fill="var(--foreground)" />
            <circle cx={cx} cy={cy} r={2.5} fill="var(--card)" />
          </g>
        )}

        {/* readout below the baseline */}
        <text
          x={cx}
          y={144}
          textAnchor="middle"
          fontFamily="var(--font-mono)"
          fontWeight={600}
          fontSize="34"
          fill="var(--foreground)"
        >
          {value}
          <tspan fontSize="14" fontWeight={500} fill="var(--muted-foreground)">
            /100
          </tspan>
        </text>
      </svg>
    </div>
  );
}

/** Compact linear instrument meter — ticked track, filled by zone, mono value. */
export function ScoreMeter({
  label,
  score,
  showMax = false,
}: {
  label: string;
  score: number;
  showMax?: boolean;
}) {
  const value = Math.round(Math.max(0, Math.min(100, score)));
  const color = scoreVar(value);

  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm">{label}</span>
        <span
          className="font-mono text-sm font-medium tabular-nums"
          style={{ color }}
        >
          {value}
          {showMax && (
            <span className="text-muted-foreground text-xs"> /100</span>
          )}
        </span>
      </div>
      <div
        className="relative h-2 overflow-hidden rounded-[2px]"
        style={{
          backgroundColor: "var(--secondary)",
          // hairline ticks every 10%
          backgroundImage:
            "repeating-linear-gradient(to right, var(--border) 0, var(--border) 1px, transparent 1px, transparent 10%)",
        }}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
      >
        <div
          className="h-full rounded-[2px]"
          style={{ width: `${value}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}
