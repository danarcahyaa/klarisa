import type { Editor } from "@tiptap/react";
import { DOMSerializer } from "@tiptap/pm/model";

/**
 * Standard data ID attribute names for clause selection highlights.
 */
export type ClauseDataIdContext =
  | "data-review-id"
  | "data-repair-id"
  | "review"
  | "repair"
  | string;

export interface MarkClauseOptions {
  /** Prevent triggering draft auto-save during selection marking */
  preventAutosave?: boolean;
  /** Custom ID if already generated, otherwise auto-generated */
  id?: string;
  /** Additional custom attributes to apply to mark */
  attrs?: Record<string, any>;
}

export interface SyncHighlightsResult<T> {
  /** Items whose highlight marks are still present in the document */
  remainingItems: T[];
  /** Whether orphaned marks were removed from the document */
  hasRemovals: boolean;
  /** Set of valid mark IDs detected in the editor document */
  existingMarkIds: Set<string>;
}

/**
 * Normalizes a context string or data attribute name to standard 'data-*-id' format.
 * Examples:
 * - "review" -> "data-review-id"
 * - "repair" -> "data-repair-id"
 * - "data-review-id" -> "data-review-id"
 */
export function normalizeDataIdName(dataIdName: ClauseDataIdContext): string {
  if (dataIdName === "review" || dataIdName === "reviewClause") {
    return "data-review-id";
  }
  if (dataIdName === "repair" || dataIdName === "repairClause" || dataIdName === "revise") {
    return "data-repair-id";
  }
  return dataIdName;
}

/**
 * Generates a unique UUID or timestamp fallback for highlight marks.
 */
export function generateHighlightId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Marks the active editor selection with a contextual highlight mark.
 * Automatically generates a unique ID and attaches the appropriate data attribute and CSS class.
 *
 * @param editor The TipTap editor instance.
 * @param dataIdName Context identifier (e.g. "data-review-id", "data-repair-id", "review", "repair").
 * @param options Marking options including preventAutosave and custom ID.
 * @returns Generated highlight ID, or null if editor or selection is invalid.
 */
export function markClauseSelection(
  editor: Editor | null | undefined,
  dataIdName: ClauseDataIdContext,
  options: MarkClauseOptions = {}
): string | null {
  if (!editor || editor.isDestroyed) return null;

  const { from, to } = editor.state.selection;
  if (from === to) return null;

  const attrName = normalizeDataIdName(dataIdName);
  const generatedId = options.id || generateHighlightId();

  const chain = editor.chain();
  if (options.preventAutosave) {
    (chain as any).setMeta("preventAutosave", true);
  }

  (chain as any)
    .setHighlight({
      id: generatedId,
      [attrName]: generatedId,
      ...(options.attrs || {}),
    })
    .run();

  return generatedId;
}

/**
 * Checks if a mark belongs to the specified context (dataIdName).
 */
function isMarkInContext(mark: any, targetAttrName: string): boolean {
  if (!mark.attrs) return false;

  // Direct attribute match (e.g. data-review-id or data-repair-id)
  if (mark.attrs[targetAttrName]) return true;

  // Backward-compatibility: if target is review, accept legacy marks with only id
  if (targetAttrName === "data-review-id") {
    const isRepair = Boolean(mark.attrs["data-repair-id"]);
    if (!isRepair && mark.attrs.id) {
      return true;
    }
  }

  return false;
}

/**
 * Extracts the ID from a mark within the given context.
 */
function getMarkIdForContext(mark: any, targetAttrName: string): string | null {
  if (!mark.attrs) return null;
  return (
    mark.attrs[targetAttrName] ||
    mark.attrs.id ||
    null
  );
}

/**
 * Synchronizes editor highlight marks with target data items (e.g. ClauseReviewItem or ClauseRepairItem).
 * 1. Scans document descendants strictly for marks belonging to the specified context (dataIdName).
 * 2. Removes any orphaned marks whose ID is no longer present in targetItems.
 *    (Marks belonging to other contexts, e.g. repair marks during review sync, are preserved).
 * 3. Filters targetItems to return only those whose mark still exists in the editor document.
 *
 * @param editor The TipTap editor instance.
 * @param targetItems Array of items containing an id property.
 * @param dataIdName Context identifier (e.g. "data-review-id", "data-repair-id", "review", "repair").
 * @returns Sync result containing remainingItems, hasRemovals flag, and existingMarkIds set.
 */
