"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { createErrorResponse } from "@/lib/response";
import { createEmbeddingService } from "@/services/embedding.service";
import type {
  AnyChunkItem,
  GenerateEmbeddingInput,
  MatchOptions,
} from "@/types/embedding.type";

export type { AnyChunkItem, GenerateEmbeddingInput, MatchOptions };

/**
 * Server action: generates vector embeddings in batches via EmbeddingService.
 *
 * @param input - Input payload containing chunks array and optional batch settings.
 * @returns BaseResponse containing embedded chunks.
 */
export async function generateEmbeddingAction<T extends AnyChunkItem>(
  input: GenerateEmbeddingInput<T>
) {
  const sessionClient = await createClient();
  const { data: { user }, error } = await sessionClient.auth.getUser();
  if (error || !user) {
    return createErrorResponse("Sesi Anda telah berakhir.");
  }

  const embeddingService = createEmbeddingService(createAdminClient());
  return embeddingService.generateEmbeddings<T>(input);
}

/**
 * Server action: performs RAG similarity search via EmbeddingService.
 *
 * @param embeddedChunks - Array of chunks adorned with embedding vectors.
 * @param options         - Match threshold and match count parameters.
 * @returns BaseResponse containing chunks with matched regulations.
 */
export async function matchEmbeddingAction<T extends { embedding: number[] }>(
  embeddedChunks: T[],
  options: MatchOptions = {}
) {
  const sessionClient = await createClient();
  const { data: { user }, error } = await sessionClient.auth.getUser();
  if (error || !user) {
    return createErrorResponse("Sesi Anda telah berakhir.");
  }

  const embeddingService = createEmbeddingService(createAdminClient());
  return embeddingService.matchEmbeddings<T>(embeddedChunks, options);
}
