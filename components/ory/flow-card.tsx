"use client";

import type {
  UiContainer,
  UiNode,
  UiNodeAnchorAttributes,
  UiNodeDivisionAttributes,
  UiNodeImageAttributes,
  UiNodeInputAttributes,
  UiNodeScriptAttributes,
  UiNodeTextAttributes,
} from "@ory/client";
import Link from "next/link";
import Script from "next/script";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { OryFlowType } from "@/components/ory/flow-session";

type FlowCardProps = {
  flowType: OryFlowType;
  ui: UiContainer;
  title: string;
  description: string;
  footer?: { href: string; label: string };
};

export function FlowCard({ flowType, ui, title, description, footer }: FlowCardProps) {
  const nodeGroups = flowType === "settings" ? groupNodes(ui.nodes as UiNode[]) : null;

  return (
    <div className="mx-auto mt-16 w-full max-w-xl px-4">
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {ui.messages?.map((message) => (
              <Message key={message.id} message={message} />
            ))}
            {nodeGroups ? (
              nodeGroups.map(([group, nodes]) => (
                <form
                  key={group}
                  action={proxiedOryUrl(ui.action)}
                  method={ui.method}
                  className="space-y-4 rounded-lg border p-4"
                >
                  <div>
                    <h2 className="font-medium">{settingsGroupTitle(group)}</h2>
                    <p className="text-sm text-muted-foreground">
                      {settingsGroupDescription(group)}
                    </p>
                  </div>
                  {nodes.map((node, index) => (
                    <FlowNode key={`${node.group}-${index}`} node={node} />
                  ))}
                </form>
              ))
            ) : (
              <form action={proxiedOryUrl(ui.action)} method={ui.method} className="space-y-6">
                {ui.nodes.map((node, index) => (
                  <FlowNode key={`${node.group}-${index}`} node={node as UiNode} />
                ))}
              </form>
            )}
          </div>
        </CardContent>
        {footer && (
          <CardFooter>
            <Link className="text-sm text-muted-foreground underline" href={footer.href}>
              {footer.label}
            </Link>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}

function groupNodes(nodes: UiNode[]) {
  const sharedNodes = nodes.filter((node) => node.group === "default");
  const groups = new Map<string, UiNode[]>();

  for (const node of nodes) {
    if (node.group === "default") continue;
    groups.set(node.group, [...(groups.get(node.group) ?? []), node]);
  }

  if (groups.size === 0) {
    return [["default", sharedNodes] as const];
  }

  return Array.from(groups, ([group, groupNodes]) => [
    group,
    [...sharedNodes, ...groupNodes],
  ] as const);
}

function settingsGroupTitle(group: string) {
  const titles: Record<string, string> = {
    profile: "Profile",
    oidc: "Social accounts",
    password: "Password",
    totp: "Authenticator app",
    lookup_secret: "Recovery codes",
    webauthn: "Security keys",
    passkey: "Passkeys",
  };

  return titles[group] ?? humanize(group);
}

function settingsGroupDescription(group: string) {
  const descriptions: Record<string, string> = {
    profile: "Update the profile details stored with your identity.",
    oidc: "Link or unlink social sign-in providers.",
    password: "Set or change the password for this account.",
    totp: "Manage time-based one-time password authentication.",
    lookup_secret: "Manage one-time recovery codes.",
    webauthn: "Manage registered WebAuthn security keys.",
    passkey: "Manage passkeys registered to this account.",
  };

  return descriptions[group] ?? "Manage this authentication method.";
}

function FlowNode({ node }: { node: UiNode }) {
  switch (node.type) {
    case "input":
      return <InputNode node={node} attributes={node.attributes as UiNodeInputAttributes} />;
    case "a": {
      const attributes = node.attributes as UiNodeAnchorAttributes;
      return (
        <Button asChild variant="outline" className="w-full">
          <a href={proxiedOryUrl(attributes.href)}>{attributes.title.text}</a>
        </Button>
      );
    }
    case "img": {
      const attributes = node.attributes as UiNodeImageAttributes;
      return (
        // Ory supplies QR codes as data URLs or trusted flow assets.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={proxiedOryUrl(attributes.src)}
          width={attributes.width}
          height={attributes.height}
          alt={node.meta.label?.text ?? "Authentication QR code"}
          className="mx-auto rounded-md bg-white p-3"
        />
      );
    }
    case "script": {
      const attributes = node.attributes as UiNodeScriptAttributes;
      const src = selfHostedOryScriptUrl(attributes.src);
      if (!src) return null;

      return (
        <Script
          id={attributes.id}
          src={src}
          async={attributes.async}
          crossOrigin={attributes.crossorigin as React.ScriptHTMLAttributes<HTMLScriptElement>["crossOrigin"]}
          integrity={attributes.integrity}
          referrerPolicy={attributes.referrerpolicy as React.HTMLAttributeReferrerPolicy}
          nonce={attributes.nonce}
        />
      );
    }
    case "div": {
      const attributes = node.attributes as UiNodeDivisionAttributes;
      return <div id={attributes.id} className={attributes.class} {...dataAttributes(attributes.data)} />;
    }
    case "text": {
      const attributes = node.attributes as UiNodeTextAttributes;
      return <p className="text-sm text-muted-foreground">{attributes.text.text}</p>;
    }
    default:
      return null;
  }
}

function InputNode({
  node,
  attributes,
}: {
  node: UiNode;
  attributes: UiNodeInputAttributes;
}) {
  if (attributes.type === "hidden") {
    return <input type="hidden" name={attributes.name} value={String(attributes.value ?? "")} />;
  }

  if (attributes.type === "submit" || attributes.type === "button") {
    return (
      <Button
        type={attributes.type}
        name={attributes.name}
        value={String(attributes.value ?? "")}
        disabled={attributes.disabled}
        className="w-full"
        onClick={attributes.onclickTrigger ? () => runTrigger(attributes.onclickTrigger!) : undefined}
      >
        {node.meta.label?.text ?? attributes.label?.text ?? "Continue"}
      </Button>
    );
  }

  const label = node.meta.label?.text ?? attributes.label?.text ?? humanize(attributes.name);
  const hasError = node.messages.some((message) => message.type === "error");

  return (
    <div className="grid gap-2">
      {attributes.type === "checkbox" ? (
        <label className="flex items-center gap-3 text-sm">
          <input
            type="checkbox"
            name={attributes.name}
            value={String(attributes.value ?? "true")}
            defaultChecked={attributes.value === true}
            disabled={attributes.disabled}
            required={attributes.required}
            className="size-4 rounded border-input accent-primary"
          />
          {label}
        </label>
      ) : (
        <>
          <Label htmlFor={attributes.name}>{label}</Label>
          {attributes.options?.length ? (
            <select
              id={attributes.name}
              name={attributes.name}
              defaultValue={String(attributes.value ?? "")}
              disabled={attributes.disabled}
              required={attributes.required}
              className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm shadow-xs outline-none focus:border-ring focus:ring-3 focus:ring-ring/50"
            >
              {attributes.options.map((option) => (
                <option key={String(option.value)} value={String(option.value)}>
                  {String(option.value)}
                </option>
              ))}
            </select>
          ) : (
            <Input
              id={attributes.name}
              name={attributes.name}
              type={attributes.type}
              defaultValue={String(attributes.value ?? "")}
              autoComplete={attributes.autocomplete}
              inputMode={attributes.name.includes("code") ? "numeric" : undefined}
              disabled={attributes.disabled}
              required={attributes.required}
              maxLength={attributes.maxlength}
              pattern={attributes.pattern}
              aria-invalid={hasError}
            />
          )}
        </>
      )}
      {node.messages.map((message) => (
        <Message key={message.id} message={message} />
      ))}
    </div>
  );
}

function Message({ message }: { message: { id: number; text: string; type: string } }) {
  return (
    <p
      role={message.type === "error" ? "alert" : undefined}
      className={message.type === "error" ? "text-sm text-destructive" : "text-sm text-muted-foreground"}
    >
      {message.text}
    </p>
  );
}

function humanize(name: string) {
  return name.split(".").at(-1)!.replaceAll("_", " ").replace(/^./, (value) => value.toUpperCase());
}

function dataAttributes(data?: Record<string, string>) {
  return Object.fromEntries(Object.entries(data ?? {}).map(([key, value]) => [`data-${key}`, value]));
}

function runTrigger(name: string) {
  const trigger = (window as unknown as Record<string, unknown>)[name];
  if (typeof trigger === "function") {
    trigger();
  }
}

function proxiedOryUrl(value: string) {
  try {
    const url = new URL(value);
    if (
      url.pathname.startsWith("/self-service/") ||
      url.pathname.startsWith("/.well-known/ory/")
    ) {
      return `${url.pathname}${url.search}${url.hash}`;
    }
  } catch {
    // Relative URLs already use the current application origin.
  }

  return value;
}

function selfHostedOryScriptUrl(value: string) {
  const proxied = proxiedOryUrl(value);

  try {
    new URL(proxied);
    return null;
  } catch {
    return proxied;
  }
}
