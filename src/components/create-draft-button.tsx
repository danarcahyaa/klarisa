"use client";

import { FilePlus2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { createDraftAction } from "@/app/actions/draft.action";
import { cn } from "@/lib/utils";

export function CreateDraftButton({ label = "Buat kontrak", className }: { label?: string; className?: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return <div className="grid gap-1"><button type="button" disabled={isPending} onClick={() => startTransition(async () => {
    setError(null);
    const result = await createDraftAction();
    if (!result.success || !result.data) {
      setError(result.error ?? "Draft gagal dibuat.");
      return;
    }
    router.push(`/dashboard/create?id=${result.data.id}`);
  })} className={cn("inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 transition-colors hover:border-klarisa-secondary hover:text-klarisa-secondary disabled:cursor-wait disabled:opacity-60", className)}><FilePlus2 className="size-4"/>{isPending ? "Membuat draft..." : label}</button>{error && <small className="max-w-48 text-[9px] leading-4 text-red-500">{error}</small>}</div>;
}
