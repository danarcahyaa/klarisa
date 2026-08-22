import { NextResponse } from "next/server";

import { getContractRequestContext } from "@/lib/contract-api";
import { createErrorResponse } from "@/lib/response";

export async function GET(request: Request) {
  const context = await getContractRequestContext();
  if (!context) return NextResponse.json(createErrorResponse("Sesi Anda telah berakhir."), { status: 401 });
  const params = new URL(request.url).searchParams;
  const type = params.get("type");
  const result = await context.service.list(context.user.id, {
    query: params.get("query") || undefined,
    type: type === "review" || type === "draft" ? type : undefined,
    shared: params.get("shared") === "true" ? true : undefined,
  });
  return NextResponse.json(result, { status: result.success ? 200 : 400 });
}
