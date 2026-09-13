import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import {
  contractQuerySchema,
  draftEntityIdSchema,
  saveDraftChatSchema,
  type SaveDraftChatDTO,
} from "@/app/validations/contract.validation";
import { decryptContractContent } from "@/lib/contract-encryption";
import {
  createErrorResponse,
  createSuccessResponse,
  mapSupabaseError,
} from "@/lib/response";
import { DEFAULT_DRAFT_CONTENT } from "@/lib/draft-template";
import {
  DraftRepository,
  type ContractRecord,
} from "@/repositories/draft.repository";
import type {
  ContractDetail,
  ContractListItem,
  ContractQuery,
  SaveDraftChatResult,
} from "@/types/contract.type";
import type { Database, Json } from "@/types/database.type";
import type { BaseResponse } from "@/types/response.type";
import { createClient } from "@/lib/supabase/client";
import {
  mapCollaborator,
  mapComment,
  mapDraftVersion,
  mapListItem,
  metadataOf,
  type DraftCollaboratorRecord,
  type DraftCommentRecord,
} from "./draft-mapper";
import type {
  GeminiInteractionOptions,
  GeminiInteractionResponse,
} from "@/types/llm.type";
import { GeminiService, geminiService as defaultGeminiService } from "./gemini.service";
import { EXTRACT_CONTRACT_CLAUSE } from "@/lib/gemini/tools";

/**
 * Service orchestrating business logic for draft management,
 * versions, collaborators, and comments.
 */
export class DraftService {
  constructor(
    private readonly repository: DraftRepository = new DraftRepository(createClient()),
    private readonly geminiService: GeminiService = defaultGeminiService,
  ) {}

  withClient(client: SupabaseClient<Database>) {
    return new DraftService(new DraftRepository(client), this.geminiService);
  }

  /**
   * Retrieves all contracts and drafts for a user, with optional filtering.
   */
  async getDraftList(
    userId: string,
    input?: ContractQuery,
  ): Promise<BaseResponse<ContractListItem[]>> {
    const queryValidation = contractQuerySchema.safeParse(input ?? {});
    if (!queryValidation.success) {
      return createErrorResponse<ContractListItem[]>(
        queryValidation.error.issues[0]?.message ?? "Parameter pencarian tidak valid.",
      );
    }

    const result = await this.repository.listByUser(userId);
    if (result.error) {
      return createErrorResponse<ContractListItem[]>(
        mapSupabaseError(result.error.message),
      );
    }

    let items = (result.data ?? []).map(mapListItem);

    if (queryValidation.data.type) {
      items = items.filter((item) => item.type === queryValidation.data.type);
    }
    if (queryValidation.data.shared !== undefined) {
      items = items.filter(
        (item) => Boolean(item.metadata?.shared) === queryValidation.data.shared,
      );
    }
    if (queryValidation.data.query && queryValidation.data.query.trim().length > 0) {
      const q = queryValidation.data.query.trim().toLowerCase();
      items = items.filter((item) => item.title.toLowerCase().includes(q));
    }

    return createSuccessResponse(items, "Daftar dokumen berhasil dimuat.");
  }

  /**
   * Alias for getDraftList — used by search page, shared page, and dashboard.
   */
  async list(
    userId: string,
    query?: ContractQuery,
  ): Promise<BaseResponse<ContractListItem[]>> {
    return this.getDraftList(userId, query);
  }

  async generateDraft(
    prompt: string,
    options?: GeminiInteractionOptions,
  ): Promise<GeminiInteractionResponse> {
    try {
      const firstTurn = await this.initialTurn(prompt, options);
      if (firstTurn.error) return createErrorResponse(firstTurn.error);
      if (!firstTurn || !firstTurn.data) {
        return createSuccessResponse({
          text: "",
          interactionId: "",
          model: "",
          toolCalls: [],
          status: "",
          steps: [],
          outputs: [],
        });
      }

      return createSuccessResponse(firstTurn.data);
    } catch (error) {
      console.error("[Draft Service] Error generating draft:", error);
      return createErrorResponse("Gagal membuat draft.");
    }
  }

  async *streamDraft(
    prompt: string,
    options?: GeminiInteractionOptions
  ) {
    const systemPrompt = await this.buildSystemPrompt();
    yield* this.geminiService.streamInteractions(prompt, {
      ...options,
      tools: [EXTRACT_CONTRACT_CLAUSE],
      systemInstruction: systemPrompt,
    });
  }

