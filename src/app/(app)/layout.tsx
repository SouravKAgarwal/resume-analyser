import Link from "next/link";
import { FileSearch } from "lucide-react";
import { requireUser } from "@/lib/session";
import { UserMenu } from "@/components/layout/user-menu";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  return (
    <div className="flex min-h-svh flex-col">
      <header className="bg-background/80 sticky top-0 z-40 border-b backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-4 px-4">
          <nav className="flex items-center gap-6">
            <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
              <FileSearch className="size-5" aria-hidden />
              <span className="hidden sm:inline">AI Resume Analyzer</span>
            </Link>
            <Link
              href="/dashboard"
              className="text-muted-foreground hover:text-foreground text-sm transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="/resumes"
              className="text-muted-foreground hover:text-foreground text-sm transition-colors"
            >
              Resumes
            </Link>
          </nav>
          <UserMenu name={user.name} email={user.email} />
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
    </div>
  );
}
