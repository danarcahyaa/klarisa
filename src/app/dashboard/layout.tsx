import { redirect } from "next/navigation";

import { DashboardShell } from "@/components/dashboard-shell";
import { getDraftServerContext } from "@/lib/draft-context";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const context = await getDraftServerContext();

  if (!context) {
    redirect("/login?next=/dashboard");
  }

  const { user, service } = context;
  const recentResult = await service.list(user.id, { type: "draft" });
  const recentDocuments = (recentResult.data ?? []).slice(0, 3).map((draft) => ({
    id: draft.id,
    title: draft.title,
  }));

  const name =
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

  return (
    <DashboardShell
      user={{ name, email: user.email ?? "", initials: initials || "K" }}
      recentDocuments={recentDocuments}
    >
      {children}
    </DashboardShell>
  );
}
