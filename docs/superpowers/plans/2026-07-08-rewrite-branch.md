# Rewrite → Resume Branch Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn a resume rewrite into a committable child `Resume` (git-branch lineage) that is independently downloadable, analyzable, and re-rewritable, with a proper structured layout that fixes the issues flagged by analysis.

**Architecture:** The rewrite AI emits a *complete structured resume* (the `parsedResume` shape + headline). A commit flow renders that structure to a stored PDF (UploadThing) + deterministic `rawText`, creates a child `Resume` with `parentId`/`source="rewrite"`, records a `Rewrite` commit row, and auto-runs analysis. Rendering (text/PDF/DOCX) is centralized in one pure module driven by the structured object.

**Tech Stack:** Next.js 16 (App Router, server actions), React 19, Prisma 7 + Neon, Zod v4, jsPDF 4, docx 9, UploadThing 7, OpenAI-compatible LLM, vitest (new, for pure-logic tests).

## Global Constraints

- **Next.js 16 conventions** (per `AGENTS.md`): server-first; reads via `src/features/resumes/queries.ts` (`server-only`); mutations are Zod-validated server actions in `src/features/resumes/actions.ts` returning `{ ok: true, data } | { ok: false, error }`.
- **Prisma 7:** datasource url lives in `prisma.config.ts`, not `schema.prisma`. Client generates to `src/generated/prisma/`. Regenerate with `pnpm prisma generate` after schema edits.
- **AI:** every model call goes through `generateJSON` (defensive parse + one repair retry) wrapped in `cached()` (Redis, keyed by input hash). Schemas live in `src/lib/schemas/resume.ts`; prompts in `src/lib/ai/resume-ai.ts`.
- **Ownership** is always re-checked in actions/queries via `userId` (`requireUser()` from `src/lib/session.ts`).
- **Score thresholds** unchanged: ≥80 emerald, ≥60 amber, else red (`src/components/scores/score.tsx`).
- **Commands:** `pnpm dev` · `pnpm build` · `pnpm lint` · `pnpm prisma db push` · `pnpm prisma generate`. `pnpm build` runs `prisma generate` first.
- Commit message footer on every commit:
  `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`

## File Structure

**Create:**
- `vitest.config.ts` — vitest config with `@` alias.
- `src/lib/export/render-resume.ts` — pure renderers: `renderResumeText`, `renderResumePdf`, `renderResumeDocx`.
- `src/lib/export/render-resume.test.ts` — unit tests for `renderResumeText`.
- `src/lib/ai/fixes.ts` — pure `formatFixes(analysis)` helper.
- `src/lib/ai/fixes.test.ts` — unit tests for `formatFixes`.
- `src/lib/schemas/resume.test.ts` — unit tests for `rewriteResultSchema`.
- `src/components/resumes/resume-download.tsx` — server-driven PDF + DOCX download buttons.

**Modify:**
- `src/lib/schemas/resume.ts` — add `structuredResumeSchema`, replace `rewriteResultSchema`.
- `src/lib/ai/resume-ai.ts` — new `rewriteResume` signature/prompt using structured input + fixes.
- `prisma/schema.prisma` — `Resume.parentId`/`parent`/`children`/`source`; `Rewrite.childResumeId`.
- `src/features/resumes/actions.ts` — rewrite `runRewrite` into the commit flow; add `downloadResumeDocx`.
- `src/features/resumes/queries.ts` — `getResume` include parent/children; `getResumes` new fields.
- `src/components/resumes/rewrite-form.tsx` — "Generate branch" + redirect to child.
- `src/app/(app)/resumes/[id]/page.tsx` — lineage strip, branches list, trimmed rewrite tab, download buttons.
- `src/app/(app)/resumes/page.tsx` — branch badge + parent link.
- `package.json` — add `vitest` devDep + `test` script.

**Delete:**
- `src/lib/export/resume-doc.ts` — client exporter (replaced by server renderers).
- `src/components/resumes/rewrite-download.tsx` — replaced by `resume-download.tsx`.

---

### Task 1: Test harness + structured schema

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`
- Modify: `src/lib/schemas/resume.ts`
- Test: `src/lib/schemas/resume.test.ts`

**Interfaces:**
- Produces: `structuredResumeSchema` / `StructuredResume` (the `parsedResume` shape + optional `headline`); `rewriteResultSchema` / `RewriteResult` = `{ resume: StructuredResume; notes: string[] }`.

- [ ] **Step 1: Add vitest devDep + test script**

Edit `package.json`: add `"test": "vitest run"` to `scripts`, and `"vitest": "^3.2.4"` to `devDependencies`. Then run:

```bash
pnpm add -D vitest@^3.2.4
```

- [ ] **Step 2: Create `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: { environment: "node" },
});
```

- [ ] **Step 3: Write the failing schema test**

Create `src/lib/schemas/resume.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { rewriteResultSchema, structuredResumeSchema } from "@/lib/schemas/resume";

describe("rewriteResultSchema", () => {
  it("parses a full structured resume with notes", () => {
    const parsed = rewriteResultSchema.parse({
      resume: {
        personal: { name: "Ada Lovelace", email: "ada@example.com" },
        headline: "Full Stack Engineer",
        summary: "Builds things.",
        experience: [
          { company: "Acme", title: "Engineer", bullets: ["Shipped X"] },
        ],
        skills: [{ category: "Languages", items: ["TypeScript"] }],
      },
      notes: ["Quantified impact"],
    });
    expect(parsed.resume.personal.name).toBe("Ada Lovelace");
    expect(parsed.resume.headline).toBe("Full Stack Engineer");
    expect(parsed.resume.experience[0].bullets).toEqual(["Shipped X"]);
    expect(parsed.notes).toEqual(["Quantified impact"]);
  });

  it("defaults missing lists and notes", () => {
    const parsed = rewriteResultSchema.parse({
      resume: { personal: {} },
    });
    expect(parsed.resume.experience).toEqual([]);
    expect(parsed.resume.skills).toEqual([]);
    expect(parsed.notes).toEqual([]);
    expect(parsed.resume.headline).toBeUndefined();
  });

  it("structuredResumeSchema keeps personal contact fields", () => {
    const r = structuredResumeSchema.parse({
      personal: { name: "X", github: "gh/x" },
    });
    expect(r.personal.github).toBe("gh/x");
  });
});
```

- [ ] **Step 4: Run the test, verify it fails**

Run: `pnpm test src/lib/schemas/resume.test.ts`
Expected: FAIL — `structuredResumeSchema` / new `rewriteResultSchema` not exported yet (import error or shape mismatch).

- [ ] **Step 5: Implement the schema change**

In `src/lib/schemas/resume.ts`, replace the existing `rewriteResultSchema` + `RewriteResult` block (lines ~127-141) with:

```ts
export const structuredResumeSchema = parsedResumeSchema.extend({
  headline: z
    .string()
    .nullish()
    .transform((v) => v ?? undefined),
});