  /**
   * Saves an AI chat question and response atomically using RPC.
   *
   * @param userId - ID of the authenticated user.
   * @param payload - The chat question, answer, and optional session data.
   * @returns BaseResponse containing the chat_id, conversation_id, and success status.
   */
  async saveAiChat(
    userId: string,
    payload: SaveDraftChatDTO
  ): Promise<BaseResponse<SaveDraftChatResult>> {
    try {
      const validation = saveDraftChatSchema.safeParse(payload);
      if (!validation.success) {
        return createErrorResponse<SaveDraftChatResult>(
          validation.error.issues[0]?.message ?? "Data percakapan tidak valid."
        );
      }

      const { question, answer, chatId, title, lastInteractionId, metadata } =
        validation.data;

      const result = await this.repository.saveChatConversation({
        userId,
        question: question.trim(),
        answer: answer.trim(),
        chatId: chatId ?? null,
        title: title?.trim() || null,
        lastInteractionId: lastInteractionId?.trim() || null,
        metadata: (metadata as Json) ?? null,
      });

      if (result.error) {
        console.error("[DraftService] Error saving AI chat conversation:", result.error);
        return createErrorResponse<SaveDraftChatResult>(
          mapSupabaseError(result.error.message)
        );
      }

      if (!result.data) {
        return createErrorResponse<SaveDraftChatResult>(
          "Gagal menyimpan percakapan AI."
        );
      }

      const responseData = result.data as unknown as SaveDraftChatResult;
      return createSuccessResponse<SaveDraftChatResult>(
        responseData,
        "Percakapan berhasil disimpan."
      );
    } catch (error) {
      console.error("[DraftService] Unexpected error in saveAiChat:", error);
      return createErrorResponse<SaveDraftChatResult>(
        "Terjadi kesalahan saat menyimpan percakapan."
      );
    }
  }

  async getDraftDetail(userId: string, contractId: string) {
    const idValidation = draftEntityIdSchema.safeParse(contractId);
    if (!idValidation.success) {
      return createErrorResponse<ContractDetail>(
        idValidation.error.issues[0]?.message ?? "Draft tidak valid.",
      );
    }

    const current = await this.repository.findDraftById(idValidation.data);
    if (current.error) {
      return createErrorResponse<ContractDetail>(
        mapSupabaseError(current.error.message),
      );
    }
    if (!current.data) {
      return createErrorResponse<ContractDetail>("Draft tidak ditemukan.");
    }

    const draftRecord = current.data as ContractRecord;
    const isOwner = draftRecord.user_id === userId;
    const collaboratorResult = isOwner
      ? null
      : await this.repository.findCollaborator(userId, idValidation.data);

    if (collaboratorResult?.error) {
      return createErrorResponse<ContractDetail>(
        mapSupabaseError(collaboratorResult.error.message),
      );
    }
    if (!isOwner && !collaboratorResult?.data) {
      return createErrorResponse<ContractDetail>(
        "Anda tidak memiliki akses ke draft ini.",
      );
    }

    const permission = isOwner
      ? "owner"
      : (collaboratorResult?.data?.role ?? "viewer");
    const meta = metadataOf(draftRecord.contract_draft?.metadata);

    const [versionsResult, collaboratorsResult, commentsResult] =
      await Promise.all([
        this.repository.listDraftVersions(idValidation.data),
        this.repository.listCollaborators(idValidation.data),
        this.repository.listComments(idValidation.data),
      ]);

    if (versionsResult.error || collaboratorsResult.error || commentsResult.error) {
      const err =
        versionsResult.error ||
        collaboratorsResult.error ||
        commentsResult.error;
      return createErrorResponse<ContractDetail>(mapSupabaseError(err!.message));
    }

    const activeVersionId = meta.active_version_id;

    let encryptedContent = draftRecord.contract_draft?.content || "";
    if (activeVersionId) {
      const activeVersion = (versionsResult.data ?? []).find(
        (v) => v.id === activeVersionId,
      );
      if (activeVersion?.body) {
        encryptedContent = activeVersion.body;
      }
    }

    let content = DEFAULT_DRAFT_CONTENT;
    if (encryptedContent) {
      try {
        content = await decryptContractContent(encryptedContent);
      } catch {
        return createErrorResponse<ContractDetail>(
          "Gagal membuka isi draft. Silakan coba lagi.",
        );
      }
    }

    const detail: ContractDetail = {
      id: draftRecord.id,
      title: draftRecord.title,
      type: draftRecord.type === "draft" ? "draft" : "review",
      isPinned: draftRecord.is_pinned,
      updatedAt: draftRecord.updated_at,
      score: draftRecord.contract_draft?.fairness_score ?? null,
      riskCount: draftRecord.contract_draft?.total_clausul_risk ?? 0,
      metadata: meta,
      content,
      permission,
      versions: (versionsResult.data ?? []).map(mapDraftVersion),
      collaborators: (
        (collaboratorsResult.data ?? []) as DraftCollaboratorRecord[]
      ).map(mapCollaborator),
      comments: ((commentsResult.data ?? []) as DraftCommentRecord[])
        .filter((comment) => {
          if (!activeVersionId) return true;
          const commentMeta =
            (comment.metadata as Record<string, unknown> | null) ?? {};
          return commentMeta.document_version_id === activeVersionId;
        })
        .map((comment) => mapComment(comment, userId)),
      settings: null,
    };

    return createSuccessResponse(detail);
  }

