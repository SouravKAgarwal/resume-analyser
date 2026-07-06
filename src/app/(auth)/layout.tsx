import Link from "next/link";
import { FileSearch } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-muted/40 flex min-h-svh flex-col items-center justify-center gap-6 p-4">
      <Link href="/" className="flex items-center gap-2 font-semibold">
        <FileSearch className="size-6" aria-hidden />
        AI Resume Analyzer
      </Link>
      {children}
    </div>
  );
}
