import type { AuthenticatorAssuranceLevel, Session } from "@ory/client";

// Static per-route AAL requirement: each protected route declares the
// minimum assurance level a session must already have reached.
export const REQUIRED_AAL_ROUTES = {
  sensitive: "aal2",
} as const satisfies Record<string, AuthenticatorAssuranceLevel>;

const AAL_RANK: Record<string, number> = {
  aal0: 0,
  aal1: 1,
  aal2: 2,
  aal3: 3,
};

export function hasRequiredAal(
  session: Pick<Session, "authenticator_assurance_level">,
  required: AuthenticatorAssuranceLevel,
): boolean {
  const current = session.authenticator_assurance_level ?? "aal0";
  return AAL_RANK[current] >= AAL_RANK[required];
}
