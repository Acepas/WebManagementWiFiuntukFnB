"use client";

import { useServerStore } from "@/store/server-store";
import { useEffect, useState, useCallback } from "react";
import apiClient from "@/lib/api-client";
import { Card, PageHeader, Button, StatusDot, EmptyState } from "@/components/ui";
import {
  Users,
  Ticket,
  Activity,
  Wifi,
  Cpu,
  Database,
  RefreshCw,
  Search,
  Clock,
  HardDrive,
  AlertTriangle,
  ArrowUp,
  ArrowDown,
  Network,
  Server as ServerIcon,
  ArrowRight,
} from "lucide-react";

interface ActiveUser {
  id: string;
  username: string;
  ipAddress: string;
  macAddress: string;
  uptime: string;
  bytesIn: number;
  bytesOut: number;
  sessionTimeLeft: string | null;
  idleTime: string | null;
}

interface RouterResources {
  serverId: string;
  serverName: string;
  uptime: string;
  cpuLoad: number;
  cpuCount: number;
  freeMemory: number;
  totalMemory: number;
  freeHddSpace: number;
  totalHddSpace: number;
  version: string;
  boardName: string;
  architectureName: string;
}

interface InterfaceTraffic {
  id: string;
  name: string;
  type: string;
  mtu: number;
  macAddress: string;
  rxByte: number;
  txByte: number;
  rxPacket: number;
  txPacket: number;
  running: boolean;
  disabled: boolean;
}

