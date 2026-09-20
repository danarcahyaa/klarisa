import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import {
  contractQuerySchema,
  draftEntityIdSchema,
  saveDraftChatSchema,
  updateDraftTitleSchema,
  saveDraftContentSchema,
  deleteDraftSchema,
  type SaveDraftChatDTO,
  type UpdateDraftTitleDTO,
  type SaveDraftContentDTO,
  type DeleteDraftDTO,
} from "@/app/validations/contract.validation";
import {
  decryptContractContent,
  encryptContractContent,
} from "@/lib/contract-encryption";
import {
  CONTRACT_DRAFTER_SYSTEM_PROMPT,
  buildContractDraftingUserPrompt,
  type MatchedArticleItem,
} from "@/lib/gemini/prompts/contract-drafter.prompt";
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
import { EXTRACT_CONTRACT_CLAUSES } from "@/lib/gemini/tools";

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
      tools: [EXTRACT_CONTRACT_CLAUSES],
      systemInstruction: systemPrompt,
    });
  }

  /**
   * Generates a complete formal contract draft based on user prompt and matched legal articles,
   * encrypts the HTML content, and persists it as a new contract draft in the database.
   *
   * @param userId - ID of the authenticated user.
   * @param input - Generation parameters including prompt and matched articles.
   * @returns BaseResponse containing contractId and title.
   */
  async generateContractDraft(
    userId: string,
    input: {
      userPrompt: string;
      contractType?: string;
      matchedArticles?: MatchedArticleItem[];
    }
  ): Promise<BaseResponse<{ contractId: string; title: string }>> {
    try {
      const { userPrompt, contractType, matchedArticles = [] } = input;
      if (!userPrompt || userPrompt.trim().length === 0) {
        return createErrorResponse("Instruksi draf kontrak tidak boleh kosong.");
      }

      const promptText = buildContractDraftingUserPrompt(
        userPrompt,
        matchedArticles
      );

      const llmResult = await this.geminiService.generateCompletion(promptText, {
        systemInstruction: CONTRACT_DRAFTER_SYSTEM_PROMPT,
        temperature: 0.2,
      });

      if (!llmResult.success || !llmResult.data?.text) {
        return createErrorResponse(
          llmResult.error || "Gagal menghasilkan draf kontrak dari AI."
        );
      }

      let rawHtml = llmResult.data.text.trim();
      // Strip markdown code block fences if present
      rawHtml = rawHtml.replace(/^```(?:html)?\s*/i, "").replace(/\s*```$/i, "").trim();

      if (!rawHtml) {
        return createErrorResponse("Hasil draf kontrak kosong.");
      }

      const cleanTitle = contractType
        ? `Draf Perjanjian ${contractType.trim()}`
        : "Draf Surat Perjanjian";

      const encryptedContent = encryptContractContent(rawHtml);

      const created = await this.repository.createDraftDocument({
        userId,
        title: cleanTitle,
        encryptedContent,
        metadata: {
          generation_status: "ai_generated",
          draft_category: contractType || "Umum",
        },
      });

      return createSuccessResponse(
        created,
        "Draf kontrak berhasil disusun dan disimpan."
      );
    } catch (error) {
      console.error("[DraftService] Error in generateContractDraft:", error);
      return createErrorResponse("Terjadi kesalahan saat menyusun draf kontrak.");
    }
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

      // If a new chat session was created, fetch and attach the chat row
      if (!chatId && responseData.chat_id) {
        const { data: createdChat } = await this.repository.findChatById(
          responseData.chat_id
        );
        if (createdChat) {
          responseData.chat = createdChat;
        }
      }

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

    const draftResult = await this.repository.findDraftById(idValidation.data);
    if (draftResult.error) {
      return createErrorResponse<ContractDetail>(
        mapSupabaseError(draftResult.error.message),
      );
    }
    if (!draftResult.data) {
      return createErrorResponse<ContractDetail>("Draft tidak ditemukan.");
    }

    const draftRecord = draftResult.data;
    const permission = "owner";
    const meta = metadataOf(draftRecord.metadata);

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

    let encryptedContent = draftRecord.content || "";
    if (activeVersionId) {
      const activeVersion = (versionsResult.data ?? []).find(
        (v: any) => v.id === activeVersionId,
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
      id: draftRecord.contract_id,
      title: (draftRecord.metadata as any)?.title || "Draf Kontrak",
      type: "draft",
      isPinned: false,
      updatedAt: draftRecord.updated_at,
      score: (draftRecord.metadata as any)?.fairness_score ?? null,
      riskCount: (draftRecord.metadata as any)?.total_clausul_risk ?? 0,
      metadata: meta,
      reviewMetadata: (draftRecord.review_metadata as any) ?? [],
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

  /**
   * Updates the title of a contract draft.
   *
   * @param userId - ID of the authenticated user.
   * @param input - Contract ID and new title payload.
   * @returns BaseResponse with the updated contract data.
   */
  async updateDraftTitle(
    userId: string,
    input: UpdateDraftTitleDTO
  ): Promise<BaseResponse<{ id: string; title: string; updatedAt: string }>> {
    try {
      const validation = updateDraftTitleSchema.safeParse(input);
      if (!validation.success) {
        return createErrorResponse(
          validation.error.issues[0]?.message ?? "Data judul kontrak tidak valid."
        );
      }

      const { contractId, title } = validation.data;
      const cleanTitle = title.trim();

      // Check ownership or collaborator permission
      const current = await this.repository.findDraftById(contractId);
      if (current.error) {
        return createErrorResponse(mapSupabaseError(current.error.message));
      }
      if (!current.data) {
        return createErrorResponse("Kontrak tidak ditemukan.");
      }

      const result = await this.repository.updateTitle(contractId, cleanTitle);
      if (result.error) {
        return createErrorResponse(mapSupabaseError(result.error.message));
      }

      return createSuccessResponse(
        {
          id: result.data.id,
          title: result.data.title,
          updatedAt: result.data.updated_at,
        },
        "Nama kontrak berhasil diperbarui."
      );
    } catch (error) {
      console.error("[DraftService] Error in updateDraftTitle:", error);
      return createErrorResponse("Terjadi kesalahan saat mengubah nama kontrak.");
    }
  }

  /**
   * Saves updated contract draft content securely using AES-256-GCM encryption.
   *
   * @param userId - ID of the authenticated user.
   * @param input - Contract ID and raw HTML content.
   * @returns BaseResponse with updated timestamp.
   */
  async saveDraftContent(
    userId: string,
    input: SaveDraftContentDTO
  ): Promise<BaseResponse<{ id: string; updatedAt: string }>> {
    try {
      const validation = saveDraftContentSchema.safeParse(input);
      if (!validation.success) {
        return createErrorResponse(
          validation.error.issues[0]?.message ?? "Data konten draft tidak valid."
        );
      }

      const { contractId, content } = validation.data;

      // Check access permission
      const current = await this.repository.findDraftById(contractId);
      if (current.error) {
        return createErrorResponse(mapSupabaseError(current.error.message));
      }
      if (!current.data) {
        return createErrorResponse("Kontrak tidak ditemukan.");
      }

      // Encrypt HTML content before storage
      const encryptedContent = encryptContractContent(content || "<p></p>");

      const result = await this.repository.updateDraftContent(contractId, encryptedContent);
      if (result.error) {
        return createErrorResponse(mapSupabaseError(result.error.message));
      }

      return createSuccessResponse(
        {
          id: contractId,
          updatedAt: result.data.updated_at,
        },
        "Perubahan draft berhasil disimpan."
      );
    } catch (error) {
      console.error("[DraftService] Error in saveDraftContent:", error);
      return createErrorResponse("Terjadi kesalahan saat menyimpan perubahan draft.");
    }
  }

  /**
   * Deletes a contract draft and its associated records.
   * Only the owner can delete the contract.
   *
   * @param userId - ID of the authenticated user (must be the owner).
   * @param contractId - ID of the contract to delete.
   * @returns BaseResponse with deleted contract ID.
   */
  async deleteDraft(
    userId: string,
    contractId: string
  ): Promise<BaseResponse<{ id: string }>> {
    try {
      const idValidation = draftEntityIdSchema.safeParse(contractId);
      if (!idValidation.success) {
        return createErrorResponse(
          idValidation.error.issues[0]?.message ?? "ID kontrak tidak valid."
        );
      }

      const validId = idValidation.data;

      // Check ownership - only owner can delete
      const current = await this.repository.findById(userId, validId);
      if (current.error) {
        return createErrorResponse(mapSupabaseError(current.error.message));
      }
      if (!current.data) {
        return createErrorResponse(
          "Kontrak tidak ditemukan atau Anda tidak memiliki izin untuk menghapusnya."
        );
      }

      const result = await this.repository.deleteContract(userId, validId);
      if (result.error) {
        return createErrorResponse(mapSupabaseError(result.error.message));
      }

      return createSuccessResponse(
        { id: validId },
        "Kontrak berhasil dihapus."
      );
    } catch (error) {
      console.error("[DraftService] Error in deleteDraft:", error);
      return createErrorResponse("Terjadi kesalahan saat menghapus kontrak.");
    }
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
        tools: [EXTRACT_CONTRACT_CLAUSES],
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
