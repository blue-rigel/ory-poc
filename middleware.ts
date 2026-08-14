import { createOryMiddleware } from "@ory/nextjs/middleware";

export default createOryMiddleware({});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