export type StructuredResume = z.infer<typeof structuredResumeSchema>;

export const rewriteResultSchema = z.object({
  resume: structuredResumeSchema,
  notes: z.array(z.string()).default([]),
});

export type RewriteResult = z.infer<typeof rewriteResultSchema>;
```

Keep `REWRITE_STYLES` and `RewriteStyle` exactly as-is below it.

- [ ] **Step 6: Run the test, verify it passes**

Run: `pnpm test src/lib/schemas/resume.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 7: Commit**

```bash
git add package.json pnpm-lock.yaml vitest.config.ts src/lib/schemas/resume.ts src/lib/schemas/resume.test.ts
git commit -m "feat: structured rewrite schema + vitest harness

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2: Deterministic text renderer

**Files:**
- Create: `src/lib/export/render-resume.ts`
- Test: `src/lib/export/render-resume.test.ts`

**Interfaces:**
- Consumes: `StructuredResume` from `@/lib/schemas/resume`.
- Produces: `renderResumeText(r: StructuredResume): string`.

- [ ] **Step 1: Write the failing test**

Create `src/lib/export/render-resume.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { renderResumeText } from "@/lib/export/render-resume";
import { structuredResumeSchema } from "@/lib/schemas/resume";

const sample = structuredResumeSchema.parse({
  personal: {
    name: "Ada Lovelace",
    email: "ada@example.com",
    phone: "555-0100",
    github: "github.com/ada",
  },
  headline: "Full Stack Engineer",
  summary: "Builds reliable web systems.",
  experience: [
    {
      company: "Acme",
      title: "Senior Engineer",
      startDate: "2021",
      endDate: "Present",
      bullets: ["Cut latency 40%", "Led a team of 4"],
    },
  ],
  skills: [{ category: "Languages", items: ["TypeScript", "Python"] }],
  education: [{ institution: "MIT", degree: "BSc", field: "CS" }],
});

describe("renderResumeText", () => {
  it("puts name, headline and contact on the first lines", () => {
    const text = renderResumeText(sample);
    const lines = text.split("\n");
    expect(lines[0]).toBe("Ada Lovelace");
    expect(lines[1]).toBe("Full Stack Engineer");
    expect(lines[2]).toContain("ada@example.com");
    expect(lines[2]).toContain("github.com/ada");
  });

  it("renders experience with bullets and skills as category lines", () => {
    const text = renderResumeText(sample);
    expect(text).toContain("EXPERIENCE");
    expect(text).toContain("Senior Engineer — Acme");
    expect(text).toContain("- Cut latency 40%");
    expect(text).toContain("Languages: TypeScript, Python");
  });

  it("omits empty sections and collapses blank runs", () => {
    const text = renderResumeText(
      structuredResumeSchema.parse({ personal: { name: "X" } }),
    );
    expect(text).not.toContain("EXPERIENCE");
    expect(text).not.toMatch(/\n{3,}/);
  });
});
```

- [ ] **Step 2: Run the test, verify it fails**

Run: `pnpm test src/lib/export/render-resume.test.ts`
Expected: FAIL — module `render-resume` not found.

- [ ] **Step 3: Implement `renderResumeText`**

Create `src/lib/export/render-resume.ts` (this module is pure — no `server-only` — so it can be unit-tested and reused anywhere):

```ts
import type { StructuredResume } from "@/lib/schemas/resume";

const join = (parts: (string | undefined)[], sep: string) =>
  parts.filter((p): p is string => Boolean(p && p.trim())).join(sep);

/** Deterministic plain-text rendering — used as a resume's rawText for analysis. */
export function renderResumeText(r: StructuredResume): string {
  const lines: string[] = [];
  const p = r.personal;

  if (p.name) lines.push(p.name);
  if (r.headline) lines.push(r.headline);
  const contact = join(
    [p.email, p.phone, p.location, p.linkedin, p.github, p.portfolio],
    " | ",
  );
  if (contact) lines.push(contact);
  lines.push("");

  const heading = (title: string) => lines.push(title.toUpperCase());

  if (r.summary) {
    heading("Summary");
    lines.push(r.summary);
    lines.push("");
  }

  if (r.experience.length) {
    heading("Experience");
    for (const e of r.experience) {
      lines.push(
        join(
          [
            join([e.title, e.company], " — "),
            e.location,
            join([e.startDate, e.endDate], " – "),
          ],
          "  |  ",
        ),
      );
      for (const b of e.bullets) lines.push(`- ${b}`);
      lines.push("");
    }
  }

  if (r.projects.length) {
    heading("Projects");
    for (const pr of r.projects) {
      lines.push(join([pr.name, pr.technologies.join(", ")], " — "));
      if (pr.description) lines.push(pr.description);
      for (const b of pr.bullets) lines.push(`- ${b}`);
      lines.push("");
    }
  }

  if (r.skills.length) {
    heading("Skills");
    for (const s of r.skills) lines.push(`${s.category}: ${s.items.join(", ")}`);
    lines.push("");
  }

  if (r.education.length) {
    heading("Education");
    for (const ed of r.education) {
      lines.push(
        join(
          [
            ed.institution,
            join([ed.degree, ed.field], ", "),
            ed.grade,
            join([ed.startDate, ed.endDate], " – "),
          ],
          "  |  ",
        ),
      );
    }
    lines.push("");
  }

  const simpleList = (title: string, items: string[]) => {
    if (!items.length) return;
    heading(title);
    for (const it of items) lines.push(`- ${it}`);
    lines.push("");
  };
  simpleList("Certifications", r.certifications);
  simpleList("Achievements", r.achievements);
  simpleList("Languages", r.languages);
  simpleList("Publications", r.publications);
  simpleList("Volunteer", r.volunteer);

  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}
