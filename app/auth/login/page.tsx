import { redirect } from "next/navigation";

type AuthLoginPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AuthLoginPage({ searchParams }: AuthLoginPageProps) {
  const params = await searchParams;
  const destination = new URL("/login", "https://ory.the-blue-rigel.com");

  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string") destination.searchParams.set(key, value);
  }

  redirect(`${destination.pathname}${destination.search}`);
}
