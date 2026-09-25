import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getDraftServerContext } from "@/lib/draft-context";
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

  const context = await getDraftServerContext();
  if (!context) {
    redirect(`/login?next=/dashboard/draft/${id}`);
  }

  const result = await context.service.getDraftDetail(context.user.id, id);
  if (!result.success || !result.data) {
    redirect("/dashboard/create");
  }

  return (
    <DraftEditor
      contractId={id}
      initialDraft={result.data}
      backHref={backHref}
    />
  );
}