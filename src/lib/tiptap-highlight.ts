import { Highlight } from "@tiptap/extension-highlight";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    standardHighlight: {
      /**
       * Remove the highlight mark from the document (optionally filtered by mark ID),
       * collapses the selection to dismiss floating tooltips, and flags preventAutosave.
       */
      unsetHighlightMark: (id?: string) => ReturnType;
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
        renderHTML: (attributes) => (attributes.id ? { id: attributes.id } : {}),
      },
    };
  },
  addCommands() {
    return {
      ...this.parent?.(),
      unsetHighlightMark:
        (id?: string) =>
        ({ tr, dispatch, editor }: any) => {
          if (dispatch) {
            const markType = this.type || editor?.schema?.marks?.highlight;
            if (markType && tr?.doc) {
              tr.doc.descendants((node: any, pos: number) => {
                if (node.marks) {
                  node.marks.forEach((mark: any) => {
                    if (mark.type === markType && (!id || mark.attrs.id === id)) {
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
              tr.setMeta("preventAutosave", true);
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
