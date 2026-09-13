import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createDraftService } from "@/services/draft.service";
import { createReviewService } from "@/services/review.service";
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

  const sessionClient = await createClient();
  const {
    data: { user },
    error,
  } = await sessionClient.auth.getUser();

  if (error || !user) {
    redirect(`/login?next=/dashboard/draft/${id}`);
  }

  const adminClient = createAdminClient();
  const draftService = createDraftService(adminClient);
  const draftResult = await draftService.getDraftDetail(user.id, id);

  let initialDraft = null;
  let isFromReview = false;

  if (draftResult.success && draftResult.data) {
    initialDraft = draftResult.data;
  } else {
    // Fallback: Check if document exists as a review contract
    const reviewService = createReviewService(adminClient);
    const reviewResult = await reviewService.getReviewDetail(user.id, id);

    if (reviewResult.success && reviewResult.data) {
      isFromReview = true;
      initialDraft = {
        id: reviewResult.data.id,
        title: reviewResult.data.title,
        content: reviewResult.data.content,
        updatedAt: reviewResult.data.createdAt,
        createdAt: reviewResult.data.createdAt,
      };
    }
  }

  if (!initialDraft) {
    return (
      <main className="grid min-h-[calc(100svh-57px)] place-items-center px-5">
        <section className="max-w-md text-center">
          <p className="text-sm font-semibold text-red-500">
            {draftResult.error ?? "Dokumen kontrak tidak ditemukan."}
          </p>
          <Link
            href="/dashboard"
            className="mt-5 inline-flex items-center gap-2 text-xs font-bold text-klarisa-secondary"
          >
            <ArrowLeft className="size-4" />
            Kembali ke dashboard
          </Link>
        </section>
      </main>
    );
  }

  const backHref =
    resolvedSearchParams?.backHref ??
    (isFromReview ? `/dashboard/review/result/${id}` : "/dashboard");

  return (
    <DraftEditor
      initialDraft={initialDraft}
      backHref={backHref}
    />
  );
}