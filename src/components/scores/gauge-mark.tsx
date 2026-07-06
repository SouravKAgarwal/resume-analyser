import { cn } from "@/lib/utils";

/** Brand glyph: a tiny dial with a needle. Echoes the score gauge. */
export function GaugeMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={cn("shrink-0", className)} aria-hidden>
      <path
        d="M3 15 A9 9 0 0 1 21 15"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line x1="12" y1="15" x2="16.5" y2="10.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="12" cy="15" r="1.75" fill="currentColor" />
    </svg>
  );
}