export function syncHighlightsAndItems<T extends { id: string }>(
  editor: Editor | null | undefined,
  targetItems: T[],
  dataIdName: ClauseDataIdContext
): SyncHighlightsResult<T> {
  if (!editor || editor.isDestroyed || editor.isEmpty) {
    return {
      remainingItems: targetItems,
      hasRemovals: false,
      existingMarkIds: new Set(),
    };
  }

  const attrName = normalizeDataIdName(dataIdName);
  const validIds = new Set(targetItems.map((item) => item.id));
  const { tr } = editor.state;
  let hasRemovals = false;
  const existingMarkIdsInDoc = new Set<string>();

  tr.doc.descendants((node: any, pos: number) => {
    if (node.marks && node.marks.length > 0) {
      node.marks.forEach((mark: any) => {
        if (isMarkInContext(mark, attrName)) {
          const markId = getMarkIdForContext(mark, attrName);
          if (markId) {
            if (!validIds.has(markId)) {
              // Remove orphaned mark from editor document
              tr.removeMark(pos, pos + node.nodeSize, mark);
              hasRemovals = true;
            } else {
              existingMarkIdsInDoc.add(markId);
            }
          }
        }
      });
    }
  });

  if (hasRemovals) {
    editor.view.dispatch(tr);
  }

  const remainingItems = targetItems.filter((item) =>
    existingMarkIdsInDoc.has(item.id)
  );

  return {
    remainingItems,
    hasRemovals,
    existingMarkIds: existingMarkIdsInDoc,
  };
}

/**
 * Gathers all existing mark IDs in the editor document belonging to a specific context.
 * Useful in editor document update events to detect user deletion of marked ranges.
 *
 * @param editor The TipTap editor instance.
 * @param dataIdName Context identifier (e.g. "data-review-id", "data-repair-id").
 */
export function findMarkIdsInDoc(
  editor: Editor | null | undefined,
  dataIdName: ClauseDataIdContext
): Set<string> {
  const markIds = new Set<string>();
  if (!editor || editor.isDestroyed) return markIds;

  const attrName = normalizeDataIdName(dataIdName);

  editor.state.doc.descendants((node: any) => {
    if (node.marks) {
      node.marks.forEach((mark: any) => {
        if (isMarkInContext(mark, attrName)) {
          const markId = getMarkIdForContext(mark, attrName);
          if (markId) {
            markIds.add(markId);
          }
        }
      });
    }
  });

  return markIds;
}

/**
 * Finds an existing mark ID strictly within the active text selection range for the given context.
 *
 * @param editor The TipTap editor instance.
 * @param dataIdName Context identifier (e.g. "data-review-id", "data-repair-id").
 */
export function getSelectedHighlightId(
  editor: Editor | null | undefined,
  dataIdName: ClauseDataIdContext = "data-review-id"
): string | null {
  if (!editor || editor.isDestroyed) return null;
  const { from, to } = editor.state.selection;
  if (from === to) return null;

  const attrName = normalizeDataIdName(dataIdName);
  let foundId: string | null = null;

  editor.state.doc.nodesBetween(from, to, (node: any) => {
    if (node.isText && node.marks) {
      for (const mark of node.marks) {
        if (isMarkInContext(mark, attrName)) {
          const markId = getMarkIdForContext(mark, attrName);
          if (markId) {
            foundId = markId;
            return false;
          }
        }
      }
    }
  });

  return foundId;
}

/**
 * Retrieves the exact text currently spanned by a specific highlight mark in the editor document.
 *
 * @param editor The TipTap editor instance.
 * @param id The mark ID to locate.
 * @param dataIdName Context identifier (e.g. "data-review-id", "data-repair-id").
 * @returns The text string inside the highlight mark, or null if not found.
 */
