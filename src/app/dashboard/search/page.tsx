import { ContractSearchClient } from "@/components/contract-search-client";
import { getDraftServerContext } from "@/lib/draft-context";

export default async function SearchPage() {
  const context = await getDraftServerContext();
  const result = context ? await context.service.list(context.user.id) : null;
  return <ContractSearchClient items={result?.data ?? []}/>;
}