```

- [ ] **Step 4: Run the test, verify it passes**

Run: `pnpm test src/lib/export/render-resume.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/export/render-resume.ts src/lib/export/render-resume.test.ts
git commit -m "feat: deterministic structured-resume text renderer

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 3: PDF + DOCX renderers

**Files:**
- Modify: `src/lib/export/render-resume.ts`
- Test: `src/lib/export/render-resume.test.ts`

**Interfaces:**
- Consumes: `StructuredResume`.
- Produces: `renderResumePdf(r: StructuredResume): Promise<Uint8Array>`; `renderResumeDocx(r: StructuredResume): Promise<Uint8Array>`.

- [ ] **Step 1: Add the failing byte-output tests**

Append to `src/lib/export/render-resume.test.ts`:

```ts
import { renderResumePdf, renderResumeDocx } from "@/lib/export/render-resume";

describe("renderResumePdf", () => {
  it("returns non-empty PDF bytes starting with %PDF", async () => {
    const bytes = await renderResumePdf(sample);
    expect(bytes.byteLength).toBeGreaterThan(500);
    // "%PDF" magic
    expect([bytes[0], bytes[1], bytes[2], bytes[3]]).toEqual([0x25, 0x50, 0x44, 0x46]);
  });
});

describe("renderResumeDocx", () => {
  it("returns non-empty DOCX (zip) bytes starting with PK", async () => {
    const bytes = await renderResumeDocx(sample);
    expect(bytes.byteLength).toBeGreaterThan(500);
    // "PK" zip magic
    expect([bytes[0], bytes[1]]).toEqual([0x50, 0x4b]);
  });
});
```

- [ ] **Step 2: Run, verify it fails**

Run: `pnpm test src/lib/export/render-resume.test.ts`
Expected: FAIL — `renderResumePdf` / `renderResumeDocx` not exported.

- [ ] **Step 3: Implement the PDF renderer**

Append to `src/lib/export/render-resume.ts`. Reference the existing jsPDF usage in `src/lib/export/resume-doc.ts` for the API shape; `doc.output("arraybuffer")` returns the bytes server-side.

```ts
/** Renders a structured resume into a cleanly formatted single-column PDF. */
export async function renderResumePdf(r: StructuredResume): Promise<Uint8Array> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4" });

  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 56;
  const maxW = pageW - margin * 2;
  let y = margin;

  const ensure = (h: number) => {
    if (y + h > pageH - margin) {
      doc.addPage();
      y = margin;
    }
  };

  const line = (
    text: string,
    opts: {
      size?: number;
      style?: "normal" | "bold";
      gap?: number;
      indent?: number;
      bullet?: boolean;
    } = {},
  ) => {
    const { size = 11, style = "normal", gap = 4, indent = 0, bullet = false } = opts;
    doc.setFont("helvetica", style);
    doc.setFontSize(size);
    const x = margin + indent;
    const wrapped = doc.splitTextToSize(text, maxW - indent) as string[];
    const lh = size * 1.35;
    wrapped.forEach((w, i) => {
      ensure(lh);
      if (bullet && i === 0) doc.text("•", margin + indent - 12, y + size);
      doc.text(w, x, y + size);
      y += lh;
    });
    y += gap;
  };

  const sectionHeading = (title: string) => {
    ensure(24);
    y += 4;
    line(title.toUpperCase(), { size: 12, style: "bold", gap: 2 });
    doc.setDrawColor(200);
    doc.line(margin, y, pageW - margin, y);
    y += 6;
  };

  const p = r.personal;
  if (p.name) line(p.name, { size: 20, style: "bold", gap: 2 });
  if (r.headline) line(r.headline, { size: 12, style: "bold", gap: 2 });
  const contact = join(
    [p.email, p.phone, p.location, p.linkedin, p.github, p.portfolio],
    "  |  ",
  );
  if (contact) line(contact, { size: 9, gap: 6 });

  if (r.summary) {
    sectionHeading("Summary");
    line(r.summary, { size: 11, gap: 6 });
  }

  if (r.experience.length) {
    sectionHeading("Experience");
    for (const e of r.experience) {
      line(join([e.title, e.company], " — "), { size: 11, style: "bold", gap: 1 });
      const meta = join([e.location, join([e.startDate, e.endDate], " – ")], "  ·  ");
      if (meta) line(meta, { size: 9, gap: 2 });
      for (const b of e.bullets) line(b, { size: 10, indent: 14, bullet: true, gap: 2 });
      y += 4;
    }
  }

  if (r.projects.length) {
    sectionHeading("Projects");
    for (const pr of r.projects) {
      line(join([pr.name, pr.technologies.join(", ")], " — "), { size: 11, style: "bold", gap: 1 });
      if (pr.description) line(pr.description, { size: 10, gap: 2 });
      for (const b of pr.bullets) line(b, { size: 10, indent: 14, bullet: true, gap: 2 });
      y += 4;
    }
  }

  if (r.skills.length) {
    sectionHeading("Skills");
    for (const s of r.skills) {
      doc.setFont("helvetica", "bold");
      const label = `${s.category}: `;
      line(`${label}${s.items.join(", ")}`, { size: 10, gap: 2 });
    }
  }

  if (r.education.length) {
    sectionHeading("Education");
    for (const ed of r.education) {
      line(join([ed.degree, ed.field], ", ") || ed.institution || "", { size: 11, style: "bold", gap: 1 });
      const meta = join([ed.institution, ed.grade, join([ed.startDate, ed.endDate], " – ")], "  ·  ");
      if (meta) line(meta, { size: 9, gap: 2 });
    }
  }

  const simple = (title: string, items: string[]) => {
    if (!items.length) return;
    sectionHeading(title);
    for (const it of items) line(it, { size: 10, indent: 14, bullet: true, gap: 2 });
  };
  simple("Certifications", r.certifications);
  simple("Achievements", r.achievements);
  simple("Languages", r.languages);
  simple("Publications", r.publications);
  simple("Volunteer", r.volunteer);

  return new Uint8Array(doc.output("arraybuffer"));
}
```

