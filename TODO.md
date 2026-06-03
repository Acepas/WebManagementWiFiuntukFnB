# TODO.md — Progres Projek

**P5 — Web Management WiFi FnB** (Mikrotik voucher + POS + AI). Magang 40 hari kerja.

Status verified dari source code per **2026-06-03**.

Legenda: ✅ selesai · ⚠️ partial/perlu perbaikan · ❌ belum dikerjakan.

---

## A. Fitur MVP (Must-have, dari brief §5)

| # | Fitur | Status | Catatan |
|---|-------|--------|---------|
| 1 | Koneksi multi-server MikroTik (host, user, pass, port) | ✅ | CRUD + test koneksi + custom test. Via RouterOS **REST API**. |
| 2 | Manajemen hotspot profile (bandwidth, durasi, shared user) | ✅ | CRUD + sinkron 2 arah ke router (`rateLimit`, `sessionTimeout`, `idleTimeout`, `sharedUsers`, `validity`). |
| 3 | Generate voucher single | ✅ | Kode unik (charset hindari O/I/1/0), buat user di router. |
| 4 | Generate voucher batch | ✅ | BullMQ queue, maks 200/batch, opsi prefix + format karakter. |
| 5 | Cetak voucher PDF | ✅ | pdfkit + QR code (per single/batch/filtered). |
| 5b | Cetak thermal printer (ESC/POS) | ❌ | Brief sebut ESC/POS via service kasir — belum ada. POS hanya kirim data `receipt` (struk), pencetakan thermal di sisi POS. |
| 6 | Endpoint integrasi POS (transaksi → voucher) | ✅ | `POST /pos/transactions`, idempotent, `x-api-key`, response `receipt` siap cetak. |
| 7 | Monitoring user aktif per server (real-time) | ⚠️ | Endpoint active/resources/traffic ada, tarik real-time dari router. **Masih polling**, belum WebSocket / auto-refresh < 5 detik (target brief). |
| 8 | AI analisis konfigurasi + saran | ✅ | `getFullConfig` → prompt terstruktur → LLM (4 provider) → laporan Markdown. |
| 9 | Log aktivitas (voucher dibuat/dipakai, error router) | ✅ | `ActivityLog` + enum `LogAction` lengkap, endpoint list dengan filter. |

---

## B. Progres per Milestone (brief §9 — 8 minggu)

| Minggu | Fase | Target | Status |
|--------|------|--------|--------|
| 1 | Riset & Lab | Setup CHR, uji API, baca dok POS | ✅ Integrasi REST API jalan |
| 2 | Desain | ERD, wireframe, endpoint POS, prompt AI | ✅ Schema (8 model), endpoint & prompt ada |
| 3 | Auth & Server | Login admin, CRUD server, test koneksi | ✅ JWT + CRUD + test |
| 4 | Voucher Engine | Single & batch, profile, PDF | ✅ Lengkap (batch via queue, PDF+QR) |
| 5 | Integrasi POS | Endpoint POS, simulasi transaksi → voucher | ✅ Backend selesai; ⚠️ UI POS frontend belum |
| 6 | Monitoring | User aktif real-time, log, dashboard | ⚠️ Endpoint+log ada, real-time masih polling |
| 7 | AI Analisis | Pull config → LLM → rekomendasi | ✅ Multi-provider, simpan & tampil laporan |
| 8 | QA & Demo | Test end-to-end, demo, dokumentasi | ⚠️ Dokumentasi jalan; **test otomatis minim**, demo video belum |

---

## C. Yang Perlu Diperbaiki / Diselesaikan

### 🔴 Prioritas tinggi (keamanan & fungsional)
- [ ] **Enkripsi password router MikroTik** — saat ini plaintext di DB (`schema.prisma` tandai `// enkripsi saat implementasi`).
- [ ] **Pasang `JwtAuthGuard` di `AiController`** — endpoint AI sekarang publik.
- [ ] **Buat halaman frontend `/pos`** — nav sidebar menunjuk `/pos` tapi `app/(dashboard)/pos/page.tsx` belum ada → 404.
- [ ] **Lengkapi `.env.example`** — tambah `OPENROUTER_API_KEY`, `POS_API_KEY`, `FRONTEND_URL` (dipakai kode tapi belum terdokumentasi).
- [ ] **Ganti POS API key hardcoded** — fallback `pos_secret_key_123` di `pos.controller.ts` sebaiknya wajib dari env di produksi.

### 🟡 Prioritas sedang (kualitas & target brief)
- [ ] **Monitoring real-time < 5 detik** — implement WebSocket / auto-polling interval (kriteria sukses brief §11).
- [ ] **Test otomatis** — saat ini hanya `app.controller.spec.ts`. Tambah unit/e2e untuk vouchers, pos, ai.
- [ ] **Validasi AI manual 5 skenario misconfig** (brief §13) — verifikasi kualitas temuan.
- [ ] **`apiClient.baseURL` dinamis** — arahkan ke `NEXT_PUBLIC_API_URL` (kini hardcoded `localhost:4000`).
- [ ] **`expiredAt` / validity-by-date voucher** — field ada di schema, logika expiry belum aktif.
- [ ] **`AiReport.adminId`** — belum diisi (analisis tidak terhubung ke admin yang menjalankan).

### 🟢 Deliverables (brief §10)
- [x] Source code panel (frontend + backend)
- [x] Dokumentasi API integrasi POS (`Api.md` + Swagger)
- [ ] Skrip/dok setup MikroTik (user API, port, firewall) — perlu dokumen khusus
- [ ] Sample AI analysis report (markdown/PDF) tersimpan sebagai contoh
- [ ] Demo video integrasi POS → voucher tercetak

---

## D. Fitur Lanjutan (Luar MVP, brief §6) — semua ❌ belum

- [ ] Captive portal kustom branded per outlet
- [ ] Voucher QR + validity by date (QR sudah ada di PDF; validity-by-date belum)
- [ ] Forecast pemakaian voucher mingguan (analytics)
- [ ] Auto-fix konfigurasi (apply script ke MikroTik dengan confirmation)
- [ ] Multi-tenant (1 panel multi-cabang franchise)

---

## E. Kriteria Sukses MVP (brief §11) — checklist

- [x] 1 server MikroTik dikelola voucher batch ≥ 100 (limit kode 200/batch ✅)
- [x] Trigger POS menghasilkan voucher valid siap cetak
- [x] AI menghasilkan ≥ 3 temuan relevan (prompt minta minimal 3)
- [ ] Monitoring user aktif update otomatis < 5 detik (⚠️ masih polling manual)

---

## F. Pertanyaan Riset yang Masih Terbuka (brief §12)

- [ ] Versi RouterOS outlet (6.x / 7.x) — kode pakai **REST API** (butuh RouterOS 7.x).
- [ ] Format struk POS final — apakah bisa tambah block voucher otomatis (koordinasi mentor).
- [ ] Budget LLM bulanan — saat ini default Gemini Flash (murah/free tier).
- [ ] Jumlah outlet pilot untuk MVP.
