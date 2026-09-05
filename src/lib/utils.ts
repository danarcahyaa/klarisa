import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import * as cheerio from "cheerio";
import type { AnyNode } from "domhandler";
import { DocumentSection, ParsedElement, ParsedTable, ParsedTableRow, TextSegment } from "@/types/common.type";
import type { MatchLegalArticleResult } from "@/types/legal.type";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Sanitize full name: trim extra spaces and convert to Title Case
 */
export function sanitizeFullName(name: string): string {
  if (!name) return ""
  return name
    .trim()
    .replace(/\s+/g, " ")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ")
}

/**
 * Sanitize email: trim leading/trailing whitespace and convert to lowercase
 */
export function sanitizeEmail(email: string): string {
  if (!email) return ""
  return email.trim().toLowerCase()
}

/**
 * Remove executable HTML while preserving basic rich-text formatting.
 */
export function sanitizeContractHtml(html: string): string {
  return html
    .trim()
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<iframe\b[^>]*>[\s\S]*?<\/iframe>/gi, "")
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/javascript\s*:/gi, "")
}

export function formatFileSize(bytes: number): string {
  if (bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, index)).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}


export function injectHTMLUniqueID(html: string): string {
  const $ = cheerio.load(html);
  let nodeIndex = 0;

  $("p,li,h1,h2,h3,h4,h5,h6,tr,td,th").each((_, el) => {
    const text = $(el).text().trim();
    if (text.length > 0) {
      const nodeId = `tag-${++nodeIndex}`;
      $(el).attr("data-tag-id", nodeId);
      $(el).attr("id", nodeId);
    }
  });

  return $("body").html() || html;
}


export function normalizeTextFromHtml(raw: string): string {
  return raw
    .replace(/\u00a0/g, " ")   // &nbsp; -> spasi biasa
    .replace(/[ \t]+/g, " ")    // tab & spasi berulang -> satu spasi
    .replace(/\n{2,}/g, "\n")   // newline berlebih -> satu newline
    .trim();
}

export function getTagId($el: cheerio.Cheerio<AnyNode>): string {
  return $el.attr("data-tag-id") ?? "";
}

export function walkList(
  $: cheerio.CheerioAPI,
  $ol: cheerio.Cheerio<AnyNode>,
  depth: number
): ParsedElement[] {
  const results: ParsedElement[] = [];
 
  $ol.children("li").each((_, liNode) => {
    const $li = $(liNode);
 
    // Ambil teks langsung milik <li> ini saja, tanpa teks dari <ol> anak
    // (supaya sub-item tidak terduplikasi di parent).
    const $liClone = $li.clone();
    $liClone.children("ol, ul").remove();
    const ownText = normalizeTextFromHtml($liClone.text());
 
    if (ownText.length > 0) {
      results.push({
        tagId: getTagId($li),
        tagName: "li",
        text: ownText,
        depth,
      });
    }
 
    // Rekursi ke nested list jika ada
    $li.children("ol, ul").each((_, nestedOl) => {
      results.push(...walkList($, $(nestedOl), depth + 1));
    });
  });
 
  return results;
}


export function parseTable($: cheerio.CheerioAPI, $table: cheerio.Cheerio<AnyNode>): ParsedTable {
  const rows: ParsedTableRow[] = [];
 
  $table.find("tr").each((_, trNode) => {
    const $tr = $(trNode);
    const tagIds: string[] = [];
    const cells: string[] = [];
 
    $tr.find("td, th").each((_, cellNode) => {
      const $cell = $(cellNode);
      tagIds.push(getTagId($cell.find("p").first().length ? $cell.find("p").first() : $cell));
      cells.push(normalizeTextFromHtml($cell.text()));
    });
 
    if (cells.some((c) => c.length > 0)) {
      rows.push({ tagIds, cells });
    }
  });
 
  return { tagId: getTagId($table), rows };
}

export function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") || "section";
}
 

export function parseContractHtml(html: string): DocumentSection[] {
  const $ = cheerio.load(html);
 
  // Ambil semua elemen top-level dalam urutan aslinya.
  // Selector ini sengaja eksplisit (bukan "*") supaya elemen yang tidak relevan
  // (mis. <script>, <style> sisa konversi DOCX) otomatis terabaikan.
  const topLevelSelector = "h1, h2, h3, p, ol, ul, table";
  const $topLevel = $(topLevelSelector).filter((_, node) => {
    // Hindari mengambil <ol>/<p> yang sebenarnya nested di dalam <li> atau <td>
    // (karena itu akan ditangani oleh walkList / parseTable masing-masing).
    const $node = $(node);
    return (
      $node.parents("li").length === 0 && $node.parents("td, th").length === 0
    );
  });
 
  const sections: DocumentSection[] = [];
 
  let current: DocumentSection = {
    sectionId: "preamble",
    sectionTitle: "Preamble",
    headingTagId: null,
    elements: [],
    tables: [],
  };
 
  $topLevel.each((_, node) => {
    const $node = $(node);
    const tagName = (node as any).tagName?.toLowerCase() ?? "";
 
    if (tagName === "h1" || tagName === "h2" || tagName === "h3") {
      // Heading baru -> tutup section sebelumnya, mulai section baru.
      if (current.elements.length > 0 || current.tables.length > 0) {
        sections.push(current);
      }
      const title = normalizeTextFromHtml($node.text());
      current = {
        sectionId: slugify(title),
        sectionTitle: title,
        headingTagId: getTagId($node),
        elements: [],
        tables: [],
      };
      return;
    }
 
    if (tagName === "table") {
      current.tables.push(parseTable($, $node));
      return;
    }
 
    if (tagName === "ol" || tagName === "ul") {
      current.elements.push(...walkList($, $node, 0));
      return;
    }
 
    // Default: <p> dan elemen block-level lain
    const text = normalizeTextFromHtml($node.text());
    if (text.length > 0) {
      current.elements.push({
        tagId: getTagId($node),
        tagName,
        text,
        depth: 0,
      });
    }
  });
 
  // Jangan lupa push section terakhir
  if (current.elements.length > 0 || current.tables.length > 0) {
    sections.push(current);
  }
 
  return sections;
}



