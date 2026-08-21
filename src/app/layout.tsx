import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Klarisa - Platform LegalTech",
  description: "Platform Manajemen Dokumen & Kontrak Hukum AI",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="id"
      className="h-full antialiased font-sans"
    >
      <body className="min-h-full flex flex-col font-sans bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