export function getTextForHighlightMark(
  editor: Editor | null | undefined,
  id: string,
  dataIdName: ClauseDataIdContext = "data-review-id"
): string | null {
  if (!editor || editor.isDestroyed || !id) return null;
  const attrName = normalizeDataIdName(dataIdName);
  const parts: string[] = [];
  let lastPos = -1;

  editor.state.doc.descendants((node: any, pos: number) => {
    if (node.isText && node.marks && node.marks.length > 0) {
      for (const mark of node.marks) {
        if (isMarkInContext(mark, attrName)) {
          const markId = getMarkIdForContext(mark, attrName);
          if (markId === id) {
            if (lastPos !== -1 && pos > lastPos) {
              parts.push(" ");
            }
            parts.push(node.text || "");
            lastPos = pos + node.nodeSize;
            break;
          }
        }
      }
    }
  });

  const fullText = parts.join("").trim();
  return fullText || null;
}

/**
 * Removes a highlight mark from the editor document by ID.
 *
 * @param editor The TipTap editor instance.
 * @param id The mark ID to remove.
 * @param preventAutosave Whether to prevent autosave transaction.
 */
export function removeHighlightMark(
  editor: Editor | null | undefined,
  id: string,
  preventAutosave = false
): boolean {
  if (!editor || editor.isDestroyed) return false;
  return (editor.commands as any).unsetHighlightMark(id, preventAutosave);
}

/**
 * Updates attributes on an existing highlight mark by ID in the editor document.
 *
 * @param editor The TipTap editor instance.
 * @param id The mark ID to update.
 * @param attrsToUpdate Key-value map of attributes to update.
 * @param preventAutosave Whether to prevent autosave transaction.
 */
export function updateHighlightMarkAttrs(
  editor: Editor | null | undefined,
  id: string,
  attrsToUpdate: Record<string, any>,
  preventAutosave = false
): boolean {
  if (!editor || editor.isDestroyed) return false;
  const { tr } = editor.state;
  let updated = false;

  tr.doc.descendants((node: any, pos: number) => {
    if (node.marks && node.marks.length > 0) {
      node.marks.forEach((mark: any) => {
        const markId =
          mark.attrs?.id ||
          mark.attrs?.["data-review-id"] ||
          mark.attrs?.["data-revise-id"];
        if (markId === id) {
          const newAttrs = { ...mark.attrs, ...attrsToUpdate };
          const newMark = mark.type.create(newAttrs);
          tr.removeMark(pos, pos + node.nodeSize, mark);
          tr.addMark(pos, pos + node.nodeSize, newMark);
          updated = true;
        }
      });
    }
  });

  if (updated) {
    if (preventAutosave) {
      tr.setMeta("preventAutosave", true);
    }
    editor.view.dispatch(tr);
  }
  return updated;
}

/**
 * Checks whether a given document range [from, to] contains or touches an active revise mark
 * (e.g. struck-through clause, shimmer animation, or shine-text).
 *
 * @param editor The TipTap editor instance.
 * @param from Starting document position (optional, defaults to current selection.from).
 * @param to Ending document position (optional, defaults to current selection.to).
 * @returns boolean True if range touches an active revise/strikethrough mark.
 */
export function hasReviseMarkInRange(
  editor: Editor | null | undefined,
  from?: number,
  to?: number
): boolean {
  if (!editor || editor.isDestroyed) return false;

  const start = from !== undefined ? from : editor.state.selection.from;
  const end = to !== undefined ? to : editor.state.selection.to;
  if (start === end) return false;

  let hasRevise = false;
  editor.state.doc.nodesBetween(start, end, (node: any) => {
    if (node.isText && node.marks) {
      for (const mark of node.marks) {
        if (
          mark.attrs?.["data-revise-id"] ||
          mark.attrs?.class?.includes("revise-clause-strikethrough") ||
          mark.attrs?.class?.includes("shimmer") ||
          mark.attrs?.class?.includes("shine-text")
        ) {
          hasRevise = true;
          return false;
        }
      }
    }
  });

  return hasRevise;
}

