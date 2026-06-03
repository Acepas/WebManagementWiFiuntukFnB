# Api.md

Referensi lengkap REST API backend. Base URL: **`http://localhost:4000/api`**.
Dokumentasi interaktif (Swagger): **`http://localhost:4000/api/docs`**.

**Auth**: endpoint terproteksi butuh header `Authorization: Bearer <JWT>`.
Token didapat dari `POST /auth/login`. Default expiry `7d`.

Legenda: 🔒 = butuh JWT · 🔑 = butuh `x-api-key` · 🌐 = publik.

---

## Auth — `/auth`

### 🌐 POST `/auth/login`
Login admin, dapatkan JWT.
```json
// Request
{ "email": "admin@wifimanagement.local", "password": "admin123" }
```
- `200` → `{ access_token, admin }`
- `401` → email/password salah / akun nonaktif

### 🔒 GET `/auth/me`
Profil admin yang sedang login.
- `200` → data admin · `401` → token invalid

---

## Servers — `/servers` 🔒

| Method | Path | Fungsi |
|--------|------|--------|
| POST | `/servers` | Daftarkan router baru |
| GET | `/servers` | List semua router |
| GET | `/servers/:id` | Detail router |
| PATCH | `/servers/:id` | Update router |
| DELETE | `/servers/:id` | Hapus router |
| POST | `/servers/:id/test-connection` | Uji koneksi router tersimpan |
| POST | `/servers/test-connection-custom` | Uji kredensial sebelum simpan |

**Body create (`CreateServerDto`)**
```json
{
  "name": "Kafe Utama CHR",
  "host": "10.168.26.96",
  "port": 80,                    // opsional (default 80 HTTP / 443 HTTPS)
  "username": "admin",
  "password": "admin",
  "useSSL": false,               // opsional
  "hotspotName": "hotspot1",     // opsional
  "dnsName": "hotspot.wifi.com"  // opsional
}
```
Response test-connection → `{ success, latency, error? }`.

---

## Profiles — `/profiles` 🔒

| Method | Path | Fungsi |
|--------|------|--------|
| POST | `/profiles` | Buat profile + sinkron ke MikroTik |
| GET | `/profiles` | List semua profile |
| GET | `/profiles/:id` | Detail profile |
| PATCH | `/profiles/:id` | Update + sinkron ulang ke router |
| DELETE | `/profiles/:id` | Hapus + singkirkan dari router |
| POST | `/profiles/sync/:serverId` | Impor profile yang sudah ada di router → DB lokal |

**Body create (`CreateProfileDto`)**
```json
{
  "serverId": "cmpnoc2ea0000o0ustysa8zf5",
  "name": "Paket_1_Jam",        // tanpa spasi, pakai underscore
  "rateLimit": "2M/2M",
  "sessionTimeout": "1h",       // opsional
  "idleTimeout": "10m",         // opsional
  "sharedUsers": 1,
  "validity": "1d",             // opsional
  "description": "Voucher 1 Jam Wifi Kafe"  // opsional
}
```

---

## Vouchers — `/vouchers`

| Method | Path | Auth | Fungsi |
|--------|------|------|--------|
| POST | `/vouchers/single` | 🔒 | Generate 1 voucher instant |
| POST | `/vouchers/batch` | 🔒 | Generate massal (background queue) |
| POST | `/vouchers/delete-bulk` | 🔒 | Hapus massal (hanya UNUSED) |
| GET | `/vouchers` | 🔒 | List semua voucher |
| GET | `/vouchers/:id` | 🔒 | Detail voucher |
| GET | `/vouchers/pdf/filtered` | 🌐 | PDF by filter (`serverId`, `profileId`, `status`) |
| GET | `/vouchers/pdf/batch/:batchId` | 🌐 | PDF per batch |
| GET | `/vouchers/pdf/single/:id` | 🌐 | PDF 1 voucher |

**Body single (`GenerateSingleDto`)**
```json
{
  "serverId": "cmpnoc2ea0000o0ustysa8zf5",
  "profileId": "cmpnod1ea0000o0ustysa8zf6",
  "outletName": "Kafe Utama Jakarta",   // opsional
  "username": "USER12",                  // opsional (auto 6 char jika kosong)
  "password": "PASS34"                   // opsional (= username jika kosong)
}
```

