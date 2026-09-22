import { Extension } from "@tiptap/core";
import { Plugin, PluginKey, type Transaction, type EditorState } from "@tiptap/pm/state";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import type { ReviseClauseResult } from "@/types/revise-clause.type";

export const reviseSuggestionPluginKey = new PluginKey("reviseSuggestionPlugin");

export interface ReviseSuggestionStorage {
  activeRevision: ReviseClauseResult | null;
  onAccept: (() => void) | null;
  onReject: (() => void) | null;
}

/**
 * Tiptap Extension rendering the AI clause revision proposal as inline text
 * directly adjacent to the right of the struck-through original clause.
 *
 * Uses ProseMirror Decoration.widget so it flows naturally with the text,
 * avoids container boxes, and does not alter the underlying document during preview.
 */
export const ReviseSuggestionExtension = Extension.create<
  Record<string, never>,
  ReviseSuggestionStorage
>({
  name: "reviseSuggestion",

  addStorage() {
    return {
      activeRevision: null,
      onAccept: null,
      onReject: null,
    };
  },

  addProseMirrorPlugins() {
    const extension = this;

    return [
      new Plugin({
        key: reviseSuggestionPluginKey,
        props: {
          decorations(state) {
            const { activeRevision, onAccept, onReject } = extension.storage;
            if (!activeRevision) return DecorationSet.empty;

            const targetCitationId = activeRevision.citation_id;

            // Locate the exact end position of the target marked range
            let maxTo = -1;
            state.doc.descendants((node, pos) => {
              if (node.isText && node.marks) {
                for (const mark of node.marks) {
                  if (
                    mark.attrs?.id === targetCitationId ||
                    mark.attrs?.["data-revise-id"] === targetCitationId
                  ) {
                    const endPos = pos + node.nodeSize;
                    if (endPos > maxTo) {
                      maxTo = endPos;
                    }
                  }
                }
              }
            });

            if (maxTo === -1) return DecorationSet.empty;

            // Create inline widget directly at the end of the struck-through text
            const widget = Decoration.widget(
              maxTo,
              () => {
                const wrapper = document.createElement("span");
                wrapper.className = "revise-inline-wrapper not-prose";
                wrapper.setAttribute("contenteditable", "false");

                // Spacer
                const spacer = document.createTextNode(" ");
                wrapper.appendChild(spacer);

                // Revision text element styled with light green background
                const textElem = document.createElement("span");
                textElem.className = "revise-inline-suggestion";
                textElem.innerHTML = activeRevision.revision_clause;
                wrapper.appendChild(textElem);

                // Shadcn-style Button Group container (Check and X)
                const btnGroup = document.createElement("span");
                btnGroup.className = "revise-inline-btn-group";

                // Check button (Accept)
                const checkBtn = document.createElement("button");
                checkBtn.type = "button";
                checkBtn.className = "revise-inline-group-btn revise-btn-accept";
                checkBtn.title = "Terapkan";
                checkBtn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
                checkBtn.addEventListener("mousedown", (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                });
                checkBtn.addEventListener("click", (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onAccept?.();
                });
                btnGroup.appendChild(checkBtn);

                // Divider line
                const divider = document.createElement("span");
                divider.className = "revise-inline-group-divider";
                btnGroup.appendChild(divider);

                // Reject button (X)
                const rejectBtn = document.createElement("button");
                rejectBtn.type = "button";
                rejectBtn.className = "revise-inline-group-btn revise-btn-reject";
                rejectBtn.title = "Tolak";
                rejectBtn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
                rejectBtn.addEventListener("mousedown", (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                });
                rejectBtn.addEventListener("click", (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onReject?.();
                });
                btnGroup.appendChild(rejectBtn);

                wrapper.appendChild(btnGroup);


                return wrapper;
              },
              { side: 1, stopEvent: () => true }
            );

            return DecorationSet.create(state.doc, [widget]);
          },
        },
        filterTransaction(tr: Transaction, state: EditorState): boolean {
          // If transaction does not change document content, allow it (e.g. selection moves)
          if (!tr.docChanged) return true;
          // If transaction has explicit mutation approval meta, allow it
          if (tr.getMeta("allowReviseMutation") || tr.getMeta("preventAutosave")) return true;

          // Detect any active revise marks (shimmer or strikethrough) in the document
          const lockedRanges: Array<{ from: number; to: number }> = [];
          state.doc.descendants((node: ProseMirrorNode, pos: number) => {
            if (node.isText && node.marks) {
              for (const mark of node.marks) {
                if (
                  mark.attrs?.["data-revise-id"] ||
                  mark.attrs?.class?.includes("shimmer") ||
                  mark.attrs?.class?.includes("shine-text") ||
                  mark.attrs?.class === "revise-clause-strikethrough"
                ) {
                  lockedRanges.push({ from: pos, to: pos + node.nodeSize });
                }
              }
            }
          });

          if (lockedRanges.length === 0) return true;

          // If any step in the transaction mutates within a locked range, reject the transaction
          for (const step of tr.steps) {
            const stepFrom = (step as any).from;
            const stepTo = (step as any).to;
            if (stepFrom !== undefined && stepTo !== undefined) {
              for (const range of lockedRanges) {
                if (
                  (stepFrom >= range.from && stepFrom <= range.to) ||
                  (stepTo >= range.from && stepTo <= range.to) ||
                  (stepFrom <= range.from && stepTo >= range.to)
                ) {
                  return false; // Blocks editing completely
                }
              }
            }
          }

          return true;
        },
      }),
    ];
  },
});
