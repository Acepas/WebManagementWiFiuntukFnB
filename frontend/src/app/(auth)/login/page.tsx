"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import { Wifi, Eye, EyeOff, CreditCard } from "lucide-react";
import { Button, Input, Label } from "@/components/ui";
import { LoginDemo } from "./LoginDemo";
import apiClient from "@/lib/api-client";

export default function LoginPage() {
  const router = useRouter();
  const setSession = useAuthStore((state) => state.setSession);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // Admin Backend Login
      const response = await apiClient.post("/auth/login", { email, password });

      const { accessToken, admin } = response.data;

      setSession(accessToken, admin);
      router.push("/dashboard");
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Login gagal. Cek lagi email sama kata sandimu, ya.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas flex font-sans text-body">
      {/* ── Kiri: Form ─────────────────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-[380px] animate-fade-in">
          {/* Brand */}
          <div className="flex items-center gap-2 mb-12">
            <div className="w-8 h-8 rounded-lg bg-ink text-on-dark flex items-center justify-center">
              <Wifi className="w-4 h-4" strokeWidth={2} />
            </div>
            <span className="font-display text-lg font-semibold text-ink">
              WiFi Management
            </span>
          </div>

          {/* Heading */}
          <h1 className="font-display text-[28px] leading-tight font-semibold text-ink">
            Masuk ke akunmu
          </h1>
          <p className="mt-1.5 text-sm text-body">
            Isi email sama kata sandi buat lanjut.
          </p>

          {/* Error banner */}
          {error && (
            <div className="mt-6 px-4 py-3 rounded-[12px] border border-hairline bg-surface-soft text-sm text-charcoal">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-7 space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Masukin emailmu"
                autoComplete="email"
                required
              />
            </div>

            <div>
              <Label htmlFor="password">Kata Sandi</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="pr-11"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full text-mute hover:text-ink hover:bg-surface-soft transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[rgba(59,130,246,0.5)]"
                  aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" strokeWidth={1.75} />
                  ) : (
                    <Eye className="w-4 h-4" strokeWidth={1.75} />
                  )}
                </button>
              </div>
            </div>

            {/* Lupa password */}
            <div className="flex justify-end pt-0.5">
              <button
                type="button"
                className="text-sm font-medium text-ink hover:underline"
                title="Hubungi admin untuk reset kata sandi"
              >
                Lupa sandi?
              </button>
            </div>

            <Button type="submit" loading={isLoading} className="w-full mt-1">
              {isLoading ? "Sebentar ya…" : "Masuk"}
            </Button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-hairline" />
            <span className="text-xs text-mute">ATAU</span>
            <div className="flex-1 h-px bg-hairline" />
          </div>

          {/* SmartCard (hiasan — belum aktif) */}
          <Button
            type="button"
            variant="secondary"
            className="w-full"
            title="Fitur SmartCard belum tersedia"
          >
            <CreditCard className="w-4 h-4" strokeWidth={1.75} />
            Masuk pakai SmartCard
          </Button>

          {/* Footer */}
          <p className="mt-10 text-xs text-mute">
            Dengan masuk, kamu setuju sama{" "}
            <span className="text-charcoal underline cursor-pointer">Ketentuan Pakai</span>.
          </p>
        </div>
      </div>

      {/* ── Kanan: Panel branding (surface-dark) ───────────────────────── */}
      <div className="hidden lg:flex flex-1 p-3">
        <div className="relative w-full rounded-[20px] bg-surface-dark text-on-dark overflow-hidden flex flex-col justify-between p-12">
          {/* Brand kecil di atas */}
          <div className="flex items-center gap-2 text-on-dark">
            <Wifi className="w-5 h-5" strokeWidth={2} />
            <span className="font-display font-semibold">WiFi Management</span>
          </div>

          {/* Tagline */}
          <div className="relative z-10">
            <h2 className="font-display text-[34px] leading-[1.15] font-semibold max-w-[420px]">
              Kelola hotspot &amp; voucher kafemu dari satu tempat.
            </h2>
            <p className="mt-4 text-[15px] text-on-dark-mute max-w-[400px] leading-relaxed">
              Pantau router MikroTik, bikin voucher, sama lihat siapa yang lagi
              nyambung — semua real-time.
            </p>
          </div>

          {/* Mockup mini-dashboard animasi alur kerja (auto-play, loop) */}
          <LoginDemo />

          {/* Glow halus latar */}
          <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-white/[0.04] blur-3xl pointer-events-none" />
        </div>
      </div>
    </div>
  );
}
