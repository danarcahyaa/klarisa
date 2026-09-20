import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Editor Draft Kontrak | Klarisa",
  description: "Editor draft dan tinjauan kontrak hukum Klarisa",
};

export default function DraftEditorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
