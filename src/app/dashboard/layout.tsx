import { Suspense } from "react";
import { redirect } from "next/navigation";

import { DashboardShell } from "@/components/dashboard-shell";
import { getDraftServerContext } from "@/lib/draft-context";
import { createChatService } from "@/services/chat.service";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const context = await getDraftServerContext();

  if (!context) {
    redirect("/login?next=/dashboard");
  }

  const { user } = context;

  const adminClient = createAdminClient();
  const chatService = createChatService(adminClient);
  const chatsResult = await chatService.searchChats(user.id, { page: 1, limit: 15 });
  const initialChats = chatsResult.data?.chats ?? [];

  const { data: profile } = await adminClient
    .from("profiles")
    .select("avatar_url, full_name")
    .eq("id", user.id)
    .maybeSingle();

  const name =
    profile?.full_name ??
    user.user_metadata?.full_name ??
    user.user_metadata?.name ??
    user.email?.split("@")[0] ??
    "Pengguna Klarisa";

  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((part: string) => part[0])
    .join("")
    .toUpperCase();

  const avatarUrl =
    profile?.avatar_url ??
    user.user_metadata?.avatar_url ??
    user.user_metadata?.picture ??
    user.user_metadata?.avatar ??
    null;

  return (
    <Suspense fallback={null}>
      <DashboardShell
        user={{
          name,
          email: user.email ?? "",
          initials: initials || "K",
          avatarUrl,
        }}
        initialChats={initialChats}
      >
        {children}
      </DashboardShell>
    </Suspense>
  );
}
