import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-[calc(100svh-(--spacing(36)))] flex-col items-center justify-center gap-4 p-4 text-center">
      <span className="label-mono">Off scale</span>
      <h1 className="font-mono text-6xl font-semibold">404</h1>
      <p className="text-muted-foreground max-w-sm">
        This page doesn&rsquo;t exist, or you don&rsquo;t have access to it.
      </p>
      <Button asChild>
        <Link href="/dashboard">Back to dashboard</Link>
      </Button>
    </div>
  );
}
