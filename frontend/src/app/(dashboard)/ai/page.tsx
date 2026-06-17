"use client";

import { useServerStore } from "@/store/server-store";
import { useToastStore } from "@/store/toast-store";
import apiClient from "@/lib/api-client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  PageHeader,
  Button,
  Label,
  Select,
  StatusDot,
  Badge,
  Banner,
  Modal,
  EmptyState,
} from "@/components/ui";
import { BrainCircuit, Loader2, History, Trash2, ArrowRight } from "lucide-react";

interface AiReport {
  id: string;
  serverId: string;
  provider: string;
  configJson: string;
  resultMd: string;
  status: string;
  createdAt: string;
  server?: { name: string; host: string };
}

export default function AiPage() {
  const { activeServerId, servers, fetchServers } = useServerStore();
  const [reports, setReports] = useState<AiReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [provider, setProvider] = useState("openrouter");

  const router = useRouter();
  const activeServer = servers.find((s) => s.id === activeServerId);

  useEffect(() => {
    fetchServers();
    loadReports();
    const saved = localStorage.getItem("wifi_ai_provider");
    if (saved) setProvider(saved);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchServers]);

  const loadReports = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get("/ai/reports");
      setReports(response.data);
    } catch (error: any) {
      console.error("Failed to load AI reports:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnalyze = async () => {
    if (!activeServerId) {
      setErrorMessage("Pilih router aktif di header dulu.");
      return;
    }
    setIsAnalyzing(true);
    setErrorMessage("");
    try {
      const response = await apiClient.post(`/ai/servers/${activeServerId}/analyze`, { provider });
      if (response.data) {
        await loadReports();
        router.push(`/ai/${response.data.id}`);
      }
    } catch (error: any) {
      setErrorMessage(
        error.response?.data?.message ||
          error.message ||
          "Gagal memanggil AI. Pastikan API Key valid & koneksi internet stabil.",
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  // ─── Hapus riwayat ──────────────────────────────────────────────────────────
  const [deleteTarget, setDeleteTarget] = useState<string | "ALL" | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const executeDelete = async () => {
    if (!deleteTarget) return;
    const toast = useToastStore.getState();
    setIsDeleting(true);
    try {
      if (deleteTarget === "ALL") {
        const res = await apiClient.delete("/ai/reports");
        toast.success(`${res.data?.deletedCount ?? "Semua"} laporan dihapus.`, "Riwayat dikosongkan");
      } else {
        await apiClient.delete(`/ai/reports/${deleteTarget}`);
        toast.success("Laporan dihapus.", "Berhasil dihapus");
      }
      await loadReports();
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.message || "Gagal menghapus laporan.", "Gagal menghapus");
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="AI Analis"
        description="Diagnosa otomatis konfigurasi router MikroTik — temukan celah keamanan & optimasi performa."
        action={
          activeServerId ? (
            <span className="inline-flex items-center gap-1.5 px-3 h-9 rounded-full border border-hairline bg-canvas text-xs font-medium text-charcoal">
              <StatusDot tone="ok" pulse />
              {activeServer?.name}
            </span>
          ) : undefined
        }
      />

      {errorMessage && <Banner tone="error">{errorMessage}</Banner>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Panel aksi */}
        <div className="lg:col-span-1">
          <Card className="space-y-5">
            <div>
              <h3 className="font-display text-lg font-semibold text-ink">Jalankan Analisis</h3>
              <p className="text-sm text-body mt-1">Pilih model AI lalu mulai diagnosa router aktif.</p>
            </div>
            <div>
              <Label>Model AI</Label>
              <Select
                value={provider}
                onChange={(e) => {
                  setProvider(e.target.value);
                  localStorage.setItem("wifi_ai_provider", e.target.value);
                }}
              >
                <option value="openrouter">OpenRouter (GLM)</option>
                <option value="gemini">Google Gemini (1.5 Flash)</option>
              </Select>
            </div>
            <Button className="w-full" onClick={handleAnalyze} loading={isAnalyzing} disabled={!activeServerId}>
              {!isAnalyzing && <BrainCircuit className="w-4 h-4" />}
              {isAnalyzing ? "Menganalisis…" : "Mulai Analisis"}
            </Button>
            {!activeServerId && <p className="text-xs text-mute text-center">Pilih router di header dulu.</p>}
          </Card>
        </div>

        {/* Riwayat */}
        <div className="lg:col-span-2">
          <Card padded={false} className="p-6 min-h-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg font-semibold text-ink inline-flex items-center gap-2">
                <History className="w-5 h-5 text-mute" strokeWidth={1.75} /> Riwayat Analisis
              </h3>
              {!isLoading && reports.length > 0 && (
                <Button variant="danger" size="sm" onClick={() => setDeleteTarget("ALL")}>
                  <Trash2 className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Hapus Semua</span>
                </Button>
              )}
            </div>

            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-16 text-mute">
                <Loader2 className="w-6 h-6 animate-spin mb-3" />
                <p className="text-sm">Memuat riwayat…</p>
              </div>
            ) : reports.length === 0 ? (
              <EmptyState
                icon={BrainCircuit}
                title="Belum ada analisis"
                description="Klik 'Mulai Analisis' buat diagnosa router pertamamu."
              />
            ) : (
              <div className="space-y-3">
                {reports.map((report) => (
                  <div
                    key={report.id}
                    onClick={() => router.push(`/ai/${report.id}`)}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-[12px] border border-hairline hover:border-hairline-strong hover:bg-surface-soft cursor-pointer transition-colors group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full border border-hairline flex items-center justify-center text-mute shrink-0">
                        <BrainCircuit className="w-5 h-5" strokeWidth={1.75} />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-medium text-ink truncate">Analisis {report.server?.name || "Router"}</h4>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <Badge>{report.provider}</Badge>
                          <span className="text-xs text-mute">
                            {new Date(report.createdAt).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                      <ArrowRight className="w-4 h-4 text-mute group-hover:text-ink group-hover:translate-x-0.5 transition-all" />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteTarget(report.id);
                        }}
                        className="w-8 h-8 flex items-center justify-center rounded-full border border-hairline text-danger hover:bg-error-container transition-colors"
                        title="Hapus laporan"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Konfirmasi hapus */}
      <Modal
        open={!!deleteTarget}
        onClose={() => !isDeleting && setDeleteTarget(null)}
        title={deleteTarget === "ALL" ? "Hapus semua riwayat?" : "Hapus laporan?"}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteTarget(null)} disabled={isDeleting}>
              Batal
            </Button>
            <Button variant="danger" onClick={executeDelete} loading={isDeleting}>
              <Trash2 className="w-4 h-4" /> Hapus
            </Button>
          </>
        }
      >
        <p className="text-sm text-body leading-relaxed">
          {deleteTarget === "ALL" ? (
            <>
              Hapus <span className="font-medium text-ink">semua</span> riwayat ({reports.length} laporan)? Tindakan ini tak bisa dibatalkan.
            </>
          ) : (
            "Yakin hapus laporan analisis ini? Tindakan ini tak bisa dibatalkan."
          )}
        </p>
      </Modal>
    </div>
  );
}