/**
 * Ubah satu ParsedTable jadi baris-baris teks "Label: value1 value2",
 * dan kembalikan juga segment tag-id per baris agar tetap traceable.
 */
function renderTable(
  table: ParsedTable
): { text: string; segments: TextSegment[] }[] {
  return table.rows.map((row) => {
    // Kolom terakhir biasanya nominal/isi, kolom sebelumnya label.
    // Kita gabungkan apa adanya sesuai urutan sel supaya tidak salah asumsi struktur.
    const line = row.cells.filter((c) => c.length > 0).join(" ");
    // Semua tag-id di baris ini menunjuk ke rentang teks yang sama (baris utuh),
    // karena granularitas per-sel tidak berguna untuk retrieval semantik.
    return {
      text: line,
      segments: row.tagIds
        .filter((id) => id.length > 0)
        .map((tagId) => ({ tagId, start: 0, end: line.length })),
    };
  });
}

/**
 * Serialisasi satu DocumentSection menjadi:
 * 1. `text`      -> teks gabungan siap embed, dengan judul section sebagai konteks di awal
 * 2. `segments`  -> mapping posisi karakter -> tagId, untuk keperluan fallback split
 *
 * Konteks judul section disisipkan di awal teks (bukan cuma di metadata) supaya
 * embedding chunk tidak kehilangan konteks "ini Pasal apa" saat berdiri sendiri
 * -- teknik ini mirip dengan contextual retrieval.
 */
export function serializeSection(section: DocumentSection): {
  text: string;
  segments: TextSegment[];
} {
  const lines: string[] = [];
  const segments: TextSegment[] = [];
  let cursor = 0;

  function pushLine(line: string, tagId?: string) {
    lines.push(line);
    if (tagId) {
      segments.push({ tagId, start: cursor, end: cursor + line.length });
    }
    // +1 untuk newline yang akan menggabungkan lines nanti
    cursor += line.length + 1;
  }

  // Baris pertama: judul section sebagai konteks (kalau bukan preamble)
  if (section.headingTagId) {
    pushLine(section.sectionTitle, section.headingTagId);
  }

  for (const el of section.elements) {
    const prefix = el.tagName === "li" ? "- ".repeat(1) : "";
    pushLine(`${"  ".repeat(el.depth)}${prefix}${el.text}`, el.tagId);
  }

  for (const table of section.tables) {
    for (const row of renderTable(table)) {
      const line = row.text;
      lines.push(line);
      for (const seg of row.segments) {
        segments.push({
          tagId: seg.tagId,
          start: cursor,
          end: cursor + line.length,
        });
      }
      cursor += line.length + 1;
    }
  }

  return { text: lines.join("\n"), segments };
}

/**
 * Serializes a DocumentSection into tag-annotated text format for LLM reasoning prompt.
 * Each element (paragraph/list item) and table row is explicitly prefixed with its source tag ID(s).
 *
 * Example output:
 * [tag-30] Pihak Pertama akan memberikan/membayarkan upah...
 * [tag-31, tag-32, tag-33] a. Upah Pokok : Rp. 0
 *
 * @param section - The parsed document section to serialize.
 * @returns Serialized tag-annotated string representation of the section.
 */
export function serializeSectionWithTags(section: DocumentSection): string {
  const lines: string[] = [];

  if (section.headingTagId && section.sectionTitle) {
    lines.push(`[${section.headingTagId}] ${section.sectionTitle}`);
  } else if (section.sectionTitle && !section.headingTagId) {
    lines.push(section.sectionTitle);
  }

  for (const el of section.elements) {
    if (!el.text.trim()) continue;
    const prefix = el.tagName === "li" ? "- " : "";
    const indentation = "  ".repeat(el.depth);
    lines.push(`[${el.tagId}] ${indentation}${prefix}${el.text.trim()}`);
  }

  for (const table of section.tables) {
    for (const row of table.rows) {
      const rowText = row.cells.map((c) => c.trim()).filter(Boolean).join(" ");
      if (rowText) {
        const validTagIds = row.tagIds.filter(
          (id) => Boolean(id) && id.trim().length > 0
        );
        const tagPrefix =
          validTagIds.length > 0 ? `[${validTagIds.join(", ")}] ` : "";
        lines.push(`${tagPrefix}${rowText}`);
      }
    }
  }

  return lines.join("\n");
}

