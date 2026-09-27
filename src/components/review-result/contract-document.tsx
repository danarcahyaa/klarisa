"use client";

import { useEffect, useRef } from "react";

export type ContractDocumentProps = {
  htmlContent?: string | null;
  activeFinding?: string;
  onSelectFinding?: (findingId: string) => void;
  onClauseClick?: (findingId: string, targetEl: HTMLElement) => void;
};

/** Read-only view: highlights risky clauses and supports click selection */
function ContractReadView({
  htmlContent,
  activeFinding,
  onSelectFinding,
  onClauseClick,
}: ContractDocumentProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const marks = containerRef.current.querySelectorAll("[data-finding-source]");
    marks.forEach((el) => {
      const source = el.getAttribute("data-finding-source");
      if (activeFinding && source === activeFinding) {
        el.classList.add("active-highlight");
      } else {
        el.classList.remove("active-highlight");
      }
    });
  }, [activeFinding, htmlContent]);

  // Click delegation handler for highlighted clauses
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = (e.target as HTMLElement).closest("[data-finding-source]");
    if (target) {
      const sourceId = target.getAttribute("data-finding-source");
      if (sourceId) {
        onClauseClick?.(sourceId, target as HTMLElement);
      }
    }
  };

  return (
    <article className="docx-rendered-content w-full p-6 sm:p-10 lg:p-12 font-serif text-sm leading-6 text-slate-800">
      <div
        className="max-w-4xl mx-auto w-full min-h-[300px]"
        ref={containerRef}
        onClick={handleClick}
        dangerouslySetInnerHTML={{ __html: htmlContent || "" }}
      />
    </article>
  );
}

export function ContractDocument({
  htmlContent,
  activeFinding,
  onSelectFinding,
  onClauseClick,
}: ContractDocumentProps) {
  return (
    <div className="animate-in fade-in duration-200">
      <ContractReadView
        htmlContent={htmlContent}
        activeFinding={activeFinding}
        onSelectFinding={onSelectFinding}
        onClauseClick={onClauseClick}
      />
    </div>
  );
}