**Body batch (`GenerateBatchDto`)**
```json
{
  "serverId": "cmpnoc2ea0000o0ustysa8zf5",
  "profileId": "cmpnod1ea0000o0ustysa8zf6",
  "count": 50,                           // 1–200
  "usernamePrefix": "KAFE-",             // opsional
  "charLength": 6,                       // 4–10, default 6
  "charFormat": "UPPERCASE",             // UPPERCASE|LOWERCASE|MIXED_CASE|LETTERS_ONLY|NUMBERS_ONLY|ALPHANUMERIC
  "outletName": "Kafe Utama Jakarta"     // opsional
}
```
- `single` → `201` voucher · `batch` → `202` (masuk antrean) · PDF → stream `application/pdf`.

---

## POS Integration — `/pos`

### 🔑 POST `/pos/transactions`
Dipicu sistem kasir saat transaksi selesai → buat voucher WiFi otomatis untuk dicetak di struk.
Header wajib: `x-api-key: <POS_API_KEY>` (default `pos_secret_key_123`).

```json
// Request (CreatePosTransactionDto)
{
  "transactionId": "TX-20260527-991",   // unik, idempotent
  "serverId": "cmpnoc2ea0000o0ustysa8zf5",
  "profileName": "Paket_Ultra_5_Jam",
  "outletName": "Kafe Sudut Kota",       // opsional
  "customerName": "Pelanggan Setia",     // opsional
  "totalAmount": 45000                   // opsional
}
```
```json
// Response 200
{
  "message": "Voucher WiFi berhasil dibuat otomatis dari transaksi POS",
  "transaction": { "id": "...", "transactionId": "TX-20260527-991", "status": "SUCCESS", "createdAt": "..." },
  "receipt": {
    "title": "=== VOUCHER WIFI KAFE ===",
    "outletName": "KAFE SUDUT KOTA",
    "username": "ABC234",
    "password": "ABC234",
    "validity": "Aktif:1Hari",
    "duration": "Durasi:5Jam",
    "rateLimit": "2M/2M",
    "portalUrl": "http://10.168.26.96",
    "instructions": [ "1. Hubungkan WiFi ke hotspot kafe.", "2. Buka browser ke http://...", "3. Masukkan Username & Password di atas." ],
    "footer": "=========================="
  }
}
```
- **Idempotent**: `transactionId` yang sudah `SUCCESS` mengembalikan voucher yang sama.
- `401` API key salah · `404` server/profile tidak ada.

---

## Monitoring — `/monitoring` 🔒

| Method | Path | Fungsi |
|--------|------|--------|
| GET | `/monitoring/active/:serverId` | User hotspot aktif (real-time dari router) |
| GET | `/monitoring/resources/:serverId` | CPU / RAM / HDD / uptime |
| GET | `/monitoring/traffic/:serverId` | RX/TX bytes per interface |

---

## AI Analysis — `/ai`

> ⚠️ Controller saat ini **belum dipasang `JwtAuthGuard`** (publik). Lihat `TODO.md`.

| Method | Path | Fungsi |
|--------|------|--------|
| POST | `/ai/servers/:id/analyze` | Tarik config router → kirim ke LLM → simpan laporan |
| GET | `/ai/reports` | Daftar semua laporan AI |
| GET | `/ai/reports/:id` | Detail 1 laporan |

```json
// Request analyze
{ "provider": "gemini" }   // gemini (default) | openai | anthropic | openrouter
```
- `201` → objek `AiReport` (`resultMd` berisi analisis Markdown).
- `404` server tidak ada · `400`/`503` LLM gagal / key belum diset.

Model per provider: gemini=`gemini-flash-latest`, openai=`gpt-4o-mini`, anthropic=`claude-3-haiku-20240307`, openrouter=`openrouter/free`.

---

## Activity Logs — `/activity-log` 🔒

### GET `/activity-log`
Riwayat aktivitas sistem (paginated).
Query: `skip?`, `take?`, `serverId?`, `action?` (enum `LogAction`).
- `200` → daftar log.

---

## Ringkasan Kode Status

| Kode | Arti |
|------|------|
| 200 | OK |
| 201 | Created |
| 202 | Accepted (batch masuk antrean) |
| 400 | Input invalid / error MikroTik / LLM |
| 401 | Token / API key invalid |
| 404 | Resource tidak ditemukan |
| 503 | LLM provider tidak tersedia |
