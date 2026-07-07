import type { MetadataRoute } from "next";

const siteUrl = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Keep private, auth-gated areas and API routes out of the index.
      disallow: ["/dashboard", "/resumes", "/analyses", "/matches", "/profile", "/api/"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
