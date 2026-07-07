import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getSession } from "@/lib/session";
import { ProfileForm } from "@/components/profile/profile-form";
import { SessionsList } from "@/components/profile/sessions-list";
import { AccountsList } from "@/components/profile/accounts-list";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Profile",
  description: "Manage your profile, active sessions, and connected accounts.",
};

export default async function ProfilePage() {
  const session = await getSession();
  if (!session?.user) redirect("/sign-in");
  const { user, session: current } = session;

  // Fetch sessions + linked accounts on the server so the client components
  // render with data immediately — no loading waterfall, no effect.
  const hdrs = await headers();
  const [sessions, accounts] = await Promise.all([
    auth.api.listSessions({ headers: hdrs }).catch(() => []),
    auth.api.listUserAccounts({ headers: hdrs }).catch(() => []),
  ]);

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <span className="label-mono">Account</span>
        <h1 className="text-3xl font-semibold">Profile</h1>
        <p className="text-muted-foreground">
          Update your details, review where you&rsquo;re signed in, and manage connected accounts.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Your details</CardTitle>
          <p className="text-muted-foreground text-sm">
            Your name and photo appear across the app.
          </p>
        </CardHeader>
        <CardContent>
          <ProfileForm name={user.name} email={user.email} image={user.image ?? null} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Active sessions</CardTitle>
          <p className="text-muted-foreground text-sm">
            Devices currently signed in to your account. Revoke any you don&rsquo;t recognize.
          </p>
        </CardHeader>
        <CardContent>
          <SessionsList
            initialSessions={JSON.parse(JSON.stringify(sessions))}
            currentToken={current?.token ?? null}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Connected accounts</CardTitle>
          <p className="text-muted-foreground text-sm">
            Sign-in methods linked to your account.
          </p>
        </CardHeader>
        <CardContent>
          <AccountsList initialAccounts={JSON.parse(JSON.stringify(accounts))} />
        </CardContent>
      </Card>
    </div>
  );
}
