import { ErrorCard } from "@/components/ory/error-card";

type ErrorPageProps = {
  searchParams: Promise<{ id?: string }>;
};

export default async function ErrorPage({ searchParams }: ErrorPageProps) {
  const { id } = await searchParams;
  return <ErrorCard errorId={id} />;
}
