import { NextResponse } from "next/server";
import htmlToDocx from "html-to-docx";

/**
 * Strips temporary selection highlight marks before converting to DOCX.
 */
function cleanDraftHtml(html: string): string {
  if (!html || !html.trim()) {
    return "<p></p>";
  }
  return html.replace(/<mark(\b[^>]*)>([\s\S]*?)<\/mark>/gi, (_match, _attrs, innerText) => {
    return innerText;
  });
}

/**
 * Handles exporting contract draft HTML into a formatted DOCX document.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const title = typeof body.title === "string" && body.title.trim() ? body.title.trim() : "Dokumen Kontrak";
    const rawContent = typeof body.content === "string" ? body.content : "";

    const cleanedContent = cleanDraftHtml(rawContent);

    // html-to-docx replaces default margins entirely if a margins object is provided.
    // Explicitly defining header, footer, and gutter prevents Word XML schema errors
    // where attributes default to "undefined" twip values, which corrupts the document.
    const docxBuffer = await htmlToDocx(cleanedContent, null, {
      title,
      margins: {
        top: 1440,
        right: 1440,
        bottom: 1440,
        left: 1440,
        header: 720,
        footer: 720,
        gutter: 0,
      },
    });

    const safeFilename = title.replace(/\.docx$/i, "").replace(/[/\\?%*:|"<>]/g, "-").trim() || "dokumen-kontrak";

    return new Response(docxBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(safeFilename)}.docx"`,
      },
    });
  } catch (error) {
    console.error("[ExportDocx] Failed to generate DOCX:", error);
    return NextResponse.json(
      { success: false, error: "Gagal membuat dokumen DOCX." },
      { status: 500 }
    );
  }
}
