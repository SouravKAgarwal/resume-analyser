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
      line(`${s.category}: ${s.items.join(", ")}`, { size: 10, gap: 2 });
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
