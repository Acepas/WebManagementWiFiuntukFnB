# Backend.md

Dokumentasi arsitektur **backend** — NestJS 11 + Prisma 7 + PostgreSQL + BullMQ/Redis.

Lokasi: `/backend`. Entry point: `src/main.ts`. Root module: `src/app.module.ts`.

---

## 1. Bootstrap (`src/main.ts`)

- Global prefix `/api`.
- CORS aktif (`origin = FRONTEND_URL` atau `http://localhost:3000`, `credentials: true`).
- `ValidationPipe` global: `whitelist`, `forbidNonWhitelisted`, `transform`, `enableImplicitConversion`.
- Swagger di `/api/docs` (Bearer auth `access-token`, `persistAuthorization`).
- Port default `4000` (env `PORT`).

---

## 2. Struktur Module

```
src/
├── main.ts                     # bootstrap
├── app.module.ts               # root module (registrasi semua module + config)
├── config/                     # 5 file config (registerAs)
│   ├── app.config.ts
│   ├── database.config.ts
│   ├── jwt.config.ts
│   ├── redis.config.ts
│   └── ai.config.ts
└── modules/
    ├── prisma/                 # global — PrismaService
    ├── mikrotik/               # global (shared) — MikrotikService
    ├── auth/                   # login JWT + guard + strategy
    ├── servers/                # CRUD server MikroTik + test koneksi
    ├── profiles/               # CRUD hotspot profile + sync ke/dari router
    ├── vouchers/               # generate single/batch + PDF + queue
    ├── pos/                    # endpoint integrasi POS
    ├── monitoring/             # user aktif, resource, traffic (real-time)
    ├── ai/                     # AI analysis konfigurasi
    └── activity-log/           # log aktivitas sistem
```

`ConfigModule.forRoot({ isGlobal: true, load: [appConfig, databaseConfig, jwtConfig, redisConfig, aiConfig] })`.

---

## 3. Skema Database (`prisma/schema.prisma`)

Provider `postgresql`, generator `prisma-client-js`. Semua ID `cuid()`. Tabel di-`@@map` snake_case.

### Model & relasi

**Admin** (`admins`)
- `id, email (unique), password (bcrypt), name, isActive, createdAt, updatedAt`
- relasi: `logs ActivityLog[]`, `aiReports AiReport[]`

**MikrotikServer** (`mikrotik_servers`)
- `id, name, host, port (default 8728), username, password, useSSL (default false)`
- `hotspotName?` (nama server hotspot di MikroTik), `dnsName?` (DNS captive portal)
- `lastStatus (ServerStatus), lastCheckedAt?`
- relasi: `profiles[], vouchers[], logs[], aiReports[]`
- ⚠️ `password` masih plaintext — komentar schema: `// enkripsi saat implementasi`

**HotspotProfile** (`hotspot_profiles`)
- `id, serverId, name, rateLimit (mis "2M/2M"), sessionTimeout?, idleTimeout?`
- `sharedUsers (default 1), validity?, description?, syncedToRouter (default false)`
- `@@unique([serverId, name])`
- relasi: `server`, `vouchers[]`

**Voucher** (`vouchers`)
- `id, serverId, profileId, username (unique), password, status (VoucherStatus)`
- `batchId?, posTransId?, outletName?, usedAt?, expiredAt?`
- index: `serverId, profileId, status, batchId`
- relasi: `server, profile, posTrans?`

**PosTransaction** (`pos_transactions`)
- `id, transactionId (unique — ID dari POS), outletId, totalAmount, customerName?`
- `voucherProfile, status (PosTransactionStatus), errorMessage?`
- index: `outletId, status`
- relasi: `vouchers[]`

**AiReport** (`ai_reports`)
- `id, serverId, adminId?, provider, configJson, resultMd, status (AiReportStatus), errorMessage?, createdAt`
- relasi: `server, admin?`

