import { Configuration, IdentityApi } from "@ory/client";
import { ORY_SDK_URL } from "@/lib/ory-sdk";

// Identity Admin API — requires a project API key with admin scope.
// Server-only: never import this module from a client component.
if (typeof window !== "undefined") {
  throw new Error("lib/ory-admin.ts must not be imported into client code.");
}
export const oryIdentityAdmin = new IdentityApi(
  new Configuration({
    basePath: ORY_SDK_URL,
    accessToken: process.env.ORY_PROJECT_API_TOKEN,
  }),
);
