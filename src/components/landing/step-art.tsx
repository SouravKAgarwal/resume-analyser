import type { SVGProps } from "react";

/* Landing "how it works" illustrations.

   Stylized vector scenes that stand in for the old 3D renders: a document on a
   pedestal, ringed by floating UI cards. Everything is drawn from theme tokens
   so the art tracks light/dark, and each SVG carries its own <defs> with
   id-suffixed gradients/filters so the three instances never collide on the
   page. Purely decorative — the caller sets aria-hidden.

   Shared 320×260 frame. Small primitives (Lines, Dots, Card, Doc) keep the
   three scenes visually consistent. */

const FRAME = "0 0 320 260";

type Num = number;

/** Stack of hairline "text" rules used inside mock documents and cards. */
function Lines({
  x,
  y,
  widths,
  gap = 7,
  stroke = "var(--border)",
  sw = 3,
  opacity = 1,
}: {
  x: Num;
  y: Num;
  widths: Num[];
  gap?: Num;
  stroke?: string;
  sw?: Num;
  opacity?: Num;
}) {
  return (
    <>
      {widths.map((w, i) => (
        <line
          key={i}
          x1={x}
          y1={y + i * gap}
          x2={x + w}
          y2={y + i * gap}
          stroke={stroke}
          strokeWidth={sw}
          strokeLinecap="round"
          opacity={opacity}
        />
      ))}
    </>
  );
}

/** A small dot cluster — the recurring "technical confetti" of the renders. */
function Dots({
  x,
  y,
  cols,
  rows,
  step = 7,
  r = 1.4,
  fill = "var(--muted-foreground)",
  opacity = 0.5,
}: {
  x: Num;
  y: Num;
  cols: Num;
  rows: Num;
  step?: Num;
  r?: Num;
  fill?: string;
  opacity?: Num;
}) {
  const dots = [];
  for (let c = 0; c < cols; c++)
    for (let ro = 0; ro < rows; ro++)
      dots.push(
        <circle
          key={`${c}-${ro}`}
          cx={x + c * step}
          cy={y + ro * step}
          r={r}
          fill={fill}
        />,
      );
  return <g opacity={opacity}>{dots}</g>;
}

/** Floating UI card with a mono header strip — the scene's building block. */
function Card({
  x,
  y,
  w,
  h,
  children,
  accent,
}: {
  x: Num;
  y: Num;
  w: Num;
  h: Num;
  children?: React.ReactNode;
  accent?: string;
}) {
  return (
    <g>
      {/* soft contact shadow */}
      <rect
        x={x + 2}
        y={y + 3}
        width={w}
        height={h}
        rx={9}
        fill="var(--foreground)"
        opacity={0.06}
      />
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={9}
        fill="var(--card)"
        stroke={accent ?? "var(--border)"}
        strokeWidth={1.5}
      />
      <g transform={`translate(${x} ${y})`}>{children}</g>
    </g>
  );
}

/** A résumé sheet with a folded corner, avatar, and body text. */
function Doc({
  x,
  y,
  w,
  h,
  accent,
}: {
  x: Num;
  y: Num;
  w: Num;
  h: Num;
  accent?: string;
}) {
  const fold = 16;
  return (
    <g>
      <rect
        x={x + 2}
        y={y + 4}
        width={w}
        height={h}
        rx={7}
        fill="var(--foreground)"
        opacity={0.06}
      />
      <path
        d={`M${x + 7} ${y} H${x + w - fold} L${x + w} ${y + fold} V${y + h - 7} a7 7 0 0 1 -7 7 H${x + 7} a7 7 0 0 1 -7 -7 V${y + 7} a7 7 0 0 1 7 -7 Z`}
        fill="var(--card)"
        stroke={accent ?? "var(--border)"}
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
      {/* dog-ear */}
      <path
        d={`M${x + w - fold} ${y} V${y + fold} H${x + w} Z`}
        fill="var(--secondary)"
        stroke={accent ?? "var(--border)"}
        strokeWidth={1.25}
        strokeLinejoin="round"
      />
      {/* header: avatar + name */}
      <circle
        cx={x + 15}
        cy={y + 16}
        r={7}
        fill="var(--secondary)"
        stroke="var(--border)"
        strokeWidth={1.25}
      />
      <path
        d={`M${x + 12} ${y + 17} a3 3 0 0 1 6 0`}
        fill="none"
        stroke="var(--muted-foreground)"
        strokeWidth={1.25}
      />
      <circle cx={x + 15} cy={y + 13} r={2} fill="var(--muted-foreground)" />
      <Lines
        x={x + 27}
        y={y + 13}
        widths={[w * 0.42, w * 0.28]}
        gap={6}
        stroke="var(--muted-foreground)"
        sw={2.5}
      />
    </g>
  );
}

