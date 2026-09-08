"use client";

import { X } from "lucide-react";
import type { ContractDetail } from "@/types/contract.type";
import { Button, SubmitButton } from "@/components/ui/button";

export interface ShareDialogProps {
  isOpen: boolean;
  onClose: () => void;
  draft: ContractDetail;
  inviteEmail: string;
  onInviteEmailChange: (email: string) => void;
  onSubmitInvitation: (event: React.FormEvent<HTMLFormElement>) => void;
  isSharing: boolean;
  onChangeRole: (userId: string, role: "commenter" | "viewer") => void;
  onRevokeAccess: (userId: string) => void;
  isManagingAccess: boolean;
}

/**
 * Modal dialog for sharing a draft and managing collaborator access roles.
 */
export function ShareDialog({
  isOpen,
  onClose,
  draft,
  inviteEmail,
  onInviteEmailChange,
  onSubmitInvitation,
  isSharing,
  onChangeRole,
  onRevokeAccess,
  isManagingAccess,
}: ShareDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-slate-950/35 px-4 backdrop-blur-[2px]">
      <button
        type="button"
        aria-label="Tutup panel bagikan"
        onClick={onClose}
        className="absolute inset-0"
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-draft-title"
        className="relative w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold tracking-wider text-klarisa-secondary uppercase">
              BAGIKAN DRAFT
            </p>
            <h2
              id="share-draft-title"
              className="mt-2 text-xl font-semibold tracking-[-.03em]"
            >
              Tambahkan pihak terkait.
            </h2>
            <p className="mt-2 text-xs leading-5 text-slate-500">
              Atur siapa yang dapat melihat atau memberi komentar pada draft ini.
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon-xs"
            type="button"
            onClick={onClose}
            aria-label="Tutup"
          >
            <X className="size-4" />
          </Button>
        </div>

        <form onSubmit={onSubmitInvitation} className="mt-6 grid gap-4">
          <label className="grid gap-2 text-xs font-semibold text-slate-600">
            Email pengguna
            <input
              type="email"
              required
              value={inviteEmail}
              onChange={(event) => onInviteEmailChange(event.target.value)}
              placeholder="nama@contoh.com"
              className="h-11 rounded-md border border-slate-200 px-3 text-xs font-normal outline-none focus:border-klarisa-secondary focus:ring-2 focus:ring-klarisa-secondary/10"
            />
          </label>
          <div className="rounded-md bg-[#f5f7ff] px-4 py-3 text-xs leading-5 text-slate-600">
            <b className="text-klarisa-secondary">Komentator</b> dapat berdiskusi.{" "}
            <b className="text-klarisa-secondary">Peninjau</b> hanya dapat membaca isi draft.
          </div>
          <div className="flex justify-end gap-2">
            <SubmitButton
              variant="default"
              size="sm"
              type="submit"
              isLoading={isSharing}
              loadingText="Menambahkan..."
            >
              Undang dan salin tautan
            </SubmitButton>
          </div>
        </form>

        {draft.collaborators.length > 0 && (
          <div className="mt-6 border-t border-slate-200 pt-4">
            <p className="text-xs font-bold tracking-wider text-slate-500 uppercase">
              ORANG YANG MEMILIKI AKSES
            </p>
            <div className="mt-3 grid max-h-48 gap-2 overflow-y-auto pr-1">
              {draft.collaborators.map((collaborator) => (
                <div
                  key={collaborator.userId}
                  className="flex items-center gap-2 rounded-md border border-slate-200 p-2.5"
                >
                  <span className="grid size-7 place-items-center rounded-full bg-[#edf2ff] text-xs font-bold text-klarisa-secondary">
                    {collaborator.name
                      .split(" ")
                      .slice(0, 2)
                      .map((part) => part[0])
                      .join("")
                      .toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1">
                    <b className="block truncate text-xs font-semibold">
                      {collaborator.name}
                    </b>
                    <small className="block text-xs text-slate-400">
                      {collaborator.role === "commenter"
                        ? "Dapat berkomentar"
                        : "Hanya melihat"}
                    </small>
                  </span>
                  <select
                    aria-label={`Peran ${collaborator.name}`}
                    value={
                      collaborator.role === "commenter" ? "commenter" : "viewer"
                    }
                    disabled={isManagingAccess}
                    onChange={(event) =>
                      void onChangeRole(
                        collaborator.userId,
                        event.target.value as "commenter" | "viewer",
                      )
                    }
                    className="h-8 rounded border border-slate-200 bg-white px-2 text-xs font-semibold outline-none"
                  >
                    <option value="commenter">Komentator</option>
                    <option value="viewer">Peninjau</option>
                  </select>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    type="button"
                    disabled={isManagingAccess}
                    onClick={() => void onRevokeAccess(collaborator.userId)}
                    aria-label={`Cabut akses ${collaborator.name}`}
                  >
                    <X className="size-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <Button variant="outline" size="sm" type="button" onClick={onClose}>
            Selesai
          </Button>
        </div>
      </section>
    </div>
  );
}
