import NextLink, { type LinkProps } from "next/link";
import * as React from "react";

import { Button } from "../ui/button";

function Link(props: LinkProps & { children?: React.ReactNode }) {
  return (
    <Button asChild>
      <NextLink {...props}>{props.children}</NextLink>
    </Button>
  );
}

export default Link;
