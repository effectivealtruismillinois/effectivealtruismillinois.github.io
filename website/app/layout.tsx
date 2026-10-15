import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Effective Altruism at UIUC — Doing good better.",
  description: "A community of curious students at UIUC exploring how to use our lives to make the world better. Join the conversation.",
  other: {
    "codex-preview": "development",
  },
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
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
