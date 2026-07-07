import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { AuthForm } from "@/components/auth/auth-form";

export const metadata: Metadata = {
  title: "Sign up",
  description:
    "Create a free Resume Bench account to get an ATS score, job-match analysis, and AI rewrites for your resume.",
  alternates: { canonical: "/sign-up" },
};

export default async function SignUpPage() {
  const session = await getSession();
  if (session?.user) redirect("/dashboard");
  return <AuthForm mode="sign-up" />;
}
