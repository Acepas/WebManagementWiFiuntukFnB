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
  Textarea,
  StatusDot,
  Badge,
  Banner,
  Modal,
  EmptyState,
} from "@/components/ui";
import {
  Plus,
  Users,
  Tag,
  Check,
  RefreshCw,
  Upload,
  Download,
  Trash2,
  ArrowRight,
  Settings,
  Server,
} from "lucide-react";

interface HotspotProfile {
  id: string;
  serverId: string;
  name: string;
  rateLimit: string;
  sessionTimeout: string | null;
  idleTimeout: string | null;
  sharedUsers: number;
  validity: string | null;
  description: string | null;
  syncedToRouter: boolean;
  createdAt: string;
  server?: { name: string };
}

const RATE_PRESETS = ["512k/1M", "1M/1M", "1M/2M", "2M/2M", "5M/5M"];

export default function ProfilesPage() {
  const { activeServerId, servers, fetchServers, syncVersion, syncActiveServer, isSyncing } = useServerStore();
  const [profiles, setProfiles] = useState<HotspotProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<HotspotProfile | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    rateLimit: "",
    sessionTimeout: "",
    idleTimeout: "",
    sharedUsers: 1,
    validity: "",
    description: "",
  });

  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const activeServer = servers.find((s) => s.id === activeServerId);

  // Load profil saat mount / ganti server / setelah sinkronisasi global (syncVersion naik)
  useEffect(() => {
    fetchServers();
    loadProfiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeServerId, fetchServers, syncVersion]);

  // Auto-hapus banner sukses agar tidak nempel
  useEffect(() => {
    if (!successMessage) return;
    const t = setTimeout(() => setSuccessMessage(""), 2500);
    return () => clearTimeout(t);
  }, [successMessage]);

  const loadProfiles = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get("/profiles");
      if (activeServerId) {
        setProfiles(response.data.filter((p: HotspotProfile) => p.serverId === activeServerId));
      } else {
        setProfiles([]);
      }
    } catch (error: any) {
      console.error("Failed to load profiles:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: name === "sharedUsers" ? parseInt(value) || 1 : value }));
  };

  const resetForm = () => {
    setFormData({ name: "", rateLimit: "1M/2M", sessionTimeout: "", idleTimeout: "", sharedUsers: 1, validity: "", description: "" });
    setErrorMessage("");
    setSuccessMessage("");
    setIsEditMode(false);
    setShowDeleteConfirm(false);
  };

  const openAddModal = () => {
    resetForm();
    setIsAddModalOpen(true);
  };

  const openDetailModal = (profile: HotspotProfile) => {
    resetForm();
    setSelectedProfile(profile);
    setFormData({
      name: profile.name,
      rateLimit: profile.rateLimit,
      sessionTimeout: profile.sessionTimeout || "",
      idleTimeout: profile.idleTimeout || "",
      sharedUsers: profile.sharedUsers,
      validity: profile.validity || "",
      description: profile.description || "",
    });
  };

  const closeModals = () => {
    setIsAddModalOpen(false);
    setSelectedProfile(null);
    resetForm();
  };

  // Impor profil dari router (empty-state CTA) — pakai sync global store
  const handleImportFromRouter = async () => {
    if (!activeServerId) return;
    const toast = useToastStore.getState();
    const result = await syncActiveServer(activeServerId);
    if (result) {
      const imported = (result.importedCount as number) ?? 0;
      toast.success(`Berhasil impor ${imported} profil dari router.`, "Impor berhasil");
    } else {
      toast.error("Gagal impor profil dari router. Cek koneksi.", "Impor gagal");
    }
  };

  const handleAddProfile = async (e?: React.SyntheticEvent) => {
    e?.preventDefault();
    if (!activeServerId) {
      setErrorMessage("Router aktif belum terdeteksi. Hubungkan router dulu.");
      return;
    }
    const nameRegex = /^[a-zA-Z0-9_-]+$/;
    if (!nameRegex.test(formData.name)) {
      setErrorMessage("Nama profil tanpa spasi (pakai underscore '_' atau dash '-').");
      return;
    }
    if (!formData.name || !formData.rateLimit) {
      setErrorMessage("Nama profil dan Rate Limit wajib diisi.");
      return;
    }

    setIsSaving(true);
    setErrorMessage("");
    setSuccessMessage("");
    try {
      const payload = {
        serverId: activeServerId,
        name: formData.name,
        rateLimit: formData.rateLimit,
        sessionTimeout: formData.sessionTimeout || undefined,
        idleTimeout: formData.idleTimeout || undefined,
        sharedUsers: formData.sharedUsers,
        validity: formData.validity || undefined,
        description: formData.description || undefined,
      };
      const response = await apiClient.post("/profiles", payload);
      if (response.data) {
        setSuccessMessage("Profil hotspot baru berhasil dibuat di router.");
        await loadProfiles();
        setTimeout(() => closeModals(), 1200);
      }
    } catch (error: any) {
      setErrorMessage(error.response?.data?.message || error.message || "Gagal membuat profil.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateProfile = async (e?: React.SyntheticEvent) => {
    e?.preventDefault();
    if (!selectedProfile) return;
    const nameRegex = /^[a-zA-Z0-9_-]+$/;
    if (!nameRegex.test(formData.name)) {
      setErrorMessage("Nama profil tanpa spasi (pakai '_' atau '-').");
      return;
    }
    if (!formData.name || !formData.rateLimit) {
      setErrorMessage("Nama dan Rate Limit wajib diisi.");
      return;
    }

    setIsSaving(true);
    setErrorMessage("");
    setSuccessMessage("");
    try {
      const payload = {
        name: formData.name,
        rateLimit: formData.rateLimit,
        sessionTimeout: formData.sessionTimeout || null,
        idleTimeout: formData.idleTimeout || null,
        sharedUsers: formData.sharedUsers,
        validity: formData.validity || null,
        description: formData.description || null,
      };
      const response = await apiClient.patch(`/profiles/${selectedProfile.id}`, payload);
      if (response.data) {
        setSuccessMessage("Profil hotspot berhasil diperbarui.");
        await loadProfiles();
        setIsEditMode(false);
        setSelectedProfile(response.data);
      }
    } catch (error: any) {
      setErrorMessage(error.response?.data?.message || error.message || "Gagal memperbarui profil.");
    } finally {
      setIsSaving(false);
    }
  };

  // Force-push profil ke router (kalau out of sync)
  const handleForceSyncProfile = async (profile: HotspotProfile) => {
    setIsSaving(true);
    setErrorMessage("");
    setSuccessMessage("");
    try {
      const payload = {
        name: profile.name,
        rateLimit: profile.rateLimit,
        sessionTimeout: profile.sessionTimeout,
        idleTimeout: profile.idleTimeout,
        sharedUsers: profile.sharedUsers,
        validity: profile.validity,
        description: profile.description,
      };
      await apiClient.patch(`/profiles/${profile.id}`, payload);
      setSuccessMessage("Profil berhasil di-push ulang ke router.");
      await loadProfiles();
      if (selectedProfile?.id === profile.id) {
        setSelectedProfile({ ...profile, syncedToRouter: true });
      }
    } catch (error: any) {
      setErrorMessage("Gagal sinkron ulang ke router: " + (error.message || "error"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProfile = async () => {
    if (!selectedProfile) return;
    setIsSaving(true);
    setErrorMessage("");
    try {
      await apiClient.delete(`/profiles/${selectedProfile.id}`);
      await loadProfiles();
      closeModals();
    } catch (error: any) {
      setErrorMessage(error.response?.data?.message || error.message || "Gagal menghapus profil.");
    } finally {
      setIsSaving(false);
    }
  };

  // ── Form fields (fungsi, bukan komponen — cegah remount input) ────────────
  const renderFormFields = () => (
    <div className="space-y-4">
      <div>
        <Label required>Nama Profil</Label>
        <Input name="name" value={formData.name} onChange={handleInputChange} placeholder="Paket_1_Jam (tanpa spasi)" mono />
        <p className="text-xs text-mute mt-1">Pakai underscore (_) atau dash (-) pengganti spasi.</p>
      </div>

      <div>
        <Label required>Rate Limit (Upload/Download)</Label>
        <Input name="rateLimit" value={formData.rateLimit} onChange={handleInputChange} placeholder="1M/2M" mono />
        <div className="flex flex-wrap gap-2 mt-2">
          {RATE_PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setFormData((prev) => ({ ...prev, rateLimit: preset }))}
              className={`px-3 py-1 rounded-full text-xs font-mono transition-colors ${
                formData.rateLimit === preset ? "bg-ink text-on-dark" : "bg-surface-soft text-charcoal border border-hairline hover:text-ink"
              }`}
            >
              {preset}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Shared Users</Label>
          <Input type="number" name="sharedUsers" min={1} max={100} value={formData.sharedUsers} onChange={handleInputChange} mono />
        </div>
        <div>
          <Label>Masa Aktif (Validity)</Label>
          <Input name="validity" value={formData.validity} onChange={handleInputChange} placeholder="1d, 12h, 30m" mono />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Session Timeout</Label>
          <Input name="sessionTimeout" value={formData.sessionTimeout} onChange={handleInputChange} placeholder="1h" mono />
        </div>
        <div>
          <Label>Idle Timeout</Label>
          <Input name="idleTimeout" value={formData.idleTimeout} onChange={handleInputChange} placeholder="5m" mono />
        </div>
      </div>

      <div>
        <Label>Deskripsi (opsional)</Label>
        <Textarea name="description" value={formData.description} onChange={handleInputChange} placeholder="Catatan singkat paket ini…" rows={2} />
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Profil Hotspot"
        description={
          activeServer
            ? `Kelola paket bandwidth & masa aktif di ${activeServer.name}.`
            : "Pilih router di header buat kelola profil hotspot."
        }
        action={
          activeServerId && profiles.length > 0 ? (
            <Button onClick={openAddModal}>
              <Plus className="w-4 h-4" /> Buat Profil
            </Button>
          ) : undefined
        }
      />

      {/* Konten */}
      {!activeServerId ? (
        <Card className="max-w-xl mx-auto">
          <EmptyState
            icon={Server}
            title="Router belum dipilih"
            description="Sistem berbasis multi-server. Pilih salah satu router di header dulu buat kelola profil hotspotnya."
          />
        </Card>
      ) : isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-44 rounded-[12px] border border-hairline bg-surface-soft animate-pulse" />
          ))}
        </div>
      ) : profiles.length === 0 ? (
        <Card className="max-w-xl mx-auto">
          <EmptyState
            icon={Settings}
            title="Belum ada profil di router ini"
            description="Voucher butuh profil buat tahu batas bandwidth & masa aktif. Impor profil bawaan router atau buat baru."
            action={
              <>
                <Button variant="secondary" onClick={handleImportFromRouter} loading={isSyncing}>
                  <RefreshCw className="w-4 h-4" /> Impor dari Router
                </Button>
                <Button onClick={openAddModal}>
                  Buat Profil <ArrowRight className="w-4 h-4" />
                </Button>
              </>
            }
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {profiles.map((profile) => {
            const isSynced = profile.syncedToRouter;
            const [up, down] = profile.rateLimit.split("/");
            return (
              <button
                key={profile.id}
                onClick={() => openDetailModal(profile)}
                className="text-left rounded-[12px] border border-hairline bg-canvas p-5 hover:border-hairline-strong transition-colors flex flex-col"
              >
                {/* Header kartu */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="min-w-0">
                    <h3 className="font-medium text-ink truncate">{profile.name}</h3>
                    <p className="text-xs text-mute truncate mt-0.5">
                      {profile.description || "Tanpa deskripsi"}
                    </p>
                  </div>
                  <Badge tone={isSynced ? "ok" : "danger"} dot>
                    {isSynced ? "Sinkron" : "Gagal"}
                  </Badge>
                </div>

                {/* Parameter */}
                <div className="grid grid-cols-2 gap-y-3 gap-x-2 py-3 border-y border-hairline text-sm">
                  <div className="col-span-2">
                    <span className="text-xs text-mute">Bandwidth</span>
                    <div className="flex items-center gap-1.5 text-ink font-medium font-mono mt-0.5">
                      <Upload className="w-3.5 h-3.5 text-mute" /> {up}
                      <span className="text-mute">/</span>
                      <Download className="w-3.5 h-3.5 text-mute" /> {down}
                    </div>
                  </div>
                  <div>
                    <span className="text-xs text-mute">Shared</span>
                    <div className="flex items-center gap-1.5 text-ink font-medium mt-0.5">
                      <Users className="w-3.5 h-3.5 text-mute" /> {profile.sharedUsers}
                    </div>
                  </div>
                  <div>
                    <span className="text-xs text-mute">Masa Aktif</span>
                    <div className="flex items-center gap-1.5 text-ink font-medium mt-0.5">
                      <Tag className="w-3.5 h-3.5 text-mute" /> {profile.validity || "—"}
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between mt-3 text-xs text-mute">
                  <span>Sesi: {profile.sessionTimeout || "Tanpa batas"}</span>
                  {!isSynced && (
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleForceSyncProfile(profile);
                      }}
                      className="inline-flex items-center gap-1 text-danger font-medium hover:underline cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" /> Perbaiki
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* ── Modal: Buat Profil ── */}
      <Modal
        open={isAddModalOpen}
        onClose={closeModals}
        title="Buat Profil Hotspot"
        subtitle={activeServer ? `Disimpan & disinkron ke ${activeServer.name}` : undefined}
        footer={
          <>
            <Button variant="secondary" onClick={closeModals} disabled={isSaving}>
              Batal
            </Button>
            <Button onClick={(e) => handleAddProfile(e)} loading={isSaving}>
              <Check className="w-4 h-4" /> Buat Profil
            </Button>
          </>
        }
      >
        <form onSubmit={handleAddProfile} className="space-y-4">
          {errorMessage && <Banner tone="error">{errorMessage}</Banner>}
          {successMessage && <Banner tone="success">{successMessage}</Banner>}
          {renderFormFields()}
        </form>
      </Modal>

      {/* ── Modal: Detail & Edit Profil ── */}
      <Modal
        open={!!selectedProfile}
        onClose={closeModals}
        title={isEditMode ? "Edit Profil Hotspot" : "Detail Profil"}
        subtitle={selectedProfile ? selectedProfile.name : undefined}
        footer={
          selectedProfile ? (
            <div className="flex items-center justify-between w-full">
              {!showDeleteConfirm ? (
                <Button variant="danger" onClick={() => setShowDeleteConfirm(true)} disabled={isSaving}>
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
                      }}
                    >
                      Edit Profil
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="secondary" onClick={() => { setIsEditMode(false); setErrorMessage(""); }} disabled={isSaving}>
                      Kembali
                    </Button>
                    <Button onClick={(e) => handleUpdateProfile(e)} loading={isSaving}>
                      <Check className="w-4 h-4" /> Simpan
                    </Button>
                  </>
                )}
              </div>
            </div>
          ) : undefined
        }
      >
        {selectedProfile && (
          <form onSubmit={(e) => { e.preventDefault(); if (isEditMode) handleUpdateProfile(e); }} className="space-y-4">
            {errorMessage && <Banner tone="error">{errorMessage}</Banner>}
            {successMessage && <Banner tone="success">{successMessage}</Banner>}

            {!isEditMode ? (
              <>
                {/* Status sinkronisasi */}
                <div className="flex items-center justify-between rounded-[12px] border border-hairline p-4">
                  <span className="inline-flex items-center gap-2 text-sm font-medium text-ink">
                    <StatusDot tone={selectedProfile.syncedToRouter ? "ok" : "danger"} pulse={!selectedProfile.syncedToRouter} />
                    {selectedProfile.syncedToRouter ? "Tersinkron di router" : "Gagal / tidak sinkron"}
                  </span>
                  {!selectedProfile.syncedToRouter && (
                    <Button variant="secondary" size="sm" onClick={() => handleForceSyncProfile(selectedProfile)} loading={isSaving}>
                      <RefreshCw className="w-3.5 h-3.5" /> Push ke Router
                    </Button>
                  )}
                </div>

                {/* Detail */}
                <div className="rounded-[12px] border border-hairline divide-y divide-hairline text-sm">
                  <DetailRow label="Nama" value={selectedProfile.name} mono />
                  <DetailRow label="Rate Limit" value={selectedProfile.rateLimit} mono />
                  <DetailRow label="Shared Users" value={`${selectedProfile.sharedUsers} perangkat`} />
                  <DetailRow label="Masa Aktif" value={selectedProfile.validity || "Tanpa batas"} />
                  <DetailRow label="Session Timeout" value={selectedProfile.sessionTimeout || "Tanpa batas"} />
                  <DetailRow label="Idle Timeout" value={selectedProfile.idleTimeout || "Tanpa batas"} />
                  <DetailRow label="Server" value={selectedProfile.server?.name || "MikroTik"} />
                  {selectedProfile.description && <DetailRow label="Deskripsi" value={selectedProfile.description} />}
                </div>
              </>
            ) : (
              <>
                <Banner tone="info">
                  Mengubah profil akan hapus profil lama di router & daftarkan baru (cegah duplikasi).
                </Banner>
                {renderFormFields()}
              </>
            )}

            {/* Konfirmasi hapus */}
            {showDeleteConfirm && (
              <Banner tone="error" className="items-start!">
                <div className="space-y-3">
                  <div>
                    <p className="font-medium text-ink">Hapus profil ini?</p>
                    <p className="text-xs text-body mt-0.5 leading-relaxed">
                      Profil dihapus dari database & router. Voucher yang pakai profil ini bisa gagal login.
                    </p>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="secondary" size="sm" onClick={() => setShowDeleteConfirm(false)}>
                      Batal
                    </Button>
                    <Button variant="danger" size="sm" onClick={handleDeleteProfile} loading={isSaving}>
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
