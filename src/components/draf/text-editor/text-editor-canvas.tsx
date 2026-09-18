import { TextEditorToolbar } from "./text-editor-toolbar";
import { EditorContent, EditorContext } from "@tiptap/react";
import { AgentPanel } from "../agent/agent-panel";
import { useDraftEditor } from "@/hooks/useDraftEditor";
import { useSelectionTextDraft } from "@/hooks/useSelectionTextDraft";
import { AskSelectionTooltip } from "./ask-selection-tooltip";

interface TextEditorCanvasProps {
  initialContent?: string;
  onContentChange?: (content: string) => void;
} 

export function TextEditorCanvas({
  initialContent = "",
  onContentChange,
}: TextEditorCanvasProps) {
  const { editor } = useDraftEditor({
    initialContent,
    onContentChange,
  });

  const {
    selectedTextForAsk,
    selectedHighlightId,
    isMultiLine,
    setSelectedTextRef,
    handleSelectTextForAsk,
    handleDismissSelectedText,
  } = useSelectionTextDraft({ editor });

  return (
    <section className="min-w-0 h-full w-full">
      <EditorContext.Provider value={{ editor }}>
        <div className="w-full h-full flex justify-start items-center overflow-hidden">
          {/* Editor Column: Fixed Toolbar + Scrollable Document Canvas */}
          <div className="h-full min-w-0 flex flex-col shrink-0 w-full max-w-[760px] xl:max-w-[820px] 2xl:max-w-[860px]">
            <TextEditorToolbar
              editor={editor}
              className="w-full shrink-0"
            />

            {/* ONLY SCROLLABLE AREA: Document Canvas */}
            <div
              className="flex-1 min-h-0 overflow-y-auto border-r border-input cursor-text bg-white p-6 sm:p-8 lg:p-10 relative"
              onClick={() => editor?.chain().focus().run()}
            >
              <AskSelectionTooltip
                editor={editor}
                onAsk={handleSelectTextForAsk}
              />
              <EditorContent
                editor={editor}
                role="presentation"
                className="h-full mx-auto w-full prose max-w-none text-sm leading-6 text-slate-800 [&_.ProseMirror]:min-h-full [&_.ProseMirror]:outline-none"
              />
            </div>
          </div>

          {/* AI Agent Sidebar on the right */}
          <AgentPanel
              selectedText={selectedTextForAsk}
              highlightId={selectedHighlightId}
              isMultiLine={isMultiLine}
              setSelectedTextRef={setSelectedTextRef}
              onDismissSelectedText={handleDismissSelectedText}
              className="w-full h-full"
            />
        </div>
      </EditorContext.Provider>
    </section>
  );
}