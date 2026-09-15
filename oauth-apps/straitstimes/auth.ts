import NextAuth from "next-auth";

export const issuer = (process.env.ORY_ISSUER ?? "https://cranky-bose-9s8hbv5let.projects.oryapis.com").replace(/\/$/, "");
const authUrl = process.env.AUTH_URL ?? process.env.NEXTAUTH_URL;
const useSecureCookies = authUrl ? new URL(authUrl).protocol === "https:" : process.env.NODE_ENV === "production";

export const { auth, handlers, signIn, signOut } = NextAuth({
  trustHost: true,
  useSecureCookies,
  session: { strategy: "jwt" },
  providers: [
    {
      id: "ory",
      name: "Ory",
      type: "oidc",
      issuer,
      wellKnown: `${issuer}/.well-known/openid-configuration`,
      clientId: process.env.ORY_CLIENT_ID,
      clientSecret: process.env.ORY_CLIENT_SECRET,
      checks: ["pkce", "state", "nonce"],
      authorization: { params: { scope: "openid email profile" } },
    },
  ],
  callbacks: {
    jwt({ token, account, profile }) {
      if (account) {
        token.idToken = account.id_token;
        token.sid = typeof profile?.sid === "string" ? profile.sid : undefined;
        token.iss = typeof profile?.iss === "string" ? profile.iss : issuer;
      }
      return token;
    },
    session({ session, token }) {
      session.oidc = {
        sid: typeof token.sid === "string" ? token.sid : undefined,
        iss: typeof token.iss === "string" ? token.iss : undefined,
      };
      return session;
    },
  },
});

declare module "next-auth" {
  interface Session {
    oidc?: {
      sid?: string;
      iss?: string;
      issuer?: string;
    };
  }
}
