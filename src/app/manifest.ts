import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Resume Bench — AI resume analysis & ATS scoring",
    short_name: "Resume Bench",
    description:
      "Read your resume the way an ATS does: a /100 score across ten dimensions, job-description matching, and recruiter-grade rewrites.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0a0a0a",
    icons: [
      { src: "/favicon.ico", sizes: "any", type: "image/x-icon" },
    ],
  };
}
