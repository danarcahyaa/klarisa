import type { Editor } from '@tiptap/react'
import { UndoRedoButton } from '@/components/tiptap-ui/undo-redo-button'
import { HeadingDropdownMenu } from '@/components/tiptap-ui/heading-dropdown-menu';
import { ListDropdownMenu } from '@/components/tiptap-ui/list-dropdown-menu';
import { MarkButton } from '@/components/tiptap-ui/mark-button';
import { TextAlignButton } from '@/components/tiptap-ui/text-align-button';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface TextEditorToolbarProps {
  editor: Editor | null;
  className?: string;
}

export function TextEditorToolbar({ editor, className }: TextEditorToolbarProps) {
    return (
        <div className={cn("sticky top-4 z-20 px-5 py-2 bg-white/80 backdrop-blur-lg border border-input rounded-full flex items-center justify-between gap-2 overflow-x-auto", className)}>
            <div className="flex gap-1">
                <UndoRedoButton
                    editor={editor}
                    action="undo"
                    onExecuted={() => console.log('Action executed!')}
                />
                <UndoRedoButton
                    editor={editor}
                    action="redo"
                    onExecuted={() => console.log('Action executed!')}
                />
            </div>
            
            <div className="flex gap-1">
                <HeadingDropdownMenu editor={editor}
                    levels={[1,2,3,4,5,6]}
                    
                />
                <ListDropdownMenu
                    editor={editor}
                    types={['bulletList', 'orderedList']}
                />
            </div>
            <div className="flex gap-1">
                <MarkButton editor={editor} type="bold"/>
                <MarkButton editor={editor} type="italic" />
                <MarkButton editor={editor} type="strike" />
                <MarkButton editor={editor} type="underline" /> 
            </div>

            <div className="flex gap-1"> 
                <TextAlignButton editor={editor} align="left"/>
                <TextAlignButton editor={editor} align="center" />
                <TextAlignButton editor={editor} align="right" />
                <TextAlignButton editor={editor} align="justify" />
            </div>

            <div className="flex items-center">
                <button
                    type="button"
                    aria-label="Klarisa AI"
                    className="flex size-8 items-center justify-center rounded-md transition-all duration-200 cursor-pointer hover:bg-slate-100 outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0"
                >
                        <Image
                            src="/klarisa/logo-ai.svg"
                            alt="logo-ai"
                            width={18}
                            height={18}
                            className="size-4.5 object-contain mb-0.5 mr-0.5"
                        />
                </button>
            </div>
            
        </div>
    )
}