- [ ] **Step 4: Implement the DOCX renderer**

Append to `src/lib/export/render-resume.ts`. `Packer.toBuffer` returns a Node `Buffer` (a `Uint8Array` subclass) server-side.

```ts
/** Renders a structured resume into a formatted DOCX with headings and bullets. */
export async function renderResumeDocx(r: StructuredResume): Promise<Uint8Array> {
  const { Document, Packer, Paragraph, TextRun, HeadingLevel } = await import("docx");
  const p = r.personal;
  const kids: InstanceType<typeof Paragraph>[] = [];

  if (p.name)
    kids.push(new Paragraph({ heading: HeadingLevel.TITLE, children: [new TextRun({ text: p.name, bold: true })] }));
  if (r.headline)
    kids.push(new Paragraph({ children: [new TextRun({ text: r.headline, bold: true })] }));
  const contact = join([p.email, p.phone, p.location, p.linkedin, p.github, p.portfolio], "  |  ");
  if (contact) kids.push(new Paragraph({ children: [new TextRun({ text: contact, size: 18 })], spacing: { after: 160 } }));

  const heading = (text: string) =>
    kids.push(new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 60 }, children: [new TextRun({ text, bold: true })] }));
  const bullet = (text: string) => kids.push(new Paragraph({ text, bullet: { level: 0 } }));
  const plain = (text: string, bold = false) =>
    kids.push(new Paragraph({ children: [new TextRun({ text, bold })] }));

  if (r.summary) {
    heading("Summary");
    plain(r.summary);
  }
  if (r.experience.length) {
    heading("Experience");
    for (const e of r.experience) {
      plain(join([e.title, e.company], " — "), true);
      const meta = join([e.location, join([e.startDate, e.endDate], " – ")], "  ·  ");
      if (meta) plain(meta);
      for (const b of e.bullets) bullet(b);
    }
  }
  if (r.projects.length) {
    heading("Projects");
    for (const pr of r.projects) {
      plain(join([pr.name, pr.technologies.join(", ")], " — "), true);
      if (pr.description) plain(pr.description);
      for (const b of pr.bullets) bullet(b);
    }
  }
  if (r.skills.length) {
    heading("Skills");
    for (const s of r.skills) plain(`${s.category}: ${s.items.join(", ")}`);
  }
  if (r.education.length) {
    heading("Education");
    for (const ed of r.education) {
      plain(join([ed.degree, ed.field], ", ") || ed.institution || "", true);
      const meta = join([ed.institution, ed.grade, join([ed.startDate, ed.endDate], " – ")], "  ·  ");
      if (meta) plain(meta);
    }
  }
  const simple = (title: string, items: string[]) => {
    if (!items.length) return;
    heading(title);
    for (const it of items) bullet(it);
  };
  simple("Certifications", r.certifications);
  simple("Achievements", r.achievements);
  simple("Languages", r.languages);
  simple("Publications", r.publications);
  simple("Volunteer", r.volunteer);

  const doc = new Document({ sections: [{ children: kids }] });
  const buf = await Packer.toBuffer(doc);
  return new Uint8Array(buf);
}
```

- [ ] **Step 5: Run the tests, verify they pass**

Run: `pnpm test src/lib/export/render-resume.test.ts`
Expected: PASS (5 tests total).

- [ ] **Step 6: Commit**

```bash
git add src/lib/export/render-resume.ts src/lib/export/render-resume.test.ts
git commit -m "feat: server-side PDF and DOCX renderers for structured resumes

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 4: Prisma schema — lineage + commit link

**Files:**
- Modify: `prisma/schema.prisma`

**Interfaces:**
- Produces: `Resume.parentId`, `Resume.parent`, `Resume.children`, `Resume.source`; `Rewrite.childResumeId`.

> **Env note:** `pnpm prisma db push` needs the Neon `DATABASE_URL` (via `prisma.config.ts`). `pnpm prisma generate` works offline. If DB access is unavailable in this environment, run `generate` here and flag that `db push` must run against the real database before the feature works.

- [ ] **Step 1: Edit `Resume` model**

In `prisma/schema.prisma`, inside `model Resume`, add after the `updatedAt` line (~line 94):

```prisma
  parentId String?
  parent   Resume?  @relation("lineage", fields: [parentId], references: [id], onDelete: SetNull)
  children Resume[] @relation("lineage")
  source   String   @default("upload") // "upload" | "rewrite"
```

- [ ] **Step 2: Edit `Rewrite` model**

Inside `model Rewrite`, add after the `content` line (~line 161):

```prisma
  childResumeId String? @unique // the Resume this rewrite produced
```

- [ ] **Step 3: Push schema + regenerate client**

```bash
pnpm prisma db push
pnpm prisma generate
```

Expected: `db push` reports the new columns added; `generate` rewrites `src/generated/prisma/`. (If no DB access: run only `pnpm prisma generate` and note `db push` is pending.)

- [ ] **Step 4: Verify the client typechecks**

Run: `pnpm exec tsc --noEmit`
Expected: no errors referencing `parentId`, `source`, or `childResumeId` (existing code doesn't use them yet, so this just confirms the generated client is valid).

- [ ] **Step 5: Commit**

```bash
git add prisma/schema.prisma src/generated/prisma
git commit -m "feat: resume lineage (parentId/source) and rewrite->child link

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 5: AI rewrite — structured output driven by analysis

**Files:**
- Create: `src/lib/ai/fixes.ts`
- Test: `src/lib/ai/fixes.test.ts`
- Modify: `src/lib/ai/resume-ai.ts`

**Interfaces:**
- Consumes: `AnalysisResult` from `@/lib/schemas/resume`; `StructuredResume`, `RewriteResult`, `RewriteStyle`.
- Produces: `formatFixes(analysis: AnalysisResult | null): string`; new `rewriteResume(source, style, focus, analysis)` signature (see Step 5).

- [ ] **Step 1: Write the failing `formatFixes` test**