/** Shared pedestal: a stacked slab with a dark inset panel + scan ring. */
function Pedestal({ cx, y }: { cx: Num; y: Num }) {
  const w = 150;
  const x = cx - w / 2;
  return (
    <g>
      <ellipse
        cx={cx}
        cy={y + 40}
        rx={92}
        ry={16}
        fill="var(--foreground)"
        opacity={0.08}
      />
      {/* lower slab (thickness) */}
      <rect
        x={x - 4}
        y={y + 20}
        width={w + 8}
        height={20}
        rx={9}
        fill="var(--secondary)"
        stroke="var(--border)"
        strokeWidth={1.25}
      />
      {/* top slab */}
      <rect
        x={x}
        y={y}
        width={w}
        height={26}
        rx={9}
        fill="var(--card)"
        stroke="var(--border)"
        strokeWidth={1.5}
      />
      {/* dark inset panel */}
      <rect
        x={x + 14}
        y={y + 5}
        width={w - 28}
        height={15}
        rx={6}
        fill="var(--foreground)"
      />
      <ellipse
        cx={cx}
        cy={y + 12}
        rx={44}
        ry={5}
        fill="none"
        stroke="var(--card)"
        strokeWidth={1}
        strokeDasharray="3 3"
        opacity={0.55}
      />
    </g>
  );
}

/* -------------------------------------------------------------------------- */

/** Step 01 — Upload. A résumé rising off the pedestal on a cloud, ringed by a
    transfer-progress card, a PDF file chip, and an upload-complete toast. */
