import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="en">
      <body className="min-h-screen bg-[#f8f9fa]">
        {children}
      </body>
    </html>
  );
}
