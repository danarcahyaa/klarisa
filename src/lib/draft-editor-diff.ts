import type { Editor } from "@tiptap/react";
import type { AgentDiffChangeItem } from "@/types/agent-contract.type";

/**
 * Finds the document range for a diff change, prioritizing highlight mark ID,
 * then falling back to matching the original text.
 */
function findTargetRange(
  editor: Editor,
  targetId?: string | null,
  originalText?: string
): { from: number; to: number } | null {
  // 1. Priority 1: Match highlight mark by target_id
  if (targetId) {
    const markType = editor.schema.marks.highlight;
    if (markType) {
      let foundRange: { from: number; to: number } | null = null;
      editor.state.doc.descendants((node, pos) => {
        if (foundRange) return false;
        if (node.isText && node.marks) {
          const matched = node.marks.find(
            (mark) => mark.attrs?.id === targetId
          );
          if (matched) {
            foundRange = { from: pos, to: pos + node.nodeSize };
            return false;
          }
        }
        return true;
      });
      if (foundRange) return foundRange;
    }
  }

  // 2. Priority 2: Fallback search by original_text in document text nodes
  if (originalText && originalText.trim().length > 0) {
    const trimmedTarget = originalText.trim();
    let foundRange: { from: number; to: number } | null = null;
    editor.state.doc.descendants((node, pos) => {
      if (foundRange) return false;
      if (node.isText && node.text) {
        const foundIndex = node.text.indexOf(trimmedTarget);
        if (foundIndex !== -1) {
          foundRange = {
            from: pos + foundIndex,
            to: pos + foundIndex + trimmedTarget.length,
          };
          return false;
        }
      }
      return true;
    });
    if (foundRange) return foundRange;
  }

  return null;
}

/**
 * Applies a proposed diff change item directly to the Tiptap editor canvas.
 * Supports:
 * - 'replace': replaces highlighted selection or matched text snippet with replacement HTML/text.
 * - 'insert': inserts new content before or after the anchor text.
 * - 'delete': removes the target clause or selection range.
 *
 * @param editor - Tiptap editor instance.
 * @param change - Structured diff item proposed by agent_diff_replace.
 * @returns boolean indicating whether the change was successfully applied.
 */
export function applyDiffChangeToEditor(
  editor: Editor | null | undefined,
  change: AgentDiffChangeItem
): boolean {
  if (!editor || editor.isDestroyed) {
    console.warn("[applyDiffChangeToEditor] Editor instance is not ready or destroyed.");
    return false;
  }

  const { target_id, action, insert_position, original_text, replacement_text } = change;
  const targetRange = findTargetRange(editor, target_id, original_text);
  const contentToInsert = replacement_text || "";

  try {
    if (action === "replace") {
      if (!targetRange) {
        console.warn("[applyDiffChangeToEditor] Target range for replace could not be located.");
        return false;
      }
      editor.chain().focus().insertContentAt(targetRange, contentToInsert).run();
    } else if (action === "delete") {
      if (!targetRange) {
        console.warn("[applyDiffChangeToEditor] Target range for delete could not be located.");
        return false;
      }
      editor.chain().focus().deleteRange(targetRange).run();
    } else if (action === "insert") {
      if (targetRange) {
        const insertPos = insert_position === "before" ? targetRange.from : targetRange.to;
        editor.chain().focus().insertContentAt(insertPos, contentToInsert).run();
      } else {
        // Append at current cursor position if anchor target not found
        editor.chain().focus().insertContent(contentToInsert).run();
      }
    }

    // Clean up temporary highlight mark if present
    if (target_id && (editor.commands as any).unsetHighlightMark) {
      (editor.commands as any).unsetHighlightMark(target_id);
    }

    return true;
  } catch (error) {
    console.error("[applyDiffChangeToEditor] Error executing editor transaction:", error);
    return false;
  }
}
