import { createOryMiddleware } from "@ory/nextjs/middleware";

import oryConfig from "@/ory.config";

export default createOryMiddleware({ project: oryConfig.project });

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
