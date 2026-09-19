import type { StreamDraftClientOptions } from "@/types/draft.type";

import { GeminiInteractionResponse, GeminiInteractionToolCall, GeminiInteraction } from "@/types/llm.type";
import { createErrorResponse, createSuccessResponse } from "@/lib/response";

/**
 * Client-side utility that streams draft generation from `/api/draft/stream` via SSE.
 *
 * @param options - Prompt, optional interactionId, and streaming callbacks.
 * @returns Resolves with GeminiInteractionResponse upon completion.
 */
export async function streamDraftFromApiAction(
  options: StreamDraftClientOptions
): Promise<GeminiInteractionResponse> {
  const { prompt, interactionId, signal, onChunk, onInteractionId, onStepStop } = options;

  if (signal?.aborted) {
    return createSuccessResponse(
      {
        text: "",
        interactionId: interactionId ?? undefined,
        status: "stopped",
        steps: [],
      },
      "Respons AI dihentikan."
    );
  }

  let fullText = "";
  let currentInteractionId = interactionId ?? null;
  let completedData: GeminiInteraction | null = null;
  const collectedToolCalls: GeminiInteractionToolCall[] = [];

  try {
    const response = await fetch("/api/draft/stream", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
        interactionId,
      }),
      signal,
    });

    if (!response.ok) {
      let errorMsg = "Gagal membuat draf kontrak.";
      const errText = await response.text();
      if (errText.trim().startsWith("{")) {
        const errJson = JSON.parse(errText);
        if (errJson?.error) {
          errorMsg = errJson.error;
        }
      }
      return createErrorResponse(errorMsg);
    }

    if (!response.body) {
      return createErrorResponse("Stream respons tidak tersedia dari server.");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let streamError: string | null = null;

    const onAbort = () => {
      void reader.cancel();
    };

    signal?.addEventListener("abort", onAbort, { once: true });

    const processEvent = (event: any) => {
      if (!event || typeof event !== "object") return;

      console.log(`[StreamClient:Event] type: "${event.type}"`, event.status ? `status: "${event.status}"` : "");

      if (event.type === "interaction_created" && event.interactionId) {
        currentInteractionId = event.interactionId;
        console.log(`[StreamClient:interaction_created] ID: ${event.interactionId}`);
        onInteractionId?.(event.interactionId);
      } else if (event.type === "status_update") {
        console.log(`[StreamClient:status_update] Status: ${event.status}`);
      } else if (event.type === "text_delta" && typeof event.text === "string") {
        fullText += event.text;
        onChunk?.(event.text, fullText);
      } else if (event.type === "tool_call" && event.toolCall) {
        console.log(`[StreamClient:tool_call] Tool: ${event.toolCall.name}`, event.toolCall.args);
        collectedToolCalls.push(event.toolCall);
      } else if (event.type === "step_stop") {
        const hasToolCall = collectedToolCalls.length > 0 || event.stepType === "function_call";
        console.log(`[StreamClient:step_stop] Index: ${event.index}, StepType: ${event.stepType}, hasToolCall: ${hasToolCall}`);
        onStepStop?.(event.stepType, hasToolCall);

        // Condition 1: If there are NO tool calls (plain text generation), the model has finished emitting tokens.
        // We can immediately settle completedData and complete the stream without waiting for trailing interaction.completed.
        // Condition 2: If there ARE tool calls (any tool calls), do NOT finish early; wait for full lifecycle.
        if (!hasToolCall && fullText.length > 0) {
          console.log("[StreamClient:step_stop] No tool calls detected. Completing stream immediately at step.stop.");
          completedData = {
            text: fullText,
            interactionId: currentInteractionId ?? undefined,
            status: "completed",
            steps: [],
          };
        }
      } else if (event.type === "interaction_completed" && event.data) {
        console.log(`[StreamClient:interaction_completed] Status: ${event.data.status}, Text length: ${event.data.text?.length}`);
        completedData = event.data;
      } else if (event.type === "error" && event.error) {
        console.error(`[StreamClient:error] Error:`, event.error);
        streamError = event.error;
      }
    };

    try {
      while (true) {
        if (signal?.aborted) {
          console.log("[StreamClient] Stream aborted by signal");
          break;
        }

        const { done, value } = await reader.read();
        if (done || signal?.aborted) {
          console.log("[StreamClient] Reader read done:", done);
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine || !trimmedLine.startsWith("data:")) continue;

          const jsonPayload = trimmedLine.replace(/^data:\s*/, "");
          if (jsonPayload.startsWith("{")) {
            const parsed = JSON.parse(jsonPayload);
            processEvent(parsed);
            if (completedData || streamError) {
              break;
            }
          }
        }

        if (completedData || streamError) {
          console.log("[StreamClient] Exiting read loop due to completedData or streamError");
          try {
            void reader.cancel();
          } catch {
            // Ignore cancel error if already closed
          }
          break;
        }
      }
    } catch (readError) {
      if (signal?.aborted || (readError instanceof Error && readError.name === "AbortError")) {
        // Stream reading cancelled by user abort, proceed to return partial result
      } else {
        throw readError;
      }
    } finally {
      signal?.removeEventListener("abort", onAbort);
    }

    if (!signal?.aborted && buffer.trim().startsWith("data:")) {
      const jsonPayload = buffer.trim().replace(/^data:\s*/, "");
      if (jsonPayload.startsWith("{")) {
        const parsed = JSON.parse(jsonPayload);
        processEvent(parsed);
      }
    }

    if (signal?.aborted) {
      const stoppedInteraction: GeminiInteraction = completedData || {
        text: fullText,
        interactionId: currentInteractionId ?? undefined,
        toolCalls: collectedToolCalls.length > 0 ? collectedToolCalls : undefined,
        status: "stopped",
        steps: [],
      };
      return createSuccessResponse(stoppedInteraction, "Respons AI dihentikan.");
    }

    if (streamError) {
      return createErrorResponse(streamError);
    }

    const finalInteraction: GeminiInteraction = completedData || {
      text: fullText,
      interactionId: currentInteractionId ?? undefined,
      toolCalls: collectedToolCalls.length > 0 ? collectedToolCalls : undefined,
      status: "completed",
      steps: [],
    };

    return createSuccessResponse(finalInteraction, "Draf kontrak berhasil diproses.");
  } catch (error) {
    if (signal?.aborted || (error instanceof Error && error.name === "AbortError")) {
      const stoppedInteraction: GeminiInteraction = {
        text: fullText,
        interactionId: currentInteractionId ?? undefined,
        toolCalls: collectedToolCalls.length > 0 ? collectedToolCalls : undefined,
        status: "stopped",
        steps: [],
      };
      return createSuccessResponse(stoppedInteraction, "Respons AI dihentikan.");
    }

    const errorMsg =
      error instanceof Error ? error.message : "Terjadi kesalahan saat memproses stream respons.";
    return createErrorResponse(errorMsg);
  }
}
