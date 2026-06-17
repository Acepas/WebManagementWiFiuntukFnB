"use client";

import { useAuthStore } from "@/store/auth-store";
import { useServerStore } from "@/store/server-store";
import { useToastStore } from "@/store/toast-store";
import { ToastContainer } from "@/components/Toast";
import { StatusDot } from "@/components/ui";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  Server,
  Users,
  Ticket,
  Wifi,
  BrainCircuit,
  LogOut,
  Menu,
  ChevronDown,
  History,
  RefreshCw,
  KeyRound,
} from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, admin, clearSession } = useAuthStore();
  const {
    servers,
    activeServerId,
    setActiveServerId,
    fetchServers,
    refreshStatuses,
    isSyncing,
    syncActiveServer,
  } = useServerStore();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    if (!isAuthenticated) {
      router.push("/login");
    } else {
      fetchServers();
    }
  }, [isAuthenticated, router, fetchServers, isMounted]);

  // Run full sync when activeServerId is loaded
  useEffect(() => {
    if (activeServerId && isMounted) {
      syncActiveServer(activeServerId);
    }
  }, [activeServerId, syncActiveServer, isMounted]);

  // ─── Sinkronisasi status TERPUSAT (single source of truth) ──────────────────
  // Satu-satunya polling status: refresh status SEMUA server tiap 30 detik.
  // Seluruh halaman (dashboard, /servers, header) membaca servers[] dari store ini
  // sehingga status selalu fresh & tidak stale, tanpa logika tersebar per-halaman.
  useEffect(() => {
    if (!isMounted || !isAuthenticated) return;

    refreshStatuses(); // sekali saat masuk
    const interval = setInterval(() => {
      refreshStatuses();
    }, 30_000);

    return () => clearInterval(interval);
  }, [isMounted, isAuthenticated, refreshStatuses]);

  const handleServerChange = async (id: string) => {
    setActiveServerId(id);
    await syncActiveServer(id);
  };

  // Tombol sinkronisasi GLOBAL (samping Select Router) — satu pintu untuk
  // menyelaraskan profil + voucher + status server aktif. Menggantikan tombol
  // sync yang dulu tersebar di /profiles & /vouchers.
  const handleGlobalSync = async () => {
    if (!activeServerId) return;
    const toast = useToastStore.getState();
    const result = await syncActiveServer(activeServerId);
    if (result === null) {
      toast.error("Gagal terhubung ke router MikroTik. Periksa koneksi.", "Sinkronisasi gagal");
    } else if (result.usersSynced === false) {
      toast.warning("Profil tersinkron, voucher gagal ditarik. Data lokal dipertahankan.", "Sinkronisasi sebagian");
    } else {
      toast.success("Profil & voucher berhasil diselaraskan dengan router.", "Sinkronisasi berhasil");
    }
  };

  const handleLogout = () => {
    clearSession();
    router.push("/login");
  };

  // Prevent hydration mismatch by rendering a basic shell during SSR
  if (!isMounted) {
    return <div className="min-h-screen bg-canvas flex flex-col md:flex-row font-sans"></div>;
  }

  if (!isAuthenticated) return null;

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Server", href: "/servers", icon: Server },
    { name: "Profil", href: "/profiles", icon: Users },
    { name: "Voucher", href: "/vouchers", icon: Ticket },
    { name: "Integrasi POS", href: "/pos-keys", icon: KeyRound },
    { name: "AI Analis", href: "/ai", icon: BrainCircuit },
    { name: "Riwayat Aktivitas", href: "/logs", icon: History },
  ];

  const activeServer = servers.find((s) => s.id === activeServerId);
  const status = activeServer?.lastStatus;
  const statusTone = status === "ONLINE" ? "ok" : status === "OFFLINE" ? "danger" : "neutral";
  const statusText = status === "ONLINE" ? "Online" : status === "OFFLINE" ? "Offline" : "Unknown";

  return (
    <div className="h-screen overflow-hidden bg-canvas flex flex-col md:flex-row font-sans text-body">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between px-4 h-14 border-b border-hairline bg-canvas">
        <span className="font-display font-semibold text-ink flex items-center gap-2">
          <Wifi className="w-5 h-5" strokeWidth={1.75} /> WiFi
        </span>
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="w-9 h-9 flex items-center justify-center rounded-full text-body hover:bg-surface-soft hover:text-ink transition-colors"
          aria-label="Menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Sidebar — tetap (tidak ikut scroll konten) */}
      <aside
        className={`${
          isSidebarOpen ? "block" : "hidden"
        } md:block w-full md:w-64 bg-canvas border-r border-hairline shrink-0 md:h-screen md:overflow-y-auto`}
      >
        <div className="p-6 hidden md:block">
          <h1 className="font-display text-lg font-semibold text-ink flex items-center gap-2">
            <Wifi className="w-5 h-5" strokeWidth={1.75} /> WiFi Management
          </h1>
          <p className="text-xs text-mute mt-1">Panel Admin</p>
        </div>

        <nav className="p-3 space-y-0.5">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-full text-sm transition-colors ${
                  isActive
                    ? "bg-surface-soft text-ink font-medium"
                    : "text-body hover:bg-surface-soft hover:text-ink"
                }`}
              >
                <item.icon className="w-4.5 h-4.5" strokeWidth={isActive ? 2 : 1.75} />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content — header tetap, hanya <main> yang scroll */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        {/* Header (tetap di atas, tidak ikut scroll) */}
        <header className="h-16 shrink-0 border-b border-hairline bg-canvas flex items-center justify-between px-4 lg:px-8">
          <div className="flex items-center gap-3">
            {/* Server Selector (pill) */}
            <div className="relative">
              <select
                value={activeServerId || ""}
                onChange={(e) => handleServerChange(e.target.value)}
                className="appearance-none h-9 pl-4 pr-9 rounded-full bg-surface-soft border border-hairline text-ink text-sm outline-none cursor-pointer transition-colors focus:border-ink focus:ring-2 focus:ring-[rgba(59,130,246,0.5)]"
              >
                <option value="" disabled>
                  Pilih Router…
                </option>
                {servers.map((server) => (
                  <option key={server.id} value={server.id}>
                    {server.name} ({server.host})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-mute absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Status Indicator */}
            {activeServerId && activeServer && (
              <div
                className="hidden sm:flex items-center gap-1.5 px-3 h-9 rounded-full border border-hairline bg-canvas"
                title={`Status: ${statusText}`}
              >
                <StatusDot tone={statusTone} pulse={statusTone === "neutral"} />
                <span className="text-xs font-medium text-charcoal">{statusText}</span>
              </div>
            )}

            {/* Tombol Sinkronisasi GLOBAL — satu pintu untuk semua halaman */}
            {activeServerId && (
              <button
                onClick={handleGlobalSync}
                disabled={isSyncing}
                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full bg-canvas text-charcoal border border-hairline-strong text-[13px] font-medium hover:bg-surface-soft hover:text-ink active:scale-[0.98] disabled:text-mute disabled:bg-surface-soft transition-all"
                title="Sinkronkan profil & voucher dari router"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
                <span className="hidden md:inline">Sinkronisasi</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-ink leading-tight">{admin?.name}</p>
              <p className="text-xs text-mute">{admin?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="w-9 h-9 flex items-center justify-center rounded-full text-body hover:bg-surface-soft hover:text-ink transition-colors"
              title="Keluar"
            >
              <LogOut className="w-4.5 h-4.5" strokeWidth={1.75} />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto bg-canvas p-4 lg:p-8 relative">
          {children}

          {/* Syncing Overlay — kartu putih hairline, tanpa glass/gradient */}
          {isSyncing && (
            <div className="absolute inset-0 bg-canvas/70 flex flex-col items-center justify-center z-50">
              <div className="bg-canvas p-8 rounded-[12px] border border-hairline max-w-sm text-center flex flex-col items-center gap-4">
                <div className="w-10 h-10 border-2 border-hairline border-t-ink rounded-full animate-spin" />
                <div>
                  <h3 className="font-display text-lg font-semibold text-ink">Sinkronisasi Router…</h3>
                  <p className="text-sm text-body mt-1.5 leading-relaxed">
                    Menghubungkan ke MikroTik & menyelaraskan data profil hotspot serta voucher.
                  </p>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Notifikasi global (toast) */}
      <ToastContainer />
    </div>
  );
}
