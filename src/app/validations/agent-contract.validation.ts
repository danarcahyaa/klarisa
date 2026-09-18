import { z } from "zod";

/**
 * Zod schema validating clarification tool arguments (agent_clarification).
 */
export const agentClarificationArgsSchema = z.object({
  question: z
    .string()
    .trim()
    .min(1, "Pertanyaan klarifikasi tidak boleh kosong."),
  draft_context: z
    .string()
    .trim()
    .max(5000, "Konteks draf terlalu panjang.")
    .optional()
    .nullable(),
  suggested_options: z
    .array(z.string().trim().min(1, "Opsi klarifikasi tidak boleh kosong."))
    .max(10, "Maksimal 10 opsi klarifikasi.")
    .optional(),
});

export type AgentClarificationArgsDTO = z.infer<typeof agentClarificationArgsSchema>;

/**
 * Zod schema validating out-of-scope rejection tool arguments (agent_reject_out_of_scope).
 */
export const agentRejectOutOfScopeArgsSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(1, "Alasan penolakan di luar konteks kontrak tidak boleh kosong.")
    .max(1000, "Alasan penolakan terlalu panjang."),
});

export type AgentRejectOutOfScopeArgsDTO = z.infer<typeof agentRejectOutOfScopeArgsSchema>;

/**
 * Zod schema validating general conversational and informational output tool arguments (agent_text_output).
 */
export const agentTextOutputArgsSchema = z.object({
  summary: z
    .string()
    .trim()
    .min(1, "Ringkasan tanggapan tidak boleh kosong.")
    .max(300, "Ringkasan maksimal 300 karakter."),
  content: z
    .string()
    .trim()
    .min(1, "Isi tanggapan kontrak tidak boleh kosong."),
  referenced_clauses: z
    .array(z.string().trim().min(1))
    .max(20, "Maksimal 20 klausul rujukan.")
    .optional(),
});

export type AgentTextOutputArgsDTO = z.infer<typeof agentTextOutputArgsSchema>;

/**
 * Zod schema validating single clause or text diff item.
 */
export const agentDiffChangeItemSchema = z.object({
  target: z
    .string()
    .trim()
    .min(1, "Target pasal atau bagian teks tidak boleh kosong.")
    .max(200, "Target pasal maksimal 200 karakter."),
  action: z.enum(["replace", "insert", "delete"]),
  insert_position: z.enum(["before", "after"]).optional().nullable(),
  original_text: z
    .string()
    .trim()
    .max(50000, "Teks asli terlalu panjang."),
  replacement_text: z
    .string()
    .trim()
    .max(50000, "Teks pengganti terlalu panjang.")
    .optional()
    .nullable(),
  target_id: z.string().trim().optional().nullable(),
  explanation: z
    .string()
    .trim()
    .min(1, "Alasan perubahan tidak boleh kosong.")
    .max(2000, "Penjelasan perubahan maksimal 2000 karakter."),
});

export type AgentDiffChangeItemDTO = z.infer<typeof agentDiffChangeItemSchema>;

/**
 * Zod schema validating diff and replace tool arguments (agent_diff_replace).
 */
export const agentDiffReplaceArgsSchema = z.object({
  summary: z
    .string()
    .trim()
    .min(1, "Ringkasan perubahan tidak boleh kosong.")
    .max(500, "Ringkasan perubahan maksimal 500 karakter."),
  changes: z
    .array(agentDiffChangeItemSchema)
    .min(1, "Minimal harus ada satu usulan perubahan klausul atau teks."),
});

export type AgentDiffReplaceArgsDTO = z.infer<typeof agentDiffReplaceArgsSchema>;

/**
 * Zod schema validating streaming request payload sent from client.
 */
export const agentStreamRequestSchema = z.object({
  prompt: z
    .string()
    .trim()
    .min(1, "Prompt pertanyaan atau instruksi tidak boleh kosong."),
  selectedText: z
    .string()
    .trim()
    .max(20000, "Teks seleksi terlalu panjang.")
    .optional()
    .nullable(),
  highlightId: z
    .string()
    .trim()
    .optional()
    .nullable(),
  interactionId: z
    .string()
    .trim()
    .optional()
    .nullable(),
});

export type AgentStreamRequestDTO = z.infer<typeof agentStreamRequestSchema>;

// Backward compatibility exports
export const askClarificationArgsSchema = agentClarificationArgsSchema;
export const rejectOutOfScopeArgsSchema = agentRejectOutOfScopeArgsSchema;
export const contractTextOutputArgsSchema = agentTextOutputArgsSchema;
export const contractDiffItemSchema = agentDiffChangeItemSchema;
export const contractDiffReplaceArgsSchema = agentDiffReplaceArgsSchema;
