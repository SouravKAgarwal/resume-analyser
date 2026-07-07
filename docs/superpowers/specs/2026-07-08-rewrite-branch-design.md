# Rewrite → Committable Resume Branch — Design

Date: 2026-07-08
Status: Approved (design), pending implementation plan

## Problem

Three defects in the resume rewrite feature:

1. **Bad PDF/DOCX formatting.** `rewriteResume` returns a loose shape
   `{ headline, summary, sections: [{ title, content[] }], notes[] }`. The exporter
   (`src/lib/export/resume-doc.ts`) renders every `content` line as a bullet, so summary
   paragraphs, skill lists, and experience roles all flatten into undifferentiated bullets.
   The rewrite output also carries **no contact info** (name/email/phone/links are never
   emitted), even though `resume.parsed.personal` holds it. There is no structured resume to
   format well.

2. **Rewrite ignores analysis.** The `rewriteResume` prompt receives only
   `rawText + style + section`. It never sees the analysis `topFixes`/weaknesses, so flagged
   issues cannot be fixed by design.

3. **Rewrite cannot be analyzed.** `analyzeResume` reads `resume.rawText`. A rewrite is stored
   as JSON on a separate `Rewrite` model with no `rawText` and no `analyses` relation, so there
   is nothing to analyze, match, or re-rewrite.

## Decisions (locked with user)

- **Branch model:** promote a rewrite to a new child `Resume` row with `parentId` lineage
  (git-commit semantics). The branch is a first-class resume: analyzable, matchable,
  downloadable, re-rewritable.
- **File output:** generate PDF server-side and store it in UploadThing.
- **Analysis feed:** rewrite auto-consumes the resume's latest analysis.
- **Section scope:** rewrite always emits a **complete structured resume**; the `section`
  selector becomes a *focus hint* for what to rework hardest. Every rewrite is committable.
- **Auto-analyze:** after committing a branch, run analysis on it once automatically.

## Architecture

### 1. Data model (`prisma/schema.prisma`)

```prisma
model Resume {
  // ...existing...
  parentId String?
  parent   Resume?  @relation("lineage", fields: [parentId], references: [id], onDelete: SetNull)
  children Resume[] @relation("lineage")
  source   String   @default("upload") // "upload" | "rewrite"
}

model Rewrite {
  // ...existing style, section, content, timestamps...
  childResumeId String? @unique // the Resume this rewrite produced
  content       Json           // now = { notes: string[] } — the commit message / changelog
}
```

Apply with `pnpm prisma db push` + `pnpm prisma generate`. Existing rows are safe:
`source` defaults to `"upload"`, `parentId` is null.

The `Rewrite` row is retained as the **commit object**: it records `style`, `section` (focus),
`notes`, links parent (`resumeId`) to child (`childResumeId`). Old per-section preview rewrites
become orphaned (no `childResumeId`) — harmless.

### 2. Structured resume schema (`src/lib/schemas/resume.ts`)

Introduce `structuredResumeSchema` — the `parsedResume` shape plus an optional `headline`. The
rewrite AI outputs this instead of loose `sections[]`:

```ts
export const rewriteResultSchema = z.object({
  resume: structuredResumeSchema, // personal, headline, summary, experience[roles+bullets],
                                  // projects, skills[categorized], education, certifications,
                                  // achievements, languages, publications, volunteer
  notes: z.array(z.string()).default([]), // what changed (commit message)
});
```

`REWRITE_STYLES` unchanged. `section`/`focus` enum unchanged
(`full | summary | experience | projects | skills`).

A single structured object now drives rendering, storage, and on-screen display — this is what
eliminates the "everything becomes a bullet" bug.

### 3. AI rewrite (`src/lib/ai/resume-ai.ts`)

```ts
rewriteResume(parentStructured, style, focus, analysisFixes) -> { resume, notes }
```

- Input: parent's **parsed structure** (fall back to `rawText` only if `parsed` is null),
  the style label, the `focus` section, and the latest analysis `topFixes` + section
  `weaknesses` rendered into the prompt.
- System prompt: fix the flagged issues, preserve every fact and all contact info (never
  invent employers, dates, credentials, or metrics), rework the `focus` section hardest,
  output a complete structured resume.
