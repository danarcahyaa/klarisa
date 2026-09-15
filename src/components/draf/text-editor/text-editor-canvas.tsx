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
import {Text} from  "@tiptap/extension-text";
import {Bold} from "@tiptap/extension-bold";
import {Italic} from "@tiptap/extension-italic";
import {Underline} from "@tiptap/extension-underline";
import { Strike } from "@tiptap/extension-strike";
import { generateJSON} from '@tiptap/core'

interface TextEditorCanvasProps {
  initialContent?: string;
}

export function TextEditorCanvas({ initialContent = "" }: TextEditorCanvasProps) {
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
  });

  useEffect(() => {
    if (editor && initialContent) {
      if (editor.isEmpty) {
        editor.commands.setContent(initialContent);
      }
    }


  }, [editor, initialContent]);

      const result = generateJSON(`
        <h1>HEADING 1 </h1>
        <ul><li><p>LIST BERBUTIR</p></li></ul>
        <ol><li><p>LIST BERURUTAN</p></li></ol>
        <p><strong>BOLD </strong><em>ITALIC </em></p>
        <p><s>STIKE</s> <u>UNDERLINE</u></p>
        <p style="text-align: left;">LEFT TEXT ALIGN</p>
        <p style="text-align: center;">CENTER TEXT ALIGN</p>
        <p style="text-align: right;">RIGHT TEXT ALIGN</p>
        <p style="text-align: justify;">JUSTIFY TEXT ALIGN</p>

        `, [
      Document,
      Text,
      Paragraph,      
      Heading,
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
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Bold,
      Italic,
      Underline,
      Strike,
    ])

    console.log("RESULT: ")
    console.log(result);

  return (
    <section className="min-w-0 h-full">
      <EditorContext.Provider value={{ editor }}>
        <TextEditorToolbar editor={editor} className="mx-4 mb-4 shadow-xs" />

        <div
          className="flex-1 p-10 rounded-sm border border-slate-200 cursor-text bg-white"
          onClick={() => editor?.chain().focus().run()}
        >
          <EditorContent
            editor={editor}
            role="presentation"
            className="h-full max-w-4xl mx-auto w-full prose max-w-none text-sm leading-6 text-slate-800 [&_.ProseMirror]:min-h-[calc(100svh-180px-5rem)] [&_.ProseMirror]:outline-none"
          />
        </div>
      </EditorContext.Provider>
    </section>
  );
}