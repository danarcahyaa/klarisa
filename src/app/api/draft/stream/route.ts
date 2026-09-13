import { NextRequest } from "next/server";
import { getDraftServerContext } from "@/lib/draft-context";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Route handler to stream draft generation events in real time.
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

    const body = await req.json();
    const prompt = typeof body?.prompt === "string" ? body.prompt.trim() : "";
    const interactionId = typeof body?.interactionId === "string" ? body.interactionId.trim() : undefined;

    if (!prompt) {
      return new Response(
        JSON.stringify({ error: "Prompt draft tidak boleh kosong." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of context.service.streamDraft(prompt, { interactionId })) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
          }
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Terjadi kesalahan saat streaming draf.";
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "error", error: msg })}\n\n`));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive",
      },
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Gagal memulai streaming.";
    return new Response(JSON.stringify({ error: errorMsg }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
