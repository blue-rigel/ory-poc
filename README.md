# Ory Proof of Concept

## Getting Started

Install the dependencies:

```bash
pnpm install
```

### Local HTTP

Run the non-root development server at
[http://localhost:3000](http://localhost:3000):

```bash
pnpm dev
```

### Local HTTPS

Before using the local domain, configure wildcard `.test` DNS resolution by
following [LocalDomain.md](./LocalDomain.md). Verify that `orypoc.test` resolves
to `127.0.0.1`.

Install `mkcert` and trust its local certificate authority:

```bash
brew install mkcert
mkcert -install
```

Generate the certificate and private key expected by `pnpm dev:https`:

```bash
mkdir -p .cert
mkcert \
  -cert-file .cert/orypoc.test.pem \
  -key-file .cert/orypoc.test-key.pem \
  orypoc.test
```

The `.cert` directory is excluded from Git. Keep the private key local and do
not commit it.

Run [https://orypoc.test](https://orypoc.test) and its Ory tunnel together:

```bash
./run-https.sh
```

The script starts the Ory tunnel as the current user and runs the HTTPS router
on privileged port 443 through `sudo`. The router sends `orypoc.test` directly
to the central Next.js application on port 3000. When the tunnel is run
separately, use:

```bash
ORY_APP_URL=https://orypoc.test ./ory.sh
```

## OAuth2/OIDC single sign-on

Create **two separate Server applications** in Ory Console, one for each news
site. These are confidential Next.js applications: the authorization code is
exchanged on the server and the client secret is never sent to the browser.

Configure the applications as follows:

| Application | Redirect URI | Post-logout URI |
| --- | --- | --- |
| Straits Times | `https://straitstimes.test/api/auth/callback/ory` | `https://straitstimes.test/` |
| Business Times | `https://businesstimes.test/api/auth/callback/ory` | `https://businesstimes.test/` |

Use Authorization Code and Refresh Token grants, the `code` response type, and
the `openid email profile offline_access` scopes. Enable **Skip consent** for
first-party applications if users should not see a consent screen. Keep PKCE
enabled. Do not use Machine to Machine, because that flow has no browser user;
Mobile/SPA is for public clients that cannot protect a secret.

Create the local environment file and generate a different Auth.js secret for
each application:

```bash
cp .env.oauth.example .env.oauth.local
openssl rand -base64 32
```

Put each Ory client ID/client secret and generated Auth.js secret in
`.env.oauth.local`, then run `./run-https.sh`.

The OAuth clients use the Ory Network issuer
`https://cranky-bose-9s8hbv5let.projects.oryapis.com`. The `ST_AUTH_SECRET` and
`BT_AUTH_SECRET` values do not come from Ory Console; they are private Auth.js
secrets used to encrypt each site's local session cookie. Generate them locally
with `openssl rand -base64 32` and use a different value for each application.

The sites intentionally do not share their application cookies. Each site owns
an independent, host-only Auth.js cookie. Clicking **Log in** redirects the
browser to the same Ory issuer; Ory sees its existing identity/SSO cookie and
returns immediately without asking for credentials again. The central IdP owns
the Ory cookie, while each OAuth client creates its own local session after it
validates the returned authorization code.

For production, use one stable Ory issuer/custom domain such as
`https://auth.example.com` for every client. The client sites can be unrelated
domains; OIDC SSO works through top-level redirects and does not require sharing
cookies across `straitstimes` and `businesstimes` domains. Never attempt to set a
cookie for `.test` or another public suffix.
