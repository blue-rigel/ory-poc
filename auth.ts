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
  cookies: {
    sessionToken: {
      name: "__Secure-authjs.session-token",
      options: { httpOnly: true, sameSite: "none", path: "/", secure: true },
    },
  },
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
      profile(profile) {
        const email = typeof profile.email === "string" ? profile.email : null;
        const name = typeof profile.name === "string"
          ? profile.name
          : typeof profile.preferred_username === "string"
            ? profile.preferred_username
            : email;
        return { id: profile.sub, email, name, image: null };
      },
    },
  ],
  callbacks: {
    jwt({ token, account, profile }) {
      if (account) {
        token.oryIdToken = account.id_token;
        token.oryIssuer = ORY_ISSUER;
        token.orySid = typeof profile?.sid === "string" ? profile.sid : undefined;
        token.loginId =
          typeof profile?.email === "string"
            ? profile.email
            : typeof profile?.preferred_username === "string"
              ? profile.preferred_username
              : typeof profile?.sub === "string"
                ? profile.sub
                : token.sub;
      }
      return token;
    },
    session({ session, token }) {
      session.oryIssuer = token.oryIssuer;
      session.orySid = token.orySid;
      session.user.loginId = token.loginId;
      return session;
    },
  },
});
