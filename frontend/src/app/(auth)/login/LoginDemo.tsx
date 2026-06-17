"use client";

import { useEffect, useState } from "react";
import { MousePointer2, Signal, Users, Ticket, RefreshCw, Plus } from "lucide-react";

/**
 * Mockup mini-dashboard animasi alur kerja (auto-play, loop).
 * Murni CSS/React — tanpa aset gambar. Menunjukkan betapa mudahnya alur:
 * pilih router → sinkronkan → buat voucher → voucher muncul, counter naik.
 *
 * State machine berbasis "step". Tiap step memindahkan kursor ke target,
 * lalu memicu efek (klik, status berubah, item baru, dsb).
 */

type Phase =
  | "idle"
  | "toSync"
  | "clickSync"
  | "synced"
  | "toCreate"
  | "clickCreate"
  | "created"
  | "reset";

// Posisi kursor (persen relatif kontainer) per fase.
const CURSOR: Record<Phase, { x: number; y: number }> = {
  idle: { x: 12, y: 8 },
  toSync: { x: 88, y: 9 },
  clickSync: { x: 88, y: 9 },
  synced: { x: 88, y: 9 },
  toCreate: { x: 50, y: 88 },
  clickCreate: { x: 50, y: 88 },
  created: { x: 50, y: 60 },
  reset: { x: 12, y: 8 },
};

// Durasi tiap fase (ms).
const TIMELINE: { phase: Phase; dur: number }[] = [
  { phase: "idle", dur: 900 },
  { phase: "toSync", dur: 1100 },
  { phase: "clickSync", dur: 550 },
  { phase: "synced", dur: 1000 },
  { phase: "toCreate", dur: 1100 },
  { phase: "clickCreate", dur: 550 },
  { phase: "created", dur: 1700 },
  { phase: "reset", dur: 1200 },
];

// Durasi transisi kursor adaptif: langkah jauh (toSync/toCreate/reset) bergerak
// lebih lama agar terasa natural; klik nyaris diam (kursor sudah di target).
const CURSOR_DUR: Record<Phase, number> = {
  idle: 500,
  toSync: 1000,
  clickSync: 200,
  synced: 400,
  toCreate: 1000,
  clickCreate: 200,
  created: 600,
  reset: 1100,
};

export function LoginDemo() {
  const [stepIdx, setStepIdx] = useState(0);
  const phase = TIMELINE[stepIdx].phase;

  useEffect(() => {
    const t = setTimeout(() => {
      setStepIdx((i) => (i + 1) % TIMELINE.length);
    }, TIMELINE[stepIdx].dur);
    return () => clearTimeout(t);
  }, [stepIdx]);

  // Turunan state dari fase.
  // Status & counter TAHAN sampai 'reset' selesai (kembali ke 'idle'), supaya
  // tidak ada snap kasar saat loop. 'reset' = transisi keluar yang halus.
  const isOnline = ["synced", "toCreate", "clickCreate", "created", "reset"].includes(phase);
  const syncing = phase === "clickSync";
  const clickingSync = phase === "clickSync";
  const clickingCreate = phase === "clickCreate";
  const voucherCount = ["created", "reset"].includes(phase) ? 205 : 204;
  // Voucher tampil saat 'created'; saat 'reset' masih ada tapi fade keluar.
  const showNewVoucher = ["created", "reset"].includes(phase);
  const voucherLeaving = phase === "reset";

  const cur = CURSOR[phase];

  return (
    <div className="relative z-10 rounded-[14px] bg-white/[0.04] border border-white/10 p-4 select-none">
      {/* Kursor animasi — durasi adaptif per fase + easing halus */}
      <div
        className="absolute z-30 ease-[cubic-bezier(0.33,1,0.68,1)] pointer-events-none"
        style={{
          left: `${cur.x}%`,
          top: `${cur.y}%`,
          transitionProperty: "left, top",
          transitionDuration: `${CURSOR_DUR[phase]}ms`,
        }}
      >
        <MousePointer2
          className={`w-4 h-4 text-white drop-shadow transition-transform duration-200 ${
            clickingSync || clickingCreate ? "scale-90" : "scale-100"
          }`}
          fill="white"
        />
        {/* Ripple klik */}
        {(clickingSync || clickingCreate) && (
          <span className="absolute -left-1 -top-1 w-6 h-6 rounded-full border border-white/60 animate-ping" />
        )}
      </div>

      {/* Header mock: status router + tombol sync */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full transition-colors ${
              isOnline ? "bg-ok" : "bg-white/30"
            } ${isOnline ? "" : "animate-pulse"}`}
          />
          <span className="text-xs text-on-dark-mute">
            Router Outlet A · {isOnline ? "Online" : "Menyambung…"}
          </span>
        </div>
        <div
          className={`flex items-center gap-1 rounded-full px-2 py-1 text-[10px] transition-colors ${
            clickingSync ? "bg-white/20" : "bg-white/[0.06]"
          }`}
        >
          <RefreshCw className={`w-3 h-3 ${syncing ? "animate-spin" : ""}`} />
          Sinkron
        </div>
      </div>

      {/* Kartu metrik mock */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: Signal, label: "CPU", val: "12%" },
          { icon: Users, label: "Aktif", val: "38" },
          { icon: Ticket, label: "Voucher", val: String(voucherCount), bump: showNewVoucher },
        ].map((m) => (
          <div
            key={m.label}
            className="rounded-[10px] bg-white/[0.05] border border-white/10 p-3"
          >
            <m.icon className="w-4 h-4 text-on-dark-mute mb-2" strokeWidth={1.75} />
            <p
              className={`text-lg font-semibold leading-none transition-all ${
                m.bump ? "text-ok scale-105" : ""
              }`}
            >
              {m.val}
            </p>
            <p className="text-[11px] text-on-dark-mute mt-1">{m.label}</p>
          </div>
        ))}
      </div>

      {/* Voucher baru: slide-in saat 'created', lalu collapse-halus saat 'reset'.
          Wrapper grid-rows 1fr→0fr meng-collapse tinggi mulus, jadi baris di
          bawahnya naik bertahap (smart-animate) — bukan melompat. */}
      <div className="mt-3 space-y-2">
        <div
          className={`grid transition-[grid-template-rows,opacity,margin] duration-700 ease-[cubic-bezier(0.33,1,0.68,1)] ${
            showNewVoucher && !voucherLeaving
              ? "grid-rows-[1fr] opacity-100"
              : "grid-rows-[0fr] opacity-0 -mt-2"
          }`}
        >
          <div className="overflow-hidden">
            <div className="flex items-center gap-2.5 rounded-md bg-ok/15 border border-ok/30 px-3 py-2">
              <span className="w-1.5 h-1.5 rounded-full bg-ok" />
              <span className="text-xs text-white truncate">
                Voucher KAFE-9X2Z baru dibuat
              </span>
            </div>
          </div>
        </div>

        {["Profil 1 Jam disinkronkan", "User 738142 login"].map((t) => (
          <div
            key={t}
            className="flex items-center gap-2.5 rounded-md bg-white/[0.03] px-3 py-2"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-white/30" />
            <span className="text-xs text-on-dark-mute truncate">{t}</span>
          </div>
        ))}
      </div>

      {/* Tombol "Buat Voucher" (target klik kedua) */}
      <div className="mt-3 flex justify-center">
        <div
          className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-medium transition-all ${
            clickingCreate
              ? "bg-white text-ink scale-95"
              : "bg-white/10 text-white"
          }`}
        >
          <Plus className="w-3.5 h-3.5" />
          Buat Voucher
        </div>
      </div>
    </div>
  );
}

export default LoginDemo;