export default function DashboardPage() {
  const { activeServerId, servers, setActiveServerId, checkActiveServerStatus, isSyncing } = useServerStore();

  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);
  const [resources, setResources] = useState<RouterResources | null>(null);
  const [traffic, setTraffic] = useState<InterfaceTraffic[]>([]);
  const [vouchersCount, setVouchersCount] = useState<number>(0);

  const [isLoading, setIsLoading] = useState(false);
  const [isSilentLoading, setIsSilentLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [autoRefreshInterval, setAutoRefreshInterval] = useState<number>(3); // Default 3s (real-time)
  const [countdown, setCountdown] = useState<number>(3);

  const activeServer = servers.find((s) => s.id === activeServerId);

  // Helper format Bytes → KB/MB/GB
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Helper format Uptime MikroTik. Input RouterOS: "1w2d3h4m5s". Parse per-unit
  // via regex agar tidak salah-ganti huruf di label Indonesia; tampilkan maks 2
  // unit terbesar yang bernilai (mis. "2 jam 49 menit") agar ringkas.
  const formatUptime = (uptimeStr: string) => {
    if (!uptimeStr || uptimeStr === "Unknown" || uptimeStr === "-") return "-";

    const units: { re: RegExp; label: string }[] = [
      { re: /(\d+)w/, label: "minggu" },
      { re: /(\d+)d/, label: "hari" },
      { re: /(\d+)h/, label: "jam" },
      { re: /(\d+)m(?!s)/, label: "menit" },
      { re: /(\d+)s/, label: "detik" },
    ];

    const parts: string[] = [];
    for (const { re, label } of units) {
      const match = uptimeStr.match(re);
      if (match && parseInt(match[1], 10) > 0) {
        parts.push(`${parseInt(match[1], 10)} ${label}`);
      }
    }

    if (parts.length === 0) return uptimeStr;
    return parts.slice(0, 2).join(" ");
  };

  // Fetch data dashboard
  const fetchDashboardData = useCallback(
    async (silent = false) => {
      if (!activeServerId) return;

      if (silent) {
        setIsSilentLoading(true);
      } else {
        setIsLoading(true);
        setError(null);
      }

      try {
        // 1. Snapshot monitoring (active + resource + traffic) — SATU panggilan,
        //    di backend 1 koneksi router (1 login, 3 perintah) → hemat beban ~3x.
        const snapRes = await apiClient.get<{
          activeUsers: ActiveUser[];
          resources: RouterResources;
          traffic: InterfaceTraffic[];
        }>(`/monitoring/snapshot/${activeServerId}`);
        setActiveUsers(snapRes.data.activeUsers);
        setResources(snapRes.data.resources);
        setTraffic(snapRes.data.traffic);

        // 2. Count voucher server ini (dari DB)
        const vouchersRes = await apiClient.get<any[]>("/vouchers");
        const filteredVouchers = vouchersRes.data.filter((v: any) => v.serverId === activeServerId);
        setVouchersCount(filteredVouchers.length);

        setError(null);
      } catch (err: any) {
        console.error("Dashboard fetch error:", err);
        checkActiveServerStatus();
        setError(err.response?.data?.message || err.message || "Gagal terhubung ke router MikroTik.");
        setActiveUsers([]);
        setResources(null);
        setTraffic([]);
      } finally {
        setIsLoading(false);
        setIsSilentLoading(false);
      }
    },
    [activeServerId, checkActiveServerStatus],
  );

  // Trigger fetch saat server aktif berubah / selesai sinkronisasi
  useEffect(() => {
    if (activeServerId && !isSyncing) {
      fetchDashboardData(false);
      setCountdown(autoRefreshInterval);
    }
  }, [activeServerId, isSyncing, fetchDashboardData, autoRefreshInterval]);

  // Timer hitung mundur auto-refresh
  useEffect(() => {
    if (!activeServerId || autoRefreshInterval === 0 || error) return;

    setCountdown(autoRefreshInterval);

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          fetchDashboardData(true);
          return autoRefreshInterval;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [activeServerId, autoRefreshInterval, fetchDashboardData, error]);

  const handleManualRefresh = () => {
    fetchDashboardData(false);
    setCountdown(autoRefreshInterval);
  };

  // Filter user aktif by search
  const filteredUsers = activeUsers.filter(
    (u) =>
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.ipAddress.includes(searchQuery) ||
      u.macAddress.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const memoryUsagePercent = resources
    ? Math.round(((resources.totalMemory - resources.freeMemory) / resources.totalMemory) * 100)
    : 0;
  const hddUsagePercent = resources
    ? Math.round(((resources.totalHddSpace - resources.freeHddSpace) / resources.totalHddSpace) * 100)
    : 0;

  // ── State 1: Belum pilih router ───────────────────────────────────────────
  if (!activeServerId) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center pt-10 pb-8">
          <div className="w-14 h-14 rounded-full border border-hairline flex items-center justify-center mx-auto mb-5 text-ink">
            <Wifi className="w-6 h-6" strokeWidth={1.5} />
          </div>
          <h1 className="font-display text-[28px] font-semibold text-ink">Selamat datang</h1>
          <p className="text-body mt-2 max-w-md mx-auto text-sm">
            Pilih salah satu router di pojok kanan atas, atau klik kartu di bawah buat mulai memantau.
          </p>
        </div>

        {servers.length === 0 ? (
          <Card className="max-w-sm mx-auto text-center">
            <div className="w-12 h-12 rounded-full border border-hairline flex items-center justify-center mx-auto mb-4 text-mute">
              <ServerIcon className="w-5 h-5" strokeWidth={1.5} />
            </div>
            <h3 className="font-semibold text-ink">Belum ada router</h3>
            <p className="text-sm text-body mt-1 mb-5">Daftarkan router MikroTik dulu buat mulai.</p>
            <a href="/servers" className="inline-block">
              <Button>Tambah Router</Button>
            </a>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {servers.map((server) => {
              const isOnline = server.lastStatus === "ONLINE";
              return (
                <button
                  key={server.id}
                  onClick={() => setActiveServerId(server.id)}
                  className="text-left rounded-[12px] border border-hairline bg-canvas p-5 hover:border-hairline-strong transition-colors flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-hairline bg-surface-soft text-xs font-medium text-charcoal">
                        <StatusDot tone={isOnline ? "ok" : "danger"} />
                        {isOnline ? "Online" : "Offline"}
                      </span>
                    </div>
                    <h3 className="font-semibold text-ink">{server.name}</h3>
                    <p className="text-xs text-mute font-mono mt-1">
                      {server.host}:{server.port}
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-hairline flex items-center justify-between text-sm text-ink font-medium">
                    <span>Hubungkan</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  const isLive = activeServer?.lastStatus === "ONLINE" && !error;

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title={activeServer?.name ?? "Dasbor"}
        description={`${activeServer?.host}:${activeServer?.port} · RouterOS ${resources?.version || "-"}`}
        action={
          <div className="flex flex-wrap items-center gap-2">
            {/* Status live */}
            <span className="inline-flex items-center gap-1.5 px-3 h-9 rounded-full border border-hairline bg-canvas text-xs font-medium text-charcoal">
              <StatusDot tone={isLive ? "ok" : "danger"} pulse={isLive} />
              {isLive ? "Terhubung" : "Terputus"}
            </span>

            {/* Auto-refresh */}
            <div className="inline-flex items-center gap-2 h-9 px-3 rounded-full bg-surface-soft border border-hairline">
              <Clock className="w-3.5 h-3.5 text-mute" />
              <select
                value={autoRefreshInterval}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  setAutoRefreshInterval(val);
                  setCountdown(val);
                }}
                className="bg-transparent text-xs text-ink font-medium focus:outline-none cursor-pointer"
              >
                <option value={0}>Nonaktif</option>
                <option value={3}>3 detik</option>
                <option value={10}>10 detik</option>
                <option value={30}>30 detik</option>
                <option value={60}>60 detik</option>
              </select>
            </div>
          </div>
        }
      />

      {/* Error banner */}
      {error && (
        <Card className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-danger" strokeWidth={1.75} />
          <div>
            <h3 className="font-semibold text-ink">Gagal memantau router</h3>
            <p className="text-sm text-body mt-1">{error}</p>
            <Button variant="secondary" size="sm" className="mt-3" onClick={handleManualRefresh}>
              <RefreshCw className="w-3.5 h-3.5" /> Coba hubungkan ulang
            </Button>
          </div>
        </Card>
      )}

      {/* Loading skeleton */}
      {isLoading && !isSilentLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 rounded-[12px] border border-hairline bg-surface-soft animate-pulse" />
          ))}
          <div className="lg:col-span-4 h-64 rounded-[12px] border border-hairline bg-surface-soft animate-pulse" />
        </div>
      ) : (
        <>
          {/* Metrik utama */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              icon={Users}
              label="User Aktif"
              value={error ? "-" : String(activeUsers.length)}
              hint="Sesi aktif sekarang"
            />
            <MetricCard
              icon={Ticket}
              label="Voucher"
              value={error ? "-" : String(vouchersCount)}
              hint="Total di database"
            />
            <MetricCard
              icon={Wifi}
              label="Uptime Router"
              value={error || !resources ? "-" : formatUptime(resources.uptime)}
              hint="Waktu aktif router"
              small
            />
            <MetricCard
              icon={Network}
              label="Interface Aktif"
              value={error ? "-" : `${traffic.filter((i) => i.running).length}/${traffic.length}`}
              hint="Interface berjalan"
            />
          </div>

          {/* Performa & hardware */}
          {!error && resources && (
            <Card padded={false} className="p-6 space-y-6">
              <h2 className="font-display text-lg font-semibold text-ink">Performa Router &amp; Hardware</h2>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <UsageBar
                  icon={Cpu}
                  title="Penggunaan CPU"
                  meta={`${resources.cpuCount} Core`}
                  percent={resources.cpuLoad}
                  sub="Beban kerja"
                />
                <UsageBar
                  icon={Database}
                  title="Memori RAM"
                  meta={formatBytes(resources.totalMemory)}
                  percent={memoryUsagePercent}
                  sub={`Terpakai ${formatBytes(resources.totalMemory - resources.freeMemory)}`}
                />
                <UsageBar
                  icon={HardDrive}
                  title="Penyimpanan HDD"
                  meta={formatBytes(resources.totalHddSpace)}
                  percent={hddUsagePercent}
                  sub={`Sisa ${formatBytes(resources.freeHddSpace)}`}
                />
              </div>

              {/* Spec badges — info hardware unik saja (Uptime & Versi sudah di
                  kartu metrik / subjudul header, tidak diduplikasi di sini). */}
              <div className="grid grid-cols-2 gap-3 pt-5 border-t border-hairline">
                <SpecBadge label="Tipe Board" value={resources.boardName} />
                <SpecBadge label="Arsitektur" value={resources.architectureName} />
              </div>
            </Card>
          )}

          {/* Traffic + Pengguna aktif */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Traffic */}
            <Card padded={false} className="overflow-hidden flex flex-col h-100">
              <div className="p-5 border-b border-hairline shrink-0">
                <h2 className="font-display text-lg font-semibold text-ink">Traffic Jaringan</h2>
                <p className="text-xs text-body mt-0.5">Bandwidth RX/TX real-time</p>
              </div>

              <div className="flex-1 overflow-auto">
                {error ? (
                  <EmptyState icon={AlertTriangle} title="Data traffic tidak tersedia" />
                ) : traffic.length === 0 ? (
                  <EmptyState icon={Activity} title="Memuat…" />
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 bg-surface-soft text-mute font-medium text-xs border-b border-hairline select-none z-10">
                      <tr>
                        <th className="p-3 pl-5">Interface</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">
                          <span className="inline-flex items-center gap-1">
                            <ArrowDown className="w-3.5 h-3.5" /> RX
                          </span>
                        </th>
                        <th className="p-3">
                          <span className="inline-flex items-center gap-1">
                            <ArrowUp className="w-3.5 h-3.5" /> TX
                          </span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-hairline text-sm text-ink">
                      {traffic.map((iface) => (
                        <tr key={iface.id} className="hover:bg-surface-soft transition-colors">
                          <td className="p-3 pl-5 font-medium text-ink">
                            <span className="inline-flex items-center gap-2">
                              <StatusDot tone={iface.running ? "ok" : "neutral"} />
                              <span className="truncate max-w-25 sm:max-w-none">{iface.name}</span>
                            </span>
                          </td>
                          <td className="p-3">
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-hairline bg-surface-soft text-[11px] font-medium text-charcoal">
                              {iface.disabled ? "Disabled" : iface.running ? "Running" : "Down"}
                            </span>
                          </td>
                          <td className="p-3 font-mono text-xs text-charcoal whitespace-nowrap">
                            {formatBytes(iface.rxByte)}
                          </td>
                          <td className="p-3 font-mono text-xs text-charcoal whitespace-nowrap">
                            {formatBytes(iface.txByte)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </Card>

            {/* Pengguna aktif */}
            <Card padded={false} className="overflow-hidden flex flex-col h-100">
              <div className="p-5 border-b border-hairline flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
                <div>
                  <h2 className="font-display text-lg font-semibold text-ink">Pengguna Aktif</h2>
                  <p className="text-xs text-body mt-0.5">Pelanggan terhubung saat ini</p>
                </div>
                {!error && activeUsers.length > 0 && (
                  <div className="relative max-w-45 w-full shrink-0">
                    <Search className="w-4 h-4 text-mute absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Cari user…"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full h-9 text-xs bg-surface-soft text-ink placeholder:text-mute rounded-full pl-9 pr-3 border border-hairline outline-none focus:border-ink focus:ring-2 focus:ring-[rgba(59,130,246,0.5)] transition-colors"
                    />
                  </div>
                )}
              </div>

              <div className="flex-1 overflow-auto">
                {error ? (
                  <EmptyState icon={AlertTriangle} title="Data pengguna tidak tersedia" />
                ) : activeUsers.length === 0 ? (
                  <EmptyState icon={Users} title="Belum ada sesi pengguna" />
                ) : filteredUsers.length === 0 ? (
                  <EmptyState icon={Search} title="Tidak ada yang cocok" />
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 bg-surface-soft text-mute font-medium text-xs border-b border-hairline select-none z-10">
                      <tr>
                        <th className="p-3 pl-5">Username</th>
                        <th className="p-3">IP Address</th>
                        <th className="p-3">Uptime</th>
                        <th className="p-3 pr-5">Sisa Waktu</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-hairline text-sm text-ink">
                      {filteredUsers.map((user) => (
                        <tr key={user.id} className="hover:bg-surface-soft transition-colors">
                          <td className="p-3 pl-5 font-medium text-ink">
                            <span className="inline-flex items-center gap-2">
                              <StatusDot tone="ok" />
                              <span className="truncate max-w-25 sm:max-w-none">{user.username}</span>
                            </span>
                          </td>
                          <td className="p-3 font-mono text-xs text-charcoal whitespace-nowrap">{user.ipAddress}</td>
                          <td className="p-3 text-xs text-charcoal whitespace-nowrap">{user.uptime}</td>
                          <td className="p-3 pr-5 whitespace-nowrap">
                            {user.sessionTimeLeft ? (
                              <span className="inline-block px-2 py-0.5 rounded-full border border-hairline bg-surface-soft text-charcoal text-[11px] font-medium">
                                {user.sessionTimeLeft}
                              </span>
                            ) : (
                              <span className="text-mute text-xs">Tanpa batas</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Footer */}
              {!error && activeUsers.length > 0 && (
                <div className="p-3 border-t border-hairline bg-surface-soft flex items-center justify-between text-xs text-mute select-none shrink-0">
                  <span>Menampilkan {filteredUsers.length} pengguna</span>
                  {isSilentLoading && (
                    <span className="text-charcoal inline-flex items-center gap-1.5">
                      <RefreshCw className="w-3 h-3 animate-spin" /> Memperbarui…
                    </span>
                  )}
                </div>
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

// ── Sub-komponen ─────────────────────────────────────────────────────────────

function MetricCard({
  icon: Icon,
  label,
  value,
  hint,
  small,
}: {
  icon: typeof Users;
  label: string;
  value: string;
  hint: string;
  small?: boolean;
}) {
  return (
    <Card className="flex items-start justify-between">
      <div className="min-w-0">
        <p className="text-xs font-medium text-mute uppercase tracking-wide">{label}</p>
        <p
          className={`font-display font-semibold text-ink mt-2 truncate ${
            small ? "text-xl" : "text-3xl"
          }`}
        >
          {value}
        </p>
        <p className="text-xs text-body mt-1">{hint}</p>
      </div>
      <div className="w-10 h-10 rounded-full border border-hairline flex items-center justify-center text-mute shrink-0">
        <Icon className="w-5 h-5" strokeWidth={1.75} />
      </div>
    </Card>
  );
}

function UsageBar({
  icon: Icon,
  title,
  meta,
  percent,
  sub,
}: {
  icon: typeof Cpu;
  title: string;
  meta: string;
  percent: number;
  sub: string;
}) {
  return (
    <div className="rounded-[12px] border border-hairline p-5 flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <span className="font-medium text-sm text-ink inline-flex items-center gap-2">
          <Icon className="w-4 h-4 text-charcoal" strokeWidth={1.75} /> {title}
        </span>
        <span className="text-xs text-mute font-mono">{meta}</span>
      </div>
      <div className="space-y-2">
        <div className="flex justify-between items-end">
          <span className="font-display text-2xl font-semibold text-ink">{percent}%</span>
          <span className="text-xs text-body">{sub}</span>
        </div>
        {/* Bar hitam (ink) — tanpa warna semantik, sesuai Ollama */}
        <div className="h-2 w-full bg-surface-soft rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-ink transition-all duration-500"
            style={{ width: `${Math.min(percent, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function SpecBadge({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex flex-col rounded-[12px] border border-hairline px-4 py-3">
      <span className="text-xs text-mute">{label}</span>
      <span className={`text-sm font-medium text-ink mt-0.5 truncate ${mono ? "font-mono" : ""}`} title={value}>
        {value}
      </span>
    </div>
  );
}
