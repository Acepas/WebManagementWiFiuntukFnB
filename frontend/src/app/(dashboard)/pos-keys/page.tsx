"use client";

import { useServerStore } from "@/store/server-store";
import { useToastStore } from "@/store/toast-store";
import apiClient from "@/lib/api-client";
import { useEffect, useState } from "react";
import {
  Card,
  PageHeader,
  Button,
  Input,
  Label,
  Select,
  Badge,
  StatusDot,
  Banner,
  Modal,
  EmptyState,
  TerminalCard,
} from "@/components/ui";
import { KeyRound, Trash2, Copy, Check, Server, Power, BookOpen } from "lucide-react";
import { PosApiDocs } from "./PosApiDocs";

interface PosKey {
  id: string;
  label: string;
  serverId: string;
  serverName: string;
  maskedKey: string;
  isActive: boolean;
  lastUsedAt: string | null;
  createdAt: string;
}

export default function PosKeysPage() {
  const { servers, fetchServers } = useServerStore();
  const [keys, setKeys] = useState<PosKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Buat key
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [serverId, setServerId] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [newKey, setNewKey] = useState<string | null>(null); // key mentah hasil create

  // Hapus
  const [deleteTarget, setDeleteTarget] = useState<PosKey | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [copied, setCopied] = useState<string | null>(null);
  const [tab, setTab] = useState<"keys" | "docs">("keys");

  useEffect(() => {
    fetchServers();
    loadKeys();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchServers]);

  const loadKeys = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get("/pos-keys");
      setKeys(res.data);
    } catch (error: any) {
      console.error("Failed to load POS keys:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const copyText = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 1500);
  };

  const openCreate = () => {
    setLabel("");
    setServerId(servers[0]?.id ?? "");
    setErrorMessage("");
    setNewKey(null);
    setIsCreateOpen(true);
  };

  const handleCreate = async (e?: React.SyntheticEvent) => {
    e?.preventDefault();
    if (!label.trim()) return setErrorMessage("Label outlet wajib diisi.");
    if (!serverId) return setErrorMessage("Pilih server tujuan dulu.");

    setIsSaving(true);
    setErrorMessage("");
    try {
      const res = await apiClient.post("/pos-keys", { label: label.trim(), serverId });
      setNewKey(res.data.key); // tampil sekali
      await loadKeys();
    } catch (error: any) {
      setErrorMessage(error.response?.data?.message || error.message || "Gagal membuat API key.");
    } finally {
      setIsSaving(false);
    }
  };

  const toggleActive = async (k: PosKey) => {
    const toast = useToastStore.getState();
    try {
      await apiClient.patch(`/pos-keys/${k.id}`, { isActive: !k.isActive });
      await loadKeys();
      toast.success(`API key "${k.label}" ${k.isActive ? "dinonaktifkan" : "diaktifkan"}.`, "Status diperbarui");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Gagal ubah status.", "Gagal");
    }
  };

  const executeDelete = async () => {
    if (!deleteTarget) return;
    const toast = useToastStore.getState();
    setIsDeleting(true);
    try {
      await apiClient.delete(`/pos-keys/${deleteTarget.id}`);
      await loadKeys();
      toast.success(`API key "${deleteTarget.label}" dihapus.`, "Berhasil dihapus");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Gagal menghapus key.", "Gagal");
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Integrasi POS"
        description="Hubungkan mesin kasir (POS) ke sistem. Kelola API key & baca dokumentasi API di sini."
        action={
          tab === "keys" && servers.length > 0 ? (
            <Button onClick={openCreate} className="group gap-2">
              <KeyRound className="w-4 h-4 group-hover:animate-[key-turn_0.6s_ease]" />
              Buat API Key
            </Button>
          ) : undefined
        }
      />

      {/* Tab bar */}
      <div className="flex items-center gap-1 border-b border-hairline">
        {[
          { id: "keys" as const, label: "Kelola Key", icon: KeyRound },
          { id: "docs" as const, label: "Dokumentasi API", icon: BookOpen },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t.id ? "border-ink text-ink" : "border-transparent text-mute hover:text-ink"
            }`}
          >
            <t.icon className="w-4 h-4" strokeWidth={1.75} />
            {t.label}
          </button>
        ))}
      </div>

      {tab === "docs" ? (
        <PosApiDocs />
      ) : (
      <>
      {/* List API key */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-20 rounded-[12px] border border-hairline bg-surface-soft animate-pulse" />
          ))}
        </div>
      ) : servers.length === 0 ? (
        <Card className="max-w-xl mx-auto">
          <EmptyState
            icon={Server}
            title="Belum ada server"
            description="Daftarkan router MikroTik dulu sebelum bikin API key POS (key harus terikat ke server)."
            action={
              <a href="/servers">
                <Button>Ke Server</Button>
              </a>
            }
          />
        </Card>
      ) : keys.length === 0 ? (
        <Card className="max-w-xl mx-auto">
          <EmptyState
            icon={KeyRound}
            title="Belum ada API key"
            description="Buat API key lewat tombol di atas untuk menghubungkan mesin kasir (POS) ke sistem. Key terikat ke 1 outlet/server."
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {keys.map((k) => (
            <Card key={k.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full border border-hairline flex items-center justify-center text-mute shrink-0">
                  <KeyRound className="w-5 h-5" strokeWidth={1.75} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-ink truncate">{k.label}</h3>
                    <Badge tone={k.isActive ? "ok" : "neutral"} dot>
                      {k.isActive ? "Aktif" : "Nonaktif"}
                    </Badge>
                  </div>
                  <p className="text-xs text-mute mt-0.5">
                    <span className="font-mono">{k.maskedKey}</span> · server: {k.serverName}
                  </p>
                  <p className="text-xs text-mute">
                    {k.lastUsedAt
                      ? `Terakhir dipakai ${new Date(k.lastUsedAt).toLocaleString("id-ID", { dateStyle: "short", timeStyle: "short" })}`
                      : "Belum pernah dipakai"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                <Button variant="secondary" size="sm" onClick={() => toggleActive(k)}>
                  <Power className="w-3.5 h-3.5" /> {k.isActive ? "Nonaktifkan" : "Aktifkan"}
                </Button>
                <button
                  onClick={() => setDeleteTarget(k)}
                  className="w-8 h-8 flex items-center justify-center rounded-full border border-hairline text-danger hover:bg-error-container transition-colors"
                  title="Hapus key"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
      </>
      )}

      {/* Modal: Buat key */}
      <Modal
        open={isCreateOpen}
        onClose={() => !isSaving && setIsCreateOpen(false)}
        title="Buat API Key POS"
        subtitle="Key terikat ke 1 server/outlet"
        footer={
          newKey ? (
            <Button onClick={() => setIsCreateOpen(false)}>Selesai</Button>
          ) : (
            <>
              <Button variant="secondary" onClick={() => setIsCreateOpen(false)} disabled={isSaving}>
                Batal
              </Button>
              <Button onClick={(e) => handleCreate(e)} loading={isSaving}>
                <KeyRound className="w-4 h-4" /> Buat
              </Button>
            </>
          )
        }
      >
        {newKey ? (
          // Tampil key mentah SEKALI
          <div className="space-y-4">
            <Banner tone="success">
              API key berhasil dibuat. <span className="font-medium text-ink">Salin sekarang</span> — key mentah tak akan ditampilkan lagi.
            </Banner>
            <TerminalCard title="x-api-key">
              <div className="flex items-center justify-between gap-2">
                <span className="text-ink break-all">{newKey}</span>
              </div>
            </TerminalCard>
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => copyText(newKey, "newkey")}
            >
              {copied === "newkey" ? <Check className="w-4 h-4 text-ok" /> : <Copy className="w-4 h-4" />}
              {copied === "newkey" ? "Tersalin!" : "Salin API Key"}
            </Button>
          </div>
        ) : (
          <form onSubmit={handleCreate} className="space-y-4">
            {errorMessage && <Banner tone="error">{errorMessage}</Banner>}
            <div>
              <Label required>Label / Nama Outlet</Label>
              <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Outlet A" />
            </div>
            <div>
              <Label required>Server / Router Tujuan</Label>
              <Select value={serverId} onChange={(e) => setServerId(e.target.value)}>
                <option value="" disabled>Pilih server…</option>
                {servers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.host})
                  </option>
                ))}
              </Select>
              <p className="text-xs text-mute mt-1">Key hanya bisa akses server ini (isolasi antar outlet).</p>
            </div>
          </form>
        )}
      </Modal>

      {/* Modal: Hapus */}
      <Modal
        open={!!deleteTarget}
        onClose={() => !isDeleting && setDeleteTarget(null)}
        title="Hapus API key?"
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
          Hapus API key <span className="font-medium text-ink">{deleteTarget?.label}</span>? POS yang pakai
          key ini akan langsung kehilangan akses. Tindakan ini tak bisa dibatalkan.
        </p>
      </Modal>
    </div>
  );
}
