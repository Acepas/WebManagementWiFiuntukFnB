"use client";

// Kartu mock-terminal: 3 traffic-light dot + body monospace.
// Untuk preview CLI / output mentah MikroTik / code-block.
export function TerminalCard({
  title,
  className = "",
  children,
}: {
  title?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`rounded-[12px] border border-hairline bg-canvas overflow-hidden ${className}`}
    >
      {/* Header: traffic-light dots */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-hairline">
        <span className="w-3 h-3 rounded-full bg-terminal-red" />
        <span className="w-3 h-3 rounded-full bg-terminal-yellow" />
        <span className="w-3 h-3 rounded-full bg-terminal-green" />
        {title && (
          <span className="ml-2 text-xs text-mute font-mono truncate">{title}</span>
        )}
      </div>
      {/* Body */}
      <div className="p-4 font-mono text-[13px] leading-relaxed text-ink overflow-x-auto whitespace-pre-wrap">
        {children}
      </div>
    </div>
  );
}

export default TerminalCard;