/**
 * Serializes a document range [from, to] into clean semantic HTML supported by TipTap.
 * Strips internal highlight/revise mark elements while preserving formatting marks (e.g. strong, em, u, s).
 * Ensures block-level enclosure (e.g. <p>...</p>) if not already wrapped in a block node.
 *
 * @param editor The TipTap editor instance.
 * @param from Starting position in document.
 * @param to Ending position in document.
 * @returns Clean HTML string representing the selected range.
 */
export function getHtmlForRange(
  editor: Editor | null | undefined,
  from: number,
  to: number
): string {
  if (!editor || editor.isDestroyed || from >= to) return "";

  try {
    const slice = editor.state.doc.slice(from, to);
    const serializer = DOMSerializer.fromSchema(editor.schema);
    const fragment = serializer.serializeFragment(slice.content);

    if (typeof document === "undefined") {
      return editor.state.doc.textBetween(from, to, " ").trim();
    }

    const tempDiv = document.createElement("div");
    tempDiv.appendChild(fragment);

    // Strip internal highlight / revise mark elements while keeping their inner text/elements
    const internalMarks = tempDiv.querySelectorAll("mark");
    internalMarks.forEach((mark) => {
      mark.replaceWith(...Array.from(mark.childNodes));
    });

    let html = tempDiv.innerHTML.trim();

    // If html is not wrapped in a block tag (p, h1-h6, ul, ol, li, blockquote), wrap in <p>
    const isBlockWrapped = /^\s*<(p|h[1-6]|ul|ol|li|blockquote)[\s>]/i.test(html);
    if (html && !isBlockWrapped) {
      html = `<p>${html}</p>`;
    }

    return html;
  } catch (err) {
    console.error("[getHtmlForRange] Failed to serialize range to HTML:", err);
    const text = editor.state.doc.textBetween(from, to, " ").trim();
    return text ? `<p>${text}</p>` : "";
  }
}

export interface PopoverPlacement {
  side: "top" | "bottom";
  align: "start" | "center" | "end";
}

/**
 * Dynamically calculates preferred side and alignment for floating popovers
 * based on editor selection coordinates relative to a canvas boundary element.
 * Helps avoid collision detection flips and initial placement flicker.
 *
 * @param editor The TipTap editor instance.
 * @param canvasBoundary Optional boundary container element.
 * @param minSpaceAbove Minimum space in pixels required above selection (default: 280).
 * @param minSpaceHorizontal Minimum space in pixels required horizontally (default: 200).
 * @returns Object with preferred side ("top" | "bottom") and align ("start" | "center" | "end").
 */
export function getSelectionPopoverPlacement(
  editor: Editor | null | undefined,
  canvasBoundary?: Element | null,
  minSpaceAbove = 280,
  minSpaceHorizontal = 200
): PopoverPlacement {
  if (!editor || editor.isDestroyed) {
    return { side: "top", align: "center" };
  }

  try {
    const { from, to } = editor.state.selection;
    if (from === to) return { side: "top", align: "center" };

    const coords = editor.view.coordsAtPos(from);
    const canvasEl =
      canvasBoundary ||
      (editor.view.dom.closest("[data-editor-canvas]") as Element | null) ||
      editor.view.dom;
    const canvasRect = canvasEl?.getBoundingClientRect();

    let side: "top" | "bottom" = "top";
    let align: "start" | "center" | "end" = "center";

    if (canvasRect && coords) {
      const spaceAbove = coords.top - canvasRect.top;
      // If space above is less than minSpaceAbove, place on bottom
      if (spaceAbove < minSpaceAbove) {
        side = "bottom";
      }

      const spaceLeft = coords.left - canvasRect.left;
      const spaceRight = canvasRect.right - coords.right;
      if (spaceLeft < minSpaceHorizontal) {
        align = "start";
      } else if (spaceRight < minSpaceHorizontal) {
        align = "end";
      }
    }

    return { side, align };
  } catch {
    return { side: "top", align: "center" };
  }
}

