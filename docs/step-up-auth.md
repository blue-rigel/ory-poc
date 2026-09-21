# Step-up Authentication

## What it is

Step-up authentication means a user can be logged in with a *weaker* proof of
identity (e.g. just a password) for everyday use, but must provide an
*additional* factor before being allowed to perform a sensitive action — view
billing details, change security settings, approve a payment, etc. The
session doesn't restart; it's upgraded in place once the extra factor is
verified.

This is different from plain multi-factor authentication (MFA), where the
second factor is required for every login. With step-up, the second factor
is requested lazily, only when the user reaches something that needs it.

## How Ory models it

Ory Kratos expresses assurance with **AAL — Authenticator Assurance Level**,
loosely based on NIST 800-63B:

- **AAL1** — one factor verified (password, OIDC, passkey, code, etc.)
- **AAL2** — AAL1 plus a second, independent factor (TOTP, WebAuthn, lookup
  secret), or passwordless WebAuthn/passkey alone depending on config.

Every Ory `Session` carries:

```ts
session.authenticator_assurance_level // "aal0" | "aal1" | "aal2" | "aal3"
session.authentication_methods        // [{ method, aal, completed_at }, ...]
```

`authentication_methods` is the audit trail: every factor the user has
completed and when. `authenticator_assurance_level` is just the highest AAL
reached across those methods.

### Triggering a step-up

To make Kratos verify a stronger factor on an *existing* session:

- **Browser flow**: redirect to the login page with `?aal=aal2&refresh=true`.
  Kratos detects the user already has an AAL1 session and only asks for the
  missing second factor — not a fresh login.

### Declarative step-up

Kratos also supports requiring a minimum AAL on its own self-service flows
via `required_aal` in the project config. This project already has it set on
two flows in [project-config.yaml](../project-config.yaml):

```yaml
selfservice:
  flows:
    settings:
      required_aal: highest_available   # line 251
session:
  whoami:
    required_aal: highest_available     # line 341
```

This means visiting `/auth/settings`, or calling `/sessions/whoami`, forces
the session to AAL2 (if any AAL2 method is enrolled) before Kratos serves the
request — Kratos handles the redirect/block itself. That's great for Ory's
own hosted flows, but it doesn't help custom application routes, which is
where this PoC's app-level check comes in.

## How this PoC evaluates step-up

Custom routes can't rely on `required_aal` — that only applies to Kratos's
own flows. Instead, the app does its own **static per-route AAL assessment**:

- [`lib/step-up.ts`](../lib/step-up.ts) declares a route → required AAL map:

  ```ts
  export const REQUIRED_AAL_ROUTES = {
    sensitive: "aal2",
  };
  ```

  and `hasRequiredAal(session, required)` ranks `aal0 < aal1 < aal2 < aal3`
  and compares the session's current level against the requirement.

- [`app/sensitive/page.tsx`](../app/sensitive/page.tsx) is the protected demo
  page. On load it calls `oryFrontend.toSession()` using the browser session cookie and
  runs the assessment. The page renders the *inputs to the assessment*
  directly, so the decision isn't a black box:
  - **Required AAL** — from `REQUIRED_AAL_ROUTES.sensitive`
  - **Current AAL** — `session.authenticator_assurance_level`
  - **Assessment result** — PASS/FAIL from `hasRequiredAal`
  - **Authentication methods** — the full `authentication_methods` list
    (method + AAL + timestamp for each factor completed)

  If the assessment fails, the page shows a "Step up to aal2" button instead
  of the protected content. If it passes, the mock sensitive content renders
  with an AAL2 badge.

  In practice this surfaces a second, more aggressive layer of enforcement:
  because `required_aal: highest_available` is also set on the `whoami`
  endpoint (the one `toSession()` calls), Kratos rejects the *entire request*
  with `session_aal2_required` for any identity that has a stronger method
  enrolled but is currently only at AAL1 — it won't even return the session
  body. The page treats that specific error as "step-up required" (not "not
  logged in") and still renders the assessment panel and step-up button.

- [`app/login/page.tsx`](../app/login/page.tsx) renders both normal password
  login nodes and the TOTP nodes returned by an AAL2 browser flow. The step-up
  button starts `/self-service/login/browser?refresh=true&aal=aal2`; Ory keeps
  the existing cookie session, redirects back to `/auth/login?flow=...`, and then
  returns the user to the requested application route after verification.

## Manual test script

1. `npm run dev`.
2. Go to `/login`, register a new account (password only → AAL1).
3. Go to `/profile` — confirm you're authenticated.
4. Go to `/sensitive` — assessment shows `aal1` vs required `aal2`,
   sensitive content is hidden, "Step up to aal2" button is shown.
5. Go to `/auth/settings` (Ory-hosted UI, itself AAL2-gated by
   `required_aal`) and enroll a TOTP authenticator, if not already enrolled.
6. From `/sensitive`, click "Step up to aal2". The browser flow returns to
   `/login`; enter the current TOTP code and submit.
7. Redirected back to `/sensitive` — assessment now shows `aal2`, PASS, and
   the sensitive content renders. `authentication_methods` lists both
   `password` and `totp`.
