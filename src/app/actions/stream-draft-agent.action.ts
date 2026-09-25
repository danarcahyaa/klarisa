import type {
  GeminiInteraction,
  GeminiInteractionResponse,
  GeminiInteractionToolCall,
} from "@/types/llm.type";
import { createErrorResponse, createSuccessResponse } from "@/lib/response";

import type { StreamDraftAgentOptions } from "@/types/agent-contract.type";
export type { StreamDraftAgentOptions };

/**
 * Client-side utility that streams draft editor agent interactions from `/api/draft/agent/stream` via SSE.
 *
 * @param options - Prompt, selection context, and streaming event callbacks.
 * @returns Resolves with GeminiInteractionResponse upon completion.
 */
export async function streamDraftAgentAction(
  options: StreamDraftAgentOptions
): Promise<GeminiInteractionResponse> {
  const {
    prompt,
    selectedText,
    highlightId,
    interactionId,
    contractContent,
    signal,
    onChunk,
    onToolCall,
    onInteractionId,
  } = options;

  if (signal?.aborted) {
    return createSuccessResponse(
      {
        text: "",
        interactionId: interactionId ?? undefined,
        status: "stopped",
        steps: [],
      },
      "Respons dihentikan."
    );
  }

  let fullText = "";
  let currentInteractionId = interactionId ?? null;
  let completedData: GeminiInteraction | null = null;
  const collectedToolCalls: GeminiInteractionToolCall[] = [];

  try {
    const response = await fetch("/api/draft/agent/stream", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
        selectedText,
        highlightId,
        interactionId,
        contractContent,
      }),
      signal,
    });

    if (!response.ok) {
      let errorMsg = "Terjadi kesalahan. Coba lagi nanti";
      const errText = await response.text();
      if (errText.trim().startsWith("{")) {
        try {
          const errJson = JSON.parse(errText);
          if (errJson?.error) {
            errorMsg = errJson.error;
          }
        } catch {
          // Ignore JSON parse error
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

      if (event.type === "interaction_created" && event.interactionId) {
        currentInteractionId = event.interactionId;
        onInteractionId?.(event.interactionId);
      } else if (event.type === "text_delta" && typeof event.text === "string") {
        fullText += event.text;
        onChunk?.(event.text, fullText);
      } else if (event.type === "tool_call" && event.toolCall) {
        collectedToolCalls.push(event.toolCall);
        onToolCall?.(event.toolCall);
      } else if (event.type === "step_stop") {
        const hasToolCall = collectedToolCalls.length > 0 || event.stepType === "function_call";
        console.log(`[StreamDraftAgent:step_stop] Index: ${event.index}, StepType: ${event.stepType}, hasToolCall: ${hasToolCall}`);
        if (!hasToolCall && fullText.length > 0) {
          completedData = {
            text: fullText,
            interactionId: currentInteractionId ?? undefined,
            status: "completed",
            steps: [],
          };
        }
      } else if (event.type === "interaction_completed" && event.data) {
        completedData = event.data;
      } else if (event.type === "error" && event.error) {
        streamError = String(event.error);
      }
    };

    try {
      while (true) {
        if (signal?.aborted) break;

        const { done, value } = await reader.read();
        if (done || signal?.aborted) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine || !trimmedLine.startsWith("data:")) continue;

          const jsonPayload = trimmedLine.replace(/^data:\s*/, "");
          if (jsonPayload.startsWith("{")) {
            try {
              const parsed = JSON.parse(jsonPayload);
              processEvent(parsed);
              if (completedData || streamError) {
                break;
              }
            } catch {
              // Ignore partial JSON line
            }
          }
        }

        if (completedData || streamError) {
          try {
            void reader.cancel();
          } catch {
            // Ignore cancel error
          }
          break;
        }
      }
    } catch (readError) {
      if (signal?.aborted || (readError instanceof Error && readError.name === "AbortError")) {
        // Stream aborted gracefully
      } else {
        throw readError;
      }
    } finally {
      signal?.removeEventListener("abort", onAbort);
    }

    if (!signal?.aborted && buffer.trim().startsWith("data:")) {
      const jsonPayload = buffer.trim().replace(/^data:\s*/, "");
      if (jsonPayload.startsWith("{")) {
        try {
          const parsed = JSON.parse(jsonPayload);
          processEvent(parsed);
        } catch {
          // Ignore
        }
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
      return createSuccessResponse(stoppedInteraction, "Respons dihentikan.");
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

    return createSuccessResponse(finalInteraction, "Interaksi agent berhasil diproses.");
  } catch (error) {
    if (signal?.aborted || (error instanceof Error && error.name === "AbortError")) {
      const stoppedInteraction: GeminiInteraction = {
        text: fullText,
        interactionId: currentInteractionId ?? undefined,
        toolCalls: collectedToolCalls.length > 0 ? collectedToolCalls : undefined,
        status: "stopped",
        steps: [],
      };
      return createSuccessResponse(stoppedInteraction, "Respons dihentikan.");
    }

    const errorMsg =
      error instanceof Error ? error.message : "Terjadi kesalahan saat memproses stream respons.";
    return createErrorResponse(errorMsg);
  }
}
