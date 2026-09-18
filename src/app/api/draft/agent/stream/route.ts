import { NextRequest } from "next/server";
import { getDraftServerContext } from "@/lib/draft-context";
import { draftAgentService } from "@/services/draft-agent.service";
import { agentStreamRequestSchema } from "@/app/validations/agent-contract.validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Route handler streaming Agentic Contract LLM interactions via SSE.
 * Receives prompt and selection context (selectedText, highlightId, interactionId),
 * invoking Gemini Interactions API with AGENT_CONTRACT_TOOLS.
 */
export async function POST(req: NextRequest) {
  try {
    const context = await getDraftServerContext();
    if (!context) {
      return new Response(
        JSON.stringify({ error: "Sesi Anda telah berakhir. Silakan masuk kembali." }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const rawBody = await req.json();
    const validation = agentStreamRequestSchema.safeParse(rawBody);

    if (!validation.success) {
      const errorMsg =
        validation.error.issues[0]?.message || "Permintaan tidak valid.";
      return new Response(JSON.stringify({ error: errorMsg }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { prompt, selectedText, highlightId, interactionId } = validation.data;

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of draftAgentService.streamAgentInteraction({
            prompt,
            selectedText,
            highlightId,
            interactionId,
          })) {
            if (req.signal.aborted) {
              break;
            }
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
          }
        } catch (err) {
          if (!req.signal.aborted) {
            const rawMsg = err instanceof Error ? err.message : String(err);
            const lowerMsg = rawMsg.toLowerCase();
            const msg =
              lowerMsg.includes("high demand") || lowerMsg.includes("spikes in demand")
                ? "Terlalu banyak permintaan. Coba lagi nanti."
                : (err instanceof Error ? err.message : "Terjadi kesalahan. Coba lagi nanti");
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: "error", error: msg })}\n\n`)
            );
          }
        } finally {
          controller.close();
        }
      },
      cancel() {
        // Consumer cancelled or aborted connection
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Terjadi kesalahan. Coba lagi nanti" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
