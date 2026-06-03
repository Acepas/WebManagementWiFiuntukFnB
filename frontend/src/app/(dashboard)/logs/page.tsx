"use client";

import { useEffect, useState } from "react";
import apiClient from "@/lib/api-client";
import { useServerStore } from "@/store/server-store";
import {
  Search,
  Plus,
  MoreHorizontal,
  X,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ArrowDown,
  RefreshCw,
  AlertCircle,
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
  const { activeServerId, servers } = useServerStore();
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
    setSkip(0); // Reset to page 1 on filter/server change
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

  const activeServerName = servers.find(s => s.id === activeServerId)?.name || "All Servers";

  return (
    <div className="w-full flex flex-col h-[calc(100vh-6rem)] animate-fade-in">
      
      {/* Top Header Area */}
      <div className="pt-2 pb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Riwayat Aktivitas</h1>
          <p className="text-sm text-on-surface-variant mt-1">Pantau seluruh kejadian pada sistem dan router Anda.</p>
        </div>
        
        {/* Actions */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
            <input 
              type="text" 
              placeholder="Cari aktivitas..." 
              className="w-64 pl-9 pr-4 py-2 text-sm bg-surface rounded-full border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary transition-all text-on-surface"
            />
          </div>
          
          <div className="relative flex items-center">
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="appearance-none bg-surface border border-outline-variant text-on-surface text-sm rounded-full pl-4 pr-10 py-2 focus:outline-none focus:border-primary font-medium"
            >
              <option value="ALL">Semua Aksi</option>
              <option value="SERVER_CREATED">Server Baru</option>
              <option value="SERVER_UPDATED">Update Server</option>
              <option value="VOUCHER_CREATED">Voucher Dibuat</option>
              <option value="VOUCHER_BATCH_CREATED">Batch Voucher</option>
              <option value="AI_ANALYSIS_COMPLETED">Analisis AI</option>
              <option value="ROUTER_CONNECTION_FAILED">Error Koneksi</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant pointer-events-none" />
          </div>

          <button onClick={loadLogs} className="p-2 text-on-surface-variant hover:text-primary bg-surface hover:bg-primary/10 border border-outline-variant rounded-full transition-colors" title="Refresh">
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="mb-6 p-4 bg-error-container/20 border border-error/20 rounded-xl text-on-error-container text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          <p>{error}</p>
        </div>
      )}

      {/* Table Area (Borderless, sleek) */}
      <div className="flex-1 overflow-auto bg-surface/50 rounded-2xl border border-outline-variant/50 backdrop-blur-sm">
        <table className="w-full text-sm text-left">
          <thead className="sticky top-0 bg-surface/90 backdrop-blur text-on-surface-variant font-medium text-xs uppercase tracking-wider border-b border-outline-variant/60 z-10">
            <tr>
              <th className="px-6 py-4 font-semibold w-40">Waktu</th>
              <th className="px-6 py-4 font-semibold w-48">Aksi</th>
              <th className="px-6 py-4 font-semibold">Deskripsi</th>
              <th className="px-6 py-4 font-semibold w-48">Server</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/40">
            {isLoading && logs.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-16 text-center text-on-surface-variant">
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-primary" />
                  <p>Memuat log aktivitas...</p>
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-16 text-center text-on-surface-variant">
                  Belum ada aktivitas yang tercatat.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="hover:bg-surface-variant/30 transition-colors">
                  {/* Waktu */}
                  <td className="px-6 py-4 align-top whitespace-nowrap">
                    <div className="font-medium text-on-surface">{formatDate(log.createdAt)}</div>
                    <div className="text-on-surface-variant text-xs mt-0.5">{formatTime(log.createdAt)}</div>
                  </td>
                  
                  {/* Aksi (Badge) */}
                  <td className="px-6 py-4 align-top">
                    <span className="inline-flex px-2.5 py-1 rounded border border-outline-variant bg-surface text-[10px] font-bold tracking-widest uppercase text-on-surface-variant">
                      {log.action.replace(/_/g, ' ')}
                    </span>
                  </td>
                  
                  {/* Deskripsi */}
                  <td className="px-6 py-4 align-top">
                    <p className="text-on-surface font-medium leading-relaxed">
                      {log.detail || "-"}
                    </p>
                  </td>
                  
                  {/* Server */}
                  <td className="px-6 py-4 align-top whitespace-nowrap">
                    {log.server ? (
                      <div>
                        <div className="inline-flex items-center gap-1.5 text-[11px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full mb-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                          {log.server.name}
                        </div>
                        <div className="text-on-surface-variant text-xs">{log.server.host}</div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-on-surface-variant">
                        <div className="w-5 h-5 rounded-full bg-surface-variant flex items-center justify-center">
                          <AlertCircle className="w-3 h-3" />
                        </div>
                        <span className="font-medium text-sm">System</span>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="py-4 mt-2 flex items-center justify-between text-sm text-on-surface-variant">
        <div className="flex items-center gap-3">
          <span>Rows per page</span>
          <div className="relative">
            <select
              value={take}
              onChange={(e) => setTake(Number(e.target.value))}
              className="appearance-none bg-surface border border-outline-variant text-on-surface rounded-md pl-3 pr-8 py-1 focus:outline-none focus:border-primary"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span>
            {totalRows === 0 ? "0 - 0" : `${skip + 1} - ${Math.min(skip + take, totalRows)}`} of {totalRows}
          </span>
          <div className="flex items-center gap-1">
            <button 
              onClick={handlePrevPage}
              disabled={skip === 0}
              className="p-1 border border-outline-variant rounded-md bg-surface text-on-surface hover:bg-surface-variant disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button 
              onClick={handleNextPage}
              disabled={skip + take >= totalRows}
              className="p-1 border border-outline-variant rounded-md bg-surface text-on-surface hover:bg-surface-variant disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
