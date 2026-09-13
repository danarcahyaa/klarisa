import type { Editor } from "@tiptap/react";
import type { DraftComment, DraftVersionContent } from "@/types/contract.type";

// Status types
export type SaveStatus = "saved" | "saving" | "error";
export type SidebarTab = "klarisa-ai" | "komentar" | "conversation" | "discussion";

// Message types
export type AiMessage = {
  role: "assistant" | "user";
  body: string;
};

// Backup types
export type LocalDraftBackup = {
  content: string;
  title: string;
  savedAt: string;
};

// Toolbar types
export interface ToolbarButton {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  action: (editor: Editor) => void;
  isActive?: (editor: Editor) => boolean;
}

// Editor state types
export interface DraftEditorState {
  title: string;
  message: string;
  activeSidebarTab: SidebarTab;
  activeCommands: Set<string>;
  isSearchOpen: boolean;
  searchQuery: string;
  searchFeedback: string;
  saveStatus: SaveStatus;
  notice: string;
  isShareOpen: boolean;
  isActionsOpen: boolean;
  isDeleteOpen: boolean;
  isVersionsOpen: boolean;
  selectedVersion: DraftVersionContent | null;
  versionToRestore: DraftVersionContent | null;
  inviteEmail: string;
  selectedDraftText: string;
  selectedTextPosition: { start: number; end: number } | null;
  replyToId: string | null;
}

// Comment anchor types
export interface TextSelection {
  start: number;
  end: number;
}
