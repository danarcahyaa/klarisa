import { GoogleGenAI } from "@google/genai";

import { createErrorResponse, createSuccessResponse } from "@/lib/response";
import type {
  GeminiInteraction,
  GeminiInteractionOptions,
  GeminiInteractionResponse,
  GeminiInteractionStreamEvent,
  GeminiInteractionToolCall,
  GenerateCompletionOptions,
  LlmCompletionResult,
  LlmResponse,
} from "@/types/llm.type";
import { GEMINI_MODEL } from "@/constants";

export class GeminiService {
  private geminiClient: GoogleGenAI | null = null;

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
   * Generates text completion using Google Gemini model (Gemini 3.6 Flash)
   * with automatic retries for transient 503 high demand / 429 rate limit errors.
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
            console.log(`[GeminiService] Memulai retry pemanggilan Gemini (Percobaan ${attempt}/${maxRetries})...`);
          }

          const response = await ai.models.generateContent({
            model: modelName,
            contents: prompt,
            config,
          });

          const result: LlmCompletionResult = {
            text: response.text ?? "",
            provider: "gemini",
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
            errStr.includes("UNAVAILABLE") ||
            errStr.includes("high demand") ||
            errStr.includes("RESOURCE_EXHAUSTED");

          if (isRetryable && attempt < maxRetries) {
            const delayMs = attempt * 2000;
            console.warn(
              `[GeminiService] Gemini 503/429 high demand detected. Retrying attempt ${attempt}/${maxRetries} in ${delayMs}ms...`
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
      let userFriendlyMessage = "Gagal memproses permintaan LLM dengan provider gemini.";

      if (rawErrorMsg.includes("503") || rawErrorMsg.includes("high demand") || rawErrorMsg.includes("UNAVAILABLE")) {
        userFriendlyMessage = "Layanan server AI sedang mengalami beban lonjakan tinggi sementara. Silakan coba beberapa saat lagi.";
      } else if (rawErrorMsg.includes("429") || rawErrorMsg.includes("RESOURCE_EXHAUSTED") || rawErrorMsg.includes("rate_limit")) {
        userFriendlyMessage = "Batas penggunaan API (rate limit) telah tercapai. Silakan tunggu sejenak dan coba kembali.";
      } else if (rawErrorMsg.includes("API key") || rawErrorMsg.includes("GEMINI_API_KEY")) {
        userFriendlyMessage = "Konfigurasi kunci API (API Key) AI belum sesuai. Harap periksa pengaturan lingkungan.";
      } else if (rawErrorMsg) {
        userFriendlyMessage = rawErrorMsg;
      }

      console.error("[GeminiService] Generation failed for provider gemini:", error);

      return createErrorResponse(userFriendlyMessage);
    }
  }

  /**
   * Executes multi-turn conversation or task interaction with Gemini using the non-streaming Interactions API.
   *
   * @param inputParam - User input or prompt.
   * @param options    - Options (systemInstruction, tools, interactionId).
   * @returns BaseResponse wrapping GeminiInteraction.
   */
  async interactions(
    inputParam: string,
    options?: GeminiInteractionOptions
  ): Promise<GeminiInteractionResponse> {
    try {
      const ai = this.getGeminiClient();

      const { interactionId, systemInstruction, tools } = options || {};

      const payload: Record<string, unknown> = {
        model: GEMINI_MODEL,
        input: inputParam,
      };

      if (interactionId) {
        payload.previous_interaction_id = interactionId;
      }
      if (systemInstruction) {
        payload.system_instruction = systemInstruction;
      }
      if (tools && tools.length > 0) {
        payload.tools = tools;
      }

      const response = await ai.interactions.create(payload as any);

      const stepList = Array.isArray(response.steps) ? response.steps : [];
      const toolCalls: GeminiInteractionToolCall[] = [];

      for (const step of stepList) {
        if (step && step.type === "function_call") {
          toolCalls.push({
            id: step.id,
            name: step.name ?? "",
            args: (step.arguments && typeof step.arguments === "object" ? step.arguments : {}) as Record<string, unknown>,
          });
        }
      }

      let text = (response as any).output_text ?? "";
      if (!text) {
        for (const step of stepList) {
          if (step?.type === "model_output" && Array.isArray(step.content)) {
            for (const item of step.content) {
              if (item?.type === "text" && item.text) {
                text += item.text;
              }
            }
          }
        }
      }

      const outputs = stepList.filter((s: any) => s && s.type === "model_output");

      return createSuccessResponse(
        {
          text,
          interactionId: response.id ?? interactionId,
          toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
          status: response.status ?? "completed",
          steps: stepList,
          outputs: outputs.length > 0 ? outputs : undefined,
        },
        "Interaksi dengan Gemini berhasil diproses."
      );
    } catch (error) {
      console.error("[GeminiService] Interaction failed:", error);
      return createErrorResponse(this.mapGeminiInteractionError(error));
    }
  }

  /**
   * Safely invoke optional stream event callback without throwing or interrupting the stream.
   */
  private safelyInvokeEventHandler(onEvent?: (event: unknown) => void, event?: unknown): void {
    if (!onEvent) return;
    try {
      onEvent(event);
    } catch (err) {
      console.warn("[GeminiService] onEvent callback threw error:", err);
    }
  }

  /**
   * Safely parse function call JSON arguments without throwing.
   */
  private parseFunctionCallArguments(
    rawArgs?: string,
    fallbackArgs?: Record<string, unknown>
  ): Record<string, unknown> {
    if (!rawArgs) {
      return fallbackArgs && typeof fallbackArgs === "object" ? fallbackArgs : {};
    }

    try {
      return JSON.parse(rawArgs);
    } catch (err) {
      console.warn("[GeminiService] Failed to parse function_call arguments JSON:", err);
      return fallbackArgs && typeof fallbackArgs === "object" ? fallbackArgs : {};
    }
  }

  /**
   * Map raw Gemini errors to localized Indonesian user-friendly messages.
   */
  private mapGeminiInteractionError(error: unknown): string {
    const rawErrorMsg = error instanceof Error ? error.message : String(error);

    if (rawErrorMsg.includes("503") || rawErrorMsg.includes("high demand") || rawErrorMsg.includes("UNAVAILABLE")) {
      return "Layanan server AI sedang mengalami beban lonjakan tinggi sementara. Silakan coba beberapa saat lagi.";
    }
    if (rawErrorMsg.includes("429") || rawErrorMsg.includes("RESOURCE_EXHAUSTED") || rawErrorMsg.includes("rate_limit")) {
      return "Batas penggunaan API (rate limit) telah tercapai. Silakan tunggu sejenak dan coba kembali.";
    }
    if (rawErrorMsg.includes("API key") || rawErrorMsg.includes("GEMINI_API_KEY")) {
      return "Konfigurasi kunci API (API Key) AI belum sesuai. Harap periksa pengaturan lingkungan.";
    }
    return rawErrorMsg || "Gagal memproses interaksi dengan Gemini.";
  }

  /**
   * Executes multi-turn conversation or task interaction with Gemini using the Interactions API,
   * yielding stream events as an AsyncGenerator in real-time.
   *
   * @param inputParam - User input or prompt.
   * @param options    - Options (systemInstruction, tools, interactionId, callbacks).
   * @yields GeminiInteractionStreamEvent for text chunks, tool calls, and lifecycle events.
   * @returns GeminiInteractionResponse upon completion.
   */
  async *streamInteractions(
    inputParam: string,
    options?: GeminiInteractionOptions,
  ): AsyncGenerator<GeminiInteractionStreamEvent, GeminiInteractionResponse, unknown> {
    try {
      const ai = this.getGeminiClient();

      const {
        interactionId,
        systemInstruction,
        tools,
        onChunk,
        onToolCall,
        onEvent,
      } = options || {};

      const payload: Record<string, unknown> = {
        model: GEMINI_MODEL,
        input: inputParam,
        stream: true,
      };

      if (interactionId) {
        payload.previous_interaction_id = interactionId;
      }
      if (systemInstruction) {
        payload.system_instruction = systemInstruction;
      }
      if (tools && tools.length > 0) {
        payload.tools = tools;
      }

      const stream = await ai.interactions.create(payload as any);

      let fullText = "";
      let finalInteractionId = interactionId;
      let status = "completed";
      const steps: Record<number, any> = {};
      const rawArgs: Record<number, string> = {};
      const toolCalls: GeminiInteractionToolCall[] = [];

      for await (const event of stream as any) {
        this.safelyInvokeEventHandler(onEvent, event);

        if (event.event_type === "error") {
          const errMsg = event.error?.message || "Terjadi kesalahan pada stream interaksi Gemini.";
          yield { type: "error", error: errMsg };
          throw new Error(errMsg);
        }

        if (event.event_type === "interaction.created" && event.interaction) {
          finalInteractionId = event.interaction.id ?? finalInteractionId;
          status = event.interaction.status ?? status;
          yield {
            type: "interaction_created",
            interactionId: finalInteractionId ?? "",
          };
        } else if (event.event_type === "interaction.status_update") {
          finalInteractionId = event.interaction_id ?? finalInteractionId;
          status = event.status ?? status;
          yield { type: "status_update", status };
        } else if (event.event_type === "step.start") {
          const idx = event.index ?? 0;
          steps[idx] = { ...event.step };
          if (event.step?.type === "function_call") {
            rawArgs[idx] = "";
          }
        } else if (event.event_type === "step.delta") {
          const idx = event.index ?? 0;
          const delta = event.delta;
          if (delta) {
            if (delta.type === "text" && delta.text) {
              fullText += delta.text;
              if (onChunk) onChunk(delta.text);
              yield { type: "text_delta", text: delta.text, index: idx };
            } else if (delta.type === "arguments_delta" && delta.arguments) {
              rawArgs[idx] = (rawArgs[idx] || "") + delta.arguments;
            } else if (delta.type === "thought_signature") {
              yield { type: "thought_delta", signature: delta.signature, index: idx };
            }
          }
        } else if (event.event_type === "step.stop") {
          const idx = event.index ?? 0;
          const step = steps[idx];
          if (step && step.type === "function_call") {
            const parsedArgs = this.parseFunctionCallArguments(rawArgs[idx], step.arguments);
            step.arguments = parsedArgs;

            const tc: GeminiInteractionToolCall = {
              id: step.id,
              name: step.name ?? "",
              args: parsedArgs,
            };

            if (
              !toolCalls.some(
                (existing) =>
                  (tc.id && existing.id === tc.id) ||
                  (existing.name === tc.name && JSON.stringify(existing.args) === JSON.stringify(tc.args))
              )
            ) {
              toolCalls.push(tc);
              if (onToolCall) onToolCall(tc);
              yield { type: "tool_call", toolCall: tc, index: idx };
            }
          }
        } else if (event.event_type === "interaction.completed") {
          if (event.interaction) {
            finalInteractionId = event.interaction.id ?? finalInteractionId;
            status = event.interaction.status ?? status;
          }
        }
      }

      const stepList = Object.values(steps);
      const outputs = stepList.filter((s) => s && s.type === "model_output");

      const finalData: GeminiInteraction = {
        text: fullText,
        interactionId: finalInteractionId,
        toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
        status,
        steps: stepList,
        outputs: outputs.length > 0 ? outputs : undefined,
      };

      yield { type: "interaction_completed", data: finalData };

      return createSuccessResponse(finalData, "Interaksi dengan Gemini berhasil diproses.");
    } catch (error) {
      console.error("[GeminiService] Interaction stream failed:", error);
      return createErrorResponse(this.mapGeminiInteractionError(error));
    }
  }

}

/** Factory function to create a GeminiService instance. */
export function createGeminiService() {
  return new GeminiService();
}

/** Singleton instance of GeminiService. */
export const geminiService = new GeminiService();
