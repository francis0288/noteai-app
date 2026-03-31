"use client";

import { useTheme } from "./ThemeProvider";

export default function NoteAILogo({ size = 40, className = "" }: { size?: number; className?: string }) {
  const { isDark } = useTheme();

  if (isDark) {
    // Dark mode: show logo inside a subtle white pill so it stays visible
    return (
      <div
        className={`flex-shrink-0 rounded-2xl bg-white/95 overflow-hidden flex items-center justify-center ${className}`}
        style={{ width: size, height: size, padding: size * 0.06 }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo.png"
          alt="NoteAI"
          style={{ width: "100%", height: "100%", objectFit: "contain" }}
        />
      </div>
    );
  }

  // Light mode: multiply blend makes the white card transparent against the white header
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo.png"
      alt="NoteAI"
      className={`flex-shrink-0 ${className}`}
      style={{
        width: size,
        height: size,
        objectFit: "contain",
        mixBlendMode: "multiply",
      }}
    />
  );
}
