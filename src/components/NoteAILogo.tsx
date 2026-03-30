export default function NoteAILogo({ size = 32, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Lightbulb body */}
      <path
        d="M20 4C13.373 4 8 9.373 8 16c0 4.418 2.239 8.306 5.625 10.625V30a2 2 0 002 2h8.75a2 2 0 002-2v-3.375C29.761 24.306 32 20.418 32 16c0-6.627-5.373-12-12-12z"
        fill="#F59E0B"
      />
      {/* Base lines */}
      <rect x="14" y="32" width="12" height="2" rx="1" fill="#D97706" />
      <rect x="15.5" y="35" width="9" height="2" rx="1" fill="#D97706" />
      {/* Spark/AI symbol inside */}
      <path d="M20 10l1.5 4.5H26l-3.75 2.75 1.5 4.5L20 19l-3.75 2.75 1.5-4.5L14 14.5h4.5L20 10z"
        fill="white" opacity="0.9" />
    </svg>
  );
}
