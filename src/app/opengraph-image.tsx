import { ImageResponse } from "next/og";

export const alt = "Resume Bench — read your resume the way an ATS does";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Static social card: brand gauge glyph + tagline on the app's paper-white
// ground. Kept dependency-free (system fonts) so it renders without a fetch.
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px",
          background: "#ffffff",
          backgroundImage:
            "linear-gradient(to right, #00000010 1px, transparent 1px), linear-gradient(to bottom, #00000010 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          fontFamily: "sans-serif",
        }}
      >
        {/* brand row */}
        <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
          <svg width="52" height="52" viewBox="0 0 24 24" fill="none">
            <path d="M3 15 A9 9 0 0 1 21 15" stroke="#0a0a0a" strokeWidth="2" strokeLinecap="round" />
            <line x1="12" y1="15" x2="16.5" y2="10.5" stroke="#0a0a0a" strokeWidth="2" strokeLinecap="round" />
            <circle cx="12" cy="15" r="1.75" fill="#0a0a0a" />
          </svg>
          <span style={{ fontSize: 34, fontWeight: 700, letterSpacing: "-0.02em", color: "#0a0a0a" }}>
            Resume Bench
          </span>
        </div>

        {/* headline */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <div
            style={{
              fontSize: 72,
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: "-0.03em",
              color: "#0a0a0a",
              maxWidth: "900px",
            }}
          >
            Read your resume the way the machine does.
          </div>
          <div style={{ fontSize: 30, color: "#525252", maxWidth: "820px" }}>
            An ATS score out of 100, across ten dimensions — plus job-match and recruiter-grade rewrites.
          </div>
        </div>

        {/* footer scale */}
        <div
          style={{
            display: "flex",
            gap: "14px",
            fontSize: 20,
            fontWeight: 600,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "#737373",
          }}
        >
          Read · Score · Rewrite
        </div>
      </div>
    ),
    size,
  );
}
