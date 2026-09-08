import { Mark, mergeAttributes } from "@tiptap/react";
import * as cheerio from "cheerio";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  UnderlineIcon,
} from "lucide-react";
import type { DraftComment } from "@/types/contract.type";
import type {
  ToolbarButton,
  LocalDraftBackup,
} from "@/types/draft-editor.type";


// Storage keys
export const DRAFT_BACKUP_KEY = "klarisa:draft:backup";
export const LEGACY_DRAFT_KEY = "klarisa:draft:content";
export const LEGACY_TITLE_KEY = "klarisa:draft:title";

// Default document template
export const DEFAULT_DOCUMENT = `
  <p>SURAT PERJANJIAN KERJA SAMA (SPK) RINGKAS</p>
  <p class="mt-3">Nomor: [NOMOR_KONTRAK]/SPK/2026</p>
  <p class="mt-3">Pada hari ini, [HARI], tanggal [TANGGAL], disepakati perjanjian kerja sama antara:</p>
  <p class="mt-2 pl-6">[NAMA PIHAK PERTAMA] (selanjutnya disebut "PIHAK PERTAMA")</p>
  <p class="mt-2 pl-6">[NAMA PIHAK KEDUA] (selanjutnya disebut "PIHAK KEDUA")</p>
  <h2 class="mt-7 font-sans text-sm font-bold">PASAL 1: RUANG LINGKUP &amp; BIAYA</h2>
  <p class="mt-2 pl-6">PIHAK KEDUA melaksanakan pekerjaan [OBJEK_PEKERJAAN] dengan total nilai imbalan Rp [NOMINAL].</p>
  <p class="mt-2 pl-6">Pembayaran dilakukan bertahap: Uang Muka (DP) [DP]% dan Pelunasan [PELUNASAN]% maksimal 7 hari kerja setelah pekerjaan diserahkan.</p>
  <h2 class="mt-7 font-sans text-sm font-bold">PASAL 3: KETENTUAN SERAH TERIMA</h2>
  <p class="mt-2 pl-6">Pekerjaan dinyatakan selesai setelah PIHAK PERTAMA menyetujui hasil akhir dan menandatangani tanda terima pekerjaan.</p>
`;

/**
 * Tiptap Mark Extension for Comment Anchors.
 * Wraps highlighted text with `<span data-comment-id="ID">` directly in Tiptap document.
 */
