"use client";

import Link from "next/link";
import { Button } from "@/components/ui";
import { LandingHeroDemo } from "./LandingHeroDemo";
import { RunningTerminal } from "./RunningTerminal";
import { Reveal, CountUp } from "./landing-anim";
import {
  Wifi,
  Server,
  Ticket,
  BrainCircuit,
  ArrowRight,
  Check,
  Gauge,
  ShieldCheck,
  Zap,
  Lock,
  Coffee,
  UtensilsCrossed,
  Laptop,
  Building2,
} from "lucide-react";

const FEATURES = [
  {
    icon: Server,
    title: "Multi-Router MikroTik",
    desc: "Kelola banyak router hotspot dari satu panel. Uji koneksi, pantau status real-time, atur kredensial aman.",
  },
  {
    icon: Ticket,
    title: "Voucher Instan & Massal",
    desc: "Buat voucher satuan atau ratusan sekaligus lewat antrean. Cetak PDF siap tempel di struk kasir.",
  },
  {
    icon: BrainCircuit,
    title: "Analisis AI",
    desc: "AI menelaah konfigurasi router, deteksi celah keamanan & misconfig, kasih saran perbaikan otomatis.",
  },
];

const STEPS = [
  { n: "01", title: "Hubungkan router", desc: "Daftarkan MikroTik-mu, uji koneksi sekali klik." },
  { n: "02", title: "Atur paket", desc: "Bikin profil bandwidth & masa aktif sesuai kebutuhan kafe." },
  { n: "03", title: "Cetak voucher", desc: "Generate voucher, cetak, pelanggan langsung connect." },
];

const USE_CASES = [
  { icon: Coffee, title: "Kafe & Coffee Shop", desc: "Voucher WiFi per pembelian, batasi durasi & bandwidth." },
  { icon: UtensilsCrossed, title: "Restoran", desc: "WiFi tamu rapi, cetak kode langsung di struk kasir." },
  { icon: Laptop, title: "Coworking Space", desc: "Paket bandwidth beda per member, pantau pemakaian." },
  { icon: Building2, title: "Hotel & Penginapan", desc: "Voucher per kamar/tamu, masa aktif sesuai menginap." },
];

const SECURITY = [
  "Password router dienkripsi AES-256-GCM di database",
  "Login admin pakai JWT + proteksi brute-force (rate-limit)",
  "Koneksi MikroTik via API resmi, dukung SSL/HTTPS",
];

