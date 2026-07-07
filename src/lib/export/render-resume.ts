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
