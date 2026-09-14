import NextAuth from "next-auth";

const issuer = process.env.ORY_ISSUER ?? "https://cranky-bose-9s8hbv5let.projects.oryapis.com";

export const { auth, handlers, signIn, signOut } = NextAuth({
  trustHost: true,
  providers: [
    {
      id: "ory",
      name: "Ory",
      type: "oidc",
      issuer,
      wellKnown: `${issuer}/.well-known/openid-configuration`,
      clientId: process.env.ORY_CLIENT_ID,
      clientSecret: process.env.ORY_CLIENT_SECRET,
      checks: ["pkce", "state"],
      authorization: { params: { scope: "openid email profile" } },
    },
  ],
});
