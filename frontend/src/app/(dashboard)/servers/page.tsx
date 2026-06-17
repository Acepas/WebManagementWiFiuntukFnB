"use client";

import { useServerStore } from "@/store/server-store";
import apiClient from "@/lib/api-client";
import { useEffect, useState } from "react";
import {
  Card,
  PageHeader,
  Button,
  Input,
  Label,
  StatusDot,
  Banner,
  Modal,
  EmptyState,
  TerminalCard,
} from "@/components/ui";
import {
  Plus,
  Server,
  Activity,
  Trash2,
  Check,
  Shield,
  ShieldAlert,
  ArrowRight,
} from "lucide-react";

interface ServerDetail {
  id: string;
  name: string;
  host: string;
  port: number;
  username: string;
  password?: string;
  useSSL: boolean;
  hotspotName?: string;
  dnsName?: string;
  lastStatus: string;
  lastCheckedAt?: string;
}

export default function ServersPage() {
  const { servers, activeServerId, setActiveServerId, fetchServers } = useServerStore();

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedServer, setSelectedServer] = useState<ServerDetail | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Form
  const [formData, setFormData] = useState({
    name: "",
    host: "",
    port: "",
    username: "",
    password: "",
    useSSL: false,
    hotspotName: "",
    dnsName: "",
  });

  // Verifikasi & loading
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; latency?: number; error?: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    fetchServers();
  }, [fetchServers]);

  // Auto-hapus banner sukses setelah 2.5 detik agar tidak nempel di mode detail
  // saat kembali / membuka Edit lagi.
  useEffect(() => {
    if (!successMessage) return;
    const t = setTimeout(() => setSuccessMessage(""), 2500);
    return () => clearTimeout(t);
  }, [successMessage]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const resetForm = () => {
    setFormData({ name: "", host: "", port: "", username: "", password: "", useSSL: false, hotspotName: "", dnsName: "" });
    setTestResult(null);
    setErrorMessage("");
    setSuccessMessage("");
    setIsEditMode(false);
    setShowDeleteConfirm(false);
  };

  const openAddModal = () => {
    resetForm();
    setIsAddModalOpen(true);
  };

  const openDetailModal = (server: any) => {
    resetForm();
    setSelectedServer(server);
    setFormData({
      name: server.name,
      host: server.host,
      port: server.port.toString(),
      username: server.username,
      password: "",
      useSSL: server.useSSL,
      hotspotName: server.hotspotName || "",
      dnsName: server.dnsName || "",
    });
  };

  const closeModals = () => {
    setIsAddModalOpen(false);
    setSelectedServer(null);
    resetForm();
  };

  // Test koneksi (draft / sebelum simpan)
  const testConnectionCustom = async () => {
    if (!formData.host || !formData.username) {
      setErrorMessage("Host IP dan Username harus diisi untuk uji koneksi.");
      return;
    }
    setIsTesting(true);
    setTestResult(null);
    setErrorMessage("");
    try {
      const response = await apiClient.post("/servers/test-connection-custom", {
        host: formData.host,
        port: formData.port ? parseInt(formData.port) : undefined,
        username: formData.username,
        password: formData.password,
        useSSL: formData.useSSL,
      });
      if (response.data.success) {
        setTestResult({ success: true, latency: response.data.latency });
      } else {
        setTestResult({ success: false, error: response.data.error || "Koneksi ditolak router MikroTik." });
      }
    } catch (error: any) {
      setTestResult({ success: false, error: error.response?.data?.message || error.message || "Gagal menghubungi router." });
    } finally {
      setIsTesting(false);
    }
  };

  // Test koneksi server existing
  const testConnectionExisting = async (serverId: string) => {
    setIsTesting(true);
    setTestResult(null);
    setErrorMessage("");
    try {
      const response = await apiClient.post(`/servers/${serverId}/test-connection`);
      if (response.data.success) {
        setTestResult({ success: true, latency: response.data.latency });
      } else {
        setTestResult({ success: false, error: response.data.error || "Koneksi terputus ke MikroTik." });
      }
      fetchServers();
    } catch (error: any) {
      setTestResult({ success: false, error: error.response?.data?.message || error.message || "Gagal menghubungi router." });
      fetchServers();
    } finally {
      setIsTesting(false);
    }
  };

  const handleAddServer = async (e?: React.SyntheticEvent) => {
    e?.preventDefault();
    if (!formData.name || !formData.host || !formData.username || !formData.password) {
      setErrorMessage("Semua kolom bertanda bintang (*) wajib diisi.");
      return;
    }
    setIsSaving(true);
    setErrorMessage("");
    setSuccessMessage("");
    try {
      const response = await apiClient.post("/servers", {
        name: formData.name,
        host: formData.host,
        port: formData.port ? parseInt(formData.port) : undefined,
        username: formData.username,
        password: formData.password,
        useSSL: formData.useSSL,
        hotspotName: formData.hotspotName || undefined,
        dnsName: formData.dnsName || undefined,
      });
      if (response.data) {
        setSuccessMessage("Router MikroTik baru berhasil didaftarkan.");
        await fetchServers();
        if (servers.length === 0) setActiveServerId(response.data.id);
        setTimeout(() => closeModals(), 1200);
      }
    } catch (error: any) {
      setErrorMessage(error.response?.data?.message || error.message || "Gagal menyimpan router.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateServer = async (e?: React.SyntheticEvent) => {
    e?.preventDefault();
    if (!selectedServer) return;
    if (!formData.name || !formData.host || !formData.username) {
      setErrorMessage("Nama, Host IP, dan Username wajib diisi.");
      return;
    }
    setIsSaving(true);
    setErrorMessage("");
    setSuccessMessage("");
    try {
      const payload: any = {
        name: formData.name,
        host: formData.host,
        port: formData.port ? parseInt(formData.port) : undefined,
        username: formData.username,
        useSSL: formData.useSSL,
        hotspotName: formData.hotspotName || undefined,
        dnsName: formData.dnsName || undefined,
      };
      if (formData.password.trim() !== "") payload.password = formData.password;

      const response = await apiClient.patch(`/servers/${selectedServer.id}`, payload);
      if (response.data) {
        setSuccessMessage("Perubahan data router berhasil disimpan.");
        await fetchServers();
        setIsEditMode(false);
        setSelectedServer(response.data);
        setTestResult(null);
      }
    } catch (error: any) {
      setErrorMessage(error.response?.data?.message || error.message || "Gagal memperbarui router.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteServer = async () => {
    if (!selectedServer) return;
    setIsSaving(true);
    setErrorMessage("");
    try {
      await apiClient.delete(`/servers/${selectedServer.id}`);
      await fetchServers();
      if (activeServerId === selectedServer.id) {
        const remaining = servers.filter((s) => s.id !== selectedServer.id);
        if (remaining.length > 0) {
          setActiveServerId(remaining[0].id);
        } else {
          if (typeof window !== "undefined") localStorage.removeItem("wifi_active_server_id");
          window.location.reload();
        }
      }
      closeModals();
    } catch (error: any) {
      setErrorMessage(error.response?.data?.message || error.message || "Gagal menghapus router.");
    } finally {
      setIsSaving(false);
    }
  };

  // ── Form fields (dipakai di modal Tambah & Edit) ──────────────────────────
  // Catatan: dipanggil sbg FUNGSI ({renderFormFields()}), BUKAN <Component/>,
  // agar React tidak me-remount input tiap render (fokus input tidak hilang).
  const renderFormFields = (edit = false) => (
    <div className="space-y-4">
      <div>
        <Label required={!edit}>Nama Router</Label>
        <Input name="name" value={formData.name} onChange={handleInputChange} placeholder="Contoh: Router Utama Kafe" required />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2">
          <Label required={!edit}>Host IP / Domain</Label>
          <Input name="host" value={formData.host} onChange={handleInputChange} placeholder="192.168.88.1" mono required />
        </div>
        <div>
          <Label>Port API</Label>
          <Input type="number" name="port" value={formData.port} onChange={handleInputChange} placeholder="Default" />
        </div>
      </div>

      <label className="flex items-center gap-2.5 cursor-pointer select-none">
        <input
          type="checkbox"
          name="useSSL"
          checked={formData.useSSL}
          onChange={handleInputChange}
          className="w-4 h-4 rounded border-hairline-strong accent-black cursor-pointer"
        />
        <span className="text-sm text-charcoal">Gunakan SSL (HTTPS) untuk koneksi aman</span>
      </label>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <Label required={!edit}>Username Admin</Label>
          <Input name="username" value={formData.username} onChange={handleInputChange} placeholder="admin" mono required />
        </div>
        <div>
          <Label required={!edit}>Password{edit && <span className="text-mute font-normal"> (isi jika diubah)</span>}</Label>
          <Input type="password" name="password" value={formData.password} onChange={handleInputChange} placeholder="••••••••" required={!edit} />
        </div>
      </div>

      {/* Data hotspot (opsional) */}
      <div className="flex items-center gap-3 pt-1">
        <div className="h-px flex-1 bg-hairline" />
        <span className="text-[11px] font-medium text-mute uppercase tracking-wide">Data Hotspot (opsional)</span>
        <div className="h-px flex-1 bg-hairline" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <Label>Hotspot Name</Label>
          <Input name="hotspotName" value={formData.hotspotName} onChange={handleInputChange} placeholder="hotspot1" mono />
          <p className="text-xs text-mute mt-1">IP › Hotspot › Servers › Name</p>
        </div>
        <div>
          <Label>DNS Name</Label>
          <Input name="dnsName" value={formData.dnsName} onChange={handleInputChange} placeholder="hotspot.wifi.com" mono />
          <p className="text-xs text-mute mt-1">DNS captive portal login</p>
        </div>
      </div>
    </div>
  );

  // Hasil test koneksi — gaya terminal-card minimalis (Ollama).
  const renderTestResult = () =>
    testResult ? (
      <TerminalCard className="mt-3">
        <div className="text-ink">
          <span className="text-mute">$</span> ping {formData.host || "router"}
        </div>
        {testResult.success ? (
          <>
            <div className="text-mute">Menghubungkan ke API MikroTik…</div>
            <div className="text-mute">
              Latensi: <span className="text-ink">{testResult.latency} ms</span>
            </div>
            <div className="text-terminal-green">→ koneksi terhubung, router siap dipakai</div>
          </>
        ) : (
          <>
            <div className="text-mute wrap-break-word">{testResult.error}</div>
            <div className="text-terminal-red">→ koneksi gagal</div>
          </>
        )}
      </TerminalCard>
    ) : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Server Router"
        description="Kelola koneksi multi-server MikroTik, uji latensi API, & atur kredensial."
        action={
          <Button onClick={openAddModal}>
            <Plus className="w-4 h-4" /> Daftarkan Router
          </Button>
        }
      />

      {/* Daftar */}
      {servers.length === 0 ? (
        <Card className="max-w-2xl mx-auto">
          <EmptyState
            icon={Server}
            title="Belum ada router terdaftar"
            description="Sistem mendukung multi-server MikroTik. Tambahkan router pertamamu buat mulai kelola voucher."
          />
          {/* Panduan setup */}
          <div className="rounded-[12px] border border-hairline p-5 text-left mt-2 space-y-3">
            <h4 className="text-sm font-medium text-ink">Panduan setup awal MikroTik (API):</h4>
            <ol className="text-xs text-body space-y-2 list-decimal list-inside leading-relaxed">
              <li>Aktifkan API di router (RouterOS v6/v7). Pastikan service <span className="font-mono text-charcoal">api</span> atau <span className="font-mono text-charcoal">api-ssl</span> nyala.</li>
              <li>Port API terjangkau dari sistem (default <span className="font-medium text-charcoal">8728</span> / SSL <span className="font-medium text-charcoal">8729</span>).</li>
              <li>Buat user admin MikroTik dengan hak <span className="font-medium text-charcoal">write</span> + <span className="font-medium text-charcoal">api</span>.</li>
              <li>Klik <span className="font-medium text-ink">Daftarkan Router</span>, isi detail, klik <span className="font-medium text-ink">Uji Koneksi</span>, lalu simpan.</li>
            </ol>
          </div>
          <div className="text-center mt-6">
            <Button onClick={openAddModal}>
              Mulai setup <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {servers.map((server) => {
            const isOnline = server.lastStatus === "ONLINE";
            const isOffline = server.lastStatus === "OFFLINE";
            const isActive = server.id === activeServerId;

            return (
              <button
                key={server.id}
                onClick={() => openDetailModal(server)}
                className={`text-left rounded-[12px] border bg-canvas p-5 transition-colors group ${
                  isActive ? "border-terminal-green" : "border-hairline hover:border-hairline-strong"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full border border-hairline flex items-center justify-center text-mute shrink-0">
                    <Server className="w-5 h-5" strokeWidth={1.75} />
                  </div>
                </div>

                <h3 className="font-medium text-ink truncate mt-3">{server.name}</h3>
                <p className="text-xs font-mono text-mute truncate mt-0.5">
                  {server.host}:{server.port}
                </p>

                {/* Footer status */}
                <div className="flex items-center justify-between border-t border-hairline mt-4 pt-3">
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-charcoal">
                    <StatusDot tone={isOnline ? "ok" : isOffline ? "danger" : "neutral"} pulse={!isOnline && !isOffline} />
                    {isOnline ? "Online" : isOffline ? "Offline" : "Unknown"}
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs text-mute">
                    {server.useSSL ? (
                      <>
                        <Shield className="w-3.5 h-3.5" /> SSL
                      </>
                    ) : (
                      <>
                        <ShieldAlert className="w-3.5 h-3.5" /> HTTP
                      </>
                    )}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* ── Modal: Daftar Router Baru ── */}
      <Modal
        open={isAddModalOpen}
        onClose={closeModals}
        title="Daftarkan Router MikroTik"
        subtitle="Hubungkan sistem ke API MikroTik"
        footer={
          <>
            <Button variant="secondary" onClick={closeModals} disabled={isSaving}>
              Batal
            </Button>
            <Button onClick={(e) => handleAddServer(e)} loading={isSaving} disabled={isTesting}>
              <Check className="w-4 h-4" /> Simpan Router
            </Button>
          </>
        }
      >
        <form id="add-server-form" onSubmit={handleAddServer} className="space-y-4">
          {errorMessage && <Banner tone="error">{errorMessage}</Banner>}
          {successMessage && <Banner tone="success">{successMessage}</Banner>}
          {renderTestResult()}
          <Button
            type="button"
            variant="secondary"
            className="w-full"
            onClick={testConnectionCustom}
            loading={isTesting}
            disabled={isSaving}
          >
            <Activity className="w-4 h-4" /> {isTesting ? "Menguji koneksi…" : "Uji Koneksi"}
          </Button>
          {renderFormFields()}
        </form>
      </Modal>

      {/* ── Modal: Detail & Edit Router ── */}
      <Modal
        open={!!selectedServer}
        onClose={closeModals}
        title={isEditMode ? "Edit Data Router" : "Detail Router"}
        subtitle={selectedServer ? `ID: ${selectedServer.id}` : undefined}
        footer={
          selectedServer ? (
            <div className="flex items-center justify-between w-full">
              {!showDeleteConfirm ? (
                <Button variant="danger" size="md" onClick={() => setShowDeleteConfirm(true)} disabled={isSaving || isTesting}>
                  <Trash2 className="w-4 h-4" /> Hapus
                </Button>
              ) : (
                <div />
              )}
              <div className="flex gap-3">
                {!isEditMode ? (
                  <>
                    <Button variant="secondary" onClick={closeModals}>
                      Tutup
                    </Button>
                    <Button
                      onClick={() => {
                        setIsEditMode(true);
                        setSuccessMessage("");
                        setErrorMessage("");
                        setTestResult(null);
                      }}
                    >
                      Edit Router
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setIsEditMode(false);
                        setTestResult(null);
                        setErrorMessage("");
                      }}
                      disabled={isSaving}
                    >
                      Kembali
                    </Button>
                    <Button onClick={(e) => handleUpdateServer(e)} loading={isSaving} disabled={isTesting}>
                      <Check className="w-4 h-4" /> Simpan
                    </Button>
                  </>
                )}
              </div>
            </div>
          ) : undefined
        }
      >
        {selectedServer && (
          <form id="edit-server-form" onSubmit={(e) => { e.preventDefault(); if (isEditMode) handleUpdateServer(e); }} className="space-y-4">
            {errorMessage && <Banner tone="error">{errorMessage}</Banner>}
            {successMessage && <Banner tone="success">{successMessage}</Banner>}

            {!isEditMode ? (
              <>
                {/* Status + ping ulang */}
                <div className="flex items-center justify-between rounded-[12px] border border-hairline p-4">
                  <span className="inline-flex items-center gap-2 text-sm font-medium text-ink">
                    <StatusDot tone={selectedServer.lastStatus === "ONLINE" ? "ok" : "danger"} pulse={selectedServer.lastStatus !== "ONLINE"} />
                    {selectedServer.lastStatus === "ONLINE" ? "Online / Terhubung" : "Offline / Terputus"}
                  </span>
                  <Button variant="secondary" size="sm" onClick={() => testConnectionExisting(selectedServer.id)} loading={isTesting}>
                    <Activity className="w-3.5 h-3.5" /> Ping ulang
                  </Button>
                </div>

                {/* Hasil ping tepat di bawah tombol */}
                {renderTestResult()}

                {/* Detail grid */}
                <div className="rounded-[12px] border border-hairline divide-y divide-hairline text-sm">
                  <DetailRow label="Nama" value={selectedServer.name} />
                  <DetailRow label="Host" value={`${selectedServer.host}`} mono />
                  <DetailRow label="Port API" value={String(selectedServer.port)} />
                  <DetailRow
                    label="Keamanan"
                    value={selectedServer.useSSL ? "SSL (HTTPS)" : "Plain (HTTP)"}
                  />
                  <DetailRow label="Username" value={selectedServer.username} mono />
                  {selectedServer.hotspotName && <DetailRow label="Hotspot Name" value={selectedServer.hotspotName} mono />}
                  {selectedServer.dnsName && <DetailRow label="DNS Name" value={selectedServer.dnsName} mono />}
                  {selectedServer.lastCheckedAt && (
                    <DetailRow label="Terakhir dicek" value={new Date(selectedServer.lastCheckedAt).toLocaleString("id-ID")} />
                  )}
                </div>
              </>
            ) : (
              <>
                <Banner tone="info">
                  Mengubah host/kredensial yang salah bisa memutus integrasi. Uji koneksi dulu sebelum simpan.
                </Banner>
                {renderTestResult()}
                <Button type="button" variant="secondary" className="w-full" onClick={testConnectionCustom} loading={isTesting} disabled={isSaving}>
                  <Activity className="w-4 h-4" /> {isTesting ? "Menguji…" : "Uji Koneksi Data Baru"}
                </Button>
                {renderFormFields(true)}
              </>
            )}

            {/* Konfirmasi hapus */}
            {showDeleteConfirm && (
              <Banner tone="error" className="items-start!">
                <div className="space-y-3">
                  <div>
                    <p className="font-medium text-ink">Hapus router ini?</p>
                    <p className="text-xs text-body mt-0.5 leading-relaxed">
                      Tindakan ini tak bisa dibatalkan. Monitoring & manajemen voucher untuk outlet ini akan berhenti.
                    </p>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="secondary" size="sm" onClick={() => setShowDeleteConfirm(false)}>
                      Batal
                    </Button>
                    <Button variant="danger" size="sm" onClick={handleDeleteServer} loading={isSaving}>
                      <Trash2 className="w-3.5 h-3.5" /> Ya, hapus
                    </Button>
                  </div>
                </div>
              </Banner>
            )}
          </form>
        )}
      </Modal>
    </div>
  );
}

// Baris detail read-only
function DetailRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-2.5">
      <span className="text-mute shrink-0">{label}</span>
      <span className={`text-ink font-medium truncate text-right ${mono ? "font-mono" : ""}`} title={value}>
        {value}
      </span>
    </div>
  );
}
