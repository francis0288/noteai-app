import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";

export const metadata: Metadata = {
  title: "NoteAI — Smart Notes",
  description: "AI-powered note-taking app similar to Google Keep",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-[#f8f9fa] dark:bg-[#202124]">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
