"use client";

import { useState } from "react";
import { ContractDocument, DiscussionPanel, DocumentHeader, FindingList, type FindingId } from "@/components/contract-review-components";

export function ReviewResultWorkspace() {
  const [activeFinding, setActiveFinding] = useState<FindingId>("payment");
  const selectFromList = (finding: FindingId) => {
    setActiveFinding(finding);
    window.requestAnimationFrame(() => document.querySelector(`[data-finding-source="${finding}"]`)?.scrollIntoView({ behavior: "smooth", block: "center" }));
  };
  return <div className="min-h-[calc(100svh-57px)] bg-white"><DocumentHeader/><div className="grid min-h-[calc(100svh-121px)] lg:grid-cols-[minmax(500px,1.55fr)_390px] xl:grid-cols-[minmax(540px,1.55fr)_390px_240px]"><div className="border-b border-slate-200 lg:border-r lg:border-b-0"><ContractDocument activeFinding={activeFinding} onSelectFinding={setActiveFinding}/></div><div className="border-b border-slate-200 lg:border-b-0 xl:border-r"><FindingList activeFinding={activeFinding} onSelectFinding={selectFromList}/></div><div className="lg:col-span-2 xl:col-span-1"><DiscussionPanel/></div></div></div>;
}
