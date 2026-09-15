import NextAuth from "next-auth";

export const issuer = (process.env.ORY_ISSUER ?? "https://cranky-bose-9s8hbv5let.projects.oryapis.com").replace(/\/$/, "");

function idTokenClaims(idToken?: string) {
  if (!idToken) return {};

  try {
    return JSON.parse(Buffer.from(idToken.split(".")[1], "base64url").toString()) as { iss?: unknown; sid?: unknown };
  } catch {
    return {};
  }
}

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
  session: { strategy: "jwt" },
  useSecureCookies: (process.env.AUTH_URL ?? process.env.NEXTAUTH_URL)?.startsWith("https://"),
  callbacks: {
    jwt({ token, account, profile }) {
      if (account) {
        const claims = idTokenClaims(account.id_token);
        const sid = profile?.sid ?? claims.sid;
        const tokenIssuer = profile?.iss ?? claims.iss;

        token.idToken = account.id_token;
        token.issuer = tokenIssuer === issuer ? issuer : undefined;
        token.sid = typeof sid === "string" ? sid : undefined;
      }
      return token;
    },
    session({ session, token }) {
      session.oidc = {
        issuer: typeof token.issuer === "string" ? token.issuer : undefined,
        sid: typeof token.sid === "string" ? token.sid : undefined,
      };
      return session;
    },
  },
});

declare module "next-auth" {
  interface Session {
    oidc?: {
      iss?: string;
      issuer?: string;
      sid?: string;
    };
  }
}
