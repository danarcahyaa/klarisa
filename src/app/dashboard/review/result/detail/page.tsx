import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { ContractDocument, DiscussionPanel, DocumentHeader, FindingList } from "@/components/contract-review-components";

export default function ReviewResultDetailPage() {
  return (
    <div className="min-h-[calc(100svh-57px)] bg-white">
      <DocumentHeader status="Temuan Pasal 02" />
      <div className="grid min-h-[calc(100svh-121px)] lg:grid-cols-[minmax(500px,1.55fr)_390px] xl:grid-cols-[minmax(540px,1.55fr)_390px_240px]">
        <div className="border-b border-slate-200 lg:border-r lg:border-b-0">
          <div className="border-b border-slate-200 px-5 py-3 sm:px-10">
            <Link href="/dashboard/review/result" className="inline-flex min-h-9 items-center gap-2 rounded-md border border-slate-200 px-3 text-xs font-bold text-klarisa-secondary transition-colors hover:border-klarisa-secondary hover:bg-[#f5f7ff]">
              <ArrowLeft className="size-3.5" />Semua temuan
            </Link>
          </div>
          <ContractDocument activeFinding="payment" />
        </div>
        <div className="border-b border-slate-200 lg:border-b-0 xl:border-r">
          <FindingList detailed activeFinding="payment" />
        </div>
        <div className="lg:col-span-2 xl:col-span-1">
          <DiscussionPanel />
        </div>
      </div>
    </div>
  );
}
