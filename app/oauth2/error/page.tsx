import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function OAuthErrorPage() {
  return (
    <Card className="mx-auto mt-16 w-full max-w-lg">
      <CardHeader>
        <CardTitle>Login could not be continued</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        The authorization request is invalid, expired, or temporarily unavailable. Return to the application and start login again.
      </CardContent>
      <CardFooter>
        <Button asChild><Link href="/">Return to portal</Link></Button>
      </CardFooter>
    </Card>
  );
}