Create `src/lib/ai/fixes.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { formatFixes } from "@/lib/ai/fixes";
import type { AnalysisResult } from "@/lib/schemas/resume";

const base = {
  score: 60,
  explanation: "",
  strengths: [],
  weaknesses: [],
  suggestions: [],
};

const analysis = {
  overallScore: 62,
  verdict: "",
  sections: {
    ats: { ...base, weaknesses: ["No standard headings"] },
    formatting: base,
    grammar: base,
    readability: base,
    keywords: base,
    experience: { ...base, weaknesses: ["Bullets lack metrics"] },
    projects: base,
    skills: base,
    impact: base,
    professionalism: base,
  },
  keywordAnalysis: { strong: [], weak: [], overused: [], missing: [] },
  topFixes: [
    { priority: "high", issue: "No metrics", fix: "Add numbers to bullets" },
  ],
} as unknown as AnalysisResult;

describe("formatFixes", () => {
  it("lists topFixes and section weaknesses", () => {
    const text = formatFixes(analysis);
    expect(text).toContain("No metrics");
    expect(text).toContain("Add numbers to bullets");
    expect(text).toContain("Bullets lack metrics");
    expect(text).toContain("No standard headings");
  });

  it("handles a null analysis", () => {
    expect(formatFixes(null)).toMatch(/no prior analysis/i);
  });
});
```

- [ ] **Step 2: Run, verify it fails**

Run: `pnpm test src/lib/ai/fixes.test.ts`
Expected: FAIL — module `fixes` not found.

- [ ] **Step 3: Implement `formatFixes`**

Create `src/lib/ai/fixes.ts` (pure — no `server-only`, so it is unit-testable):

```ts
import type { AnalysisResult } from "@/lib/schemas/resume";

/** Flattens an analysis into a prompt-ready list of concrete issues to fix. */
export function formatFixes(analysis: AnalysisResult | null): string {
  if (!analysis) return "No prior analysis available — apply general best practices.";

  const fixes = analysis.topFixes.map(
    (f) => `- [${f.priority}] ${f.issue} → ${f.fix}`,
  );
  const weaknesses = Object.entries(analysis.sections).flatMap(([name, s]) =>
    s.weaknesses.map((w) => `- (${name}) ${w}`),
  );

  const all = [...fixes, ...weaknesses];
  return all.length ? all.join("\n") : "No specific issues flagged.";
}
```

- [ ] **Step 4: Run, verify it passes**

Run: `pnpm test src/lib/ai/fixes.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Rewrite `rewriteResume` in `src/lib/ai/resume-ai.ts`**

Replace the `SECTION_INSTRUCTIONS` map and the whole `rewriteResume` function (lines ~144-185) with the following. Also add `formatFixes` and the needed type imports at the top of the file.

Add to the top imports (extend the existing import from `@/lib/schemas/resume` to include `StructuredResume` and `AnalysisResult` if not already present) and add:

```ts
import { formatFixes } from "@/lib/ai/fixes";
```

Then:

```ts
const FOCUS_INSTRUCTIONS: Record<string, string> = {
  full: "Rework the entire resume — headline, summary, and every section.",
  summary: "Focus hardest on the headline and professional summary; still return the complete resume.",
  experience: "Focus hardest on the work experience bullets; still return the complete resume.",
  projects: "Focus hardest on the projects section; still return the complete resume.",
  skills: "Focus hardest on categorizing and prioritizing skills; still return the complete resume.",
};

export async function rewriteResume(
  source: StructuredResume | string,
  style: RewriteStyle,
  focus: keyof typeof FOCUS_INSTRUCTIONS,
  analysis: AnalysisResult | null,
): Promise<RewriteResult> {
  const styleLabel = REWRITE_STYLES[style];
  const fixes = formatFixes(analysis);
  const sourceBlock =
    typeof source === "string"
      ? source
      : JSON.stringify(source, null, 2);
  const sourceHash = hash(sourceBlock);

  return cached(
    `rewrite:${sourceHash}:${style}:${focus}:${hash(fixes)}`,
    7 * DAY,
    () =>
      generateJSON({
        system: `You are an elite resume writer specializing in software engineering resumes. You produce a COMPLETE, ATS-friendly, achievement-oriented resume: strong action verbs, quantified impact, no fluff, no first-person pronouns. Target style: "${styleLabel}". Never invent employers, dates, credentials, or metrics that are not supported by the source — but sharpen wording and surface impact the source implies. You MUST preserve all personal/contact details (name, email, phone, links) exactly as given.`,
        prompt: `${FOCUS_INSTRUCTIONS[focus]}

Address these issues from the resume analysis wherever the facts allow:
"""
${fixes}
"""

Return JSON with this exact shape:
{
  "resume": {
    "personal": {"name", "email", "phone", "location", "portfolio", "github", "linkedin"},
    "headline": "concise professional headline",
    "summary": "rewritten professional summary",
    "education": [{"institution", "degree", "field", "startDate", "endDate", "grade"}],
    "experience": [{"company", "title", "location", "startDate", "endDate", "bullets": [string]}],
    "projects": [{"name", "description", "technologies": [string], "bullets": [string], "link"}],
    "skills": [{"category": string, "items": [string]}],
    "certifications": [string],
    "achievements": [string],
    "languages": [string],
    "publications": [string],
    "volunteer": [string]
  },
  "notes": ["what you changed and why", ...]
}

Preserve every factual detail from the source. Use null for genuinely missing fields and [] for missing lists.

SOURCE RESUME${typeof source === "string" ? " TEXT" : " (structured JSON)"}:
"""
${sourceBlock}
"""`,
        schema: rewriteResultSchema,
        temperature: 0.4,
        maxTokens: 12288,
      }),
  );
}
```

Ensure the file's `@/lib/schemas/resume` import now includes `StructuredResume` and `AnalysisResult` (add them to the existing import list). The `AnalysisResult` type is already exported from that module.

- [ ] **Step 6: Typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: errors ONLY in `src/features/resumes/actions.ts` (it still calls the old `rewriteResume(rawText, style, section)` signature). Those are fixed in Task 6. No errors inside `resume-ai.ts` or `fixes.ts`.

- [ ] **Step 7: Commit**

```bash
git add src/lib/ai/fixes.ts src/lib/ai/fixes.test.ts src/lib/ai/resume-ai.ts
git commit -m "feat: rewrite AI emits full structured resume driven by analysis fixes

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 6: Commit flow + DOCX download action

