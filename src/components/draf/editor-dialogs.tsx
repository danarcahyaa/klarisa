"use client";

import type {
  DraftVersion,
  DraftVersionContent,
  ContractDetail,
} from "@/types/contract.type";
import { ShareDialog } from "./dialogs/share-dialog";
import { VersionsDialog } from "./dialogs/versions-dialog";
import { RestoreConfirmDialog } from "./dialogs/restore-confirm-dialog";
import { DeleteConfirmDialog } from "./dialogs/delete-confirm-dialog";

export interface EditorDialogsProps {
  // Share dialog
  isShareOpen: boolean;
  onShareClose: () => void;
  draft: ContractDetail;
  inviteEmail: string;
  onInviteEmailChange: (email: string) => void;
  onSubmitInvitation: (event: React.FormEvent<HTMLFormElement>) => void;
  isSharing: boolean;
  onChangeCollaboratorRole: (
    userId: string,
    role: "commenter" | "viewer",
  ) => void;
  onRevokeAccess: (userId: string) => void;
  isManagingAccess: boolean;

  // Versions dialog
  isVersionsOpen: boolean;
  onVersionsClose: () => void;
  versions: DraftVersion[];
  selectedVersion: DraftVersionContent | null;
  onSelectVersion: (versionId: string) => void;
  isLoadingVersion: boolean;
  onRestoreClick: (version: DraftVersionContent) => void;

  // Restore confirmation dialog
  versionToRestore: DraftVersionContent | null;
  onRestoreCancel: () => void;
  onRestoreConfirm: () => void;
  isRestoringVersion: boolean;

  // Delete confirmation dialog
  isDeleteOpen: boolean;
  onDeleteClose: () => void;
  onDeleteConfirm: () => void;
  isDeleting: boolean;
}

/**
 * Main orchestrator for draft editor modal dialogs (share, versions, delete, restore).
 */
export function EditorDialogs({
  // Share dialog
  isShareOpen,
  onShareClose,
  draft,
  inviteEmail,
  onInviteEmailChange,
  onSubmitInvitation,
  isSharing,
  onChangeCollaboratorRole,
  onRevokeAccess,
  isManagingAccess,

  // Versions dialog
  isVersionsOpen,
  onVersionsClose,
  versions,
  selectedVersion,
  onSelectVersion,
  isLoadingVersion,
  onRestoreClick,

  // Restore confirmation
  versionToRestore,
  onRestoreCancel,
  onRestoreConfirm,
  isRestoringVersion,

  // Delete confirmation
  isDeleteOpen,
  onDeleteClose,
  onDeleteConfirm,
  isDeleting,
}: EditorDialogsProps) {
  return (
    <>
      <ShareDialog
        isOpen={isShareOpen}
        onClose={onShareClose}
        draft={draft}
        inviteEmail={inviteEmail}
        onInviteEmailChange={onInviteEmailChange}
        onSubmitInvitation={onSubmitInvitation}
        isSharing={isSharing}
        onChangeRole={onChangeCollaboratorRole}
        onRevokeAccess={onRevokeAccess}
        isManagingAccess={isManagingAccess}
      />

      <VersionsDialog
        isOpen={isVersionsOpen}
        onClose={onVersionsClose}
        versions={versions}
        selectedVersion={selectedVersion}
        onSelectVersion={onSelectVersion}
        isLoadingVersion={isLoadingVersion}
        onRestoreClick={onRestoreClick}
      />

      {versionToRestore && (
        <RestoreConfirmDialog
          version={versionToRestore}
          onCancel={onRestoreCancel}
          onConfirm={onRestoreConfirm}
          isLoading={isRestoringVersion}
        />
      )}

      {isDeleteOpen && (
        <DeleteConfirmDialog
          onClose={onDeleteClose}
          onConfirm={onDeleteConfirm}
          isLoading={isDeleting}
        />
      )}
    </>
  );
}
