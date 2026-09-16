import { useEffect } from "react";
import { TextEditorToolbar } from "./text-editor-toolbar";
import { EditorContent, EditorContext, useEditor } from "@tiptap/react";
import { StarterKit } from "@tiptap/starter-kit";
import Heading from "@tiptap/extension-heading";
import { BulletList, OrderedList, ListItem } from "@tiptap/extension-list";
import { TaskItem } from "@tiptap/extension-task-item";
import { TextAlign } from "@tiptap/extension-text-align";
import { TextStyleKit } from "@tiptap/extension-text-style";
import { Paragraph } from "@tiptap/extension-paragraph";
import { Document } from "@tiptap/extension-document";
import { TableKit } from "@tiptap/extension-table";
import { Text } from "@tiptap/extension-text";
import { Bold } from "@tiptap/extension-bold";
import { Italic } from "@tiptap/extension-italic";
import { Underline } from "@tiptap/extension-underline";
import { Strike } from "@tiptap/extension-strike";
import { AgentPanel } from "../chat-ai/agent-panel";

interface TextEditorCanvasProps {
  initialContent?: string;
  onContentChange?: (content: string) => void;
}

export function TextEditorCanvas({
  initialContent = "",
  onContentChange,
}: TextEditorCanvasProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      TableKit,
      TextStyleKit,
      Heading.configure({
        levels: [1, 2, 3, 4, 5, 6],
      }),
      BulletList.configure({
        HTMLAttributes: {
          class: "list-disc ml-2",
        },
      }),
      OrderedList.configure({
        HTMLAttributes: {
          class: "list-decimal ml-2",
        },
      }),
      ListItem,
      TaskItem.configure({ nested: true }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
    ],
    content: initialContent,
    onUpdate: ({ editor }) => {
      onContentChange?.(editor.getHTML());
    },
  });

  useEffect(() => {
    if (editor && initialContent) {
      if (editor.isEmpty) {
        editor.commands.setContent(initialContent);
      }
    }
  }, [editor, initialContent]);

  return (
    <section className="min-w-0 h-full w-full">
      <EditorContext.Provider value={{ editor }}>
        <div className="w-full h-full flex justify-start items-center overflow-hidden gap-4 lg:gap-6">
          {/* Editor Column: Fixed Toolbar + Scrollable Document Canvas */}
          <div className="h-full min-w-0 flex flex-col shrink-0 w-full max-w-[760px] xl:max-w-[820px] 2xl:max-w-[860px]">
            <TextEditorToolbar
              editor={editor}
              className="w-full shrink-0"
            />

            {/* ONLY SCROLLABLE AREA: Document Canvas */}
            <div
              className="flex-1 min-h-0 overflow-y-auto border-r border-input cursor-text bg-white p-6 sm:p-8 lg:p-10"
              onClick={() => editor?.chain().focus().run()}
            >
              <EditorContent
                editor={editor}
                role="presentation"
                className="h-full mx-auto w-full prose max-w-none text-sm leading-6 text-slate-800 [&_.ProseMirror]:min-h-full [&_.ProseMirror]:outline-none"
              />
            </div>
          </div>

          {/* AI Agent Sidebar on the right */}
          <aside className="h-full flex-1 min-w-[320px] max-w-[420px] flex items-center justify-center overflow-hidden">
            <AgentPanel
              editor={editor}
              className="w-full h-full"
            />
          </aside>
        </div>
      </EditorContext.Provider>
    </section>
  );
}