**Files:**
- Modify: `src/features/resumes/actions.ts`

**Interfaces:**
- Consumes: `rewriteResume`, `renderResumePdf`, `renderResumeText`, `analyzeResume`, `utapi`, `StructuredResume`, `RewriteResult`.
- Produces: `runRewrite(input) -> ActionResult<{ resumeId: string }>` (now returns the *child* resume id); `downloadResumeDocx(resumeId) -> ActionResult<{ fileName: string; base64: string }>`.

- [ ] **Step 1: Add imports**

At the top of `src/features/resumes/actions.ts`, extend imports:

```ts
import { UTFile } from "uploadthing/server";
import { renderResumePdf, renderResumeText, renderResumeDocx } from "@/lib/export/render-resume";
import type { StructuredResume } from "@/lib/schemas/resume";
```

Keep the existing `utapi` import from `@/lib/uploadthing-server`.

- [ ] **Step 2: Replace the `rewriteSchema` + `runRewrite` action**

Replace the existing `rewriteSchema` (lines ~182-188) and `runRewrite` (lines ~190-223) with:

```ts
const rewriteSchema = z.object({
  resumeId: z.string().min(1),
  style: z.enum(
    Object.keys(REWRITE_STYLES) as [RewriteStyle, ...RewriteStyle[]],
  ),
  focus: z.enum(["full", "summary", "experience", "projects", "skills"]),
});

/**
 * Generates a rewrite and commits it as a new child resume (a branch of the
 * source), then runs analysis on the branch so the improved score is visible.
 */
export async function runRewrite(
  input: z.infer<typeof rewriteSchema>,
): Promise<ActionResult<{ resumeId: string }>> {
  try {
    const user = await requireUser();
    const parsed = rewriteSchema.parse(input);

    const resume = await prisma.resume.findFirst({
      where: { id: parsed.resumeId, userId: user.id },
    });
    if (!resume) return { ok: false, error: "Resume not found." };

    const latestAnalysis = await prisma.analysis.findFirst({
      where: { resumeId: resume.id, userId: user.id },
      orderBy: { createdAt: "desc" },
      select: { result: true },
    });

    const source =
      (resume.parsed as StructuredResume | null) ?? resume.rawText;
    const { resume: structured, notes } = await rewriteResume(
      source,
      parsed.style,
      parsed.focus,
      (latestAnalysis?.result as import("@/lib/schemas/resume").AnalysisResult) ??
        null,
    );

    // Render + store the branch's PDF so it downloads and re-extracts like any resume.
    const pdfBytes = await renderResumePdf(structured);
    const styleLabel = REWRITE_STYLES[parsed.style];
    const baseName = `${resume.title} - ${styleLabel}`.slice(0, 90);
    const file = new UTFile([pdfBytes], `${baseName}.pdf`, {
      type: "application/pdf",
    });
    const uploaded = await utapi.uploadFiles(file);
    if (uploaded.error || !uploaded.data) {
      return { ok: false, error: "Could not store the rewritten resume file." };
    }

    const rawText = renderResumeText(structured);

    const child = await prisma.resume.create({
      data: {
        userId: user.id,
        title: baseName,
        fileName: `${baseName}.pdf`,
        fileUrl: uploaded.data.ufsUrl,
        fileKey: uploaded.data.key,
        fileType: "pdf",
        fileSize: pdfBytes.byteLength,
        rawText,
        parsed: structured,
        version: resume.version + 1,
        parentId: resume.id,
        source: "rewrite",
      },
    });

    await prisma.rewrite.create({
      data: {
        resumeId: resume.id,
        userId: user.id,
        style: parsed.style,
        section: parsed.focus,
        content: { notes },
        childResumeId: child.id,
      },
    });

    // Auto-analyze the branch once so the user immediately sees its score.
    try {
      const analysisResult = await analyzeResume(child.rawText);
      await prisma.analysis.create({
        data: {
          resumeId: child.id,
          userId: user.id,
          overallScore: Math.round(analysisResult.overallScore),
          result: analysisResult,
          model: AI_MODEL,
        },
      });
    } catch (e) {
      console.error("[runRewrite] auto-analysis failed", e);
      // Non-fatal: the branch still exists and can be analyzed manually.
    }

    revalidateTag(dashboardTag(user.id), "minutes");
    revalidateTag(resumesTag(user.id), "minutes");
    revalidatePath("/dashboard");
    revalidatePath("/resumes");
    revalidatePath(`/resumes/${resume.id}`);
    revalidatePath(`/resumes/${child.id}`);
    return { ok: true, data: { resumeId: child.id } };
  } catch (e) {
    return fail(e);
  }
}
```

- [ ] **Step 3: Add the DOCX download action**

Add after `getOriginalResumeUrl` (before `deleteResume`):

```ts
/** Renders the resume's stored structured data to a DOCX on demand. */
export async function downloadResumeDocx(
  resumeId: string,
): Promise<ActionResult<{ fileName: string; base64: string }>> {
  try {
    const user = await requireUser();
    const resume = await prisma.resume.findFirst({
      where: { id: resumeId, userId: user.id },
      select: { title: true, parsed: true },
    });
    if (!resume) return { ok: false, error: "Resume not found." };
    if (!resume.parsed)
      return { ok: false, error: "This resume has no structured data to export." };

    const bytes = await renderResumeDocx(resume.parsed as StructuredResume);
    const base64 = Buffer.from(bytes).toString("base64");
    const fileName = `${resume.title}.docx`.replace(/[^\w.\- ]+/g, "_");
    return { ok: true, data: { fileName, base64 } };
  } catch (e) {
    return fail(e);
  }
}
```

- [ ] **Step 4: Typecheck + lint**

Run: `pnpm exec tsc --noEmit && pnpm lint`
Expected: no errors in `actions.ts`. (UI files still reference the old rewrite shape / `section` prop — fixed in Tasks 8-9. If tsc surfaces those, that is expected; note them and proceed.)

