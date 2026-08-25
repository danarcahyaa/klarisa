"use client";

import { FilePlus2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function CreateDraftButton({ label = "Buat kontrak", className }: { label?: string; className?: string }) {
  const router = useRouter();
  return (
    <Button
      type="button"
      variant="outline"
      size="default"
      onClick={() => router.push("/dashboard/create")}
      className={className}
    >
      <FilePlus2 className="size-4" />
      {label}
    </Button>
  );
}
