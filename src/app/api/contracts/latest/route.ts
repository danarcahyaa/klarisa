import { NextResponse } from "next/server";

import { getContractRequestContext } from "@/lib/contract-api";
import { createErrorResponse } from "@/lib/response";

export async function GET() {
  const context = await getContractRequestContext();
  if (!context) return NextResponse.json(createErrorResponse("Sesi Anda telah berakhir."), { status: 401 });
  const result = await context.service.detail(context.user.id);
  return NextResponse.json(result, { status: result.success ? 200 : 404 });
}
