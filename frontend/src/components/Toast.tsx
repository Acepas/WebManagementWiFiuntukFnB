"use client";

import { useToastStore, ToastType } from "@/store/toast-store";
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  X,
} from "lucide-react";

const CONFIG: Record<
  ToastType,
  { Icon: typeof Info; accent: string; icon: string }
> = {
  success: { Icon: CheckCircle2, accent: "bg-ok", icon: "text-ok" },
  error: { Icon: AlertCircle, accent: "bg-danger", icon: "text-danger" },
  warning: { Icon: AlertTriangle, accent: "bg-warn", icon: "text-warn" },
  info: { Icon: Info, accent: "bg-ink", icon: "text-ink" },
};

export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  return (
    <div className="fixed top-4 right-4 z-100 flex flex-col gap-2.5 w-[min(92vw,380px)] pointer-events-none">
      {toasts.map((t) => {
        const { Icon, accent, icon } = CONFIG[t.type];
        return (
          <div
            key={t.id}
            role="alert"
            className={`pointer-events-auto relative overflow-hidden flex items-start gap-3 pl-4 pr-3 py-3.5 rounded-[12px] bg-canvas border border-hairline transition-all duration-200 ${
              t.leaving
                ? "opacity-0 translate-x-6"
                : "animate-slide-in-right"
            }`}
          >
            {/* Accent bar */}
            <span className={`absolute left-0 top-0 bottom-0 w-1 ${accent}`} />

            <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${icon}`} />

            <div className="flex-1 min-w-0">
              {t.title && (
                <p className="text-sm font-medium text-ink leading-snug">
                  {t.title}
                </p>
              )}
              <p className="text-xs text-body leading-relaxed wrap-break-word">
                {t.message}
              </p>
            </div>

            <button
              onClick={() => dismiss(t.id)}
              className="shrink-0 w-7 h-7 flex items-center justify-center -mr-0.5 text-mute hover:text-ink hover:bg-surface-soft rounded-full transition-colors"
              aria-label="Tutup notifikasi"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

export default ToastContainer;
