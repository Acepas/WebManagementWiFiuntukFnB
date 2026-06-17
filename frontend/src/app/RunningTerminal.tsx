"use client";

import { useEffect, useState } from "react";

/**
 * Terminal animasi: ketik command karakter-per-karakter → tampil output
 * bertahap ("running…" → sukses) → jeda → ulang. Menggambarkan kemudahan
 * pakai sistem. Murni React/CSS, tanpa aset. Tampil di surface gelap (CTA).
 */

type Line =
  | { kind: "cmd"; text: string } // diketik bertahap
  | { kind: "out"; text: string; tone?: "mute" | "ok" } // muncul utuh
  | { kind: "spin"; text: string }; // ada spinner

const SCRIPT: Line[] = [
  { kind: "cmd", text: "wifi connect router-kafe" },
  { kind: "spin", text: "Menghubungkan ke MikroTik…" },
  { kind: "out", text: "✓ Router online (129 ms)", tone: "ok" },
  { kind: "cmd", text: "wifi voucher create --count 50" },
  { kind: "spin", text: "Membuat 50 voucher…" },
  { kind: "out", text: "✓ 50 voucher siap cetak", tone: "ok" },
  { kind: "cmd", text: "wifi ai scan" },
  { kind: "spin", text: "Memindai konfigurasi…" },
  { kind: "out", text: "✓ Konfigurasi aman, 0 masalah", tone: "ok" },
];

const TYPE_SPEED = 45; // ms per karakter
const SPIN_DUR = 850; // durasi "running"
const OUT_PAUSE = 500; // jeda setelah output
const LOOP_PAUSE = 1800; // jeda sebelum ulang

const SPINNER = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

interface RenderedLine {
  kind: Line["kind"];
  text: string;
  tone?: "mute" | "ok";
  typing?: boolean;
}

export function RunningTerminal() {
  const [lines, setLines] = useState<RenderedLine[]>([]);
  const [step, setStep] = useState(0);
  const [typed, setTyped] = useState(0);
  const [spinFrame, setSpinFrame] = useState(0);

  // Spinner frame ticker.
  useEffect(() => {
    const cur = SCRIPT[step];
    if (cur?.kind !== "spin") return;
    const t = setInterval(() => setSpinFrame((f) => (f + 1) % SPINNER.length), 80);
    return () => clearInterval(t);
  }, [step]);

  // Mesin langkah utama.
  useEffect(() => {
    // Selesai semua → reset loop.
    if (step >= SCRIPT.length) {
      const t = setTimeout(() => {
        setLines([]);
        setTyped(0);
        setStep(0);
      }, LOOP_PAUSE);
      return () => clearTimeout(t);
    }

    const cur = SCRIPT[step];

    if (cur.kind === "cmd") {
      // Ketik bertahap.
      if (typed < cur.text.length) {
        const t = setTimeout(() => setTyped((n) => n + 1), TYPE_SPEED);
        return () => clearTimeout(t);
      }
      // Selesai ketik → commit baris, lanjut.
      const t = setTimeout(() => {
        setLines((prev) => [...prev, { kind: "cmd", text: cur.text }]);
        setTyped(0);
        setStep((s) => s + 1);
      }, 200);
      return () => clearTimeout(t);
    }

    if (cur.kind === "spin") {
      const t = setTimeout(() => {
        setLines((prev) => [...prev, { kind: "out", text: cur.text, tone: "mute" }]);
        setStep((s) => s + 1);
      }, SPIN_DUR);
      return () => clearTimeout(t);
    }

    // out
    const t = setTimeout(() => {
      setLines((prev) => [...prev, { kind: cur.kind, text: cur.text, tone: cur.tone }]);
      setStep((s) => s + 1);
    }, OUT_PAUSE);
    return () => clearTimeout(t);
  }, [step, typed]);

  const cur = step < SCRIPT.length ? SCRIPT[step] : null;

  return (
    <div className="rounded-[12px] border border-white/10 bg-black/30 overflow-hidden font-mono text-[13px]">
      {/* Header traffic-lights */}
      <div className="flex items-center gap-1.5 px-3 py-2 border-b border-white/10">
        <span className="w-2.5 h-2.5 rounded-full bg-terminal-red" />
        <span className="w-2.5 h-2.5 rounded-full bg-terminal-yellow" />
        <span className="w-2.5 h-2.5 rounded-full bg-terminal-green" />
        <span className="ml-2 text-[11px] text-on-dark-mute">wifi-management</span>
      </div>

      {/* Body */}
      <div className="p-4 space-y-1 min-h-[180px]">
        {lines.map((l, i) => (
          <Row key={i} line={l} />
        ))}

        {/* Baris aktif */}
        {cur?.kind === "cmd" && (
          <div className="text-on-dark">
            <span className="text-on-dark-mute">$</span> {cur.text.slice(0, typed)}
            <span className="inline-block w-1.5 h-3.5 bg-white/80 align-middle ml-0.5 animate-blink" />
          </div>
        )}
        {cur?.kind === "spin" && (
          <div className="text-on-dark-mute flex items-center gap-2">
            <span className="text-terminal-green">{SPINNER[spinFrame]}</span>
            {cur.text}
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ line }: { line: RenderedLine }) {
  if (line.kind === "cmd") {
    return (
      <div className="text-on-dark">
        <span className="text-on-dark-mute">$</span> {line.text}
      </div>
    );
  }
  return (
    <div className={line.tone === "ok" ? "text-terminal-green" : "text-on-dark-mute"}>{line.text}</div>
  );
}

export default RunningTerminal;