export const CommentMark = Mark.create({
  name: "commentMark",

  addAttributes() {
    return {
      commentId: {
        default: null,
        parseHTML: (element) =>
          element.getAttribute("data-comment-id") ||
          element.getAttribute("data-draft-comment-id"),
        renderHTML: (attributes) => {
          if (!attributes.commentId) return {};
          return {
            "data-comment-id": attributes.commentId,
            class:
              "draft-comment-anchor cursor-pointer rounded-xs bg-amber-200/90 px-0.5 ring-1 ring-amber-400/80 transition-colors hover:bg-amber-300 hover:ring-amber-500",
            title: "Klik untuk melihat komentar",
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      { tag: "span[data-comment-id]" },
      { tag: "span[data-draft-comment-id]" },
      { tag: "mark[data-comment-id]" },
      { tag: "mark[data-draft-comment-id]" },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "span",
      mergeAttributes(HTMLAttributes),
      0,
    ];
  },
});

/**
 * Uses Cheerio to parse HTML string and wrap target selected texts with `<span data-comment-id="...">`
 * for any comment that does not already have an HTML tag anchor in the document.
 */
export function ensureCommentHighlightsInHtml(
  html: string,
  comments: ReadonlyArray<DraftComment>,
): string {
  if (!html || !comments || comments.length === 0) return html;

  try {
    const $ = cheerio.load(html, null, false);

    for (const comment of comments) {
      if (comment.parentId || !comment.selectedText || !comment.id) continue;

      const commentId = comment.id;
      // Strip leading/trailing quote marks that user selection or UI might include
      const cleanSelectedText = comment.selectedText.replace(/^[“"'\s]+|[”"'\s]+$/g, "").trim();
      const targetText = cleanSelectedText || comment.selectedText.trim();
      if (!targetText) continue;

      const existing = $(
        `[data-comment-id="${commentId}"], [data-draft-comment-id="${commentId}"]`,
      );
      if (existing.length > 0) continue;

      let matched = false;

      $("*").each((_, element) => {
        if (matched) return;
        $(element)
          .contents()
          .each((_, node) => {
            if (matched) return;
            if (node.type === "text" && node.data) {
              const textContent = node.data;

              // 1. Direct text match
              if (textContent.includes(targetText)) {
                const idx = textContent.indexOf(targetText);
                const before = textContent.substring(0, idx);
                const after = textContent.substring(idx + targetText.length);

                const spanTag = `<span data-comment-id="${commentId}" class="draft-comment-anchor cursor-pointer rounded-xs bg-amber-200/90 px-0.5 ring-1 ring-amber-400/80 transition-colors hover:bg-amber-300 hover:ring-amber-500" title="Klik untuk melihat komentar">${targetText}</span>`;
                const replacement = `${before}${spanTag}${after}`;
                $(node).replaceWith(replacement);
                matched = true;
                return;
              }

              // 2. Normalized quote/whitespace match fallback
              const normContent = textContent.replace(/[\u201C\u201D"]/g, '"');
              const normTarget = targetText.replace(/[\u201C\u201D"]/g, '"');
              if (normTarget && normContent.includes(normTarget)) {
                const idx = normContent.indexOf(normTarget);
                const actualSub = textContent.substring(idx, idx + normTarget.length);
                const before = textContent.substring(0, idx);
                const after = textContent.substring(idx + normTarget.length);

                const spanTag = `<span data-comment-id="${commentId}" class="draft-comment-anchor cursor-pointer rounded-xs bg-amber-200/90 px-0.5 ring-1 ring-amber-400/80 transition-colors hover:bg-amber-300 hover:ring-amber-500" title="Klik untuk melihat komentar">${actualSub}</span>`;
                const replacement = `${before}${spanTag}${after}`;
                $(node).replaceWith(replacement);
                matched = true;
                return;
              }
            }
          });
      });
    }

    return $.html();
  } catch (err) {
    console.error("Failed to enrich HTML with cheerio comment highlights:", err);
    return html;
  }
}

// Toolbar buttons configuration
export const TOOLBAR_BUTTONS: ToolbarButton[] = [
  {
    label: "Tebal (Ctrl+B)",
    icon: Bold,
    action: (editor) => editor.chain().focus().toggleBold().run(),
    isActive: (editor) => editor.isActive("bold"),
  },
  {
    label: "Miring (Ctrl+I)",
    icon: Italic,
    action: (editor) => editor.chain().focus().toggleItalic().run(),
    isActive: (editor) => editor.isActive("italic"),
  },
  {
    label: "Garis bawah (Ctrl+U)",
    icon: UnderlineIcon,
    action: (editor) => editor.chain().focus().toggleUnderline().run(),
    isActive: (editor) => editor.isActive("underline"),
  },
  {
    label: "Daftar",
    icon: List,
    action: (editor) => editor.chain().focus().toggleBulletList().run(),
    isActive: (editor) => editor.isActive("bulletList"),
  },
  {
    label: "Daftar bernomor",
    icon: ListOrdered,
    action: (editor) => editor.chain().focus().toggleOrderedList().run(),
    isActive: (editor) => editor.isActive("orderedList"),
  },
  {
    label: "Rata kiri",
    icon: AlignLeft,
    action: (editor) => {
      type ChainWithAlign = { setTextAlign?: (align: string) => { run: () => boolean } };
      (editor.chain().focus() as unknown as ChainWithAlign).setTextAlign?.("left")?.run();
    },
    isActive: (editor) => editor.isActive({ textAlign: "left" }),
  },
  {
    label: "Rata tengah",
    icon: AlignCenter,
    action: (editor) => {
      type ChainWithAlign = { setTextAlign?: (align: string) => { run: () => boolean } };
      (editor.chain().focus() as unknown as ChainWithAlign).setTextAlign?.("center")?.run();
    },
    isActive: (editor) => editor.isActive({ textAlign: "center" }),
  },
  {
    label: "Rata kanan",
    icon: AlignRight,
    action: (editor) => {
      type ChainWithAlign = { setTextAlign?: (align: string) => { run: () => boolean } };
      (editor.chain().focus() as unknown as ChainWithAlign).setTextAlign?.("right")?.run();
    },
    isActive: (editor) => editor.isActive({ textAlign: "right" }),
  },
];

/**
 * Read draft backup from localStorage with validation.
 */
export function readLocalDraftBackup(draftId: string): LocalDraftBackup | null {
  try {
    const value = localStorage.getItem(`${DRAFT_BACKUP_KEY}:${draftId}`);
    if (!value) return null;
    const backup = JSON.parse(value) as Partial<LocalDraftBackup>;
    if (
      typeof backup.content !== "string" ||
      typeof backup.title !== "string" ||
      typeof backup.savedAt !== "string"
    )
      return null;
    return backup as LocalDraftBackup;
  } catch {
    return null;
  }
}

