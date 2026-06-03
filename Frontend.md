# Frontend.md

Dokumentasi arsitektur **frontend** — Next.js 15 (App Router) + React 19 + Tailwind v4 + Zustand + React Query.

Lokasi: `/frontend`. Package manager: **pnpm**.

---

## 1. Struktur Direktori

```
src/
├── app/
│   ├── layout.tsx                  # root layout (providers, theme, font)
│   ├── page.tsx                    # landing / redirect
│   ├── (auth)/
│   │   └── login/page.tsx          # halaman login admin
│   └── (dashboard)/
│       ├── layout.tsx              # shell panel: sidebar + header + server selector
│       ├── dashboard/page.tsx      # ringkasan / statistik
│       ├── servers/page.tsx        # CRUD server MikroTik
│       ├── profiles/page.tsx       # CRUD hotspot profile
│       ├── vouchers/page.tsx       # generate & kelola voucher + PDF
│       ├── ai/page.tsx             # daftar AI report + trigger analisis
│       ├── ai/[id]/page.tsx        # detail laporan AI (render markdown)
│       └── logs/page.tsx           # activity log / history
├── components/
│   └── providers.tsx               # React Query + theme provider
├── lib/
│   ├── api-client.ts               # axios instance + interceptor JWT
│   └── theme-provider.tsx          # next-themes wrapper
└── store/
    ├── auth-store.ts               # Zustand: token + admin + session
    └── server-store.ts             # Zustand: daftar server + server aktif + sync
```

> Route group `(auth)` dan `(dashboard)` hanya pengelompokan — tidak muncul di URL.

---

## 2. State Management

### Zustand — `auth-store.ts`
- Menyimpan `token`, `admin`, `isAuthenticated`.
- `clearSession()` — hapus sesi (dipakai saat logout & saat 401).
- Di-persist (localStorage) agar bertahan saat refresh.

### Zustand — `server-store.ts`
- `servers[]`, `activeServerId`, `isSyncing`.
- `fetchServers()` — ambil daftar server dari backend.
- `setActiveServerId(id)` — pilih server aktif (header selector).
- `syncActiveServer(id)` — sinkronisasi penuh: tarik profil + voucher + status router real-time.

### React Query
- Provider di `components/providers.tsx`. Dipakai untuk fetching/caching data per halaman.

---

## 3. HTTP Client (`lib/api-client.ts`)

```ts
baseURL: 'http://localhost:4000/api'
```
- **Request interceptor**: sisipkan `Authorization: Bearer <token>` dari `auth-store`.
- **Response interceptor**: saat status `401` → `clearSession()` + redirect paksa ke `/login`.

> Catatan: `baseURL` masih hardcoded `localhost:4000`. Untuk fleksibel, bisa diarahkan ke
> `process.env.NEXT_PUBLIC_API_URL` (sudah ada di `.env.local.example`).

---

## 4. Dashboard Layout (`(dashboard)/layout.tsx`)

Shell utama panel admin:
- **Guard client-side**: jika `!isAuthenticated` → redirect `/login`. Cegah hydration mismatch via `isMounted`.
- **Sidebar nav** (7 item):

  | Label | Href | Icon |
  |-------|------|------|
  | Dashboard | `/dashboard` | LayoutDashboard |
  | Servers | `/servers` | Server |
  | Profiles | `/profiles` | Users |
  | Vouchers | `/vouchers` | Ticket |
  | POS Transactions | `/pos` | ShoppingCart |
  | AI Analysis | `/ai` | BrainCircuit |
  | Activity Logs | `/logs` | History |

  ⚠️ Item **POS Transactions** menunjuk `/pos`, tapi `app/(dashboard)/pos/page.tsx` **belum ada** → klik akan 404.

- **Header**: server selector global (dropdown semua server + indikator status `ONLINE/OFFLINE/UNKNOWN` dengan dot warna), info admin, tombol logout.
- **Sync overlay**: glassmorphism spinner saat `isSyncing` (sinkronisasi router).
- Responsif: sidebar collapse di mobile (toggle `Menu`).

---

## 5. Halaman

| Halaman | Fungsi singkat |
|---------|----------------|
| `login` | Form email+password → `POST /auth/login` → simpan token → redirect dashboard |
| `dashboard` | Ringkasan/statistik server, voucher, monitoring |
| `servers` | List + form tambah/edit server, tombol test koneksi |
| `profiles` | List + form profile hotspot (rateLimit, timeout, sharedUsers, validity) |
| `vouchers` | Generate single/batch, filter, download PDF, hapus massal |
| `ai` | Daftar laporan AI + pilih provider + trigger analisis server aktif |
| `ai/[id]` | Detail 1 laporan AI, render Markdown (`react-markdown` + typography) |
| `logs` | Tabel activity log dengan filter/pagination |

---

## 6. Styling & UI

- **Tailwind CSS v4** dengan token semantik kustom (`bg-surface`, `text-on-surface`,
  `primary-container`, `outline-variant`, dll — gaya Material 3).
- **next-themes** — dukungan dark/light.
- **lucide-react** — ikon.
- **react-markdown** + `@tailwindcss/typography` — render laporan AI.
- **html2pdf.js** — opsi export PDF dari sisi browser.

---

## 7. Alur Build & Run

```bash
cd frontend
pnpm install
# opsional: buat .env.local → NEXT_PUBLIC_API_URL=http://localhost:4000
pnpm dev               # http://localhost:3000
```
Backend harus jalan di `http://localhost:4000` (lihat `Backend.md`).