// Kata hero untuk animasi stagger.
const HERO_WORDS = "Kelola hotspot & voucher kafemu dari satu tempat.".split(" ");

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-canvas text-body font-sans">
      {/* ── Nav ── */}
      <header className="sticky top-0 z-40 bg-canvas/90 backdrop-blur-sm border-b border-hairline">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-7 h-7 rounded-lg bg-ink text-on-dark flex items-center justify-center transition-transform group-hover:scale-105">
              <Wifi className="w-4 h-4" strokeWidth={2} />
            </div>
            <span className="font-display font-semibold text-ink">WiFi Management</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/login">
              <Button variant="secondary" size="sm">
                Masuk
              </Button>
            </Link>
            <Link href="/login" className="hidden sm:block">
              <Button size="sm" className="group">
                Mulai <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="max-w-6xl mx-auto px-6 pt-16 pb-20 sm:pt-24 grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-soft border border-hairline text-xs font-medium text-charcoal mb-6 animate-fade-in">
            <span className="w-1.5 h-1.5 rounded-full bg-terminal-green animate-pulse" />
            Manajemen WiFi untuk bisnis FnB
          </span>
          {/* Headline — kata muncul bertahap */}
          <h1 className="font-display text-[40px] sm:text-[52px] leading-[1.08] font-semibold text-ink tracking-tight">
            {HERO_WORDS.map((w, i) => (
              <span
                key={i}
                className="inline-block opacity-0 animate-slide-up"
                style={{ animationDelay: `${i * 70}ms`, marginRight: "0.25em" }}
              >
                {w}
              </span>
            ))}
            <span className="inline-block w-0.75 h-[0.9em] bg-ink align-middle ml-1 animate-blink" />
          </h1>
          <p
            className="mt-5 text-lg text-body leading-relaxed max-w-md opacity-0 animate-slide-up"
            style={{ animationDelay: "700ms" }}
          >
            Bikin voucher WiFi, atur bandwidth, pantau router MikroTik, dan biarkan AI menjaga
            konfigurasi tetap aman — semua dari satu dasbor.
          </p>
          <div
            className="mt-8 flex flex-wrap items-center gap-3 opacity-0 animate-slide-up"
            style={{ animationDelay: "850ms" }}
          >
            <Link href="/login">
              <Button size="md" className="h-11 px-6 text-[15px] group">
                Mulai sekarang <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="secondary" size="md" className="h-11 px-6 text-[15px]">
                Masuk
              </Button>
            </Link>
          </div>
          {/* Stat — count-up */}
          <div
            className="mt-10 flex flex-wrap gap-x-8 gap-y-4 opacity-0 animate-slide-up"
            style={{ animationDelay: "1000ms" }}
          >
            <Stat icon={Gauge} label="Monitoring" prefix="< " value={3} suffix=" detik" />
            <Stat icon={Zap} label="Voucher / batch" value={200} />
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-mute" strokeWidth={1.75} />
              <div>
                <div className="font-display font-semibold text-ink leading-none">v6 &amp; v7</div>
                <div className="text-xs text-mute mt-0.5">RouterOS</div>
              </div>
            </div>
          </div>
        </div>

        {/* Demo animasi — float halus */}
        <div className="lg:pl-4 animate-float-soft">
          <LandingHeroDemo />
        </div>
      </section>

      {/* ── Fitur ── */}
      <section className="max-w-6xl mx-auto px-6 py-20 border-t border-hairline">
        <Reveal className="max-w-xl">
          <h2 className="font-display text-[30px] leading-tight font-semibold text-ink">
            Semua yang kafemu butuh, tanpa ribet.
          </h2>
          <p className="mt-3 text-body">
            Dari pendaftaran router sampai cetak voucher di kasir — alurnya pendek dan jelas.
          </p>
        </Reveal>
        <div className="mt-10 grid md:grid-cols-3 gap-5">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={i * 120}>
              <div className="group rounded-[12px] border border-hairline p-6 transition-all duration-300 hover:border-hairline-strong hover:-translate-y-1 h-full">
                <div className="w-11 h-11 rounded-full border border-hairline flex items-center justify-center text-ink mb-4 transition-all duration-300 group-hover:bg-ink group-hover:text-on-dark group-hover:scale-105">
                  <f.icon className="w-5 h-5" strokeWidth={1.75} />
                </div>
                <h3 className="font-display text-lg font-semibold text-ink">{f.title}</h3>
                <p className="mt-2 text-sm text-body leading-relaxed">{f.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── Cara kerja ── */}
      <section className="max-w-6xl mx-auto px-6 py-20 border-t border-hairline">
        <Reveal>
          <h2 className="font-display text-[30px] leading-tight font-semibold text-ink">Tiga langkah, langsung jalan.</h2>
        </Reveal>
        <div className="mt-10 grid md:grid-cols-3 gap-8">
          {STEPS.map((s, i) => (
            <Reveal key={s.n} delay={i * 120}>
              <div className="group">
                <div className="font-display text-3xl font-semibold text-mute transition-colors group-hover:text-ink">{s.n}</div>
                <h3 className="mt-3 font-display text-lg font-semibold text-ink">{s.title}</h3>
                <p className="mt-1.5 text-sm text-body leading-relaxed">{s.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── Use-case ── */}
      <section className="max-w-6xl mx-auto px-6 py-20 border-t border-hairline">
        <Reveal className="max-w-xl">
          <h2 className="font-display text-[30px] leading-tight font-semibold text-ink">Cocok untuk bisnismu.</h2>
          <p className="mt-3 text-body">Satu sistem, banyak jenis usaha. Atur WiFi pelanggan sesuai kebutuhan.</p>
        </Reveal>
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {USE_CASES.map((u, i) => (
            <Reveal key={u.title} delay={i * 100}>
              <div className="group rounded-[12px] border border-hairline p-6 transition-all duration-300 hover:border-hairline-strong hover:-translate-y-1 h-full">
                <div className="w-11 h-11 rounded-full border border-hairline flex items-center justify-center text-ink mb-4 transition-all duration-300 group-hover:bg-ink group-hover:text-on-dark">
                  <u.icon className="w-5 h-5" strokeWidth={1.75} />
                </div>
                <h3 className="font-display text-[17px] font-semibold text-ink">{u.title}</h3>
                <p className="mt-2 text-sm text-body leading-relaxed">{u.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── Data aman ── */}
      <section className="max-w-6xl mx-auto px-6 py-20 border-t border-hairline">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <Reveal>
            <div className="w-12 h-12 rounded-full border border-hairline flex items-center justify-center text-ink mb-6">
              <Lock className="w-5 h-5" strokeWidth={1.5} />
            </div>
            <h2 className="font-display text-[30px] leading-tight font-semibold text-ink">
              Kredensial routermu, aman di tempatnya.
            </h2>
            <p className="mt-3 text-body leading-relaxed max-w-md">
              Password router tak pernah disimpan polos. Semua dienkripsi, akses panel terproteksi —
              jadi data koneksi outletmu tetap rahasia.
            </p>
          </Reveal>
          <Reveal delay={120}>
            <ul className="space-y-3">
              {SECURITY.map((s) => (
                <li key={s} className="flex items-start gap-3 rounded-[12px] border border-hairline p-4">
                  <span className="w-6 h-6 rounded-full bg-surface-soft border border-hairline flex items-center justify-center text-ink shrink-0">
                    <Check className="w-3.5 h-3.5" strokeWidth={2} />
                  </span>
                  <span className="text-sm text-charcoal leading-relaxed">{s}</span>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      {/* ── CTA dark strip ── */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <Reveal>
          <div className="rounded-[12px] bg-surface-dark text-on-dark p-8 sm:p-12 relative overflow-hidden">
            <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/4 blur-3xl pointer-events-none animate-float-soft" />
            <div className="relative z-10 grid lg:grid-cols-2 gap-10 items-center">
              {/* Kiri: teks + CTA */}
              <div>
                <h2 className="font-display text-[30px] sm:text-[34px] leading-tight font-semibold">
                  Semudah ketik satu perintah.
                </h2>
                <p className="mt-3 text-on-dark-mute leading-relaxed max-w-md">
                  Hubungkan router, bikin voucher, scan keamanan — alurnya secepat ini. Masuk dan
                  rasakan sendiri dalam hitungan menit.
                </p>
                <ul className="mt-7 space-y-2 text-sm text-on-dark-mute">
                  {["Gratis dipakai", "Tanpa setup ribet", "Real-time"].map((t) => (
                    <li key={t} className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-terminal-green shrink-0" /> {t}
                    </li>
                  ))}
                </ul>
                <div className="mt-7 flex flex-wrap items-center gap-3">
                  <Link href="/login">
                    <Button variant="on-dark" size="md" className="h-11 px-6 text-[15px] group">
                      Mulai sekarang <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Kanan: terminal animasi (ketik → run → sukses, loop) */}
              <RunningTerminal />
            </div>
          </div>
        </Reveal>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-hairline">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-mute">
          <div className="flex items-center gap-2">
            <Wifi className="w-4 h-4" strokeWidth={1.75} />
            <span className="font-display font-medium text-charcoal">WiFi Management</span>
          </div>
          <span className="text-xs">© 2026 · Manajemen WiFi Hotspot untuk FnB</span>
        </div>
      </footer>
    </div>
  );
}

// Stat dengan count-up
function Stat({
  icon: Icon,
  label,
  value,
  prefix = "",
  suffix = "",
}: {
  icon: typeof Gauge;
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <Icon className="w-4 h-4 text-mute" strokeWidth={1.75} />
      <div>
        <div className="font-display font-semibold text-ink leading-none">
          {prefix}
          <CountUp value={value} suffix={suffix} />
        </div>
        <div className="text-xs text-mute mt-0.5">{label}</div>
      </div>
    </div>
  );
}
