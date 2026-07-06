"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";

type ActionResult = { ok: true } | { ok: false; error: string };

const signUpSchema = z
  .object({
    name: z.string().trim().min(1, "Enter your name.").max(100),
    email: z.string().trim().email("Enter a valid email address."),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters.")
      .max(128, "Password is too long."),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords don't match.",
    path: ["confirmPassword"],
  });

export type SignUpInput = z.input<typeof signUpSchema>;

/** Validates sign-up on the server (incl. password confirmation), then creates the account. */
export async function signUpAction(input: SignUpInput): Promise<ActionResult> {
  const parsed = signUpSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the form and try again." };
  }

  const { name, email, password } = parsed.data;
  try {
    await auth.api.signUpEmail({
      body: { name, email, password },
      headers: await headers(),
    });
    return { ok: true };
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Could not create your account. Please try again.";
    return { ok: false, error: message };
  }
}
