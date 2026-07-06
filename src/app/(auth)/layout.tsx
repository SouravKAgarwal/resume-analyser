import Link from "next/link";
import { GaugeMark } from "@/components/scores/gauge-mark";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-secondary graph-grid flex min-h-svh flex-col items-center justify-center gap-8 p-4">
      <Link href="/" className="flex items-center gap-2">
        <GaugeMark className="size-6" />
        <span className="font-display text-lg font-semibold tracking-tight">Resume Bench</span>
      </Link>
      {children}
    </div>
  );
}