/**
 * Formats a chunk's matched legal regulations into an ID-annotated text block for the LLM prompt.
 * Each regulation is explicitly assigned its unique `[ID: <uuid>]` so the LLM can reference it
 * by ID in its JSON response rather than generating duplicate legal text.
 *
 * @param regulations - Array of matched legal article search results.
 * @returns ID-annotated string format of regulations for LLM input.
 */
export function formatRegulationsForPrompt(
  regulations: MatchLegalArticleResult[]
): string {
  if (!regulations || regulations.length === 0) {
    return "Tidak ada regulasi hukum yang ditemukan relevan dengan klausul ini.";
  }

  return regulations
    .map((reg) => {
      const name = reg.name ?? "Peraturan Perundang-undangan";
      const hierarchy = [reg.book_title, reg.chapter_title, reg.section_title]
        .filter(Boolean)
        .join(" › ");

      return [
        `[ID: ${reg.id}]`,
        `Peraturan   : ${name}`,
        hierarchy ? `Hierarki    : ${hierarchy}` : null,
        `Pasal       : ${reg.article_number}`,
        `Isi Pasal   :`,
        reg.content,
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n\n---\n\n");
}

/**
 * Builds a compact global document outline prompt header.
 * Provides the LLM with cross-clause awareness of all section titles in the contract.
 *
 * @param sections - Parsed document sections array.
 * @returns Formatted document outline string for LLM system/user prompt.
 */
export function buildDocumentOutlinePrompt(sections: DocumentSection[]): string {
  if (!sections || sections.length === 0) {
    return "";
  }

  const list = sections
    .map((sec) => `  * ${sec.sectionTitle}`)
    .join("\n");

  return [
    "KONTEKS STRUKTUR DOKUMEN:",
    "Daftar Pasal/Bagian Kontrak:",
    list,
  ].join("\n");
}




/**
 * Finds tag IDs that overlap with the character range [start, end)
 * in the section text. Used to map source tag IDs to sub-chunks when split.
 */
export function tagIdsInRange(
  segments: TextSegment[],
  start: number,
  end: number
): string[] {
  const ids = segments
    .filter((seg) => seg.start < end && seg.end > start) // overlap check
    .map((seg) => seg.tagId);
  return Array.from(new Set(ids));
}

/**
 * Finds the starting position of `needle` within `haystack`, beginning at `fromIndex`.
 * Reconstructs exact position character offsets for text splitters.
 */
export function locateChunk(
  haystack: string,
  needle: string,
  fromIndex: number
): number {
  const idx = haystack.indexOf(needle, Math.max(0, fromIndex));
  if (idx === -1) {
    return haystack.indexOf(needle);
  }
  return idx;
}

/**
 * Helper utility to split an array into chunks for batch processing.
 */
export function chunkArray<T>(array: T[], size: number): T[][] {
  const batches: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    batches.push(array.slice(i, i + size));
  }
  return batches;
}

/**
 * Helper utility to pause execution for rate limit management.
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Format ISO date string into polite Indonesian date format (e.g. "5 September 2026, 11:45")
 */
export function formatIndonesianDate(dateString?: string | null): string {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date);
  } catch {
    return dateString;
  }
}

/**
 * Check whether an error message corresponds to an API limitation or quota error.
 */
export function isLimitationError(msg?: string | null): boolean {
  if (!msg) return false;
  const lower = msg.toLowerCase();
  return (
    lower.includes("limit") ||
    lower.includes("quota") ||
    lower.includes("429") ||
    lower.includes("resource_exhausted") ||
    lower.includes("too many requests") ||
    lower.includes("rate") ||
    lower.includes("terhenti lebih awal") ||
    lower.includes("rpm") ||
    lower.includes("rpd")
  );
}

/**
 * Formats API limitation error messages into polite Indonesian user messages based on rate limit types:
 * - RPD (Requests Per Day): "Anda sudah mencapai batas harian. Coba lagi besok."
 * - RPM (Requests Per Minute) / Default Limitation: "Anda sudah mencapai batas. Coba lagi nanti."
 *
 * @param errorMessage - The raw error message string from LLM or SDK.
 * @returns Formatted polite Indonesian error message string.
 */
export function formatLimitationErrorMessage(errorMessage?: string | null): string {
  if (!errorMessage) {
    return "Anda sudah mencapai batas. Coba lagi nanti.";
  }

  const lower = errorMessage.toLowerCase();

  const isRpd =
    lower.includes("rpd") ||
    lower.includes("requests per day") ||
    lower.includes("per day") ||
    lower.includes("daily") ||
    lower.includes("day limit") ||
    lower.includes("harian");

  if (isRpd) {
    return "Anda sudah mencapai batas harian. Coba lagi besok.";
  }

  return "Anda sudah mencapai batas. Coba lagi nanti.";
}

