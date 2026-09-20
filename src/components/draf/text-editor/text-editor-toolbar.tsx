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
  isAgentOpen?: boolean;
  onToggleAgent?: () => void;
}

export function TextEditorToolbar({ 
  editor, 
  className,
  isAgentOpen,
  onToggleAgent,
}: TextEditorToolbarProps) {
    return (
        <div className={cn("relative z-[70] shrink-0 px-4 py-2 bg-white border-r border-b border-input flex items-center justify-between gap-2 overflow-x-auto shadow-2xs", className)}>
            <div className="flex gap-1 shrink-0">
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
            
            <div className="flex gap-1 shrink-0">
                <HeadingDropdownMenu editor={editor}
                    levels={[1,2,3,4,5,6]}
                    
                />
                <ListDropdownMenu
                    editor={editor}
                    types={['bulletList', 'orderedList']}
                />
            </div>
            <div className="flex gap-1 shrink-0">
                <MarkButton editor={editor} type="bold"/>
                <MarkButton editor={editor} type="italic" />
                <MarkButton editor={editor} type="strike" />
                <MarkButton editor={editor} type="underline" /> 
            </div>

            <div className="flex gap-1 shrink-0"> 
                <TextAlignButton editor={editor} align="left"/>
                <TextAlignButton editor={editor} align="center" />
                <TextAlignButton editor={editor} align="right" />
                <TextAlignButton editor={editor} align="justify" />
            </div>

            {onToggleAgent && (
              <div className="flex items-center shrink-0">
                <button
                    type="button"
                    onClick={onToggleAgent}
                    aria-label="Klarisa AI"
                    title={isAgentOpen ? "Tutup Asisten AI" : "Buka Asisten AI"}
                    className={cn(
                        "flex size-8 items-center justify-center rounded-md transition-all duration-200 cursor-pointer outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0",
                        isAgentOpen
                            ? "bg-slate-100"
                            : "hover:bg-slate-100"
                    )}
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
            )}
            
        </div>
    )
}