"use client";

import type { FlowError } from "@ory/client";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { oryFrontend } from "@/lib/ory-sdk";

type ErrorCardProps = {
  errorId?: string;
};

export function ErrorCard({ errorId }: ErrorCardProps) {
  const [flowError, setFlowError] = useState<FlowError | null>(null);
  const [loading, setLoading] = useState(Boolean(errorId));

  useEffect(() => {
    if (!errorId) return;

    let cancelled = false;
    oryFrontend
      .getFlowError({ id: errorId })
      .then(({ data }) => {
        if (!cancelled) setFlowError(data);
      })
      .catch(() => {
        if (!cancelled) setFlowError(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [errorId]);

  const error = flowError?.error as
    | { code?: number; message?: string; reason?: string; status?: string }
    | undefined;
  const title = loading ? "Loading error details" : error?.status ?? "Authentication error";
  const message = loading
    ? "Retrieving the authentication error from Ory."
    : error?.reason ?? error?.message ?? "The authentication flow could not be completed. Please try again.";

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 items-center px-4 py-12">
      <Card className="w-full">
        <CardHeader>
          <p className="font-mono text-xs uppercase tracking-widest text-destructive">
            {error?.code ? `Error ${error.code}` : "Ory identity"}
          </p>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm leading-6 text-muted-foreground">{message}</p>
          {errorId && (
            <div className="rounded-md border bg-muted/40 p-3">
              <p className="text-xs text-muted-foreground">Reference ID</p>
              <p className="mt-1 break-all font-mono text-xs">{errorId}</p>
            </div>
          )}
        </CardContent>
        <CardFooter className="gap-3">
          <Button asChild>
            <Link href="/auth/login">Try again</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/">Back to home</Link>
          </Button>
        </CardFooter>
      </Card>
    </main>
  );
}