- [ ] **Step 5: Commit**

```bash
git add src/features/resumes/actions.ts
git commit -m "feat: commit rewrite as analyzed child resume; DOCX download action

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 7: Queries — lineage in reads

**Files:**
- Modify: `src/features/resumes/queries.ts`

**Interfaces:**
- Produces: `getResume` result now includes `parent` and `children`; `getResumes` rows include `source`, `parentId`, `version`, `parent.title`.

- [ ] **Step 1: Extend `getResume` include**

In `src/features/resumes/queries.ts`, in `getResume` (~line 35), add to the `include` object (alongside `analyses`, `jobMatches`, `rewrites`):

```ts
      parent: { select: { id: true, title: true, version: true } },
      children: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          version: true,
          createdAt: true,
          source: true,
          analyses: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: { overallScore: true },
          },
        },
      },
```

- [ ] **Step 2: Extend `getResumes` select**

In `getResumes` (~line 16), add to the `select` object (alongside `id`, `title`, ...):

```ts
          source: true,
          parentId: true,
          parent: { select: { id: true, title: true } },
```

- [ ] **Step 3: Typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: no NEW errors in `queries.ts`. (Page files consuming these are updated in Task 9.)

- [ ] **Step 4: Commit**

```bash
git add src/features/resumes/queries.ts
git commit -m "feat: include resume lineage (parent/children) in reads

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 8: Rewrite form + download components

**Files:**
- Modify: `src/components/resumes/rewrite-form.tsx`
- Create: `src/components/resumes/resume-download.tsx`
- Delete: `src/components/resumes/rewrite-download.tsx`
- Delete: `src/lib/export/resume-doc.ts`

**Interfaces:**
- Consumes: `runRewrite` (returns `{ resumeId }` = child id), `getOriginalResumeUrl`, `downloadResumeDocx`.
- Produces: `<ResumeDownload resumeId title />` client component.

- [ ] **Step 1: Update the rewrite form**

In `src/components/resumes/rewrite-form.tsx`: rename the `section` state to `focus` and change the success handler to navigate to the new branch. Replace the `SECTIONS` label object key usage and the button `onClick`:

- Rename state: `const [focus, setFocus] = useState<keyof typeof SECTIONS>("full");` and its `<Select value={focus} onValueChange={(v) => setFocus(v as keyof typeof SECTIONS)}>`.
- Change the label above that select from "Section" to "Focus".
- Replace the `runRewrite` call + success branch:

```tsx
            const result = await runRewrite({ resumeId, style, focus });
            setBusy(false);
            if (result.ok) {
              toast.success("Branch created");
              router.push(`/resumes/${result.data.resumeId}`);
            } else {
              toast.error(result.error);
            }
```

- Change the button idle label from "Generate rewrite" to "Generate branch".

- [ ] **Step 2: Create `ResumeDownload`**

Create `src/components/resumes/resume-download.tsx`:

```tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileDown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getOriginalResumeUrl, downloadResumeDocx } from "@/features/resumes/actions";

type Fmt = "pdf" | "docx";

export function ResumeDownload({ resumeId }: { resumeId: string }) {
  const [busy, setBusy] = useState<Fmt | null>(null);

  const onPdf = async () => {
    setBusy("pdf");
    const res = await getOriginalResumeUrl(resumeId);
    setBusy(null);
    if (res.ok) window.open(res.data.url, "_blank", "noopener,noreferrer");
    else toast.error(res.error);
  };

  const onDocx = async () => {
    setBusy("docx");
    const res = await downloadResumeDocx(resumeId);
    setBusy(null);
    if (!res.ok) return toast.error(res.error);
    const bytes = Uint8Array.from(atob(res.data.base64), (c) => c.charCodeAt(0));
    const blob = new Blob([bytes], {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = res.data.fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex items-center gap-2">
      <Button size="sm" variant="outline" disabled={busy !== null} onClick={onPdf}>
        {busy === "pdf" ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <FileDown className="size-4" aria-hidden />}
        PDF
      </Button>
      <Button size="sm" variant="outline" disabled={busy !== null} onClick={onDocx}>
        {busy === "docx" ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <FileDown className="size-4" aria-hidden />}
        DOCX
      </Button>
    </div>
  );
}
```

- [ ] **Step 3: Delete the obsolete files**

```bash
git rm src/components/resumes/rewrite-download.tsx src/lib/export/resume-doc.ts
```

- [ ] **Step 4: Typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: remaining errors ONLY in `src/app/(app)/resumes/[id]/page.tsx` (still imports the deleted `RewriteDownload` and renders the old `RewriteResult` shape). Fixed in Task 9.

- [ ] **Step 5: Commit**

```bash
git add src/components/resumes/rewrite-form.tsx src/components/resumes/resume-download.tsx
git commit -m "feat: rewrite form commits a branch; server-driven PDF/DOCX download

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 9: Resume pages — lineage UI

**Files:**
- Modify: `src/app/(app)/resumes/[id]/page.tsx`
- Modify: `src/app/(app)/resumes/page.tsx`

**Interfaces:**
- Consumes: `getResume` (`parent`, `children`), `getResumes` (`source`, `parent`), `<ResumeDownload>`, `scoreVar`.

- [ ] **Step 1: Rework the resume detail page**

In `src/app/(app)/resumes/[id]/page.tsx`:

1. Replace the import of `RewriteDownload` with:

```tsx
import { ResumeDownload } from "@/components/resumes/resume-download";
```

2. Remove the now-unused `RewriteResult` / `RewriteStyle` / `REWRITE_STYLES` imports if they are no longer referenced after the edits below (keep `scoreVar`).

3. In the header block, under the `<p>` with `v{resume.version} …`, add a lineage line when this resume is a branch:

```tsx
          {resume.source === "rewrite" && resume.parent && (
            <p className="text-muted-foreground text-xs">
              Branched from{" "}
              <Link href={`/resumes/${resume.parent.id}`} className="underline">
                {resume.parent.title}
              </Link>{" "}
              · v{resume.parent.version}
            </p>
          )}
