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
    const documentHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${title}</title>
</head>
<body>
  ${cleanedContent}
</body>
</html>`;

    const docxBuffer = await htmlToDocx(documentHtml, null, {
      title,
      margins: {
        top: 1440,
        right: 1440,
        bottom: 1440,
        left: 1440,
      },
    });

    const safeFilename = title.replace(/[/\\?%*:|"<>]/g, "-").trim() || "dokumen-kontrak";

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
