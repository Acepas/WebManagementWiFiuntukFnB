"use client";

import { useServerStore } from "@/store/server-store";
import { useToastStore } from "@/store/toast-store";
import apiClient from "@/lib/api-client";
import { useEffect, useState, useMemo } from "react";
import {
  Card,
  PageHeader,
  Button,
  Input,
  Label,
  Select,
  StatusDot,
  Badge,
  Banner,
  Modal,
  EmptyState,
} from "@/components/ui";
import {
  Plus,
  Ticket,
  Download,
  Search,
  Clock,
  Loader2,
  CheckCircle,
  Printer,
  Settings,
  ArrowRight,
  Type,
  Hash,
  Shuffle,
  ChevronRight,
  ChevronLeft,
  Trash2,
} from "lucide-react";

interface VoucherProfile {
  name: string;
  rateLimit: string;
  validity: string | null;
}

interface Voucher {
  id: string;
  serverId: string;
  profileId: string;
  username: string;
  password: string;
  status: "UNUSED" | "USED" | "REVOKED" | "EXPIRED";
  batchId: string | null;
  outletName: string | null;
  usedAt: string | null;
  expiredAt: string | null;
  createdAt: string;
  profile?: VoucherProfile;
  server?: { name: string };
}

interface HotspotProfile {
  id: string;
  serverId: string;
  name: string;
  rateLimit: string;
  validity: string | null;
}

type CharFormat = "UPPERCASE" | "LOWERCASE" | "MIXED_CASE" | "LETTERS_ONLY" | "NUMBERS_ONLY" | "ALPHANUMERIC";

const charFormatOptions: { value: CharFormat; label: string; description: string; preview: string; icon: React.ReactNode }[] = [
  { value: "UPPERCASE", label: "Huruf Besar", description: "A–Z", preview: "KAFE-WXBZ", icon: <span className="text-xs font-bold">AA</span> },
  { value: "LOWERCASE", label: "Huruf Kecil", description: "a–z", preview: "kafe-wxbz", icon: <span className="text-xs font-bold">aa</span> },
  { value: "MIXED_CASE", label: "Campur Besar/Kecil", description: "Acak", preview: "KaFe-WxBz", icon: <span className="text-xs font-bold">Aa</span> },
  { value: "LETTERS_ONLY", label: "Huruf Saja", description: "Tanpa angka", preview: "ABCXYZ", icon: <Type className="w-3.5 h-3.5" /> },
  { value: "NUMBERS_ONLY", label: "Angka Saja", description: "0–9", preview: "284739", icon: <Hash className="w-3.5 h-3.5" /> },
  { value: "ALPHANUMERIC", label: "Huruf + Angka", description: "Campuran", preview: "K4F3-8W2Z", icon: <Shuffle className="w-3.5 h-3.5" /> },
];

const STATUS_META: Record<Voucher["status"], { tone: "ok" | "warn" | "danger" | "neutral"; label: string }> = {
  UNUSED: { tone: "warn", label: "Belum dipakai" },
  USED: { tone: "ok", label: "Terpakai" },
  EXPIRED: { tone: "danger", label: "Kedaluwarsa" },
  REVOKED: { tone: "neutral", label: "Dicabut" },
};