  private async buildSystemPrompt() {
    return `Kamu adalah asisten penyusun draf kontrak hukum di Indonesia.

ATURAN PERILAKU & FORMAT RESPONS:

1. KETIKA PENGGUNA MEMINTA MEMBUAT ATAU MENYUSUN DRAF KONTRAK:
   - Jika input berkaitan dengan pembuatan, penyesuaian, analisis, atau penyusunan draf kontrak/perjanjian:
   - Panggil fungsi tool "extract_contract_clauses".
   - Identifikasi jenis kontrak ("contract_type") dan pasal-pasal esensial ("clauses") sesuai hukum Indonesia (seperti Wanprestasi, Force Majeure, Hak & Kewajiban, Jangka Waktu, Kompensasi, Penyelesaian Sengketa, Domisili Hukum, dsb.).
   - Untuk setiap pasal, susun "semantic_query" singkat mengenai maksud substansi hukumnya.
   - JANGAN menulis isi lengkap kontrak pada tahap ini, cukup panggil fungsi "extract_contract_clauses".

2. KETIKA PENGGUNA BERTANYA, MENYAPA, ATAU MEMINTA KLARIFIKASI:
   - Jika pengguna memberikan sapaan ("Halo", "Selamat pagi"), pertanyaan seputar substansi kontrak, atau permintaannya masih belum jelas mengenai detail kontrak:
   - Jawablah LANGSUNG menggunakan teks percakapan biasa secara singkat, wajar, dan sopan dalam Bahasa Indonesia (tanpa memanggil tool).

3. KETIKA PERMINTAAN DI LUAR LINGKUP HUKUM KONTRAK:
   - Jika pengguna mengajukan pertanyaan atau permintaan di luar lingkup penyusunan kontrak (seperti pengetahuan umum, sains, teknologi umum, sejarah, dsb.):
   - Jawablah secara singkat dan sopan (cukup 1-2 kalimat) bahwa kamu hanya dapat membantu dalam penyusunan draf kontrak hukum.
   - DILARANG menjawab atau mengulas substansi pertanyaan di luar topik tersebut (contoh: jangan menjelaskan siapa penemu bola lampu atau sejarahnya).
   - DILARANG menyebutkan atau mendaftar contoh jenis-jenis kontrak (jangan sebutkan contoh seperti PKWT, sewa-menyewa, jual beli, MOU, dsb.).
   - DILARANG menggunakan istilah atau gelar berbahasa Inggris yang berlebihan seperti "Indonesian Contract Drafting Architect". Gunakan bahasa Indonesia yang wajar dan sederhana.`;
  }

  async initialTurn(input: string, options?: GeminiInteractionOptions) {
    try {
      const systemPrompt = await this.buildSystemPrompt();
      const firstTurn = await this.geminiService.interactions(input, {
        ...options,
        tools: [EXTRACT_CONTRACT_CLAUSE],
        systemInstruction: systemPrompt,
      });

      if (firstTurn.error) {
        throw new Error(firstTurn.error);
      }

      return firstTurn;
    } catch (error) {
      console.error("[DraftService] Error generating initial draft:", error);
      throw error;
    }
  }
}

export const draftService = new DraftService();

export function createDraftService(client?: SupabaseClient<Database>) {
  return client ? draftService.withClient(client) : draftService;
}
