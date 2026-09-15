import NextAuth from "next-auth";

export const issuer = (process.env.ORY_ISSUER ?? "https://cranky-bose-9s8hbv5let.projects.oryapis.com").replace(/\/$/, "");
const authUrl = process.env.AUTH_URL ?? process.env.NEXTAUTH_URL;
const useSecureCookies = authUrl ? new URL(authUrl).protocol === "https:" : process.env.NODE_ENV === "production";

export const { auth, handlers, signIn, signOut } = NextAuth({
  trustHost: true,
  useSecureCookies,
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
  callbacks: {
    jwt({ token, account, profile }) {
      if (account) {
        token.idToken = account.id_token;
        token.sid = typeof profile?.sid === "string" ? profile.sid : undefined;
        token.iss = typeof profile?.iss === "string" ? profile.iss : issuer;
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
        sid: typeof token.sid === "string" ? token.sid : undefined,
        iss: typeof token.iss === "string" ? token.iss : undefined,
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
      sid?: string;
      iss?: string;
      issuer?: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    loginId?: string;
  }
}
