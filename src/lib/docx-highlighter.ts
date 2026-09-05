import * as cheerio from "cheerio";

import type { ChunkReasoningResult, DisplayFinding } from "@/types/contract-review.type";

/** CSS class applied to highlighted risky clause elements in the document viewer. */
const HIGHLIGHT_CLASS_MAP: Record<string, string> = {
  VIOLATES_LAW: "finding-highlight legal-highlight",
  UNFAIR_ONE_SIDED: "finding-highlight legal-highlight",
  INCOMPLETE: "finding-highlight legal-highlight",
  COMPLIANT: "highlight-compliant",
};

export interface HighlightResult {
  highlightedHtml: string;
  processedFindings: DisplayFinding[];
}

/**
 * Injects visual highlight markers into the rebuilt HTML document and
 * produces a list of DisplayFinding objects keyed by their unique finding IDs.
 *
 * Each risky ChunkReasoningResult is assigned a `findingId` derived from
 * its node IDs. Matching HTML elements receive `data-finding-source` and
 * `data-compliance-status` attributes so the document viewer can scroll to
 * and highlight the relevant clause on selection.
 *
 * @param html     - The rebuilt HTML string from the DOCX pipeline.
 * @param findings - Raw reasoning findings from the AI pipeline.
 * @returns An object with the mutated HTML and typed DisplayFinding list.
 */
/**
 * Safely escapes string characters for CSS selectors across SSR and browser environments.
 */
function safeCssEscape(str: string): string {
  if (typeof CSS !== "undefined" && typeof CSS.escape === "function") {
    return CSS.escape(str);
  }
  return str.replace(/([#.:;?%&,.+*~'":!^$\[\]()=>|@\/\\{}])/g, "\\$1");
}

export function highlightRiskyClauses(
  html: string,
  findings: ChunkReasoningResult[]
): HighlightResult {
  if (!html || !findings || findings.length === 0) {
    return { highlightedHtml: html ?? "", processedFindings: [] };
  }

  const $ = cheerio.load(html);
  const processedFindings: DisplayFinding[] = [];

  findings.forEach((finding, index) => {
    const findingId = `finding-${index + 1}`;
    const highlightClass =
      HIGHLIGHT_CLASS_MAP[finding.compliance_status] ?? "highlight-compliant";

    // Tag each HTML node that belongs to this finding
    const nodeIds = finding.matched_node_ids ?? [];
    nodeIds.forEach((nodeId) => {
      const escaped = safeCssEscape(nodeId);
      const el = $(`#${escaped}, [data-tag-id="${escaped}"]`);
      if (el.length > 0) {
        el.attr("data-finding-source", findingId);
        el.attr("data-compliance-status", finding.compliance_status);

        const innerHtml = el.html() ?? "";
        if (innerHtml) {
          el.html(
            `<mark class="finding-highlight legal-highlight ${highlightClass}" data-finding-source="${findingId}" data-compliance-status="${finding.compliance_status}">${innerHtml}</mark>`
          );
        }
      }
    });

    processedFindings.push({
      ...finding,
      findingId,
    });
  });

  return {
    highlightedHtml: $("body").html() ?? $.html(),
    processedFindings,
  };
}
