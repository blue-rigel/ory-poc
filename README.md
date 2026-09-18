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

Create three separate **Server applications** in Ory Console, one for the portal
and one for each news site. These are confidential Next.js applications: the
authorization code is exchanged on the server and client secrets never reach
the browser.

Configure the applications as follows:

| Application | Redirect URI | Front-channel logout URI | Post-logout URI |
| --- | --- | --- | --- |
| Portal | `https://orypoc.test/api/auth/callback/ory` | `https://orypoc.test/api/auth/frontchannel-logout` | `https://orypoc.test/` |
| Straits Times | `https://straitstimes.test/api/auth/callback/ory` | `https://straitstimes.test/api/auth/frontchannel-logout` | `https://straitstimes.test/` |
| Business Times | `https://businesstimes.test/api/auth/callback/ory` | `https://businesstimes.test/api/auth/frontchannel-logout` | `https://businesstimes.test/` |

Use the Authorization Code grant, the `code` response type, HTTP Basic client
authentication, and the `openid email profile` scopes. The applications do not
retain refresh tokens, so they do not request `offline_access`. Enable **Skip
consent**, **Skip logout consent**, PKCE, and front-channel logout session for
these trusted first-party applications.

Set the project OAuth login URL to
`https://orypoc.test/oauth2/login`. Keep the issuer and all discovery/token
traffic on `https://cranky-bose-9s8hbv5let.projects.oryapis.com`. Create a
Project API Key for the custom login endpoint and store it only as
`ORY_PROJECT_API_TOKEN` in the portal server environment.

Each application owns its environment files. Copy the corresponding tracked
examples, then generate a different Auth.js secret for each application:

```bash
cp .env.example .env
cp .env.local.example .env.local
cp oauth-apps/straitstimes/.env.example oauth-apps/straitstimes/.env
cp oauth-apps/straitstimes/.env.local.example oauth-apps/straitstimes/.env.local
cp oauth-apps/businesstimes/.env.example oauth-apps/businesstimes/.env
cp oauth-apps/businesstimes/.env.local.example oauth-apps/businesstimes/.env.local
openssl rand -base64 32
```

Put portal values in the root `.env` and `.env.local` files. Put each news
application's Ory client ID/client secret and generated Auth.js secret in that
application's own `oauth-apps/<app>/.env.local`, then run `./run-https.sh`.

The OAuth clients use the Ory Network issuer
`https://cranky-bose-9s8hbv5let.projects.oryapis.com`. Each application's
`AUTH_SECRET` does not come from Ory Console; it encrypts that app's local
Auth.js session cookie. Generate a different value for each application.

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

Login opens a popup on supported desktop browsers and falls back to a same-tab
redirect when popups are blocked, closed, time out, or the device uses a coarse
pointer. **Sign out here** clears only the current app's local session. **Sign
out everywhere** reliably clears the initiating app and Ory provider session;
clearing other apps through front-channel iframes is best-effort because browser
third-party cookie policies can prevent those apps from receiving their cookie.