export default function VouchersPage() {
  const { activeServerId, servers, fetchServers, syncVersion } = useServerStore();
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [profiles, setProfiles] = useState<HotspotProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [generatorTab, setGeneratorTab] = useState<"single" | "batch">("single");

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [profileFilter, setProfileFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);

  const [singleForm, setSingleForm] = useState({ profileId: "", username: "", password: "", outletName: "" });
  const [batchForm, setBatchForm] = useState({
    profileId: "",
    count: 50,
    usernamePrefix: "",
    charLength: 6,
    charFormat: "UPPERCASE" as CharFormat,
    outletName: "",
  });

  const [isBatchProcessing, setIsBatchProcessing] = useState(false);
  const [batchProcessingInfo, setBatchProcessingInfo] = useState<{ count: number; profileName: string; batchId: string | null; done: boolean } | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [latestBatchId, setLatestBatchId] = useState<string | null>(null);

  const activeServer = servers.find((s) => s.id === activeServerId);

  useEffect(() => {
    fetchServers();
    loadVouchers();
    loadProfiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeServerId, fetchServers, syncVersion]);

  useEffect(() => {
    setCurrentPage(1);
    setSelectedIds([]);
  }, [searchQuery, statusFilter, profileFilter, itemsPerPage]);

  const loadVouchers = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get("/vouchers");
      if (activeServerId) {
        setVouchers(response.data.filter((v: Voucher) => v.serverId === activeServerId));
      } else {
        setVouchers([]);
      }
    } catch (error: any) {
      console.error("Failed to load vouchers:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadProfiles = async () => {
    try {
      const response = await apiClient.get("/profiles");
      if (activeServerId) {
        const filtered = response.data.filter((p: HotspotProfile) => p.serverId === activeServerId);
        setProfiles(filtered);
        if (filtered.length > 0) {
          setSingleForm((prev) => ({ ...prev, profileId: filtered[0].id }));
          setBatchForm((prev) => ({ ...prev, profileId: filtered[0].id }));
        }
      } else {
        setProfiles([]);
      }
    } catch (error: any) {
      console.error("Failed to load profiles:", error);
    }
  };

  const executeDelete = async () => {
    const toast = useToastStore.getState();
    setIsDeleting(true);
    try {
      const response = await apiClient.post("/vouchers/delete-bulk", { ids: deleteTarget });
      const data = response.data;
      setSelectedIds([]);
      await loadVouchers();
      setIsDeleteModalOpen(false);
      if (data?.failedCount && data.failedCount > 0) {
        toast.warning(
          `${data.deletedCount} voucher terhapus, ${data.failedCount} gagal dihapus di router dan tetap tersimpan.`,
          "Sebagian gagal dihapus",
        );
      } else {
        toast.success(`${data?.deletedCount ?? deleteTarget.length} voucher berhasil dihapus.`, "Berhasil dihapus");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.message || "Gagal menghapus voucher.", "Gagal menghapus");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSingleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setSingleForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleBatchInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setBatchForm((prev) => ({ ...prev, [name]: name === "count" || name === "charLength" ? parseInt(value) || 0 : value }));
  };

  const resetForm = () => {
    setSingleForm({ profileId: profiles[0]?.id || "", username: "", password: "", outletName: activeServer?.name || "" });
    setBatchForm({ profileId: profiles[0]?.id || "", count: 50, usernamePrefix: "", charLength: 6, charFormat: "UPPERCASE", outletName: activeServer?.name || "" });
    setErrorMessage("");
    setSuccessMessage("");
    setLatestBatchId(null);
  };

  const openAddModal = () => {
    resetForm();
    setIsAddModalOpen(true);
  };

  const closeAddModal = () => {
    setIsAddModalOpen(false);
    resetForm();
  };

  const handleGenerateSingle = async (e?: React.SyntheticEvent) => {
    e?.preventDefault();
    if (!activeServerId) return setErrorMessage("Pilih router aktif dulu.");
    if (!singleForm.profileId) return setErrorMessage("Profil hotspot wajib dipilih.");

    setIsSaving(true);
    setErrorMessage("");
    setSuccessMessage("");
    try {
      const response = await apiClient.post("/vouchers/single", {
        serverId: activeServerId,
        profileId: singleForm.profileId,
        username: singleForm.username || undefined,
        password: singleForm.password || undefined,
        outletName: singleForm.outletName || undefined,
      });
      if (response.data) {
        setSuccessMessage(`Voucher "${response.data.username}" berhasil dibuat.`);
        await loadVouchers();
        setTimeout(() => closeAddModal(), 1200);
      }
    } catch (error: any) {
      setErrorMessage(error.response?.data?.message || error.message || "Gagal membuat voucher.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerateBatch = async (e?: React.SyntheticEvent) => {
    e?.preventDefault();
    if (!activeServerId) return setErrorMessage("Pilih router aktif dulu.");
    if (!batchForm.profileId) return setErrorMessage("Profil hotspot wajib dipilih.");
    if (batchForm.count < 1 || batchForm.count > 200) return setErrorMessage("Jumlah voucher 1–200 per batch.");

    const selectedProfileName = profiles.find((p) => p.id === batchForm.profileId)?.name || "Unknown";

    setIsBatchProcessing(true);
    setBatchProcessingInfo({ count: batchForm.count, profileName: selectedProfileName, batchId: null, done: false });
    setIsAddModalOpen(false);

    setIsSaving(true);
    setErrorMessage("");
    setSuccessMessage("");
    setLatestBatchId(null);
    try {
      const response = await apiClient.post("/vouchers/batch", {
        serverId: activeServerId,
        profileId: batchForm.profileId,
        count: batchForm.count,
        usernamePrefix: batchForm.usernamePrefix || undefined,
        charLength: batchForm.charLength || undefined,
        charFormat: batchForm.charFormat || undefined,
        outletName: batchForm.outletName || undefined,
      });
      if (response.data) {
        const { batchId } = response.data;
        setLatestBatchId(batchId);
        setBatchProcessingInfo((prev) => (prev ? { ...prev, batchId, done: true } : null));
        await loadVouchers();
      }
    } catch (error: any) {
      setIsBatchProcessing(false);
      setBatchProcessingInfo(null);
      setIsAddModalOpen(true);
      setGeneratorTab("batch");
      setErrorMessage(error.response?.data?.message || error.message || "Gagal membuat batch voucher.");
    } finally {
      setIsSaving(false);
    }
  };

  const closeBatchProcessingPopup = () => {
    setIsBatchProcessing(false);
    setBatchProcessingInfo(null);
  };

  const filteredVouchers = useMemo(() => {
    return vouchers.filter((v) => {
      if (searchQuery && !v.username.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (statusFilter !== "ALL" && v.status !== statusFilter) return false;
      if (profileFilter !== "ALL" && v.profileId !== profileFilter) return false;
      return true;
    });
  }, [vouchers, searchQuery, statusFilter, profileFilter]);

  const stats = useMemo(() => {
    const matching = vouchers.filter((v) => profileFilter === "ALL" || v.profileId === profileFilter);
    return {
      total: matching.length,
      unused: matching.filter((v) => v.status === "UNUSED").length,
      used: matching.filter((v) => v.status === "USED").length,
    };
  }, [vouchers, profileFilter]);

  const totalPages = Math.ceil(filteredVouchers.length / itemsPerPage);
  const paginatedVouchers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredVouchers.slice(start, start + itemsPerPage);
  }, [filteredVouchers, currentPage, itemsPerPage]);

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);
      if (currentPage <= 2) end = 3;
      else if (currentPage >= totalPages - 1) start = totalPages - 2;
      if (start > 2) pages.push("e1");
      for (let i = start; i <= end; i++) pages.push(i);
      if (end < totalPages - 1) pages.push("e2");
      pages.push(totalPages);
    }
    return pages;
  };

  const toggleSelectAll = () => {
    const unused = paginatedVouchers.filter((v) => v.status === "UNUSED").map((v) => v.id);
    if (unused.length === 0) return;
    const allSel = unused.every((id) => selectedIds.includes(id));
    if (allSel) setSelectedIds((prev) => prev.filter((id) => !unused.includes(id)));
    else setSelectedIds((prev) => Array.from(new Set([...prev, ...unused])));
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const confirmDelete = (ids: string[]) => {
    setDeleteTarget(ids);
    setIsDeleteModalOpen(true);
  };

  const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4100/api";
  const getPdfBatchUrl = (id: string) => `${API_BASE}/vouchers/pdf/batch/${id}`;
  const getPdfSingleUrl = (id: string) => `${API_BASE}/vouchers/pdf/single/${id}`;
  const getPdfFilteredUrl = () => `${API_BASE}/vouchers/pdf/filtered?serverId=${activeServerId}&profileId=${profileFilter}&status=${statusFilter}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Voucher Hotspot"
        description={activeServer ? `Buat voucher instan & massal di ${activeServer.name}.` : "Pilih router di header buat kelola voucher."}
        action={
          activeServerId && profiles.length > 0 ? (
            <Button onClick={openAddModal}>
              <Plus className="w-4 h-4" /> Buat Voucher
            </Button>
          ) : undefined
        }
      />

      {/* Summary */}
      {activeServerId && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <SummaryCard icon={Ticket} label="Total Voucher" value={stats.total} />
          <SummaryCard icon={Clock} label="Belum Dipakai" value={stats.unused} />
          <SummaryCard icon={CheckCircle} label="Terpakai" value={stats.used} />
        </div>
      )}

      {/* Konten */}
      {!activeServerId ? (
        <Card className="max-w-xl mx-auto">
          <EmptyState icon={Ticket} title="Router belum dipilih" description="Voucher dibuat per router. Pilih salah satu router di header dulu." />
        </Card>
      ) : profiles.length === 0 ? (
        <Card className="max-w-xl mx-auto">
          <EmptyState
            icon={Settings}
            title="Profil hotspot belum ada"
            description="Voucher butuh profil (kecepatan + masa aktif). Buat profil dulu sebelum bikin voucher."
            action={
              <a href="/profiles">
                <Button>
                  Atur Profil <ArrowRight className="w-4 h-4" />
                </Button>
              </a>
            }
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Filter bar */}
          <Card padded={false} className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-mute absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Cari kode voucher…" className="pl-10" />
              </div>
              <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="ALL">Semua status</option>
                <option value="UNUSED">Belum dipakai</option>
                <option value="USED">Terpakai</option>
                <option value="EXPIRED">Kedaluwarsa</option>
                <option value="REVOKED">Dicabut</option>
              </Select>
              <Select value={profileFilter} onChange={(e) => setProfileFilter(e.target.value)}>
                <option value="ALL">Semua paket</option>
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.rateLimit})
                  </option>
                ))}
              </Select>
              <div className="flex items-center gap-2">
                {selectedIds.length > 0 && (
                  <Button variant="danger" className="flex-1" onClick={() => confirmDelete(selectedIds)}>
                    <Trash2 className="w-4 h-4" /> Hapus ({selectedIds.length})
                  </Button>
                )}
                <a href={getPdfFilteredUrl()} target="_blank" rel="noreferrer" className="flex-1">
                  <Button variant="secondary" className="w-full">
                    <Printer className="w-4 h-4" /> Cetak Semua
                  </Button>
                </a>
              </div>
            </div>
          </Card>

          {/* Tabel */}
          <Card padded={false} className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead className="bg-surface-soft text-mute font-medium text-xs border-b border-hairline">
                  <tr>
                    <th className="p-4 w-12 text-center">
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded border-hairline-strong accent-black cursor-pointer disabled:opacity-40"
                        onChange={toggleSelectAll}
                        disabled={paginatedVouchers.filter((v) => v.status === "UNUSED").length === 0}
                        checked={
                          paginatedVouchers.filter((v) => v.status === "UNUSED").length > 0 &&
                          paginatedVouchers.filter((v) => v.status === "UNUSED").every((v) => selectedIds.includes(v.id))
                        }
                      />
                    </th>
                    <th className="p-4">Kode</th>
                    <th className="p-4">Password</th>
                    <th className="p-4">Paket</th>
                    <th className="p-4">Outlet</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Dibuat</th>
                    <th className="p-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline text-ink">
                  {isLoading ? (
                    <tr>
                      <td colSpan={8} className="p-12 text-center text-mute">
                        <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                        Memuat voucher…
                      </td>
                    </tr>
                  ) : paginatedVouchers.length === 0 ? (
                    <tr>
                      <td colSpan={8}>
                        <EmptyState icon={Search} title="Tidak ada voucher cocok" description="Coba ubah filter pencarian." />
                      </td>
                    </tr>
                  ) : (
                    paginatedVouchers.map((v) => {
                      const meta = STATUS_META[v.status];
                      return (
                        <tr key={v.id} className={`transition-colors ${selectedIds.includes(v.id) ? "bg-surface-soft" : "hover:bg-surface-soft"}`}>
                          <td className="p-4 text-center">
                            <input
                              type="checkbox"
                              className="w-4 h-4 rounded border-hairline-strong accent-black cursor-pointer disabled:opacity-30"
                              checked={selectedIds.includes(v.id)}
                              onChange={() => toggleSelect(v.id)}
                              disabled={v.status !== "UNUSED"}
                              title={v.status !== "UNUSED" ? "Hanya UNUSED bisa dihapus" : "Pilih"}
                            />
                          </td>
                          <td className="p-4 font-mono font-medium text-ink">{v.username}</td>
                          <td className="p-4 font-mono text-charcoal">
                            {v.password === v.username ? <span className="text-xs text-mute italic">= kode</span> : v.password}
                          </td>
                          <td className="p-4">
                            <div className="font-medium text-ink">{v.profile?.name || "-"}</div>
                            <div className="text-xs text-mute font-mono">{v.profile?.rateLimit}</div>
                          </td>
                          <td className="p-4 text-charcoal">{v.outletName || v.server?.name || "—"}</td>
                          <td className="p-4">
                            <Badge tone={meta.tone} dot>
                              {meta.label}
                            </Badge>
                          </td>
                          <td className="p-4 text-mute text-xs whitespace-nowrap">
                            {new Date(v.createdAt).toLocaleString("id-ID", { dateStyle: "short", timeStyle: "short" })}
                          </td>
                          <td className="p-4">
                            <div className="flex items-center justify-center gap-1.5">
                              <a href={getPdfSingleUrl(v.id)} target="_blank" rel="noreferrer" title="Cetak PDF">
                                <span className="w-8 h-8 flex items-center justify-center rounded-full border border-hairline text-mute hover:text-ink hover:bg-surface-soft transition-colors">
                                  <Printer className="w-3.5 h-3.5" />
                                </span>
                              </a>
                              {v.status === "UNUSED" && (
                                <button
                                  onClick={() => confirmDelete([v.id])}
                                  className="w-8 h-8 flex items-center justify-center rounded-full border border-hairline text-danger hover:bg-error-container transition-colors"
                                  title="Hapus"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer paginasi */}
            <div className="border-t border-hairline p-3.5 flex flex-col sm:flex-row items-center justify-between gap-4 text-mute text-xs">
              <div className="flex items-center gap-3">
                <span>Baris:</span>
                <Select value={itemsPerPage} onChange={(e) => setItemsPerPage(Number(e.target.value))} className="h-8! w-auto! pr-8!">
                  <option value={10}>10</option>
                  <option value={15}>15</option>
                  <option value={50}>50</option>
                  <option value={999999}>Semua</option>
                </Select>
                <span className="hidden sm:inline border-l border-hairline pl-3">
                  {filteredVouchers.length === 0
                    ? "0 voucher"
                    : `${(currentPage - 1) * itemsPerPage + 1}–${Math.min(currentPage * itemsPerPage, filteredVouchers.length)} dari ${filteredVouchers.length}`}
                </span>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center gap-1.5">
                  <PageBtn onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))} disabled={currentPage === 1}>
                    <ChevronLeft className="w-4 h-4" />
                  </PageBtn>
                  {getPageNumbers().map((page, i) =>
                    typeof page === "string" ? (
                      <span key={`${page}-${i}`} className="px-1 text-mute">
                        …
                      </span>
                    ) : (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`min-w-8 h-8 px-2 text-xs font-medium rounded-full transition-colors ${
                          currentPage === page ? "bg-ink text-on-dark" : "border border-hairline text-charcoal hover:bg-surface-soft"
                        }`}
                      >
                        {page}
                      </button>
                    ),
                  )}
                  <PageBtn onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages}>
                    <ChevronRight className="w-4 h-4" />
                  </PageBtn>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* ── Modal: Generator Voucher ── */}
      <Modal
        open={isAddModalOpen}
        onClose={closeAddModal}
        title="Generator Voucher"
        subtitle={activeServer?.name}
        footer={
          <>
            <Button variant="secondary" onClick={closeAddModal} disabled={isSaving}>
              Batal
            </Button>
            {generatorTab === "single" ? (
              <Button onClick={(e) => handleGenerateSingle(e)} loading={isSaving}>
                <Plus className="w-4 h-4" /> Buat Voucher
              </Button>
            ) : (
              <Button onClick={(e) => handleGenerateBatch(e)} loading={isSaving}>
                <Plus className="w-4 h-4" /> Buat Batch
              </Button>
            )}
          </>
        }
      >
        {/* Tabs */}
        <div className="flex border-b border-hairline mb-5">
          {(["single", "batch"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => {
                setGeneratorTab(tab);
                setErrorMessage("");
                setSuccessMessage("");
              }}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                generatorTab === tab ? "border-ink text-ink" : "border-transparent text-mute hover:text-ink"
              }`}
            >
              {tab === "single" ? "Tunggal" : "Massal (Batch)"}
            </button>
          ))}
        </div>

        {errorMessage && <Banner tone="error" className="mb-4">{errorMessage}</Banner>}
        {successMessage && (
          <div className="mb-4 space-y-3">
            <Banner tone="success">{successMessage}</Banner>
            {latestBatchId && (
              <a href={getPdfBatchUrl(latestBatchId)} target="_blank" rel="noreferrer">
                <Button variant="secondary" className="w-full">
                  <Download className="w-4 h-4" /> Cetak PDF Batch (A4)
                </Button>
              </a>
            )}
          </div>
        )}

        {generatorTab === "single" ? (
          <form onSubmit={handleGenerateSingle} className="space-y-4">
            <div>
              <Label required>Profil Hotspot</Label>
              <Select name="profileId" value={singleForm.profileId} onChange={handleSingleInputChange} required>
                <option value="" disabled>Pilih profil…</option>
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.rateLimit} · {p.validity || "no limit"})
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Kode Voucher <span className="text-mute font-normal">(opsional)</span></Label>
              <Input name="username" value={singleForm.username} onChange={handleSingleInputChange} placeholder="Kosong = acak 6 digit" mono />
            </div>
            <div>
              <Label>Password <span className="text-mute font-normal">(opsional)</span></Label>
              <Input name="password" value={singleForm.password} onChange={handleSingleInputChange} placeholder="Kosong = sama dgn kode" mono />
            </div>
            <div>
              <Label>Nama Outlet <span className="text-mute font-normal">(tampil di struk)</span></Label>
              <Input name="outletName" value={singleForm.outletName} onChange={handleSingleInputChange} placeholder="Kafe Utama" />
            </div>
          </form>
        ) : (
          <form onSubmit={handleGenerateBatch} className="space-y-4">
            <div>
              <Label required>Profil Hotspot</Label>
              <Select name="profileId" value={batchForm.profileId} onChange={handleBatchInputChange} required>
                <option value="" disabled>Pilih profil…</option>
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.rateLimit} · {p.validity || "no limit"})
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label required>Jumlah Voucher</Label>
              <div className="flex items-center gap-3">
                <Input type="number" name="count" min={1} max={200} value={batchForm.count} onChange={handleBatchInputChange} className="w-24" mono />
                <span className="text-xs text-mute">Maks 200 per batch.</span>
              </div>
              <div className="flex gap-2 mt-2">
                {[10, 20, 50, 100, 200].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setBatchForm((prev) => ({ ...prev, count: preset }))}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      batchForm.count === preset ? "bg-ink text-on-dark" : "bg-surface-soft text-charcoal border border-hairline hover:text-ink"
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Prefix Kode <span className="text-mute font-normal">(ops.)</span></Label>
                <Input name="usernamePrefix" value={batchForm.usernamePrefix} onChange={handleBatchInputChange} placeholder="KAFE-" mono />
              </div>
              <div>
                <Label>Panjang Karakter</Label>
                <Input type="number" name="charLength" min={4} max={10} value={batchForm.charLength} onChange={handleBatchInputChange} mono />
              </div>
            </div>
            <div>
              <Label>Nama Outlet <span className="text-mute font-normal">(struk)</span></Label>
              <Input name="outletName" value={batchForm.outletName} onChange={handleBatchInputChange} placeholder="Kafe Utama" />
            </div>
            {/* Format karakter */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="mb-0!">Format Kode</Label>
                <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-surface-soft border border-hairline text-ink">
                  {charFormatOptions.find((o) => o.value === batchForm.charFormat)?.preview}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {charFormatOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setBatchForm((prev) => ({ ...prev, charFormat: opt.value }))}
                    className={`flex items-center gap-2 px-2.5 py-2 rounded-[12px] border text-left transition-colors ${
                      batchForm.charFormat === opt.value ? "border-ink bg-surface-soft" : "border-hairline hover:border-hairline-strong"
                    }`}
                  >
                    <span className="w-6 h-6 rounded-full bg-surface-soft border border-hairline flex items-center justify-center text-charcoal shrink-0">
                      {opt.icon}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-ink leading-tight truncate">{opt.label}</p>
                      <p className="text-[10px] text-mute leading-tight">{opt.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </form>
        )}
      </Modal>

      {/* ── Popup proses batch (tanpa gradient) ── */}
      <Modal open={isBatchProcessing && !!batchProcessingInfo} onClose={closeBatchProcessingPopup} title={batchProcessingInfo?.done ? "Batch terkirim" : "Memproses batch…"} size="sm">
        {batchProcessingInfo && (
          <div className="space-y-4">
            <div className="flex justify-center">
              {batchProcessingInfo.done ? (
                <div className="w-12 h-12 rounded-full border border-hairline flex items-center justify-center text-ok">
                  <CheckCircle className="w-6 h-6" strokeWidth={1.75} />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-full border-2 border-hairline border-t-ink animate-spin" />
              )}
            </div>
            <p className="text-center text-sm text-body">
              {batchProcessingInfo.done
                ? "Voucher dibuat di background. Daftar otomatis terbarui."
                : "Antrean dikirim ke sistem. Tunggu sebentar…"}
            </p>
            <div className="rounded-[12px] border border-hairline divide-y divide-hairline text-sm">
              <DetailRow label="Jumlah" value={`${batchProcessingInfo.count} voucher`} />
              <DetailRow label="Paket" value={batchProcessingInfo.profileName} />
              {batchProcessingInfo.batchId && <DetailRow label="Batch ID" value={batchProcessingInfo.batchId} mono />}
              <div className="flex items-center justify-between gap-3 px-4 py-2.5">
                <span className="text-mute">Status</span>
                <span className="inline-flex items-center gap-1.5 text-charcoal font-medium">
                  <StatusDot tone={batchProcessingInfo.done ? "ok" : "warn"} pulse={!batchProcessingInfo.done} />
                  {batchProcessingInfo.done ? "Antre" : "Memproses"}
                </span>
              </div>
            </div>
            {batchProcessingInfo.done && batchProcessingInfo.batchId && (
              <a href={getPdfBatchUrl(batchProcessingInfo.batchId)} target="_blank" rel="noreferrer">
                <Button className="w-full">
                  <Download className="w-4 h-4" /> Cetak PDF Batch (A4)
                </Button>
              </a>
            )}
            <Button variant="secondary" className="w-full" onClick={closeBatchProcessingPopup} disabled={!batchProcessingInfo.done && isSaving}>
              {batchProcessingInfo.done ? "Tutup" : "Menunggu…"}
            </Button>
          </div>
        )}
      </Modal>

      {/* ── Modal: Konfirmasi hapus ── */}
      <Modal
        open={isDeleteModalOpen}
        onClose={() => !isDeleting && setIsDeleteModalOpen(false)}
        title="Hapus voucher?"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsDeleteModalOpen(false)} disabled={isDeleting}>
              Batal
            </Button>
            <Button variant="danger" onClick={executeDelete} loading={isDeleting}>
              <Trash2 className="w-4 h-4" /> Hapus
            </Button>
          </>
        }
      >
        <p className="text-sm text-body leading-relaxed">
          Yakin hapus <span className="font-medium text-ink">{deleteTarget.length}</span> voucher? User juga dihapus dari router MikroTik. Tindakan ini tak bisa dibatalkan.
        </p>
        {isDeleting && (
          <Banner tone="info" className="mt-4">
            Menghapus dari router & database. Jangan tutup halaman.
          </Banner>
        )}
      </Modal>
    </div>
  );
}

// ── Sub-komponen ─────────────────────────────────────────────────────────────
function SummaryCard({ icon: Icon, label, value }: { icon: typeof Ticket; label: string; value: number }) {
  return (
    <Card className="flex items-center justify-between">
      <div>
        <p className="text-xs font-medium text-mute uppercase tracking-wide">{label}</p>
        <p className="font-display text-3xl font-semibold text-ink mt-1.5">{value}</p>
      </div>
      <div className="w-10 h-10 rounded-full border border-hairline flex items-center justify-center text-mute">
        <Icon className="w-5 h-5" strokeWidth={1.75} />
      </div>
    </Card>
  );
}

function PageBtn({ onClick, disabled, children }: { onClick: () => void; disabled: boolean; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-8 h-8 flex items-center justify-center rounded-full border border-hairline text-charcoal hover:bg-surface-soft disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
    >
      {children}
    </button>
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
