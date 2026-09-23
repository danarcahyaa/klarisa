import { redirect } from "next/navigation";
import { ContractSearchClient } from "@/components/contract-search-client";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createContractRepository } from "@/repositories/contract.repository";
import { createContractService } from "@/services/contract.service";

export const dynamic = "force-dynamic";

export default async function SearchPage() {
  const sessionClient = await createClient();
  const {
    data: { user },
    error,
  } = await sessionClient.auth.getUser();

  if (error || !user) {
    redirect("/auth/login");
  }

  const repository = createContractRepository(createAdminClient());
  const contractService = createContractService(repository);
  const result = await contractService.searchContracts({
    userId: user.id,
    limit: 10,
    offset: 0,
  });

  return (
    <ContractSearchClient
      initialItems={result.data?.items ?? []}
      initialTotalCount={result.data?.totalCount ?? 0}
    />
  );
}

