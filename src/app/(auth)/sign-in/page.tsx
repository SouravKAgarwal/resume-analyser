import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { AuthForm } from "@/components/auth/auth-form";

export const metadata: Metadata = { title: "Sign in" };

export default async function SignInPage() {
  const session = await getSession();
  if (session?.user) redirect("/dashboard");
  return <AuthForm mode="sign-in" />;
}
