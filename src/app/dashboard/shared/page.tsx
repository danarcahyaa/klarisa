import { SharedDraftsClient } from "@/components/shared-drafts-client";
import { getDraftServerContext } from "@/lib/draft-context";

export default async function SharedDraftsPage() {
  const context = await getDraftServerContext();
  const result = context ? await context.service.list(context.user.id, { type: "draft", shared: true }) : null;
  return <SharedDraftsClient items={result?.data ?? []}/>;
}