export function UploadArt(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox={FRAME} fill="none" {...props}>
      <defs>
        <linearGradient id="up-cloud" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--card)" />
          <stop offset="1" stopColor="var(--secondary)" />
        </linearGradient>
      </defs>

      <Dots x={20} y={26} cols={4} rows={3} opacity={0.35} />
      <Dots x={276} y={188} cols={3} rows={3} opacity={0.3} />

      <Pedestal cx={160} y={196} />

      {/* central document, standing on the pedestal */}
      <Doc x={118} y={58} w={84} h={116} />
      <g transform="translate(118 58)">
        <Lines x={12} y={40} widths={[62, 68, 54]} />
        <Lines x={12} y={68} widths={[66, 52, 60]} />
        <Lines x={12} y={96} widths={[58, 64]} />
      </g>

      {/* upload cloud + arrow, in front of the sheet */}
      <g>
        <path
          d="M138 196c-10 0-18-8-18-17 0-8 7-15 15-16 2-10 11-17 21-17 12 0 22 9 23 21 9 0 16 7 16 15 0 9-8 16-17 16z"
          fill="url(#up-cloud)"
          stroke="var(--border)"
          strokeWidth={1.5}
        />
        <path
          d="M160 188v-26m0 0-9 9m9-9 9 9"
          stroke="var(--foreground)"
          strokeWidth={3.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* rising ticks under the cloud */}
        <circle
          cx="160"
          cy="204"
          r="2"
          fill="var(--muted-foreground)"
          opacity={0.7}
        />
        <circle
          cx="160"
          cy="212"
          r="1.6"
          fill="var(--muted-foreground)"
          opacity={0.45}
        />
      </g>

      {/* progress card (top-left) */}
      <Card x={10} y={58} w={96} h={46}>
        <circle cx={22} cy={17} r={9} fill="var(--foreground)" />
        <path
          d="M18 17h8m-4-4v8"
          stroke="var(--card)"
          strokeWidth={1.75}
          strokeLinecap="round"
        />
        <Lines
          x={38}
          y={13}
          widths={[48, 32]}
          gap={7}
          stroke="var(--muted-foreground)"
          sw={2.5}
        />
        <rect
          x={16}
          y={33}
          width={64}
          height={6}
          rx={3}
          fill="var(--secondary)"
        />
        <rect
          x={16}
          y={33}
          width={46}
          height={6}
          rx={3}
          fill="var(--foreground)"
        />
        <text
          x={86}
          y={30}
          textAnchor="end"
          fontSize={6.5}
          fontFamily="var(--font-mono)"
          fontWeight={700}
          fill="var(--muted-foreground)"
        >
          76%
        </text>
      </Card>

      {/* PDF file chip (top-right) */}
      <Card x={214} y={50} w={80} h={50}>
        <rect
          x={14}
          y={12}
          width={22}
          height={26}
          rx={4}
          fill="var(--foreground)"
        />
        <path
          d="M31 12v6h5"
          fill="none"
          stroke="var(--card)"
          strokeWidth={1.25}
        />
        <text
          x={25}
          y={29}
          textAnchor="middle"
          fontSize={7}
          fontFamily="var(--font-mono)"
          fontWeight={700}
          fill="var(--card)"
        >
          PDF
        </text>
        <Lines
          x={44}
          y={16}
          widths={[28, 18]}
          gap={8}
          stroke="var(--muted-foreground)"
          sw={3}
        />
        <circle cx={68} cy={38} r={6} fill="var(--foreground)" />
        <path
          d="m65 38 2 2 4-4"
          stroke="var(--card)"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Card>

      {/* upload-complete toast (bottom-right) */}
      <Card x={196} y={188} w={104} h={40} accent="var(--score-good)">
        <circle cx={18} cy={20} r={9} fill="var(--score-good)" />
        <path
          d="m14 20 3 3 6-7"
          stroke="var(--card)"
          strokeWidth={1.75}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Lines
          x={34}
          y={13}
          widths={[56, 44]}
          gap={7}
          stroke="var(--muted-foreground)"
          sw={2.5}
        />
      </Card>

      {/* dashed connectors */}
      <path
        d="M106 92 q18 6 12 26"
        stroke="var(--border)"
        strokeWidth={1.25}
        strokeDasharray="3 3"
        fill="none"
      />
      <path
        d="M214 74 q-14 4 -18 20"
        stroke="var(--border)"
        strokeWidth={1.25}
        strokeDasharray="3 3"
        fill="none"
      />
    </svg>
  );
}

/* -------------------------------------------------------------------------- */

/** Step 02 — Read. A résumé scanned on the pedestal, flanked by an ATS score
    gauge, a keyword-match checklist, and a content-insights radar. */
