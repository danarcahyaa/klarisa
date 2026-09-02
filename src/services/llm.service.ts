import { GoogleGenAI } from "@google/genai";

import { createErrorResponse, createSuccessResponse } from "@/lib/response";
import type { GenerateCompletionOptions, LlmCompletionResult, LlmProvider, LlmResponse } from "@/types/llm.type";
import { GEMINI_MODEL } from "@/constants";

export class LlmService {
  private geminiClient: GoogleGenAI | null = null;

  /**
   * Lazy initializes the Google GenAI client instance.
   */
  private getGeminiClient(): GoogleGenAI {
    if (!this.geminiClient) {
      const apiKey = process.env.GEMINI_API_KEY_2;
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY belum dikonfigurasi di lingkungan aplikasi.");
      }
      this.geminiClient = new GoogleGenAI({ apiKey });
    }
    return this.geminiClient;
  }

  /**
   * Executes LLM completion generation with Google Gemini model (Gemini 3.6 Flash).
   *
   * @param prompt  - User prompt or input context.
   * @param options - Generation configurations.
   * @returns LlmCompletionResult with generated text.
   */
  private async generateWithGemini(
    prompt: string,
    options: Omit<GenerateCompletionOptions, "provider">
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
  }

  /**
   * Generates text completion using the Google Gemini LLM provider.
   *
   * @param prompt  - The text prompt sent to the LLM.
   * @param options - Model settings.
   * @returns BaseResponse wrapping LlmCompletionResult.
   */
  async generateCompletion(
    prompt: string,
    options: GenerateCompletionOptions = {}
  ): Promise<LlmResponse> {
    const provider: LlmProvider = "gemini";

    try {
      const result = await this.generateWithGemini(prompt, options);

      return createSuccessResponse(
        result,
        `Respon berhasil didapatkan dari LLM (${result.provider}: ${result.modelName}).`
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : `Gagal memproses permintaan LLM dengan provider ${provider}.`;

      console.error(`[LlmService] Generation failed for provider ${provider}:`, error);

      return createErrorResponse(errorMessage);
    }
  }
}

/** Factory function to create an LlmService instance. */
export function createLlmService() {
  return new LlmService();
}

/** Singleton instance of LlmService. */
export const llmService = new LlmService();
