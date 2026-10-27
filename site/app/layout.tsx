import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "校园互助 · AI 需求助手",
  description: "通过对话整理需求，用所长遇见需要的帮助。",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">{children}</body>
    </html>
  );
}
