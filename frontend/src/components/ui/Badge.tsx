"use client";

type Tone = "neutral" | "ok" | "warn" | "danger";

const DOT: Record<Tone, string> = {
  neutral: "bg-mute",
  ok: "bg-ok",
  warn: "bg-warn",
  danger: "bg-danger",
};

// ── StatusDot ────────────────────────────────────────────────────────────────
// Titik status kecil tanpa glow (fungsional, bukan dekorasi).
export function StatusDot({
  tone = "neutral",
  pulse = false,
  className = "",
}: {
  tone?: Tone;
  pulse?: boolean;
  className?: string;
}) {
  return (
    <span
      className={`inline-block w-2 h-2 rounded-full ${DOT[tone]} ${pulse ? "animate-pulse" : ""} ${className}`}
    />
  );
}

// ── Badge (pill netral + dot opsional) ───────────────────────────────────────
export function Badge({
  tone = "neutral",
  dot = false,
  className = "",
  children,
}: {
  tone?: Tone;
  dot?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-hairline bg-surface-soft text-charcoal text-xs font-medium ${className}`}
    >
      {dot && <StatusDot tone={tone} />}
      {children}
    </span>
  );
}

export default Badge;
