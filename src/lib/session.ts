import "server-only";

import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

/**
 * Reads the current session from cookies. Deduplicated per request via
 * React cache so layouts, pages, and actions can all call it freely.
 */
export const getSession = cache(async () => {
  return auth.api.getSession({ headers: await headers() });
});

/** Returns the authenticated user or redirects to /sign-in. */
export async function requireUser() {
  const session = await getSession();
  if (!session?.user) {
    redirect("/sign-in");
  }
  return session.user;
}
