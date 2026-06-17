"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

/**
 * Blok kode mono dengan tombol copy + label opsional. Gaya Ollama:
 * kartu hairline rounded-[12px], header surface-soft, body mono.
 */
export function CodeBlock({
  code,
  label,
  className = "",
}: {
  code: string;
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className={`rounded-[12px] border border-hairline overflow-hidden ${className}`}>
      {/* Header gaya terminal: traffic-lights + label + salin */}
      <div className="flex items-center gap-3 px-4 py-2.5 bg-surface-soft border-b border-hairline">
        <span className="w-3 h-3 rounded-full bg-terminal-red shrink-0" />
        <span className="w-3 h-3 rounded-full bg-terminal-yellow shrink-0" />
        <span className="w-3 h-3 rounded-full bg-terminal-green shrink-0" />
        {label && <span className="ml-1 text-xs font-mono text-mute truncate">{label}</span>}
        <button
          onClick={copy}
          className="ml-auto inline-flex items-center gap-1.5 text-xs font-medium text-charcoal hover:text-ink transition-colors shrink-0"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-ok" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? "Tersalin" : "Salin"}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto bg-canvas text-[13px] leading-relaxed font-mono text-ink">
        <code>{code}</code>
      </pre>
    </div>
  );
}

export default CodeBlock;
