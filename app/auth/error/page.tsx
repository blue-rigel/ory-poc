import { redirect } from "next/navigation";

type AuthErrorPageProps = {
  searchParams: Promise<{ id?: string }>;
};

export default async function AuthErrorPage({ searchParams }: AuthErrorPageProps) {
  const { id } = await searchParams;
  redirect(id ? `/error?id=${encodeURIComponent(id)}` : "/error");
}