**ActivityLog** (`activity_logs`)
- `id, adminId?, serverId?, action (LogAction), entity?, entityId?, detail?, ipAddress?, createdAt`
- index: `adminId, serverId, action, createdAt`

### Enum

| Enum | Nilai |
|------|-------|
| `ServerStatus` | `ONLINE, OFFLINE, UNKNOWN` |
| `VoucherStatus` | `UNUSED, USED, REVOKED, EXPIRED` |
| `PosTransactionStatus` | `PENDING, SUCCESS, FAILED` |
| `AiReportStatus` | `PENDING, COMPLETED, FAILED` |
| `LogAction` | `ADMIN_LOGIN/LOGOUT`, `SERVER_*`, `PROFILE_*`, `VOUCHER_*`, `POS_*`, `AI_ANALYSIS_*`, `ROUTER_CONNECTION_FAILED`, `SYSTEM_ERROR` |

### Migrasi
- `20260527050154_init`
- `20260528045545_add_hotspot_name_dns_name_to_server`

---

## 4. Integrasi MikroTik (`modules/mikrotik/mikrotik.service.ts`)

**Pakai RouterOS REST API**, bukan binary API (8728/8729). Base URL: `http(s)://host:port/rest/...`,
auth **Basic** (base64 `user:pass`), timeout default 5000ms via `AbortController`.

Method utama:

| Method | RouterOS path | Fungsi |
|--------|---------------|--------|
| `connect()` / `testConnection()` | `GET system/resource` | verifikasi kredensial + hitung latensi |
| `getHotspotProfiles(serverId)` | `GET ip/hotspot/user/profile` | list profile |
| `createHotspotProfile(...)` | `PUT ip/hotspot/user/profile` | buat profile (`rate-limit`, `shared-users`, `session-timeout`, `idle-timeout`) |
| `removeHotspotProfile(serverId, name)` | cari `.id` → `DELETE` | hapus profile |
| `createHotspotUser(...)` | `PUT ip/hotspot/user` | buat user voucher (`name`, `password`, `profile`) |
| `removeHotspotUser(serverId, username)` | cari `.id` → `DELETE` | revoke voucher |
| `getActiveUsers(serverId)` | `GET ip/hotspot/active` | user aktif real-time |
| `getHotspotUsers(serverId)` | `GET ip/hotspot/user` | semua user terdaftar |
| `getSystemResource(serverId)` | `GET system/resource` | CPU/RAM/HDD/uptime |
| `getInterfaces(serverId)` | `GET interface` | traffic RX/TX per interface |
| `getFullConfig(serverId)` | paralel `Promise.allSettled` | resource + profile + pool + dhcp + dns + hotspot + user → untuk AI |

Catatan: error 401/403 → `BadRequestException("Kredensial MikroTik salah...")`. DELETE 204 → `{ success: true }`.

---

## 5. Modul Fungsional

### auth
- `POST /auth/login` → validasi email+password (bcrypt), cek `isActive`, terbitkan JWT.
- `GET /auth/me` (guard) → profil admin aktif.
- `JwtStrategy` (passport-jwt), `JwtAuthGuard`, decorator `@CurrentUser()`.
- JWT secret + expiry dari `jwt.config` (`JWT_SECRET`, `JWT_EXPIRES_IN` default `7d`).

### servers
- CRUD server + `POST :id/test-connection` (uji koneksi server tersimpan) + `POST test-connection-custom` (uji kredensial sebelum simpan).
- Update `lastStatus` / `lastCheckedAt` saat test.

### profiles
- CRUD profile; saat create/update **disinkronkan ke router** (createHotspotProfile / removeHotspotProfile).
- `POST sync/:serverId` → impor profile yang sudah ada di router ke DB lokal.
- `@@unique([serverId, name])` mencegah duplikat per server.

