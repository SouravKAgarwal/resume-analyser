import type { RewriteResult } from "@/lib/schemas/resume";

function slug(s: string) {
  return (
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 60) || "resume"
  );
}

function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** Renders a rewrite into a cleanly formatted, single-column PDF (client-side). */
export async function downloadRewritePdf(title: string, r: RewriteResult) {
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

  const paragraph = (
    text: string,
    { size = 11, style = "normal", gap = 6, indent = 0, bullet = false }: {
      size?: number;
      style?: "normal" | "bold";
      gap?: number;
      indent?: number;
      bullet?: boolean;
    } = {},
  ) => {
    doc.setFont("helvetica", style);
    doc.setFontSize(size);
    const x = margin + indent;
    const lines = doc.splitTextToSize(text, maxW - indent) as string[];
    const lh = size * 1.35;
    lines.forEach((line, i) => {
      ensure(lh);
      if (bullet && i === 0) {
        doc.text("•", margin, y + size);
      }
      doc.text(line, x, y + size);
      y += lh;
    });
    y += gap;
  };

  const headline = r.headline?.trim() || title;
  paragraph(headline, { size: 20, style: "bold", gap: 10 });

  if (r.summary?.trim()) {
    paragraph(r.summary.trim(), { size: 11, gap: 12 });
  }

  r.sections.forEach((section) => {
    ensure(28);
    paragraph(section.title, { size: 13, style: "bold", gap: 6 });
    section.content.forEach((line) => {
      paragraph(line, { size: 11, gap: 3, indent: 16, bullet: true });
    });
    y += 6;
  });

  doc.save(`${slug(headline)}.pdf`);
}

/** Renders a rewrite into a formatted DOCX with headings and bullets (client-side). */
export async function downloadRewriteDocx(title: string, r: RewriteResult) {
  const { Document, Packer, Paragraph, TextRun, HeadingLevel } = await import("docx");

  const headline = r.headline?.trim() || title;
  const children: InstanceType<typeof Paragraph>[] = [
    new Paragraph({ heading: HeadingLevel.TITLE, children: [new TextRun({ text: headline, bold: true })] }),
  ];

  if (r.summary?.trim()) {
    children.push(new Paragraph({ children: [new TextRun(r.summary.trim())], spacing: { after: 200 } }));
  }

  r.sections.forEach((section) => {
    children.push(
      new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 80 }, children: [new TextRun({ text: section.title, bold: true })] }),
    );
    section.content.forEach((line) => {
      children.push(new Paragraph({ text: line, bullet: { level: 0 } }));
    });
  });

  const doc = new Document({ sections: [{ children }] });
  const blob = await Packer.toBlob(doc);
  saveBlob(blob, `${slug(headline)}.docx`);
}
