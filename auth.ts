import NextAuth from "next-auth";

export const ORY_ISSUER =
  process.env.ORY_ISSUER ??
  "https://cranky-bose-9s8hbv5let.projects.oryapis.com";

function required(name: "ORY_CLIENT_ID" | "ORY_CLIENT_SECRET") {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required for portal authentication.`);
  return value;
}

export const { auth, handlers, signIn, signOut } = NextAuth({
  trustHost: true,
  session: { strategy: "jwt" },
  providers: [
    {
      id: "ory",
      name: "Ory",
      type: "oidc",
      issuer: ORY_ISSUER,
      wellKnown: `${ORY_ISSUER}/.well-known/openid-configuration`,
      clientId: required("ORY_CLIENT_ID"),
      clientSecret: required("ORY_CLIENT_SECRET"),
      checks: ["pkce", "state"],
      authorization: { params: { scope: "openid email profile" } },
    },
  ],
  callbacks: {
    jwt({ token, account, profile }) {
      if (account) {
        token.oryIdToken = account.id_token;
        token.oryIssuer = ORY_ISSUER;
        token.orySid = typeof profile?.sid === "string" ? profile.sid : undefined;
      }
      return token;
    },
    session({ session, token }) {
      session.oryIssuer = token.oryIssuer;
      session.orySid = token.orySid;
      return session;
    },
  },
});
