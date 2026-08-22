import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { redirect } from "next/navigation";

import { DraftEditor } from "@/components/draft-editor";
import { getDraftServerContext } from "@/lib/draft-context";

interface CreateContractPageProps {
  searchParams: Promise<{ id?: string }>;
}

export default async function CreateContractPage({ searchParams }: CreateContractPageProps) {
  const { id } = await searchParams;
  const context = await getDraftServerContext();

  if (!context) {
    return (
      <main className="grid min-h-[calc(100svh-57px)] place-items-center px-5">
        <p className="text-sm font-semibold text-red-500">Sesi Anda telah berakhir.</p>
      </main>
    );
  }

  if (!id) {
    const created = await context.service.createDraft(context.user.id);

    if (created.success && created.data) {
      redirect(`/dashboard/create?id=${created.data.id}`);
    }

    return (
      <main className="grid min-h-[calc(100svh-57px)] place-items-center px-5">
        <section className="max-w-md text-center">
          <p className="text-sm font-semibold text-red-500">
            {created.error ?? "Draft gagal dibuat."}
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

  const result = await context.service.detail(context.user.id, id);

  if (!result.success || !result.data) {
    return (
      <main className="grid min-h-[calc(100svh-57px)] place-items-center px-5">
        <section className="max-w-md text-center">
          <p className="text-sm font-semibold text-red-500">
            {result.error ?? "Draft tidak ditemukan."}
          </p>
          <Link
            href="/dashboard/search"
            className="mt-5 inline-flex items-center gap-2 text-xs font-bold text-klarisa-secondary"
          >
            <ArrowLeft className="size-4" />
            Kembali ke daftar dokumen
          </Link>
        </section>
      </main>
    );
  }

  return <DraftEditor initialDraft={result.data} />;
}
