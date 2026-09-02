import "server-only";

import { createDraftService } from "@/services/draft.service";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function getDraftServerContext() {
  const sessionClient = await createClient();
  const { data: { user }, error } = await sessionClient.auth.getUser();
  if (error || !user) return null;
  return { user, service: createDraftService(createAdminClient()) };
}
