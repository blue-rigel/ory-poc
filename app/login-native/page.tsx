"use client";

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
import { oryFrontendNative } from "@/lib/ory-sdk";
import { isAxiosError } from "axios";
import { useRouter } from "next/navigation";
import { useState } from "react";

export const ORY_SESSION_TOKEN_KEY = "ory_session_token";

type Mode = "login" | "register";

function extractErrorMessage(err: unknown): string {
  if (isAxiosError(err)) {
    const messages = err.response?.data?.ui?.messages as
      | Array<{ text: string }>
      | undefined;
    if (messages?.length) {
      return messages.map((m) => m.text).join(" ");
    }
    const nodeMessages = (
      err.response?.data?.ui?.nodes as
        | Array<{ messages?: Array<{ text: string }> }>
        | undefined
    )
      ?.flatMap((n) => n.messages ?? [])
      .map((m) => m.text);
    if (nodeMessages?.length) {
      return nodeMessages.join(" ");
    }
  }
  return "Something went wrong. Please try again.";
}

export default function NativeLoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function loginWithPassword(identifier: string, pw: string) {
    const { data: flow } = await oryFrontendNative.createNativeLoginFlow();
    const { data: result } = await oryFrontendNative.updateLoginFlow({
      flow: flow.id,
      updateLoginFlowBody: {
        method: "password",
        identifier,
        password: pw,
      },
    });
    return result.session_token;
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const token = await loginWithPassword(email, password);
      window.localStorage.setItem(ORY_SESSION_TOKEN_KEY, token ?? "");
      router.push("/profile");
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { data: flow } = await oryFrontendNative.createNativeRegistrationFlow();
      const { data: result } = await oryFrontendNative.updateRegistrationFlow({
        flow: flow.id,
        updateRegistrationFlowBody: {
          method: "password",
          password,
          traits: { email },
        },
      });

      const token = result.session_token ?? (await loginWithPassword(email, password));
      window.localStorage.setItem(ORY_SESSION_TOKEN_KEY, token ?? "");
      router.push("/profile");
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  const isRegister = mode === "register";

  return (
    <div className="w-1/2 m-auto mt-16">
      <Card>
        <CardHeader>
          <CardTitle>{isRegister ? "Register" : "Login"} (Native Flow)</CardTitle>
          <CardDescription>
            Talks directly to Ory&apos;s API and stores a session token, the
            pattern used by mobile/headless clients.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={isRegister ? handleRegister : handleLogin}>
            <div className="flex flex-col gap-6">
              {error && (
                <p className="text-sm text-destructive" role="alert">
                  {error}
                </p>
              )}
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading
                  ? isRegister
                    ? "Registering..."
                    : "Logging in..."
                  : isRegister
                    ? "Register"
                    : "Login"}
              </Button>
            </div>
          </form>
        </CardContent>
        <CardFooter>
          <p className="text-sm text-muted-foreground">
            {isRegister ? "Already have an account?" : "Need an account?"}{" "}
            <button
              type="button"
              className="underline cursor-pointer"
              onClick={() => {
                setMode(isRegister ? "login" : "register");
                setError(null);
              }}
            >
              {isRegister ? "Login" : "Register"} instead
            </button>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
