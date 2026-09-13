import { z } from "zod";

/**
 * Zod schema for validating new chat creation payload.
 */
export const createChatSchema = z
  .object({
    title: z.string().max(255, "Judul percakapan maksimal 255 karakter.").optional(),
    question: z.string().optional(),
  })
  .refine((data) => (data.title && data.title.trim().length > 0) || (data.question && data.question.trim().length > 0), {
    message: "Judul atau pertanyaan awal wajib diisi.",
  });

/**
 * Zod schema for creating a chat together with its initial Q&A pair.
 */
export const createChatWithQuestionSchema = z.object({
  question: z
    .string()
    .min(1, "Pertanyaan wajib diisi."),
  answer: z
    .string()
    .min(1, "Jawaban wajib diisi."),
  title: z
    .string()
    .max(255, "Judul percakapan maksimal 255 karakter.")
    .optional(),
});

/**
 * Zod schema for validating updates to chat title.
 */
export const updateChatTitleSchema = z.object({
  title: z
    .string()
    .min(1, "Judul percakapan tidak boleh kosong.")
    .max(255, "Judul percakapan maksimal 255 karakter."),
});

/**
 * Zod schema for validating a question & answer conversation entry payload.
 */
export const addConversationSchema = z.object({
  chat_id: z
    .string()
    .min(1, "ID percakapan wajib diisi.")
    .uuid("ID percakapan tidak valid."),
  question: z
    .string()
    .min(1, "Pertanyaan tidak boleh kosong."),
  answer: z
    .string()
    .min(1, "Jawaban wajib diisi."),
});

/**
 * Zod schema for validating search and pagination parameters on chat listings.
 */
export const searchChatsSchema = z.object({
  query: z
    .string()
    .max(100, "Kata kunci pencarian maksimal 100 karakter.")
    .optional(),
  page: z.number().int().min(1, "Halaman minimal 1.").default(1),
  limit: z.number().int().min(1).max(50, "Batas maksimal 50 per halaman.").default(15),
});

/**
 * Zod schema for validating lazy pagination parameters for conversation messages in a chat.
 */
export const listConversationsSchema = z.object({
  chat_id: z
    .string()
    .min(1, "ID percakapan wajib diisi.")
    .uuid("ID percakapan tidak valid."),
  page: z.number().int().min(1, "Halaman minimal 1.").default(1),
  limit: z.number().int().min(1).max(50, "Batas maksimal 50 per halaman.").default(15),
});

export type CreateChatInput = z.infer<typeof createChatSchema>;
export type CreateChatWithQuestionInput = z.infer<typeof createChatWithQuestionSchema>;
export type UpdateChatTitleInput = z.infer<typeof updateChatTitleSchema>;
export type AddConversationInput = z.infer<typeof addConversationSchema>;
export type SearchChatsInput = z.infer<typeof searchChatsSchema>;
export type ListConversationsInput = z.infer<typeof listConversationsSchema>;
