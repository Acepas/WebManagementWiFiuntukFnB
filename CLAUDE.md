# CLAUDE.md

Panduan untuk Claude Code (claude.ai/code) saat bekerja di repository ini.

---

## Ringkasan Projek

**P5 — Web Management WiFi untuk FnB** (projek magang 40 hari kerja).

Web management WiFi mirip Mikhmon untuk bisnis FnB (kafe/resto): membuat voucher hotspot
MikroTik, mengatur profile bandwidth/durasi, mengelola multiple server hotspot, **terintegrasi
POS** (tiap transaksi otomatis mencetak voucher di struk), dan dilengkapi **AI** yang menganalisis
konfigurasi router dan mendeteksi misconfig.

Tiga pilar produk:
1. **Admin panel** — CRUD server MikroTik, profile, voucher, monitoring.
2. **Integrasi POS** — endpoint `POST /api/pos/transactions` → response berisi data voucher untuk dicetak di struk.
3. **AI service** — tarik konfigurasi MikroTik → kirim ke LLM → tampilkan temuan + saran perbaikan.

---

## Tech Stack

### Backend (`/backend`)
- **NestJS 11** (Node, TypeScript, **ESM** — import pakai sufiks `.js`)
- **Prisma 7** + **PostgreSQL** (driver adapter `@prisma/adapter-pg` wajib di Prisma 7)
- **BullMQ + Redis** — antrean generate voucher batch
- **JWT** (`@nestjs/jwt` + passport-jwt) — auth admin
- **pdfkit** + **qrcode** — cetak voucher PDF dengan QR
- **Swagger** (`@nestjs/swagger`) — dokumentasi API di `/api/docs`
- **puppeteer** — terpasang (kemungkinan generate PDF laporan)

### Frontend (`/frontend`)
- **Next.js 15** (App Router) + **React 19**
- **Tailwind CSS v4** (+ `@tailwindcss/typography`)
- **Zustand** — state global (auth, server aktif)
- **TanStack React Query** — fetching/caching
- **axios** — HTTP client dengan interceptor JWT
- **react-hook-form + zod** — form & validasi
- **react-markdown** — render laporan AI
- **html2pdf.js** — export PDF di sisi browser
- Package manager: **pnpm** (ada `pnpm-lock.yaml`)

---

## Command Penting

### Backend (`cd backend`)
```bash
npm run start:dev      # dev server (watch) → http://localhost:4000/api
npm run build          # build produksi
npm run start:prod     # jalankan hasil build
npm run db:migrate     # prisma migrate dev
npm run db:seed        # seed admin default
npm run db:studio      # Prisma Studio (GUI DB)
npm run db:reset       # reset DB + migrasi ulang
npm run lint           # eslint --fix
npm run test           # jest (saat ini minim coverage)
```

### Frontend (`cd frontend`)
```bash
pnpm dev               # dev server → http://localhost:3000
pnpm build             # build produksi
pnpm start             # jalankan hasil build
pnpm lint              # next lint
```

### Prasyarat
- PostgreSQL aktif (default `DATABASE_URL` port `5433`, DB `wifi_mgmt_db`)
- Redis aktif (default `localhost:6379`) untuk BullMQ
- MikroTik (CHR/fisik) dengan **REST API aktif** (`/ip/service` → `www` atau `www-ssl`)

---

## Arsitektur

### Backend
- **Global prefix** `/api` (set di `main.ts`).
- **Swagger** di `/api/docs`.
- **8 feature module** + 2 module pendukung — lihat `Backend.md`:
  `auth`, `servers`, `profiles`, `vouchers`, `pos`, `monitoring`, `ai`, `activity-log`,
  + `mikrotik` (shared, global) + `prisma` (global).
- **ConfigModule** global memuat 5 file config: `app`, `database`, `jwt`, `redis`, `ai`.
- Validasi global via `ValidationPipe` (`whitelist`, `forbidNonWhitelisted`, `transform`).
- **Integrasi MikroTik pakai RouterOS REST API** (`http(s)://host:port/rest/...`) — BUKAN
  binary API port 8728/8729. Auth Basic. Lihat `MikrotikService`.

### Frontend
- **App Router** dengan route group: `(auth)` untuk login, `(dashboard)` untuk panel.
- State auth & server aktif di **Zustand**, di-persist ke localStorage.
- `apiClient` (axios) menyisipkan Bearer JWT otomatis & redirect ke `/login` saat 401.
- Lihat `Frontend.md`.

---

## Konvensi

- **Bahasa Indonesia** untuk komentar kode, pesan error, deskripsi Swagger.
- DTO + `class-validator` untuk setiap request body. Pesan validasi berbahasa Indonesia.
- Import ESM **wajib pakai sufiks `.js`** walau file sumbernya `.ts` (proyek `"type": "module"`).
- Nama tabel DB di-`@@map` ke `snake_case` jamak (`mikrotik_servers`, `hotspot_profiles`, dst).
- ID entitas pakai `cuid()`.
- Endpoint terproteksi pakai `@UseGuards(JwtAuthGuard)` + `@ApiBearerAuth('access-token')`.

---

## Kredensial Default (setelah `db:seed`)

```
Email    : admin@wifimanagement.local
Password : admin123
```
POS API key default (jika `POS_API_KEY` tidak diset): `pos_secret_key_123` (header `x-api-key`).

---

## Known Issues / Catatan Keamanan

> Didokumentasikan agar tidak terlupa — detail lengkap & status di `TODO.md`.

- **Password router MikroTik disimpan plaintext** di DB (schema menandai `// enkripsi saat implementasi`). Belum dienkripsi.
- **`AiController` belum dipasang `JwtAuthGuard`** — endpoint AI saat ini publik.
- **Beberapa endpoint voucher PDF publik** (by design, agar bisa dibuka langsung dari browser/struk).
- **`.env.example` belum memuat `OPENROUTER_API_KEY` dan `POS_API_KEY`** padahal dipakai kode.
- **Monitoring real-time pakai polling**, belum WebSocket (target brief < 5 detik).
- **Frontend belum punya halaman `/pos`** walau item nav-nya ada di sidebar.

---

## Dokumen Terkait

| File | Isi |
|------|-----|
| `Backend.md` | Arsitektur backend, skema DB, service, integrasi MikroTik |
| `Frontend.md` | Struktur halaman, state, komponen, alur UI |
| `Api.md` | Referensi lengkap semua endpoint REST |
| `TODO.md` | Checklist progres (selesai / partial / belum) per milestone |
| `PROJECT.md`, `DOKUMENTASI.md`, `fase.md`, `ai.md`, `cararun.md` | Dokumen lama / brief / catatan |
