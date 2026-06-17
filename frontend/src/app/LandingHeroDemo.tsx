"use client";

import { useEffect, useState } from "react";
import {
  MousePointer2,
  Server,
  Ticket,
  Users,
  Signal,
  RefreshCw,
  Plus,
  BrainCircuit,
  Check,
} from "lucide-react";

/**
 * Demo animasi hero landing — auto-play, loop. Menggambarkan alur pakai sistem:
 * pilih router → sinkron → buat voucher (muncul) → AI scan (aman).
 * Murni React/CSS, tanpa aset. Kursor scripted lewat state machine.
 */

type Phase =
  | "idle"
  | "toServer"
  | "clickServer"
  | "online"
  | "toVoucher"
  | "clickVoucher"
  | "voucherDone"
  | "toAi"
  | "clickAi"
  | "aiScanning"
  | "aiDone"
  | "reset";

const TIMELINE: { phase: Phase; dur: number }[] = [
  { phase: "idle", dur: 800 },
  { phase: "toServer", dur: 1000 },
  { phase: "clickServer", dur: 500 },
  { phase: "online", dur: 900 },
  { phase: "toVoucher", dur: 1000 },
  { phase: "clickVoucher", dur: 500 },
  { phase: "voucherDone", dur: 1400 },
  { phase: "toAi", dur: 1000 },
  { phase: "clickAi", dur: 500 },
  { phase: "aiScanning", dur: 1300 },
  { phase: "aiDone", dur: 1600 },
  { phase: "reset", dur: 1200 },
];

// Posisi kursor (persen) per fase.
const CURSOR: Record<Phase, { x: number; y: number }> = {
  idle: { x: 10, y: 10 },
  toServer: { x: 30, y: 28 },
  clickServer: { x: 30, y: 28 },
  online: { x: 30, y: 28 },
  toVoucher: { x: 50, y: 64 },
  clickVoucher: { x: 50, y: 64 },
  voucherDone: { x: 50, y: 55 },
  toAi: { x: 82, y: 28 },
  clickAi: { x: 82, y: 28 },
  aiScanning: { x: 82, y: 28 },
  aiDone: { x: 82, y: 28 },
  reset: { x: 10, y: 10 },
};

const CURSOR_DUR: Record<Phase, number> = {
  idle: 500,
  toServer: 900,
  clickServer: 200,
  online: 300,
  toVoucher: 900,
  clickVoucher: 200,
  voucherDone: 500,
  toAi: 900,
  clickAi: 200,
  aiScanning: 300,
  aiDone: 300,
  reset: 1000,
};

