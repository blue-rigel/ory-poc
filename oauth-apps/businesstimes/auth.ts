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
      issuer,
      wellKnown: `${issuer}/.well-known/openid-configuration`,
      clientId: process.env.ORY_CLIENT_ID,
      clientSecret: process.env.ORY_CLIENT_SECRET,
      checks: ["pkce", "state", "nonce"],
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
      session.oidc = {
        issuer: typeof token.issuer === "string" ? token.issuer : undefined,
        sid: typeof token.sid === "string" ? token.sid : undefined,
      };
      session.user.loginId = typeof token.loginId === "string" ? token.loginId : undefined;
      return session;
    },
  },
});

declare module "next-auth" {
  interface Session {
    user: {
      name?: string | null;
      email?: string | null;
      image?: string | null;
      loginId?: string;
    };
    oidc?: {
      iss?: string;
      issuer?: string;
      sid?: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    loginId?: string;
  }
}
