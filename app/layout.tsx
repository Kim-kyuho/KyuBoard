import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Kyu-board",
  description: "A free-form board for arranging rich text memos and images.",
  icons: {
    icon: "/favicon.ico?v=2",
    apple: "/apple-touch-icon.png?v=2",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col">{children}</body>
      <Analytics />
    </html>
  );
}
