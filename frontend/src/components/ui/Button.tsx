"use client";

import { forwardRef } from "react";
import { Loader2 } from "lucide-react";

type Variant = "primary" | "secondary" | "on-dark" | "ghost" | "danger";
type Size = "sm" | "md";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

// Pill geometry (rounded-full) untuk SEMUA tombol — vocabulary inti Ollama.
const VARIANTS: Record<Variant, string> = {
  // CTA universal: pill hitam.
  primary:
    "bg-ink text-on-dark hover:bg-ink-deep active:scale-[0.98] disabled:bg-surface-soft disabled:text-mute",
  // Alternatif outline di kanvas terang.
  secondary:
    "bg-canvas text-ink border border-hairline-strong hover:bg-surface-soft active:scale-[0.98] disabled:text-mute",
  // Pill putih di atas permukaan gelap (surface-dark).
  "on-dark":
    "bg-canvas text-ink hover:bg-surface-soft active:scale-[0.98]",
  // Tanpa bingkai — aksi tersier / ikon.
  ghost:
    "bg-transparent text-body hover:bg-surface-soft hover:text-ink active:scale-[0.98]",
  // Aksi destruktif (merah fungsional minimal).
  danger:
    "bg-transparent text-danger border border-transparent hover:bg-[#fef2f2] active:scale-[0.98]",
};

const SIZES: Record<Size, string> = {
  sm: "h-8 px-3 text-[13px] gap-1.5",
  md: "h-9 px-5 text-sm gap-2",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { variant = "primary", size = "md", loading, disabled, type = "button", className = "", children, ...props },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || loading}
        className={`inline-flex items-center justify-center rounded-full font-medium leading-none transition-all outline-none focus-visible:ring-2 focus-visible:ring-[rgba(59,130,246,0.5)] disabled:cursor-not-allowed disabled:active:scale-100 ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
        {...props}
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";

export default Button;
