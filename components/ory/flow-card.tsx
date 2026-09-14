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

type FlowCardProps = {
  ui: UiContainer;
  title: string;
  description: string;
  footer?: { href: string; label: string };
};

export function FlowCard({ ui, title, description, footer }: FlowCardProps) {
  return (
    <div className="mx-auto mt-16 w-full max-w-xl px-4">
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={ui.action} method={ui.method} className="space-y-6">
            {ui.messages?.map((message) => (
              <Message key={message.id} message={message} />
            ))}
            {ui.nodes.map((node, index) => (
              <FlowNode key={`${node.group}-${index}`} node={node as UiNode} />
            ))}
          </form>
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

function FlowNode({ node }: { node: UiNode }) {
  switch (node.type) {
    case "input":
      return <InputNode node={node} attributes={node.attributes as UiNodeInputAttributes} />;
    case "a": {
      const attributes = node.attributes as UiNodeAnchorAttributes;
      return (
        <Button asChild variant="outline" className="w-full">
          <a href={attributes.href}>{attributes.title.text}</a>
        </Button>
      );
    }
    case "img": {
      const attributes = node.attributes as UiNodeImageAttributes;
      return (
        // Ory supplies QR codes as data URLs or trusted flow assets.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={attributes.src}
          width={attributes.width}
          height={attributes.height}
          alt={node.meta.label?.text ?? "Authentication QR code"}
          className="mx-auto rounded-md bg-white p-3"
        />
      );
    }
    case "script": {
      const attributes = node.attributes as UiNodeScriptAttributes;
      return <Script src={attributes.src} async={attributes.async} />;
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
