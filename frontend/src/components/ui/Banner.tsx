"use client";

import { Check, AlertCircle, Info } from "lucide-react";

type Tone = "info" | "success" | "error";

const ICON = { info: Info, success: Check, error: AlertCircle };

// Banner inline tipis (hairline + surface-soft), bukan blok warna penuh.
// Aksen kecil di ikon saja agar tetap netral ala Ollama.
export function Banner({
  tone = "info",
  children,
  className = "",
}: {
  tone?: Tone;
  children: React.ReactNode;
  className?: string;
}) {
  const Icon = ICON[tone];
  const iconColor =
    tone === "success" ? "text-ok" : tone === "error" ? "text-danger" : "text-mute";

  return (
    <div
      className={`flex items-start gap-2.5 px-4 py-3 rounded-[12px] border border-hairline bg-surface-soft text-sm text-charcoal ${className}`}
    >
      <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${iconColor}`} strokeWidth={1.75} />
      <div className="min-w-0">{children}</div>
    </div>
  );
}

export default Banner;