### vouchers
- `generateSingle` → buat 1 voucher: cek server+profile, generate kode unik (charset tanpa `O/I/1/0`), buat user di router via `createHotspotUser`, simpan DB.
- `generateBatch` → masuk **BullMQ queue** (`VoucherQueueService`), worker proses background. Maks 200/batch. Opsi `usernamePrefix`, `charLength` (4–10), `charFormat` (`UPPERCASE/LOWERCASE/MIXED_CASE/LETTERS_ONLY/NUMBERS_ONLY/ALPHANUMERIC`).
- `deleteBulk` → hapus massal (hanya status `UNUSED`).
- PDF via **pdfkit** + **qrcode**: per-batch, per-single, dan filtered (server/profile/status). Endpoint PDF publik agar bisa dibuka browser.

### pos (`processTransaction`)
1. Cek server ada.
2. **Idempotensi**: jika `transactionId` sudah `SUCCESS` + punya voucher → kembalikan voucher lama.
3. Catat/`PENDING` transaksi.
4. Cari profile by `profileName` (case-insensitive) di server tsb; jika tidak ada → `FAILED`.
5. `generateSingle` → hubungkan voucher ke transaksi → set `SUCCESS`.
6. Kembalikan `receipt` terformat (`formatReceiptData`): title, outlet, username/password, validity, duration, rateLimit, portalUrl, instruksi.
- Proteksi header `x-api-key` (env `POS_API_KEY`, fallback `pos_secret_key_123`).

### monitoring
- `GET active/:serverId` → user hotspot aktif (real-time dari router).
- `GET resources/:serverId` → CPU/RAM/HDD/uptime.
- `GET traffic/:serverId` → RX/TX per interface.
- Semua guard JWT.

### ai (`analyzeServer`)
1. `getFullConfig` dari MikroTik.
2. `generatePrompt` — prompt berbahasa Indonesia, peran "Network Engineer & MikroTik Expert", minta minimal 3 temuan + saran, output Markdown terstruktur (Ringkasan, Temuan, Saran, Kesimpulan).
3. Panggil provider sesuai param: **gemini** (default, `gemini-flash-latest`), **openai** (`gpt-4o-mini`), **anthropic** (`claude-3-haiku-20240307`), **openrouter** (`openrouter/free`).
4. Simpan `AiReport` (`COMPLETED`) + catat `ActivityLog` (`AI_ANALYSIS_COMPLETED`).
- `GET reports` & `GET reports/:id` (include server).
- ⚠️ Controller belum dipasang `JwtAuthGuard`. Provider key dari env (`GEMINI_API_KEY`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `OPENROUTER_API_KEY`).

### activity-log
- `ActivityLogService.logAction(...)` dipakai lintas module untuk mencatat aksi.
- `GET activity-log` (guard) → paginated (`skip`, `take`), filter `serverId` & `action`.

---

## 6. Environment Variables

Dari `backend/.env.example`:
```env
DATABASE_URL="postgresql://postgres:password@localhost:5433/wifi_mgmt_db"
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=...
JWT_EXPIRES_IN=7d
LLM_PROVIDER=openai          # openai | anthropic | gemini
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
GEMINI_API_KEY=
PORT=4000
NODE_ENV=development
```

⚠️ **Belum ada di `.env.example` tapi dipakai kode** — perlu ditambahkan:
```env
OPENROUTER_API_KEY=          # dipakai ai.service.callOpenRouter
POS_API_KEY=pos_secret_key_123   # dipakai pos.controller (fallback hardcoded)
FRONTEND_URL=http://localhost:3000   # dipakai CORS di main.ts
```

---

## 7. Alur Build & Run

```bash
cd backend
npm install
# isi .env (DATABASE_URL, REDIS_*, JWT_SECRET, minimal 1 LLM key)
npm run db:migrate     # buat tabel
npm run db:seed        # admin default
npm run start:dev      # http://localhost:4000/api , docs /api/docs
```
Wajib: PostgreSQL + Redis aktif sebelum start (Redis untuk BullMQ batch voucher).
