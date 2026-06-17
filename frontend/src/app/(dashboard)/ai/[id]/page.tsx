"use client";

import apiClient from "@/lib/api-client";
import { useToastStore } from "@/store/toast-store";
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { useParams, useRouter } from "next/navigation";
import { Card, Button, Banner, Modal } from "@/components/ui";
import {
  BrainCircuit,
  Loader2,
  AlertCircle,
  Copy,
  CheckCircle,
  ArrowLeft,
  Download,
  Trash2,
} from "lucide-react";

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

export default function AiReportDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [report, setReport] = useState<AiReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [isCopied, setIsCopied] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (id) loadReport(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadReport = async (reportId: string) => {
    setIsLoading(true);
    try {
      const response = await apiClient.get(`/ai/reports/${reportId}`);
      setReport(response.data);
    } catch (error: any) {
      console.error("Failed to load AI report:", error);
      setErrorMessage("Gagal memuat laporan. Mungkin sudah dihapus atau tidak ditemukan.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyResult = async () => {
    if (report?.resultMd) {
      await navigator.clipboard.writeText(report.resultMd);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const executeDelete = async () => {
    const toast = useToastStore.getState();
    setIsDeleting(true);
    try {
      await apiClient.delete(`/ai/reports/${id}`);
      toast.success("Laporan dihapus.", "Berhasil dihapus");
      router.push("/ai");
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.message || "Gagal menghapus laporan.", "Gagal menghapus");
      setIsDeleting(false);
      setIsDeleteOpen(false);
    }
  };

  // ── Download PDF — LOGIKA TIDAK DIUBAH (selector .prose kritis) ────────────
  const handleDownloadPdf = async () => {
    if (!report) return;

    try {
      // @ts-ignore
      const html2pdf = (await import("html2pdf.js")).default;

      const markdownElement = document.querySelector(".prose");
      if (!markdownElement) {
        alert("Konten laporan tidak ditemukan.");
        return;
      }

      // Iframe tersembunyi untuk isolasi CSS (hindari error oklab Tailwind v4)
      const iframe = document.createElement("iframe");
      iframe.style.position = "absolute";
      iframe.style.width = "0";
      iframe.style.height = "0";
      iframe.style.border = "none";
      document.body.appendChild(iframe);

      const doc = iframe.contentWindow?.document || iframe.contentDocument;
      if (!doc) throw new Error("Gagal membuat iframe dokumen");

      doc.open();
      doc.write(`
        <html>
          <head>
            <style>
              body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333333; line-height: 1.6; padding: 20px; font-size: 14px; }
              h1, h2, h3, h4 { color: #111111; margin-top: 1.5em; margin-bottom: 0.5em; }
              h1 { font-size: 24px; border-bottom: 2px solid #eaeaea; padding-bottom: 8px; }
              h2 { font-size: 20px; }
              p { margin-bottom: 1em; }
              ul, ol { margin-bottom: 1em; padding-left: 20px; }
              li { margin-bottom: 0.5em; }
              code { background-color: #f6f8fa; padding: 2px 4px; border-radius: 4px; font-family: monospace; font-size: 12px; color: #d73a49; }
              pre { background-color: #f6f8fa; padding: 16px; border-radius: 6px; overflow-x: auto; font-family: monospace; font-size: 12px; border: 1px solid #e1e4e8; }
              pre code { background-color: transparent; padding: 0; color: #24292e; }
              blockquote { border-left: 4px solid #dfe2e5; color: #6a737d; padding-left: 16px; margin-left: 0; }

              .pdf-header { border-bottom: 2px solid #111111; padding-bottom: 16px; margin-bottom: 24px; }
              .pdf-title { font-size: 28px; font-weight: bold; color: #111111; margin: 0 0 8px 0; border: none; }
              .pdf-meta { font-size: 12px; color: #555555; display: flex; flex-direction: column; gap: 4px; }
              .pdf-meta strong { color: #333333; }
              .badge { display: inline-block; background: #f0f0f0; color: #333333; padding: 2px 8px; border-radius: 12px; font-weight: bold; font-size: 11px; }
            </style>
          </head>
          <body>
            <div id="pdf-wrapper">
              <div class="pdf-header">
                <h1 class="pdf-title">Laporan Analisis AI</h1>
                <div class="pdf-meta">
                  <div><strong>Target Router:</strong> <span class="badge">${report.server?.name || "Unknown Server"} (${report.server?.host || "N/A"})</span></div>
                  <div><strong>Model AI:</strong> <span style="text-transform: capitalize;">${report.provider}</span></div>
                  <div><strong>Tanggal:</strong> ${new Date(report.createdAt).toLocaleString("id-ID", { dateStyle: "long", timeStyle: "short" })} WIB</div>
                </div>
              </div>
              <div class="pdf-body">
                ${markdownElement.innerHTML}
              </div>
            </div>
          </body>
        </html>
      `);
      doc.close();

      const opt = {
        margin: [15, 15, 20, 15] as [number, number, number, number],
        filename: `Laporan-AI-${report.server?.name || "Server"}-${new Date(report.createdAt).toISOString().split("T")[0]}.pdf`,
        image: { type: "jpeg" as const, quality: 1.0 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: "mm" as const, format: "a4" as const, orientation: "portrait" as const },
      };

      setTimeout(() => {
        const targetElement = doc.getElementById("pdf-wrapper");
        if (!targetElement) {
          document.body.removeChild(iframe);
          return;
        }
        html2pdf()
          .set(opt)
          .from(targetElement)
          .save()
          .then(() => {
            document.body.removeChild(iframe);
          });
      }, 500);
    } catch (error) {
      console.error("Gagal mengunduh PDF:", error);
      alert("Terjadi kesalahan internal saat membuat PDF.");
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-mute">
        <Loader2 className="w-8 h-8 animate-spin mb-3" />
        <p className="text-sm">Memuat laporan…</p>
      </div>
    );
  }

  if (errorMessage || !report) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center max-w-md mx-auto">
        <div className="w-14 h-14 rounded-full border border-hairline flex items-center justify-center mb-4 text-mute">
          <AlertCircle className="w-6 h-6" strokeWidth={1.5} />
        </div>
        <h3 className="font-display text-lg font-semibold text-ink mb-2">Laporan tidak ditemukan</h3>
        <p className="text-sm text-body mb-6">{errorMessage}</p>
        <Button onClick={() => router.push("/ai")}>
          <ArrowLeft className="w-4 h-4" /> Kembali ke AI Analis
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/ai")}
            className="w-9 h-9 flex items-center justify-center rounded-full border border-hairline text-charcoal hover:bg-surface-soft hover:text-ink transition-colors"
            title="Kembali"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="font-display text-2xl font-semibold text-ink">Laporan Analisis AI</h1>
            <p className="text-sm text-body mt-0.5 hidden sm:block">Hasil diagnosa keamanan & performa router.</p>
          </div>
        </div>

        {/* Aksi */}
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={handleDownloadPdf}>
            <Download className="w-4 h-4" /> <span className="hidden sm:inline">Unduh PDF</span>
          </Button>
          <Button variant="secondary" onClick={handleCopyResult} disabled={isCopied}>
            {isCopied ? <CheckCircle className="w-4 h-4 text-ok" /> : <Copy className="w-4 h-4" />}
            <span className="hidden sm:inline">{isCopied ? "Tersalin" : "Salin"}</span>
          </Button>
          <Button variant="danger" onClick={() => setIsDeleteOpen(true)}>
            <Trash2 className="w-4 h-4" /> <span className="hidden sm:inline">Hapus</span>
          </Button>
        </div>
      </div>

      {/* Kartu konten — gaya terminal-card */}
      <Card padded={false} className="overflow-hidden">
        {/* Header: traffic-lights + judul */}
        <div className="flex items-center gap-3 px-4 py-2.5 border-b border-hairline bg-surface-soft">
          <span className="w-3 h-3 rounded-full bg-terminal-red" />
          <span className="w-3 h-3 rounded-full bg-terminal-yellow" />
          <span className="w-3 h-3 rounded-full bg-terminal-green" />
          <span className="ml-2 text-xs text-mute font-mono truncate">
            ai-report — {report.server?.name || "router"}
          </span>
        </div>

        {/* Baris prompt mono — meta analisis */}
        <div className="px-5 sm:px-8 pt-5 font-mono text-[13px] leading-relaxed">
          <div className="text-ink">
            <span className="text-mute">$</span> ai analyze --target {report.server?.host || report.server?.name || "router"} --model {report.provider}
          </div>
          <div className="text-mute">
            # {new Date(report.createdAt).toLocaleString("id-ID", { dateStyle: "long", timeStyle: "short" })}
          </div>
          <div className="text-terminal-green">→ analisis selesai, hasil di bawah:</div>
        </div>

        {/* Markdown — styling Ollama netral */}
        <div className="p-5 sm:px-8 sm:pt-4 sm:pb-8 overflow-x-auto prose prose-sm sm:prose-base max-w-none prose-headings:font-display prose-headings:text-ink prose-p:text-body prose-strong:text-ink prose-li:text-body prose-a:text-ink prose-code:text-charcoal prose-code:font-mono prose-pre:bg-surface-soft prose-pre:border prose-pre:border-hairline prose-pre:rounded-[12px] prose-hr:border-hairline prose-blockquote:border-l-hairline-strong prose-blockquote:text-mute">
          <ReactMarkdown>{report.resultMd}</ReactMarkdown>
        </div>
      </Card>

      {/* Konfirmasi hapus */}
      <Modal
        open={isDeleteOpen}
        onClose={() => !isDeleting && setIsDeleteOpen(false)}
        title="Hapus laporan?"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsDeleteOpen(false)} disabled={isDeleting}>
              Batal
            </Button>
            <Button variant="danger" onClick={executeDelete} loading={isDeleting}>
              <Trash2 className="w-4 h-4" /> Hapus
            </Button>
          </>
        }
      >
        <p className="text-sm text-body leading-relaxed">Yakin hapus laporan analisis ini? Tindakan ini tak bisa dibatalkan.</p>
      </Modal>
    </div>
  );
}