export function ReadArt(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox={FRAME} fill="none" {...props}>
      <defs>
        <linearGradient id="rd-beam" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--foreground)" stopOpacity={0.16} />
          <stop offset="1" stopColor="var(--foreground)" stopOpacity={0} />
        </linearGradient>
      </defs>

      <Dots x={280} y={24} cols={3} rows={3} opacity={0.3} />
      <Dots x={20} y={210} cols={3} rows={2} opacity={0.3} />

      <Pedestal cx={160} y={198} />

      {/* résumé being read */}
      <Doc x={120} y={52} w={80} h={118} />
      <g transform="translate(120 52)">
        <Lines x={12} y={40} widths={[56, 60, 48]} />
        <Lines x={12} y={66} widths={[58, 46, 54]} />
        {/* skill chips */}
        <rect
          x={12}
          y={92}
          width={24}
          height={9}
          rx={4.5}
          fill="var(--secondary)"
        />
        <rect
          x={40}
          y={92}
          width={18}
          height={9}
          rx={4.5}
          fill="var(--secondary)"
        />
        <rect
          x={62}
          y={92}
          width={12}
          height={9}
          rx={4.5}
          fill="var(--secondary)"
        />
      </g>
      {/* scan beam sweeping the sheet */}
      <rect x={120} y={104} width={80} height={30} fill="url(#rd-beam)" />
      <line
        x1={120}
        y1={104}
        x2={200}
        y2={104}
        stroke="var(--foreground)"
        strokeWidth={1.5}
        opacity={0.4}
      />

      {/* ATS engine pill above the sheet */}
      <g>
        <rect
          x={116}
          y={30}
          width={88}
          height={18}
          rx={9}
          fill="var(--foreground)"
        />
        <rect x={124} y={35} width={8} height={8} rx={2} fill="var(--card)" />
        <text
          x={166}
          y={42}
          textAnchor="middle"
          fontSize={7}
          fontFamily="var(--font-mono)"
          fontWeight={700}
          fill="var(--card)"
          letterSpacing="0.5"
        >
          ATS ENGINE
        </text>
      </g>

      {/* ATS score gauge (top-left) */}
      <Card x={10} y={40} w={82} h={62}>
        {/* dial track + value arc + ticks */}
        <path
          d="M20 46 a22 22 0 0 1 42 0"
          fill="none"
          stroke="var(--secondary)"
          strokeWidth={4.5}
          strokeLinecap="round"
        />
        <path
          d="M20 46 a22 22 0 0 1 38 -12"
          fill="none"
          stroke="var(--score-good)"
          strokeWidth={4.5}
          strokeLinecap="round"
        />
        {[0, 45, 90, 135, 180].map((a) => {
          const rad = (Math.PI * (180 - a)) / 180;
          const cx = 41 + Math.cos(rad) * 26;
          const cy = 46 - Math.sin(rad) * 26;
          const ix = 41 + Math.cos(rad) * 22;
          const iy = 46 - Math.sin(rad) * 22;
          return (
            <line
              key={a}
              x1={ix}
              y1={iy}
              x2={cx}
              y2={cy}
              stroke="var(--muted-foreground)"
              strokeWidth={0.9}
              opacity={0.6}
            />
          );
        })}
        <text
          x={41}
          y={44}
          textAnchor="middle"
          fontSize={16}
          fontFamily="var(--font-mono)"
          fontWeight={700}
          fill="var(--foreground)"
        >
          98
        </text>
        <text
          x={41}
          y={56}
          textAnchor="middle"
          fontSize={5.5}
          fontFamily="var(--font-mono)"
          fill="var(--muted-foreground)"
          letterSpacing="0.5"
        >
          OUT OF 100
        </text>
      </Card>

      {/* keyword-match checklist (bottom-left) */}
      <Card x={10} y={116} w={86} h={70}>
        <text
          x={12}
          y={14}
          fontSize={6}
          fontFamily="var(--font-mono)"
          fontWeight={700}
          fill="var(--muted-foreground)"
          letterSpacing="0.5"
        >
          KEYWORD MATCH
        </text>
        {[0, 1, 2, 3].map((i) => (
          <g key={i} transform={`translate(0 ${24 + i * 12})`}>
            <line
              x1={12}
              y1={0}
              x2={44}
              y2={0}
              stroke="var(--border)"
              strokeWidth={2.5}
              strokeLinecap="round"
            />
            <rect
              x={50}
              y={-3}
              width={16}
              height={6}
              rx={3}
              fill="var(--secondary)"
            />
            <rect
              x={50}
              y={-3}
              width={16}
              height={6}
              rx={3}
              fill="var(--foreground)"
              opacity={0.85}
            />
            <circle cx={76} cy={0} r={5} fill="var(--foreground)" />
            <path
              d="m73 0 2 2 4-4"
              stroke="var(--card)"
              strokeWidth={1.3}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
        ))}
      </Card>

      {/* content-insights radar (right) */}
      <Card x={222} y={44} w={86} h={100}>
        <text
          x={12}
          y={14}
          fontSize={6}
          fontFamily="var(--font-mono)"
          fontWeight={700}
          fill="var(--muted-foreground)"
          letterSpacing="0.5"
        >
          MATCH ANALYSIS
        </text>
        {/* pentagon rings */}
        {[26, 17, 8].map((rr, k) => {
          const pts = [0, 1, 2, 3, 4]
            .map((i) => {
              const a = (Math.PI * 2 * i) / 5 - Math.PI / 2;
              return `${43 + Math.cos(a) * rr},${58 + Math.sin(a) * rr}`;
            })
            .join(" ");
          return (
            <polygon
              key={k}
              points={pts}
              fill="none"
              stroke="var(--border)"
              strokeWidth={0.9}
              opacity={0.7}
            />
          );
        })}
        {/* data polygon */}
        <polygon
          points={[22, 20, 25, 16, 19]
            .map((rr, i) => {
              const a = (Math.PI * 2 * i) / 5 - Math.PI / 2;
              return `${43 + Math.cos(a) * rr},${58 + Math.sin(a) * rr}`;
            })
            .join(" ")}
          fill="var(--foreground)"
          fillOpacity={0.18}
          stroke="var(--foreground)"
          strokeWidth={1.5}
          strokeLinejoin="round"
        />
        {[22, 20, 25, 16, 19].map((rr, i) => {
          const a = (Math.PI * 2 * i) / 5 - Math.PI / 2;
          return (
            <circle
              key={i}
              cx={43 + Math.cos(a) * rr}
              cy={58 + Math.sin(a) * rr}
              r={2}
              fill="var(--foreground)"
            />
          );
        })}
      </Card>
    </svg>
  );
}

