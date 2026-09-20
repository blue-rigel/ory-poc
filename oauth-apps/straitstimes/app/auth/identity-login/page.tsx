type LoginPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function IdentityLoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const ticket = typeof params.ticket === "string" ? params.ticket : "";
  const stage = params.stage === "password" ? "password" : "identifier";
  const error = typeof params.error === "string" ? params.error : undefined;

  return (
    <main className="identity-login-page">
      <section className="identity-login-card" aria-labelledby="identity-login-title">
        <div className="identity-login-brand">THE STRAITS TIMES</div>
        <h1 id="identity-login-title">Log in</h1>
        <p>Sign in with your SPH account.</p>
        {error && <p className="identity-login-error" role="alert">{error}</p>}
        <form action="https://ory.the-blue-rigel.com/oauth2/identity-login" method="post">
          <input type="hidden" name="ticket" value={ticket} />
          <input type="hidden" name="stage" value={stage} />
          {stage === "identifier" ? (
            <label>
              <span>Email</span>
              <input name="identifier" type="email" autoComplete="username" required autoFocus />
            </label>
          ) : (
            <label>
              <span>Password</span>
              <input name="password" type="password" autoComplete="current-password" required autoFocus />
            </label>
          )}
          <button type="submit">{stage === "identifier" ? "Continue" : "Log in"}</button>
        </form>
      </section>
    </main>
  );
}
