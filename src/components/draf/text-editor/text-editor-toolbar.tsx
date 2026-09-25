import type { Editor } from '@tiptap/react'
import { UndoRedoButton } from '@/components/tiptap-ui/undo-redo-button'
import { HeadingDropdownMenu } from '@/components/tiptap-ui/heading-dropdown-menu';
import { ListDropdownMenu } from '@/components/tiptap-ui/list-dropdown-menu';
import { MarkButton } from '@/components/tiptap-ui/mark-button';
import { TextAlignButton } from '@/components/tiptap-ui/text-align-button';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
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
        <div className={cn("relative z-20 shrink-0 px-3 sm:px-4 py-2 bg-white border-r border-b border-input flex items-center justify-between gap-1.5 sm:gap-2 overflow-x-auto overflow-y-hidden no-scrollbar shadow-2xs", className)}>
            <div className="flex gap-1 shrink-0">
                <UndoRedoButton
                    editor={editor}
                    action="undo"
                    className="cursor-pointer"
                />
                <UndoRedoButton
                    editor={editor}
                    action="redo"
                    className="cursor-pointer"
                />
            </div>
            
            <div className="flex gap-1 shrink-0">
                <HeadingDropdownMenu 
                    className="cursor-pointer"
                    editor={editor}
                    levels={[1,2,3,4,5,6]}
                    
                />
                <ListDropdownMenu
                    className="cursor-pointer"
                    editor={editor}
                    types={['bulletList', 'orderedList']}
                />
            </div>
            <div className="flex gap-1 shrink-0">
                <MarkButton editor={editor} type="bold" className="cursor-pointer"/>
                <MarkButton editor={editor} type="italic" className="cursor-pointer"/>
                <MarkButton editor={editor} type="strike" className="cursor-pointer"/>
                <MarkButton editor={editor} type="underline" className="cursor-pointer" /> 
            </div>

            <div className="flex gap-1 shrink-0"> 
                <TextAlignButton editor={editor} align="left" className="cursor-pointer"/>
                <TextAlignButton editor={editor} align="center" className="cursor-pointer"/>
                <TextAlignButton editor={editor} align="right" className="cursor-pointer"/>
                <TextAlignButton editor={editor} align="justify"className="cursor-pointer" />
            </div>

            {onToggleAgent && (
              <div className="flex items-center shrink-0 lg:hidden">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  type="button"
                  onClick={onToggleAgent}
                  aria-label="Buka Asisten AI"
                  title="Buka Asisten AI"
                  className={cn(
                    "size-8 rounded-md transition-all duration-200 cursor-pointer",
                    isAgentOpen ? "bg-slate-100" : "hover:bg-slate-100"
                  )}
                >
                  <Image
                    src="/klarisa/logo-ai.svg"
                    alt="logo-ai"
                    width={18}
                    height={18}
                    className="size-4.5 object-contain"
                  />
                </Button>
              </div>
            )}
            
        </div>
    )
}