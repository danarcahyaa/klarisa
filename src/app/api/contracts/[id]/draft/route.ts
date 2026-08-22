import { NextResponse } from "next/server";

import { getContractRequestContext } from "@/lib/contract-api";
import { createErrorResponse } from "@/lib/response";

interface RouteContext { params: Promise<{ id: string }> }

export async function PATCH(request: Request, { params }: RouteContext) {
  const context = await getContractRequestContext();
  if (!context) return NextResponse.json(createErrorResponse("Sesi Anda telah berakhir."), { status: 401 });
  const { id } = await params;
  const result = await context.service.saveDraft(context.user.id, id, await request.json());
  return NextResponse.json(result, { status: result.success ? 200 : 400 });
}