export function LandingHeroDemo() {
  const [stepIdx, setStepIdx] = useState(0);
  const phase = TIMELINE[stepIdx].phase;

  useEffect(() => {
    const t = setTimeout(() => setStepIdx((i) => (i + 1) % TIMELINE.length), TIMELINE[stepIdx].dur);
    return () => clearTimeout(t);
  }, [stepIdx]);

  const after = (target: Phase) => TIMELINE.findIndex((s) => s.phase === target) <= stepIdx;

  const serverOnline = after("online") && !after("reset");
  const clickingServer = phase === "clickServer";
  const clickingVoucher = phase === "clickVoucher";
  const clickingAi = phase === "clickAi";
  const voucherCount = after("voucherDone") && !after("reset") ? 205 : 204;
  const showVoucher = ["voucherDone", "toAi", "clickAi", "aiScanning", "aiDone"].includes(phase);
  const voucherLeaving = phase === "reset";
  const aiScanning = phase === "aiScanning";
  const aiDone = ["aiDone"].includes(phase);

  const cur = CURSOR[phase];

  return (
    <div className="relative rounded-[14px] border border-hairline bg-canvas p-4 select-none animate-slide-up">
      {/* Kursor */}
      <div
        className="absolute z-30 ease-[cubic-bezier(0.33,1,0.68,1)] pointer-events-none"
        style={{ left: `${cur.x}%`, top: `${cur.y}%`, transitionProperty: "left, top", transitionDuration: `${CURSOR_DUR[phase]}ms` }}
      >
        <MousePointer2
          className={`w-4 h-4 text-ink drop-shadow transition-transform duration-200 ${
            clickingServer || clickingVoucher || clickingAi ? "scale-90" : "scale-100"
          }`}
          fill="black"
        />
        {(clickingServer || clickingVoucher || clickingAi) && (
          <span className="absolute -left-1 -top-1 w-6 h-6 rounded-full border border-ink/40 animate-ping" />
        )}
      </div>

      {/* Top bar mock */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-terminal-red" />
          <span className="w-2.5 h-2.5 rounded-full bg-terminal-yellow" />
          <span className="w-2.5 h-2.5 rounded-full bg-terminal-green" />
        </div>
        <span className="text-xs text-mute font-mono">wifi-management</span>
      </div>

      {/* Baris atas: kartu Router + kartu AI */}
      <div className="grid grid-cols-2 gap-3">
        {/* Router */}
        <div
          className={`rounded-[10px] border p-3 transition-colors ${
            serverOnline ? "border-terminal-green" : clickingServer ? "border-ink" : "border-hairline"
          }`}
        >
          <div className="flex items-center justify-between">
            <Server className="w-4 h-4 text-mute" strokeWidth={1.75} />
            <span
              className={`inline-flex items-center gap-1 text-[10px] font-medium ${
                serverOnline ? "text-charcoal" : "text-mute"
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${serverOnline ? "bg-ok" : "bg-mute animate-pulse"}`} />
              {serverOnline ? "Online" : "…"}
            </span>
          </div>
          <p className="text-xs font-medium text-ink mt-2">Router Kafe</p>
          <p className="text-[10px] text-mute font-mono">10.168.30.248</p>
        </div>

        {/* AI */}
        <div
          className={`rounded-[10px] border p-3 transition-colors ${
            aiDone ? "border-terminal-green" : clickingAi ? "border-ink" : "border-hairline"
          }`}
        >
          <div className="flex items-center justify-between">
            <BrainCircuit className="w-4 h-4 text-mute" strokeWidth={1.75} />
            {aiScanning && <RefreshCw className="w-3 h-3 text-mute animate-spin" />}
            {aiDone && <Check className="w-3.5 h-3.5 text-ok" />}
          </div>
          <p className="text-xs font-medium text-ink mt-2">Analisis AI</p>
          <p className="text-[10px] text-mute">
            {aiScanning ? "Memindai konfig…" : aiDone ? "Konfigurasi aman" : "Siap memindai"}
          </p>
        </div>
      </div>

      {/* Metrik */}
      <div className="grid grid-cols-3 gap-3 mt-3">
        {[
          { icon: Signal, label: "CPU", val: "12%" },
          { icon: Users, label: "Aktif", val: "38" },
          { icon: Ticket, label: "Voucher", val: String(voucherCount), bump: voucherCount === 205 },
        ].map((m) => (
          <div key={m.label} className="rounded-[10px] border border-hairline p-3">
            <m.icon className="w-4 h-4 text-mute mb-1.5" strokeWidth={1.75} />
            <p className={`text-base font-semibold leading-none font-display transition-colors ${m.bump ? "text-ok" : "text-ink"}`}>
              {m.val}
            </p>
            <p className="text-[10px] text-mute mt-1">{m.label}</p>
          </div>
        ))}
      </div>

      {/* Voucher baru muncul (collapse halus) */}
      <div
        className={`grid transition-[grid-template-rows,opacity,margin] duration-700 ease-[cubic-bezier(0.33,1,0.68,1)] ${
          showVoucher && !voucherLeaving ? "grid-rows-[1fr] opacity-100 mt-3" : "grid-rows-[0fr] opacity-0 mt-0"
        }`}
      >
        <div className="overflow-hidden">
          <div className="flex items-center gap-2.5 rounded-[10px] border border-ok/40 bg-ok/[0.06] px-3 py-2.5">
            <Ticket className="w-3.5 h-3.5 text-ok" />
            <span className="text-xs text-ink font-mono">KAFE-9X2Z</span>
            <span className="text-[10px] text-mute ml-auto">voucher baru · siap cetak</span>
          </div>
        </div>
      </div>

      {/* Tombol "Buat Voucher" (target klik tengah) */}
      <div className="mt-3 flex justify-center">
        <div
          className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-medium transition-all ${
            clickingVoucher ? "bg-ink-deep text-on-dark scale-95" : "bg-ink text-on-dark"
          }`}
        >
          <Plus className="w-3.5 h-3.5" /> Buat Voucher
        </div>
      </div>
    </div>
  );
}

export default LandingHeroDemo;
