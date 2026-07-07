"use client";

import { useState, useTransition } from "react";
import { revokeSession, revokeOtherSessions } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Loader2, Monitor, LogOut } from "lucide-react";
import { toast } from "sonner";

type SessionRow = {
  id: string;
  token: string;
  createdAt: Date;
  expiresAt: Date;
  ipAddress?: string | null;
  userAgent?: string | null;
};

const dateFmt = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

/** Best-effort, dependency-free UA summary. */
function describeDevice(ua?: string | null): string {
  if (!ua) return "Unknown device";
  const browser = /edg/i.test(ua)
    ? "Edge"
    : /chrome|crios/i.test(ua)
      ? "Chrome"
      : /firefox|fxios/i.test(ua)
        ? "Firefox"
        : /safari/i.test(ua)
          ? "Safari"
          : "Browser";
  const os = /windows/i.test(ua)
    ? "Windows"
    : /android/i.test(ua)
      ? "Android"
      : /iphone|ipad|ios/i.test(ua)
        ? "iOS"
        : /mac os|macintosh/i.test(ua)
          ? "macOS"
          : /linux/i.test(ua)
            ? "Linux"
            : "";
  return os ? `${browser} · ${os}` : browser;
}

export function SessionsList({
  initialSessions,
  currentToken,
}: {
  initialSessions: SessionRow[];
  currentToken: string | null;
}) {
  const [sessions, setSessions] = useState<SessionRow[]>(initialSessions);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function revokeOne(token: string) {
    setRevoking(token);
    const { error } = await revokeSession({ token });
    setRevoking(null);
    if (error) {
      toast.error(error.message ?? "Couldn't revoke session.");
      return;
    }
    toast.success("Session signed out");
    setSessions((prev) => prev.filter((s) => s.token !== token));
  }

  function revokeOthers() {
    startTransition(async () => {
      const { error } = await revokeOtherSessions();
      if (error) {
        toast.error(error.message ?? "Couldn't sign out other sessions.");
        return;
      }
      toast.success("Signed out of all other sessions");
      setSessions((prev) => prev.filter((s) => s.token === currentToken));
    });
  }

  if (sessions.length === 0) {
    return <p className="text-muted-foreground text-sm">No active sessions.</p>;
  }

  const others = sessions.filter((s) => s.token !== currentToken);

  return (
    <div className="space-y-4">
      <ul className="divide-border divide-y">
        {sessions.map((s) => {
          const isCurrent = s.token === currentToken;
          return (
            <li
              key={s.id}
              className="flex items-center justify-between gap-3 py-3"
            >
              <div className="flex min-w-0 items-start gap-3">
                <Monitor
                  className="text-muted-foreground mt-0.5 size-4 shrink-0"
                  aria-hidden
                />
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2 font-medium">
                    <span className="truncate">
                      {describeDevice(s.userAgent)}
                    </span>
                    {isCurrent && (
                      <span className="label-mono border-border rounded-full border px-1.5 py-0.5">
                        This device
                      </span>
                    )}
                  </p>
                  <p className="text-muted-foreground font-mono text-xs mt-3">
                    {s.ipAddress ? `${s.ipAddress} · ` : ""}
                    {dateFmt.format(new Date(s.createdAt))}
                  </p>
                </div>
              </div>
              {isCurrent ? (
                <span className="text-muted-foreground shrink-0 text-xs">
                  Active
                </span>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="shrink-0"
                  disabled={revoking === s.token}
                  onClick={() => revokeOne(s.token)}
                >
                  {revoking === s.token ? (
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                  ) : (
                    <LogOut className="size-4" aria-hidden />
                  )}
                  Revoke
                </Button>
              )}
            </li>
          );
        })}
      </ul>

      {others.length > 0 && (
        <Button
          variant="outline"
          size="sm"
          disabled={pending}
          onClick={revokeOthers}
        >
          {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
          Sign out all other sessions
        </Button>
      )}
    </div>
  );
}
