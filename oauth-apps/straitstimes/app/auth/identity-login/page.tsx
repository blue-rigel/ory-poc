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
        {stage === "identifier" && (
          <>
            <form action="https://ory.the-blue-rigel.com/oauth2/identity-login" method="post">
              <input type="hidden" name="ticket" value={ticket} />
              <button className="identity-social-button" type="submit" name="provider" value="google-LFODuB-8">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="#4285f4" d="M21.6 12.2c0-.7-.1-1.5-.2-2.2H12v4.3h5.4a4.7 4.7 0 0 1-2 3v2.8h3.4c2-1.9 2.8-4.6 2.8-7.9Z" />
                  <path fill="#34a853" d="M12 22c2.8 0 5.2-.9 6.9-2.5l-3.4-2.7c-.9.6-2.1 1-3.5 1a6.1 6.1 0 0 1-5.7-4.2H2.8v2.8A10.4 10.4 0 0 0 12 22Z" />
                  <path fill="#fbbc05" d="M6.3 13.6A6.2 6.2 0 0 1 6 12c0-.6.1-1.1.3-1.6V7.6H2.8A10.1 10.1 0 0 0 1.7 12c0 1.6.4 3.1 1.1 4.4l3.5-2.8Z" />
                  <path fill="#ea4335" d="M12 6.2c1.5 0 2.8.5 3.9 1.5l2.9-2.9A9.8 9.8 0 0 0 12 2a10.4 10.4 0 0 0-9.2 5.6l3.5 2.8A6.1 6.1 0 0 1 12 6.2Z" />
                </svg>
                Continue with Google
              </button>
            </form>
            <div className="identity-login-divider"><span>or</span></div>
          </>
        )}
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
