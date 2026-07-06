import Link from "next/link";
import { requireUser } from "@/lib/session";
import { UserMenu } from "@/components/layout/user-menu";
import { GaugeMark } from "@/components/scores/gauge-mark";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  return (
    <div className="flex min-h-svh flex-col">
      <header className="border-border bg-background sticky top-0 z-40 border-b">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between gap-6 px-4">
          <nav className="flex items-center gap-6">
            <Link href="/dashboard" className="flex items-center gap-2">
              <GaugeMark className="size-5" />
              <span className="font-display hidden text-sm font-semibold tracking-tight sm:inline">
                Resume&nbsp;Bench
              </span>
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
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">{children}</main>
    </div>
  );
}
