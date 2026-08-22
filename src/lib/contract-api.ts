import "server-only";

import { createContractService } from "@/services/contract.service";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function getContractRequestContext() {
  const sessionClient = await createClient();
  const { data: { user }, error } = await sessionClient.auth.getUser();
  if (error || !user) return null;
  return { user, service: createContractService(createAdminClient()) };
}
