"use client";

import { useEffect, useState } from "react";
import apiClient from "@/lib/api-client";
import { useServerStore } from "@/store/server-store";
import { Card, PageHeader, Button, Badge, StatusDot, EmptyState } from "@/components/ui";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  History,
  AlertTriangle,
} from "lucide-react";

interface ActivityLog {
  id: string;
  adminId: string | null;
  serverId: string | null;
  action: string;
  entity: string | null;
  entityId: string | null;
  detail: string | null;
  createdAt: string;
  admin?: { name: string; email: string };
  server?: { name: string; host: string };
}

interface LogResponse {
  data: ActivityLog[];
  meta: {
    total: number;
    skip: number;
    take: number;
  };
}

export default function LogsPage() {
  const { activeServerId } = useServerStore();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Pagination & Filtering
  const [filterAction, setFilterAction] = useState<string>("ALL");
  const [take, setTake] = useState<number>(10);
  const [skip, setSkip] = useState<number>(0);
  const [totalRows, setTotalRows] = useState<number>(0);

  const loadLogs = async () => {
    setIsLoading(true);
    setError("");
    try {
      let url = `/activity-log?take=${take}&skip=${skip}`;
      if (activeServerId) url += `&serverId=${activeServerId}`;
      if (filterAction !== "ALL") url += `&action=${filterAction}`;

      const response = await apiClient.get<LogResponse>(url);
      setLogs(response.data.data);
      setTotalRows(response.data.meta.total);
    } catch (err: any) {
      setError(err.response?.data?.message || "Gagal memuat log aktivitas");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setSkip(0); // Reset ke halaman 1 saat filter/server berubah
  }, [activeServerId, filterAction, take]);

  useEffect(() => {
    loadLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeServerId, filterAction, skip, take]);

  const handleNextPage = () => {
    if (skip + take < totalRows) setSkip(skip + take);
  };

  const handlePrevPage = () => {
    if (skip - take >= 0) setSkip(skip - take);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) + " WIB";
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", { month: "2-digit", day: "2-digit", year: "numeric" });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)] animate-fade-in">
      {/* Header */}
      <PageHeader
        title="Riwayat Aktivitas"
        description="Pantau semua kejadian di sistem & router kamu."
        className="mb-6"
        action={
          <>
            <div className="relative">
              <select
                value={filterAction}
                onChange={(e) => setFilterAction(e.target.value)}
                className="appearance-none h-9 pl-4 pr-9 rounded-full bg-surface-soft border border-hairline text-ink text-sm font-medium outline-none cursor-pointer transition-colors focus:border-ink focus:ring-2 focus:ring-[rgba(59,130,246,0.5)]"
              >
                <option value="ALL">Semua aksi</option>
                <option value="SERVER_CREATED">Server baru</option>
                <option value="SERVER_UPDATED">Update server</option>
                <option value="VOUCHER_CREATED">Voucher dibuat</option>
                <option value="VOUCHER_BATCH_CREATED">Batch voucher</option>
                <option value="AI_ANALYSIS_COMPLETED">Analisis AI</option>
                <option value="ROUTER_CONNECTION_FAILED">Error koneksi</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mute pointer-events-none" />
            </div>

            <Button variant="secondary" size="md" onClick={loadLogs} disabled={isLoading}>
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Muat ulang</span>
            </Button>
          </>
        }
      />

      {/* Error */}
      {error && (
        <Card className="mb-6 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-danger" strokeWidth={1.75} />
          <div>
            <h3 className="font-semibold text-ink">Gagal memuat log</h3>
            <p className="text-sm text-body mt-1">{error}</p>
            <Button variant="secondary" size="sm" className="mt-3" onClick={loadLogs}>
              <RefreshCw className="w-3.5 h-3.5" /> Coba lagi
            </Button>
          </div>
        </Card>
      )}

      {/* Tabel */}
      <Card padded={false} className="flex-1 overflow-auto">
        <table className="w-full text-sm text-left border-collapse">
          <thead className="sticky top-0 bg-surface-soft text-mute font-medium text-xs uppercase tracking-wide border-b border-hairline z-10">
            <tr>
              <th className="px-6 py-3.5 w-40">Waktu</th>
              <th className="px-6 py-3.5 w-48">Aksi</th>
              <th className="px-6 py-3.5">Deskripsi</th>
              <th className="px-6 py-3.5 w-48">Server</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline text-ink">
            {isLoading && logs.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-16 text-center text-mute">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-3" />
                  <p className="text-sm">Memuat log aktivitas…</p>
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={4}>
                  <EmptyState icon={History} title="Belum ada aktivitas" description="Kejadian di sistem & router bakal muncul di sini." />
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="hover:bg-surface-soft transition-colors">
                  {/* Waktu */}
                  <td className="px-6 py-4 align-top whitespace-nowrap">
                    <div className="font-medium text-ink">{formatDate(log.createdAt)}</div>
                    <div className="text-mute text-xs mt-0.5">{formatTime(log.createdAt)}</div>
                  </td>

                  {/* Aksi */}
                  <td className="px-6 py-4 align-top">
                    <Badge>{log.action.replace(/_/g, " ")}</Badge>
                  </td>

                  {/* Deskripsi */}
                  <td className="px-6 py-4 align-top">
                    <p className="text-charcoal leading-relaxed">{log.detail || "-"}</p>
                  </td>

                  {/* Server */}
                  <td className="px-6 py-4 align-top whitespace-nowrap">
                    {log.server ? (
                      <div>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-hairline bg-surface-soft text-[11px] font-medium text-charcoal mb-1">
                          <StatusDot tone="ok" />
                          {log.server.name}
                        </span>
                        <div className="text-mute text-xs font-mono">{log.server.host}</div>
                      </div>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-charcoal">
                        <StatusDot tone="neutral" />
                        <span className="text-sm">Sistem</span>
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>

      {/* Pagination */}
      <div className="py-4 flex items-center justify-between text-sm text-body">
        <div className="flex items-center gap-3">
          <span>Baris per halaman</span>
          <div className="relative">
            <select
              value={take}
              onChange={(e) => setTake(Number(e.target.value))}
              className="appearance-none h-8 pl-3 pr-8 rounded-full bg-surface-soft border border-hairline text-ink outline-none cursor-pointer focus:border-ink focus:ring-2 focus:ring-[rgba(59,130,246,0.5)]"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-mute pointer-events-none" />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-mute">
            {totalRows === 0 ? "0 – 0" : `${skip + 1} – ${Math.min(skip + take, totalRows)}`} dari {totalRows}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={handlePrevPage}
              disabled={skip === 0}
              className="w-8 h-8 flex items-center justify-center rounded-full border border-hairline text-charcoal hover:bg-surface-soft disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              aria-label="Sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNextPage}
              disabled={skip + take >= totalRows}
              className="w-8 h-8 flex items-center justify-center rounded-full border border-hairline text-charcoal hover:bg-surface-soft disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              aria-label="Berikutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
