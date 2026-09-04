import { GoogleGenAI } from "@google/genai";
import Groq from "groq-sdk";

import { createErrorResponse, createSuccessResponse } from "@/lib/response";
import type { GenerateCompletionOptions, LlmCompletionResult, LlmProvider, LlmResponse } from "@/types/llm.type";
import { GEMINI_MODEL, GROQ_QWEN_MODEL } from "@/constants";

export class LlmService {
  private geminiClient: GoogleGenAI | null = null;
  private groqClient: Groq | null = null;

  /**
   * Lazy initializes the Google GenAI client instance.
   */
  private getGeminiClient(): GoogleGenAI {
    if (!this.geminiClient) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY belum dikonfigurasi di lingkungan aplikasi.");
      }
      this.geminiClient = new GoogleGenAI({ apiKey });
    }
    return this.geminiClient;
  }

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
   * Executes LLM completion generation with Google Gemini model (Gemini 3.6 Flash)
   * with automatic retries for transient 503 high demand / 429 rate limit errors.
   *
   * @param prompt     - User prompt or input context.
   * @param options    - Generation configurations.
   * @param maxRetries - Maximum retry attempts.
   * @returns LlmCompletionResult with generated text.
   */
  private async generateWithGemini(
    prompt: string,
    options: Omit<GenerateCompletionOptions, "provider">,
    maxRetries = 3
  ): Promise<LlmCompletionResult> {
    const ai = this.getGeminiClient();
    const modelName = GEMINI_MODEL;
    const { systemInstruction, jsonMode = false, responseSchema, temperature = 0.1 } = options;

    const config: Record<string, unknown> = {
      systemInstruction,
      temperature,
    };

    if (jsonMode || responseSchema) {
      config.responseMimeType = "application/json";
    }

    if (responseSchema) {
      config.responseSchema = responseSchema;
    }

    let lastError: unknown;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        if (attempt > 1) {
          console.log(`[LlmService] Memulai retry pemanggilan Gemini (Percobaan ${attempt}/${maxRetries})...`);
        }

        const response = await ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config,
        });

        return {
          text: response.text ?? "",
          provider: "gemini",
          modelName,
        };
      } catch (error: unknown) {
        lastError = error;
        const errStr = String(error);
        const status = (error as { status?: number })?.status;

        const isRetryable =
          status === 503 ||
          status === 429 ||
          errStr.includes("503") ||
          errStr.includes("UNAVAILABLE") ||
          errStr.includes("high demand") ||
          errStr.includes("RESOURCE_EXHAUSTED");

        if (isRetryable && attempt < maxRetries) {
          const delayMs = attempt * 2000;
          console.warn(
            `[LlmService] Gemini 503/429 high demand detected. Retrying attempt ${attempt}/${maxRetries} in ${delayMs}ms...`
          );
          await new Promise((resolve) => setTimeout(resolve, delayMs));
          continue;
        }

        throw error;
      }
    }

    throw lastError;
  }

  /**
   * Executes LLM completion generation with Groq Qwen model (Qwen 3.6 27B)
   * with automatic retries for transient 503 / 429 rate limit errors.
   *
   * @param prompt     - User prompt or input context.
   * @param options    - Generation configurations.
   * @param maxRetries - Maximum retry attempts.
   * @returns LlmCompletionResult with generated text.
   */
  private async generateWithGroq(
    prompt: string,
    options: Omit<GenerateCompletionOptions, "provider">,
    maxRetries = 3
  ): Promise<LlmCompletionResult> {
    const groq = this.getGroqClient();
    const modelName = GROQ_QWEN_MODEL;
    const { systemInstruction, jsonMode = false, responseSchema, temperature = 0.1 } = options;

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
          console.log(`[LlmService] Memulai retry pemanggilan Groq (Percobaan ${attempt}/${maxRetries})...`);
        }

        const response = await groq.chat.completions.create({
          model: modelName,
          messages,
          temperature,
          ...(responseFormat ? { response_format: responseFormat as any } : {}),
          stream: false,
          reasoning_effort: "none"
        });

        const choice = response.choices?.[0];
        const text = choice?.message?.content ?? "";

        return {
          text,
          provider: "groq",
          modelName,
        };
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
            `[LlmService] Groq 503/429 rate limit detected. Retrying attempt ${attempt}/${maxRetries} in ${delayMs}ms...`
          );
          await new Promise((resolve) => setTimeout(resolve, delayMs));
          continue;
        }

        throw error;
      }
    }

    throw lastError;
  }

  /**
   * Generates text completion using the specified LLM provider (defaults to Groq Qwen 3.6 27B).
   *
   * @param prompt  - The text prompt sent to the LLM.
   * @param options - Model settings.
   * @returns BaseResponse wrapping LlmCompletionResult.
   */
  async generateCompletion(
    prompt: string,
    options: GenerateCompletionOptions = {}
  ): Promise<LlmResponse> {
    const provider: LlmProvider = options.provider ?? "groq";

    try {
      const result =
        provider === "groq"
          ? await this.generateWithGroq(prompt, options)
          : await this.generateWithGemini(prompt, options);

      return createSuccessResponse(
        result,
        `Respon berhasil didapatkan dari LLM (${result.provider}: ${result.modelName}).`
      );
    } catch (error) {
      const rawErrorMsg = error instanceof Error ? error.message : String(error);
      let userFriendlyMessage = `Gagal memproses permintaan LLM dengan provider ${provider}.`;

      if (rawErrorMsg.includes("503") || rawErrorMsg.includes("high demand") || rawErrorMsg.includes("UNAVAILABLE")) {
        userFriendlyMessage = `Layanan server AI (${provider === "groq" ? "Groq / Qwen" : "Gemini"}) sedang mengalami beban lonjakan tinggi sementara. Silakan coba beberapa saat lagi.`;
      } else if (rawErrorMsg.includes("429") || rawErrorMsg.includes("RESOURCE_EXHAUSTED") || rawErrorMsg.includes("rate_limit")) {
        userFriendlyMessage = "Batas penggunaan API (rate limit) telah tercapai. Silakan tunggu sejenak dan coba kembali.";
      } else if (rawErrorMsg.includes("API key") || rawErrorMsg.includes("GROQ_API_KEY") || rawErrorMsg.includes("GEMINI_API_KEY")) {
        userFriendlyMessage = "Konfigurasi kunci API (API Key) AI belum sesuai. Harap periksa pengaturan lingkungan.";
      } else if (rawErrorMsg) {
        userFriendlyMessage = rawErrorMsg;
      }

      console.error(`[LlmService] Generation failed for provider ${provider}:`, error);

      return createErrorResponse(userFriendlyMessage);
    }
  }
}

/** Factory function to create an LlmService instance. */
export function createLlmService() {
  return new LlmService();
}

/** Singleton instance of LlmService. */
export const llmService = new LlmService();
