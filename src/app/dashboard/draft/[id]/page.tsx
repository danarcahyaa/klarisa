import type { Metadata } from "next";
import { DraftEditor } from "@/components/draft-editor";

export const metadata: Metadata = {
  title: "Editor Draft Kontrak | Klarisa",
  description: "Editor draft dan tinjauan kontrak hukum Klarisa",
};

interface DraftPageProps {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ backHref?: string }>;
}

export default async function DraftEditorPage({
  params,
  searchParams,
}: DraftPageProps) {
  const { id } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const backHref = resolvedSearchParams?.backHref ?? "/dashboard";

  return <DraftEditor contractId={id} backHref={backHref} />;
}