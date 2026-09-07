"use client";

/**
 * Re-export main DraftEditor component and utilities.
 * Ensures backward compatibility with @/components/draft-editor imports.
 */

export { DraftEditor } from "@/components/draf/text-editor";
export {
  DRAFT_BACKUP_KEY,
  LEGACY_DRAFT_KEY,
  LEGACY_TITLE_KEY,
  DEFAULT_DOCUMENT,
  TOOLBAR_BUTTONS,
  readLocalDraftBackup,
} from "@/lib/draft-editor";
