import { auth } from "@/auth";
import { signOutEverywhere, signOutHere } from "@/app/auth-actions";
import { LoginButton } from "@/components/auth/login-button";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Lock, LogIn, Monitor, ShieldCheck, Users } from "lucide-react";
import Link from "next/link";

export default async function Home() {
  const session = await auth();
  return (
    <section className="flex justify-center">
      <Card className="w-full max-w-2xl mt-16">
        <CardHeader className="text-center">
          <h1 className="text-3xl font-bold text-foreground">Ory Cloud PoC</h1>
          <p className="text-muted-foreground mt-2">
            Available flows/features for testing and demonstration purposes
          </p>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-1">
            <Button
              asChild
              variant="outline"
              className="h-14 justify-start gap-3 text-left bg-transparent"
            >
              <Link href="/profile">
                <LogIn className="h-5 w-5 text-green-600" />
                <div>
                  <div className="font-medium">Portal Profile</div>
                  <div className="text-sm text-muted-foreground">
                    OIDC session with the custom Ory login UI
                  </div>
                </div>
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              className="h-14 justify-start gap-3 text-left bg-transparent"
            >
              <Link href="/auth/settings">
                <ShieldCheck className="h-5 w-5 text-purple-600" />
                <div>
                  <div className="font-medium">Account Settings (MFA)</div>
                  <div className="text-sm text-muted-foreground">
                    Enroll TOTP and Passkey/WebAuthn, manage profile
                  </div>
                </div>
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              className="h-14 justify-start gap-3 text-left bg-transparent"
            >
              <Link href="/sensitive">
                <Lock className="h-5 w-5 text-rose-600" />
                <div>
                  <div className="font-medium">Step-up Auth Demo</div>
                  <div className="text-sm text-muted-foreground">
                    AAL2-gated route with live assessment panel
                  </div>
                </div>
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              className="h-14 justify-start gap-3 text-left bg-transparent"
            >
              <Link href="/sessions">
                <Monitor className="h-5 w-5 text-emerald-600" />
                <div>
                  <div className="font-medium">Manage Sessions</div>
                  <div className="text-sm text-muted-foreground">
                    List active sessions across devices, revoke any of them
                  </div>
                </div>
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              className="h-14 justify-start gap-3 text-left bg-transparent"
            >
              <Link href="/admin/identities">
                <Users className="h-5 w-5 text-amber-600" />
                <div>
                  <div className="font-medium">Admin: Identities</div>
                  <div className="text-sm text-muted-foreground">
                    List, disable, and delete identities via Admin API
                  </div>
                </div>
              </Link>
            </Button>
          </div>
        </CardContent>

        <CardFooter className="justify-center text-sm text-muted-foreground">
          {session?.user ? (
            <div className="flex flex-wrap items-center justify-center gap-3">
              <span>Signed in as {session.user.email ?? session.user.loginId ?? session.user.name}</span>
              <form action={signOutHere}><Button variant="outline" type="submit">Sign out here</Button></form>
              <form action={signOutEverywhere}><Button variant="outline" type="submit">Sign out everywhere</Button></form>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <LoginButton returnTo="/" />
              <span>Ory provides SSO; each app keeps its own local session.</span>
            </div>
          )}
        </CardFooter>
      </Card>
    </section>
  );
}
