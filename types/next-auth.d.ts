import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    oryIssuer?: string;
    orySid?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    oryIdToken?: string;
    oryIssuer?: string;
    orySid?: string;
  }
}
