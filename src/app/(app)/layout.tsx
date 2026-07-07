import Link from "next/link";
import { NextSSRPlugin } from "@uploadthing/react/next-ssr-plugin";
import { extractRouterConfig } from "uploadthing/server";
import { requireUser } from "@/lib/session";
import { UserMenu } from "@/components/layout/user-menu";
import { GaugeMark } from "@/components/scores/gauge-mark";
import { uploadRouter } from "@/app/api/uploadthing/core";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  return (
    <div className="flex min-h-svh flex-col">
      <NextSSRPlugin routerConfig={extractRouterConfig(uploadRouter)} />
      <header className="border-border bg-background sticky top-0 z-40 border-b">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between gap-4 px-4 sm:gap-6">
          <nav className="flex items-center gap-4 sm:gap-6">
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
            <Link
              href="/resumes/upload"
              className="text-muted-foreground hover:text-foreground text-sm transition-colors"
            >
              Upload
            </Link>
          </nav>
          <UserMenu name={user.name} email={user.email} image={user.image} />
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:py-10">{children}</main>
    </div>
  );
}
