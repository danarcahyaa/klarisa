import { Highlight } from "@tiptap/extension-highlight";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    standardHighlight: {
      /**
       * Remove the highlight mark from the document (optionally filtered by mark ID),
       * collapses the selection to dismiss floating tooltips.
       * @param id Highlight mark ID to remove. If omitted, removes all highlight marks.
       * @param preventAutosave Whether to prevent triggering draft autosave. Default is false.
       */
      unsetHighlightMark: (id?: string, preventAutosave?: boolean) => ReturnType;
    };
  }
}

/**
 * Highlight extension configured with standard HTML id attribute support
 * and transparent styling so no color is applied.
 */
export const StandardHighlight = Highlight.extend({
  addAttributes() {
    return {
      id: {
        default: null,
        parseHTML: (element) => element.getAttribute("id"),
        renderHTML: (attributes) =>
          attributes.id
            ? { id: attributes.id, class: "review-clause-mark" }
            : {},
      },
    };
  },
  addCommands() {
    return {
      ...this.parent?.(),
      unsetHighlightMark:
        (id?: string, preventAutosave = false) =>
        ({ tr, dispatch, editor }: any) => {
          if (dispatch) {
            if (tr?.doc) {
              tr.doc.descendants((node: any, pos: number) => {
                if (node.marks) {
                  node.marks.forEach((mark: any) => {
                    if (mark.attrs?.id && (!id || mark.attrs.id === id)) {
                      tr.removeMark(pos, pos + node.nodeSize, mark);
                    }
                  });
                }
              });
              // Collapse selection so floating tooltip ("Tanya" button) is immediately dismissed
              try {
                const endPos = tr.selection.to;
                tr.setSelection(
                  (editor.state.selection.constructor as any).near(tr.doc.resolve(endPos))
                );
              } catch {
                // Fallback ignored
              }
              if (preventAutosave) {
                tr.setMeta("preventAutosave", true);
              }
            }
          }
          return true;
        },
    };
  },
}).configure({
  HTMLAttributes: {
    style: "background-color: transparent; color: inherit;",
  },
});
