import Groq from "groq-sdk";

import { createErrorResponse, createSuccessResponse } from "@/lib/response";
import type { GenerateCompletionOptions, LlmCompletionResult, LlmResponse } from "@/types/llm.type";
import { GROQ_QWEN_MODEL } from "@/constants";

export class GroqService {
  private groqClient: Groq | null = null;

  /**
   * Lazy initializes the Groq SDK client instance.
   */
  private getGroqClient(): Groq {
    if (!this.groqClient) {
      const apiKey = process.env.GROQ_API_KEY;
      if (!apiKey) {
        throw new Error("GROQ_API_KEY belum dikonfigurasi di lingkungan aplikasi.");
      }
      this.groqClient = new Groq({ apiKey });
    }
    return this.groqClient;
  }

  /**
   * Generates text completion using Groq Qwen model (Qwen 3.6 27B)
   * with automatic retries for transient 503 / 429 rate limit errors.
   *
   * @param prompt     - User prompt or input context.
   * @param options    - Generation configurations.
   * @param maxRetries - Maximum retry attempts.
   * @returns BaseResponse wrapping LlmCompletionResult.
   */
  async generateCompletion(
    prompt: string,
    options: Omit<GenerateCompletionOptions, "provider"> = {},
    maxRetries = 3
  ): Promise<LlmResponse> {
    try {
      const groq = this.getGroqClient();
      const modelName = GROQ_QWEN_MODEL;
      const { systemInstruction, jsonMode = false, responseSchema, temperature = 0.1, maxTokens } = options;

      let effectiveSystemInstruction = systemInstruction ?? "";

      let responseFormat: Record<string, unknown> | undefined;
      if (
        responseSchema &&
        typeof responseSchema === "object" &&
        responseSchema !== null &&
        "name" in responseSchema &&
        "schema" in responseSchema
      ) {
        responseFormat = {
          type: "json_schema",
          json_schema: responseSchema,
        };
      } else if (jsonMode || responseSchema) {
        responseFormat = { type: "json_object" };
        if (!effectiveSystemInstruction.toLowerCase().includes("json")) {
          effectiveSystemInstruction += "\n\nHARAP BERIKAN OUTPUT DALAM FORMAT JSON BERSIH.";
        }
      }

      const messages: Array<{ role: "system" | "user"; content: string }> = [];
      if (effectiveSystemInstruction) {
        messages.push({ role: "system", content: effectiveSystemInstruction });
      }
      messages.push({ role: "user", content: prompt });

      let lastError: unknown;
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          if (attempt > 1) {
            console.log(`[GroqService] Memulai retry pemanggilan Groq (Percobaan ${attempt}/${maxRetries})...`);
          }

          const response = await groq.chat.completions.create({
            model: modelName,
            messages,
            temperature,
            ...(responseFormat ? { response_format: responseFormat as any } : {}),
            stream: false,
            reasoning_effort: "none",
            max_completion_tokens: maxTokens || 4096,
          });

          const choice = response.choices?.[0];
          const text = choice?.message?.content ?? "";

          const result: LlmCompletionResult = {
            text,
            provider: "groq",
            modelName,
          };

          return createSuccessResponse(
            result,
            `Respon berhasil didapatkan dari LLM (${result.provider}: ${result.modelName}).`
          );
        } catch (error: unknown) {
          lastError = error;
          const errStr = String(error);
          const status = (error as { status?: number })?.status;

          const isRetryable =
            status === 503 ||
            status === 429 ||
            errStr.includes("503") ||
            errStr.includes("429") ||
            errStr.includes("UNAVAILABLE") ||
            errStr.includes("rate limit") ||
            errStr.includes("rate_limit_exceeded");

          if (isRetryable && attempt < maxRetries) {
            const delayMs = attempt * 2000;
            console.warn(
              `[GroqService] Groq 503/429 rate limit detected. Retrying attempt ${attempt}/${maxRetries} in ${delayMs}ms...`
            );
            await new Promise((resolve) => setTimeout(resolve, delayMs));
            continue;
          }

          throw error;
        }
      }

      throw lastError;
    } catch (error) {
      const rawErrorMsg = error instanceof Error ? error.message : String(error);
      let userFriendlyMessage = "Gagal memproses permintaan dengan server AI.";

      if (rawErrorMsg.includes("503") || rawErrorMsg.includes("high demand") || rawErrorMsg.includes("UNAVAILABLE")) {
        userFriendlyMessage = "Layanan server AI sedang mengalami beban lonjakan tinggi sementara. Silakan coba beberapa saat lagi.";
      } else if (rawErrorMsg.includes("429") || rawErrorMsg.includes("RESOURCE_EXHAUSTED") || rawErrorMsg.includes("rate_limit")) {
        userFriendlyMessage = "Batas penggunaan API (rate limit) telah tercapai. Silakan tunggu sejenak dan coba kembali.";
      } else if (rawErrorMsg.includes("API key") || rawErrorMsg.includes("GROQ_API_KEY")) {
        userFriendlyMessage = "Konfigurasi kunci API (API Key) AI belum sesuai. Harap periksa pengaturan lingkungan.";
      } else if (
        rawErrorMsg.includes("max completion tokens") ||
        rawErrorMsg.includes("json_validate_failed") ||
        rawErrorMsg.includes("Failed to generate JSON")
      ) {
        userFriendlyMessage = "Teks klausul atau instruksi terlalu panjang untuk diproses dalam satu sesi. Silakan coba pilih bagian klausul yang lebih spesifik.";
      } else if (rawErrorMsg.includes("400") || rawErrorMsg.includes("invalid_request_error")) {
        userFriendlyMessage = "Permintaan perbaikan tidak dapat diproses. Silakan periksa kembali teks klausul atau instruksi Anda.";
      } else if (rawErrorMsg) {
        userFriendlyMessage = "Terjadi kesalahan saat memproses perbaikan klausul dengan AI. Silakan coba lagi.";
      }

      console.error("[GroqService] Generation failed for provider groq:", error);

      return createErrorResponse(userFriendlyMessage);
    }
  }
}

/** Factory function to create a GroqService instance. */
export function createGroqService() {
  return new GroqService();
}

/** Singleton instance of GroqService. */
export const groqService = new GroqService();
