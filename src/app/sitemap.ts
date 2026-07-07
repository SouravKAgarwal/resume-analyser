import type { MetadataRoute } from "next";

const siteUrl = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";

// Only public, indexable routes. The app (dashboard, resumes, analyses,
// matches, profile) is auth-gated and intentionally excluded.
export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ["", "/sign-in", "/sign-up"];
  return routes.map((path) => ({
    url: `${siteUrl}${path}`,
    changeFrequency: path === "" ? "weekly" : "monthly",
    priority: path === "" ? 1 : 0.5,
  }));
}
