import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function StepUpUnavailable() {
  return (
    <main className="mx-auto mt-16 w-full max-w-xl px-4">
      <Card>
        <CardHeader>
          <CardTitle>Second factor required</CardTitle>
          <CardDescription>
            This account does not have an authentication method that Ory can use for AAL2.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            A passkey is a passwordless sign-in method. For step-up after a password login, enroll
            an authenticator app or a WebAuthn security key in account settings.
          </p>
          <p>After enrollment, return to the sensitive page and start step-up again.</p>
        </CardContent>
        <CardFooter className="gap-3">
          <Button asChild>
            <Link href="/auth/settings">Set up a second factor</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/sensitive">Back</Link>
          </Button>
        </CardFooter>
      </Card>
    </main>
  );
}