```

4. Add the `<ResumeDownload>` control into the header action row (next to `DownloadOriginalButton`):

```tsx
          <ResumeDownload resumeId={resume.id} />
```

5. Replace the entire **rewrite tab body** — the `{resume.rewrites.map((rw) => { ... })}` block (the loop rendering `RewriteResult` cards) — with a Branches list. Replace from `{resume.rewrites.map((rw) => {` through its closing `})}` with:

```tsx
          {resume.children.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Branches</CardTitle>
                <p className="text-muted-foreground text-sm">
                  Each rewrite is committed as a new resume version you can open,
                  download, and analyze on its own.
                </p>
              </CardHeader>
              <CardContent>
                <ul className="divide-border divide-y">
                  {resume.children.map((c) => {
                    const score = c.analyses[0]?.overallScore;
                    return (
                      <li key={c.id}>
                        <Link
                          href={`/resumes/${c.id}`}
                          className="hover:bg-secondary -mx-3 flex items-center justify-between gap-3 rounded-md px-3 py-3 transition-colors"
                        >
                          <div className="min-w-0">
                            <p className="truncate font-medium">{c.title}</p>
                            <p className="text-muted-foreground font-mono text-xs">
                              v{c.version} · {dateFmt.format(new Date(c.createdAt))}
                            </p>
                          </div>
                          {typeof score === "number" && (
                            <span
                              className="font-mono text-lg font-semibold tabular-nums"
                              style={{ color: scoreVar(score) }}
                            >
                              {score}
                              <span className="text-muted-foreground text-sm">/100</span>
                            </span>
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </CardContent>
            </Card>
          )}
```

This removes all use of `RewriteResult`, `REWRITE_STYLES`, `RewriteStyle`, and `Separator` in this file — delete those imports if now unused (tsc/lint will flag unused imports).

- [ ] **Step 2: Add a branch badge to the resumes list**

In `src/app/(app)/resumes/page.tsx`, for each resume row, render a small badge + parent link when `r.source === "rewrite"`. Locate where each resume's title is rendered and add beside it:

```tsx
              {r.source === "rewrite" && (
                <span className="text-muted-foreground ml-2 font-mono text-xs">
                  branch{r.parent ? ` of ${r.parent.title}` : ""}
                </span>
              )}
```

(If the list currently maps `getResumes()` rows, the row variable may be named differently — adapt the identifier to match the existing `.map(...)` callback parameter.)

- [ ] **Step 3: Typecheck + lint**

Run: `pnpm exec tsc --noEmit && pnpm lint`
Expected: PASS, no errors, no unused-import warnings.

- [ ] **Step 4: Full unit test run**

Run: `pnpm test`
Expected: PASS (all suites from Tasks 1-5).

- [ ] **Step 5: Commit**

```bash
git add "src/app/(app)/resumes/[id]/page.tsx" "src/app/(app)/resumes/page.tsx"
git commit -m "feat: resume lineage UI — branch list, badges, downloads

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 10: End-to-end verification

**Files:** none (verification only).

- [ ] **Step 1: Build**

Run: `pnpm build`
Expected: build succeeds (runs `prisma generate` then `next build`). Fix any type/lint failures surfaced.

- [ ] **Step 2: Confirm `db push` has been applied**

Ensure Task 4's `pnpm prisma db push` ran against the real Neon database (the columns `resume.parentId`, `resume.source`, `rewrite.childResumeId` must exist). If it was deferred, run it now.

- [ ] **Step 3: Drive the app (use the `run` or `verify` skill)**

Manually verify the full flow with `pnpm dev`:
1. Open an existing resume, run an analysis (note the topFixes).
2. Go to the Rewrite tab, pick a style + focus, click **Generate branch**.
3. Confirm redirect to a new resume page showing "Branched from … · vN" and an auto-computed score.
4. Confirm the parent resume's Rewrite tab lists the new branch with its score.
5. Download the branch as **PDF** and **DOCX**; open both and confirm proper structure — name + contact header, section headings, experience bullets, skills as `Category: …` (NOT everything flattened to bullets).
6. Run a job match and a further rewrite *on the branch* to confirm it behaves as a first-class resume (produces a grandchild branch).
7. Confirm the resumes list shows the branch badge + parent link.
8. Spot-check that the branch's content reflects at least one analysis fix (e.g., added metrics).

- [ ] **Step 4: Final commit (if any fixes were needed)**

```bash
git add -A
git commit -m "fix: address issues found in end-to-end verification

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Self-Review

**Spec coverage:**
- Data model (parentId/source/childResumeId) → Task 4. ✓
- Structured schema → Task 1. ✓
- AI rewrite consumes analysis + structured output → Task 5. ✓
- Server renderers (text/PDF/DOCX) → Tasks 2-3. ✓
- Commit flow (render→upload→child resume→rewrite row→auto-analyze) → Task 6. ✓
- DOCX on-demand download → Task 6 (action) + Task 8 (UI). ✓
- Queries lineage → Task 7. ✓
- UI: form redirect, lineage strip, branches list, list badge, delete old exporter → Tasks 8-9. ✓
- Verification → Task 10. ✓

**Placeholder scan:** No TBD/TODO; every code step shows full code. ✓

**Type consistency:** `runRewrite` returns `{ resumeId }` (child id) consumed by `rewrite-form` (Task 8). `rewriteResume(source, style, focus, analysis)` defined in Task 5, called in Task 6. `RewriteResult = { resume, notes }` defined Task 1, destructured Task 6. `downloadResumeDocx -> { fileName, base64 }` defined Task 6, consumed Task 8. `renderResumePdf/Text/Docx -> Uint8Array/string` defined Tasks 2-3, used Task 6. Consistent. ✓

**Notes for the executor:**
- `resume.parsed` from uploads follows `parsedResumeSchema` which lacks `headline`; passing it as `StructuredResume` source is fine (headline is optional and only present on rewrite branches).
- Verify against `node_modules` docs where flagged: jsPDF `output("arraybuffer")` server-side, `docx` `Packer.toBuffer`, `uploadthing/server` `UTFile` + `uploadFiles` return shape (`.data.ufsUrl`, `.data.key`). Adjust field names to the installed versions if they differ.
