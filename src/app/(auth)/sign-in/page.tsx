import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { AuthForm } from "@/components/auth/auth-form";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to Resume Bench to score, match, and rewrite your resume.",
  alternates: { canonical: "/sign-in" },
};

export default async function SignInPage() {
  const session = await getSession();
  if (session?.user) redirect("/dashboard");
  return <AuthForm mode="sign-in" />;
}
