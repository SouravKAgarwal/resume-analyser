"use client";

import { useState } from "react";
import { unlinkAccount } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Loader2, Link2Off, KeyRound, Globe } from "lucide-react";
import { toast } from "sonner";

type AccountRow = {
  id: string;
  providerId: string;
  accountId: string;
  createdAt: Date;
  scopes?: string[];
};

const dateFmt = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

const PROVIDER_LABEL: Record<string, string> = {
  credential: "Email & password",
  google: "Google",
};

function providerLabel(id: string) {
  return PROVIDER_LABEL[id] ?? id.charAt(0).toUpperCase() + id.slice(1);
}

export function AccountsList({ initialAccounts }: { initialAccounts: AccountRow[] }) {
  const [accounts, setAccounts] = useState<AccountRow[]>(initialAccounts);
  const [unlinking, setUnlinking] = useState<string | null>(null);

  async function unlink(a: AccountRow) {
    setUnlinking(a.id);
    const { error } = await unlinkAccount({
      providerId: a.providerId,
      accountId: a.accountId,
    });
    setUnlinking(null);
    if (error) {
      toast.error(error.message ?? "Couldn't unlink account.");
      return;
    }
    toast.success(`${providerLabel(a.providerId)} disconnected`);
    setAccounts((prev) => prev.filter((x) => x.id !== a.id));
  }

  if (accounts.length === 0) {
    return <p className="text-muted-foreground text-sm">No connected accounts.</p>;
  }

  // Guard: never let the user remove their only remaining sign-in method.
  const isLast = accounts.length <= 1;

  return (
    <ul className="divide-border divide-y">
      {accounts.map((a) => {
        const Icon = a.providerId === "credential" ? KeyRound : Globe;
        return (
          <li key={a.id} className="flex items-center justify-between gap-3 py-3">
            <div className="flex min-w-0 items-center gap-3">
              <Icon className="text-muted-foreground size-4 shrink-0" aria-hidden />
              <div className="min-w-0">
                <p className="truncate font-medium">{providerLabel(a.providerId)}</p>
                <p className="text-muted-foreground font-mono text-xs">
                  Connected {dateFmt.format(new Date(a.createdAt))}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="shrink-0"
              disabled={unlinking === a.id || isLast}
              title={isLast ? "You can't remove your only sign-in method." : undefined}
              onClick={() => unlink(a)}
            >
              {unlinking === a.id ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : (
                <Link2Off className="size-4" aria-hidden />
              )}
              Disconnect
            </Button>
          </li>
        );
      })}
    </ul>
  );
}
