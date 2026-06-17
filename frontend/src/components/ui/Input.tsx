"use client";

import { forwardRef } from "react";

// ── Label ───────────────────────────────────────────────────────────────────
interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

export function Label({ required, className = "", children, ...props }: LabelProps) {
  return (
    <label
      className={`block text-[13px] font-medium text-ink mb-1.5 ${className}`}
      {...props}
    >
      {children}
      {required && <span className="text-danger ml-0.5">*</span>}
    </label>
  );
}

// ── Input (pill) ─────────────────────────────────────────────────────────────
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  mono?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ mono, className = "", ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={`w-full h-10 px-4 rounded-full bg-canvas border border-hairline text-ink placeholder:text-mute text-sm outline-none transition-colors focus:border-ink focus:ring-2 focus:ring-[rgba(59,130,246,0.5)] disabled:bg-surface-soft disabled:text-mute ${
          mono ? "font-mono" : ""
        } ${className}`}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

// ── Textarea (kartu 12px, bukan pill — multi-baris) ──────────────────────────
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = "", ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={`w-full px-4 py-2.5 rounded-[12px] bg-canvas border border-hairline text-ink placeholder:text-mute text-sm outline-none transition-colors resize-none focus:border-ink focus:ring-2 focus:ring-[rgba(59,130,246,0.5)] ${className}`}
        {...props}
      />
    );
  },
);
Textarea.displayName = "Textarea";

// ── Select (pill) ────────────────────────────────────────────────────────────
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = "", children, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={`w-full h-10 pl-4 pr-9 rounded-full bg-surface-soft border border-hairline text-ink text-sm outline-none transition-colors appearance-none cursor-pointer focus:border-ink focus:ring-2 focus:ring-[rgba(59,130,246,0.5)] ${className}`}
        {...props}
      >
        {children}
      </select>
    );
  },
);
Select.displayName = "Select";

export default Input;
