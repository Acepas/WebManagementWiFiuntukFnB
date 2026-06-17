"use client";

import type { LucideIcon } from "lucide-react";

// State kosong: ikon line-art + judul + deskripsi + CTA opsional.
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className = "",
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`flex flex-col items-center text-center max-w-md mx-auto py-16 px-6 ${className}`}
    >
      {Icon && (
        <div className="w-14 h-14 rounded-full border border-hairline flex items-center justify-center mb-5 text-mute">
          <Icon className="w-6 h-6" strokeWidth={1.5} />
        </div>
      )}
      <h3 className="text-lg font-semibold text-ink">{title}</h3>
      {description && (
        <p className="mt-2 text-sm text-body leading-relaxed">{description}</p>
      )}
      {action && <div className="mt-6 flex flex-wrap items-center justify-center gap-3">{action}</div>}
    </div>
  );
}

export default EmptyState;
