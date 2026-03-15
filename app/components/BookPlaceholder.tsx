export function BookPlaceholder({ className }: { className?: string }) {
  return (
    <div className={`book-placeholder ${className ?? ""}`}>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="2" y="1" width="20" height="22" rx="2" />
        <line x1="7" y1="1" x2="7" y2="23" />
        <line x1="10" y1="7" x2="18" y2="7" />
        <line x1="10" y1="11" x2="18" y2="11" />
        <line x1="10" y1="15" x2="15" y2="15" />
      </svg>
    </div>
  );
}
