"use client";

import { FilePlus2 } from "lucide-react";
import { useRouter } from "next/navigation";

import { cn } from "@/lib/utils";

export function CreateDraftButton({ label = "Buat kontrak", className }: { label?: string; className?: string }) {
  const router = useRouter();
  return <button type="button" onClick={() => router.push("/dashboard/create")} className={cn("inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 transition-colors hover:border-klarisa-secondary hover:text-klarisa-secondary", className)}><FilePlus2 className="size-4"/>{label}</button>;
}