/* -------------------------------------------------------------------------- */

/** Step 03 — Rewrite. A weak "before" sheet transformed through an AI engine
    into a stronger "after" sheet, with an improvement panel and score jump. */
export function RewriteArt(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox={FRAME} fill="none" {...props}>
      <defs>
        <radialGradient id="rw-glow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="var(--score-good)" stopOpacity={0.35} />
          <stop offset="1" stopColor="var(--score-good)" stopOpacity={0} />
        </radialGradient>
      </defs>

      <Dots x={150} y={20} cols={3} rows={2} opacity={0.3} />

      {/* BEFORE document (left) */}
      <text
        x={58}
        y={44}
        textAnchor="middle"
        fontSize={7}
        fontFamily="var(--font-mono)"
        fontWeight={700}
        fill="var(--muted-foreground)"
        letterSpacing="1"
      >
        BEFORE
      </text>
      <Doc x={18} y={52} w={80} h={120} />
      <g transform="translate(18 52)">
        <Lines x={12} y={40} widths={[54, 58, 46]} />
        <Lines x={12} y={66} widths={[56, 44, 52]} />
        <Lines x={12} y={92} widths={[50, 38]} />
      </g>
      {/* weak ATS score chip */}
      <Card x={18} y={182} w={82} h={40}>
        <path
          d="M18 30 a14 14 0 0 1 28 0"
          fill="none"
          stroke="var(--secondary)"
          strokeWidth={3.5}
          strokeLinecap="round"
        />
        <path
          d="M18 30 a14 14 0 0 1 8 -12"
          fill="none"
          stroke="var(--score-poor)"
          strokeWidth={3.5}
          strokeLinecap="round"
        />
        <text
          x={32}
          y={30}
          textAnchor="middle"
          fontSize={13}
          fontFamily="var(--font-mono)"
          fontWeight={700}
          fill="var(--foreground)"
        >
          68
        </text>
        <Lines
          x={52}
          y={16}
          widths={[24, 18]}
          gap={7}
          stroke="var(--score-poor)"
          sw={2.5}
        />
      </Card>

      {/* AFTER document (right) */}
      <text
        x={262}
        y={44}
        textAnchor="middle"
        fontSize={7}
        fontFamily="var(--font-mono)"
        fontWeight={700}
        fill="var(--score-good)"
        letterSpacing="1"
      >
        AFTER
      </text>
      <Doc x={222} y={52} w={80} h={120} accent="var(--score-good)" />
      <g transform="translate(222 52)">
        <Lines x={12} y={40} widths={[54, 58, 46]} stroke="var(--score-good)" />
        <Lines x={12} y={66} widths={[56, 44, 52]} stroke="var(--score-good)" />
        {/* skill chips, "optimized" */}
        <rect
          x={12}
          y={90}
          width={22}
          height={9}
          rx={4.5}
          fill="none"
          stroke="var(--score-good)"
          strokeWidth={1.25}
        />
        <rect
          x={38}
          y={90}
          width={16}
          height={9}
          rx={4.5}
          fill="none"
          stroke="var(--score-good)"
          strokeWidth={1.25}
        />
        <rect
          x={58}
          y={90}
          width={12}
          height={9}
          rx={4.5}
          fill="none"
          stroke="var(--score-good)"
          strokeWidth={1.25}
        />
      </g>
      {/* rising score chip */}
      <Card x={220} y={182} w={84} h={40} accent="var(--score-good)">
        <text
          x={20}
          y={28}
          textAnchor="middle"
          fontSize={16}
          fontFamily="var(--font-mono)"
          fontWeight={700}
          fill="var(--score-good)"
        >
          94
        </text>
        <path
          d="M40 26h12m0 0-5-4m5 4-5 4"
          stroke="var(--score-good)"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Lines
          x={58}
          y={18}
          widths={[20, 14]}
          gap={7}
          stroke="var(--muted-foreground)"
          sw={2.5}
        />
      </Card>

      {/* engine label pill */}
      <g>
        <rect
          x={110}
          y={54}
          width={100}
          height={20}
          rx={10}
          fill="var(--foreground)"
        />
        <path
          d="M124 64l1.6 3.8L129.4 69.4 125.6 71l-1.6 3.8L122.4 71 118.6 69.4 122.4 67.8z"
          fill="var(--card)"
        />
        <text
          x={166}
          y={67}
          textAnchor="middle"
          fontSize={7}
          fontFamily="var(--font-mono)"
          fontWeight={700}
          fill="var(--card)"
          letterSpacing="0.5"
        >
          AI REWRITE
        </text>
      </g>

      {/* AI engine core on a plinth (center) */}
      <g>
        <ellipse
          cx={160}
          cy={168}
          rx={40}
          ry={12}
          fill="var(--foreground)"
          opacity={0.08}
        />
        <circle cx={160} cy={128} r={30} fill="url(#rw-glow)" />
        {/* plinth */}
        <rect
          x={132}
          y={148}
          width={56}
          height={16}
          rx={7}
          fill="var(--card)"
          stroke="var(--border)"
          strokeWidth={1.5}
        />
        {/* core cube */}
        <rect
          x={138}
          y={104}
          width={44}
          height={46}
          rx={10}
          fill="var(--foreground)"
        />
        <path
          d="M160 118l3.4 7.4 7.6 3.6-7.6 3.6L160 140l-3.4-7.4-7.6-3.6 7.6-3.6z"
          fill="var(--card)"
        />
        {/* status leds */}
        <circle cx={173} cy={116} r={2} fill="var(--score-good)" />
        <circle cx={173} cy={124} r={2} fill="var(--card)" opacity={0.55} />
        <circle cx={173} cy={132} r={2} fill="var(--card)" opacity={0.35} />
      </g>

      {/* pipes: before -> engine -> after */}
      <path
        d="M100 100 q16 4 22 22"
        stroke="var(--border)"
        strokeWidth={1.5}
        strokeDasharray="3 3"
        fill="none"
      />
      <path
        d="M198 122 q16 -16 24 -20"
        stroke="var(--score-good)"
        strokeWidth={1.5}
        strokeDasharray="3 3"
        fill="none"
      />
      <path
        d="M100 130 q14 10 30 8m0 0-6 -3m6 3-6 3"
        stroke="var(--border)"
        strokeWidth={1.5}
        strokeDasharray="3 3"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
