type IdentityLoginPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function IdentityLoginPage({ searchParams }: IdentityLoginPageProps) {
  const params = await searchParams;
  const ticket = typeof params.ticket === "string" ? params.ticket : "";
  const stage = params.stage === "password" ? "password" : "identifier";
  const error = typeof params.error === "string" ? params.error : undefined;

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <section className="w-full max-w-md rounded-lg border bg-card p-6 shadow-sm" aria-labelledby="identity-login-title">
        <h1 id="identity-login-title" className="text-2xl font-semibold">Sign in</h1>
        <p className="mt-2 text-sm text-muted-foreground">Sign in with your SPH account.</p>
        {error && <p className="mt-4 text-sm text-destructive" role="alert">{error}</p>}
        <form action="/oauth2/identity-login" method="post" className="mt-6 space-y-4">
          <input type="hidden" name="ticket" value={ticket} />
          <input type="hidden" name="stage" value={stage} />
          {stage === "identifier" ? (
            <label className="grid gap-2 text-sm font-medium">
              Email
              <input className="rounded-md border bg-background px-3 py-2" name="identifier" type="email" autoComplete="username" required autoFocus />
            </label>
          ) : (
            <label className="grid gap-2 text-sm font-medium">
              Password
              <input className="rounded-md border bg-background px-3 py-2" name="password" type="password" autoComplete="current-password" required autoFocus />
            </label>
          )}
          <button className="w-full rounded-md bg-primary px-4 py-2 text-primary-foreground" type="submit">
            {stage === "identifier" ? "Continue" : "Sign in"}
          </button>
        </form>
      </section>
    </main>
  );
}
