"use client";

import { Button, SubmitButton } from "@/components/ui/button";

export interface CommentEditorProps {
  value: string;
  onChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  isPending: boolean;
}

export function CommentEditor({
  value,
  onChange,
  onSave,
  onCancel,
  isPending,
}: CommentEditorProps) {
  return (
    <div className="mt-2 grid gap-2">
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-20 w-full resize-y rounded-md border border-slate-200 px-3 py-2 text-xs leading-relaxed outline-none focus:border-klarisa-secondary"
      />
      <span className="flex gap-2">
        <SubmitButton
          size="xs"
          type="button"
          isLoading={isPending}
          disabled={isPending || !value.trim()}
          onClick={onSave}
        >
          Simpan
        </SubmitButton>
        <Button variant="ghost" size="xs" type="button" onClick={onCancel}>
          Batal
        </Button>
      </span>
    </div>
  );
}