- No prior analysis → `analysisFixes` is empty; the post-commit auto-analysis still scores it.
- Keep `generateJSON` + `cached` wrapper. Cache key includes style + focus + a hash of the
  structured input + a hash of the fixes.

### 4. Server-side rendering (`src/lib/export/render-resume.ts`, NEW, `server-only`)

One structured input, three deterministic renderers:

- `renderResumeText(structured): string` — plain text. Used as the branch's `rawText` (clean,
  no PDF-extraction noise) and therefore what analysis reads.
- `renderResumePdf(structured): Promise<Uint8Array>` — jsPDF. Real template: name + contact
  header line, section headings, experience entries as `Company — Title (dates)` + bullets,
  skills as `Category: a, b, c`, projects with tech + bullets, education, etc.
- `renderResumeDocx(structured): Promise<Uint8Array>` — `docx` with Heading/bullet styles.

`rawText` uses `renderResumeText` (not re-extraction of the generated PDF): `parsed` is the
single source of truth, and deterministic text avoids PDF-parser artifacts.

### 5. Commit flow (`src/features/resumes/actions.ts` — `runRewrite` rewritten)

1. `requireUser`; load parent resume (ownership check) + its latest analysis.
2. `rewriteResume(parent.parsed ?? parent.rawText, style, focus, fixes)` → `{ resume, notes }`.
3. `renderResumePdf(resume)` → upload to UploadThing (`utapi.uploadFiles`) → `fileUrl`/`fileKey`.
4. Create child `Resume`: `parsed = resume`, `rawText = renderResumeText(resume)`,
   `parentId = parent.id`, `source = "rewrite"`, `version = parent.version + 1`,
   `title = "<parent.title> · <styleLabel>"`, `fileType = "pdf"`, `fileSize`, `fileName`.
5. Create `Rewrite` commit row → set `childResumeId`.
6. Auto-run `analyzeResume(child.rawText)` and store the `Analysis`.
7. `revalidateTag`/`revalidatePath` for dashboard + resumes + the new resume page;
   return `{ resumeId: child.id }`.

DOCX download: on-demand server action `downloadResumeDocx(resumeId)` → `renderResumeDocx` from
stored `parsed` → returns bytes (base64) for client save. PDF download reuses the existing
`getOriginalResumeUrl` signed-URL path (branch has a stored `fileKey`).

### 6. UI

- **`src/components/resumes/rewrite-form.tsx`**: keep style + focus selects; button label
  "Generate branch"; on success `router.push("/resumes/<childId>")`.
- **`src/app/(app)/resumes/[id]/page.tsx`**:
  - Lineage strip when `source === "rewrite"`: "Branched from [parent] · v N" (link to parent).
  - Under the Rewrite tab: the form + a **Branches** list (children with their latest score,
    linking to each child resume). Remove the old inline preview cards and client
    `RewriteDownload`.
  - Download: PDF (existing button, now works for branches) + a DOCX button (new action).
- **`src/app/(app)/resumes/page.tsx`**: branch badge + parent link for `source === "rewrite"`
  rows; show `version`.
- **Delete** `src/lib/export/resume-doc.ts` (client exporter) and replace
  `src/components/resumes/rewrite-download.tsx` with server-driven download buttons.

### 7. Queries (`src/features/resumes/queries.ts`)

- `getResume`: `include` `parent` (id, title, version) and `children` (id, title, version,
  latest analysis score, createdAt).
- `getResumes`: select `parentId`, `source`, `version`, and parent title for the badge.

## Non-goals / YAGNI

- No editable rewrite draft UI (rejected during brainstorming).
- No diff view between parent and branch (future).
- No storing both PDF and DOCX; PDF is the stored canonical, DOCX is generated on demand.
- No pruning of old orphaned `Rewrite` preview rows in this change.

## Risks / verification points (for the plan)

- Confirm jsPDF and `docx` run in the Next 16 server runtime (Node, not edge).
- Confirm `utapi.uploadFiles` accepts server-generated bytes (`File`/`Blob`/`UTFile`).
- Confirm `onDelete: SetNull` behavior for deleting a parent that has children (branches
  survive as roots).
- Ensure the AI never drops contact info: assert `personal` is preserved from parent.
