import Link from "next/link";

import { signOutEverywhere, signOutHere } from "@/app/auth-actions";
import { auth } from "@/auth";
import { LoginButton } from "@/components/auth/login-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) {
    return <div className="mx-auto mt-16 w-full max-w-lg text-center"><p className="mb-4 text-muted-foreground">You are not logged in to the portal.</p><LoginButton returnTo="/profile" /></div>;
  }

  return (
    <Card className="mx-auto mt-16 w-full max-w-lg">
      <CardHeader><CardTitle>User Profile</CardTitle><CardDescription>Independent portal session established through Ory OIDC.</CardDescription></CardHeader>
      <CardContent className="space-y-2 text-sm">
        <Row label="Name" value={session.user.name} />
        <Row label="Email" value={session.user.email} />
        <Row label="Login ID" value={session.user.loginId} />
        <Row label="Expires" value={session.expires} />
      </CardContent>
      <CardFooter className="flex-wrap gap-2">
        <Button asChild variant="outline"><Link href="/auth/settings">Account settings</Link></Button>
        <form action={signOutHere}><Button variant="outline" type="submit">Sign out here</Button></form>
        <form action={signOutEverywhere}><Button variant="outline" type="submit">Sign out everywhere</Button></form>
      </CardFooter>
    </Card>
  );
}

function Row({ label, value }: { label: string; value?: string | null }) {
  return <div className="flex justify-between gap-4 border-b py-1 last:border-0"><span className="text-muted-foreground">{label}</span><span className="font-medium">{value ?? "Not provided"}</span></div>;
}
