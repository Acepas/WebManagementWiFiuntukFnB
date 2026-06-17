"use client";

import { Card, Badge, CodeBlock } from "@/components/ui";
import {
  BookOpen,
  Globe,
  KeyRound,
  List,
  Ticket,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4100/api";

// ── Komponen kecil ───────────────────────────────────────────────────────────
function SectionTitle({ icon: Icon, children }: { icon: any; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-9 h-9 rounded-full border border-hairline flex items-center justify-center text-ink shrink-0">
        <Icon className="w-4.5 h-4.5" strokeWidth={1.75} />
      </div>
      <h2 className="font-display text-xl font-semibold text-ink">{children}</h2>
    </div>
  );
}

function MethodBadge({ method }: { method: "GET" | "POST" }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono font-medium border ${
        method === "GET"
          ? "border-hairline bg-surface-soft text-charcoal"
          : "border-ink bg-ink text-on-dark"
      }`}
    >
      {method}
    </span>
  );
}

// Tabel field (param/header/body)
function FieldTable({
  rows,
}: {
  rows: { name: string; type: string; required: boolean; desc: string }[];
}) {
  return (
    <div className="rounded-[12px] border border-hairline overflow-hidden">
      <table className="w-full text-sm text-left">
        <thead className="bg-surface-soft text-mute text-xs border-b border-hairline">
          <tr>
            <th className="px-4 py-2.5 font-medium">Field</th>
            <th className="px-4 py-2.5 font-medium">Tipe</th>
            <th className="px-4 py-2.5 font-medium">Wajib</th>
            <th className="px-4 py-2.5 font-medium">Keterangan</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-hairline">
          {rows.map((r) => (
            <tr key={r.name}>
              <td className="px-4 py-2.5 font-mono text-ink">{r.name}</td>
              <td className="px-4 py-2.5 font-mono text-mute text-xs">{r.type}</td>
              <td className="px-4 py-2.5">
                {r.required ? (
                  <span className="text-ink font-medium">Ya</span>
                ) : (
                  <span className="text-mute">Opsional</span>
                )}
              </td>
              <td className="px-4 py-2.5 text-body">{r.desc}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function PosApiDocs() {
  return (
    <div className="max-w-3xl space-y-14">
      {/* ── Pengenalan ── */}
      <section className="space-y-4">
        <SectionTitle icon={BookOpen}>Pengenalan API</SectionTitle>
        <p className="text-body leading-relaxed">
          API Integrasi POS memungkinkan sistem kasir (Point of Sale) kamu membuat voucher WiFi
          hotspot secara otomatis saat transaksi. Setiap permintaan dari POS akan langsung membuat
          kode voucher baru di router MikroTik, lalu mengembalikan data voucher (kode, QR, tata cara)
          untuk dicetak di struk.
        </p>
        <div className="rounded-[12px] border border-hairline p-5 space-y-2.5">
          {[
            "Voucher dibuat BARU ke MikroTik saat ada permintaan POS — bukan ambil stok lama.",
            "1 permintaan = 1 voucher. Mau banyak? Kirim beberapa kali (transactionId beda).",
            "Kode voucher digenerate sistem (6 digit angka). POS tidak perlu menentukan.",
            "API key sudah terikat ke 1 server/outlet — POS tak perlu kirim Server ID.",
          ].map((t) => (
            <div key={t} className="flex items-start gap-2.5">
              <ArrowRight className="w-4 h-4 text-mute shrink-0 mt-0.5" strokeWidth={1.75} />
              <span className="text-sm text-charcoal leading-relaxed">{t}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Gateway URL ── */}
      <section className="space-y-4">
        <SectionTitle icon={Globe}>API Gateway URL</SectionTitle>
        <p className="text-body leading-relaxed">
          Semua endpoint POS diawali dengan base URL berikut. Ganti host/port sesuai server produksi
          kamu saat deploy.
        </p>
        <CodeBlock label="Base URL" code={API_BASE} />
      </section>

      {/* ── Autentikasi ── */}
      <section className="space-y-4">
        <SectionTitle icon={KeyRound}>Autentikasi</SectionTitle>
        <p className="text-body leading-relaxed">
          Setiap permintaan POS wajib menyertakan API key pada header{" "}
          <code className="font-mono text-sm bg-surface-soft border border-hairline rounded px-1.5 py-0.5 text-ink">
            x-api-key
          </code>
          . Buat API key di tab <strong className="text-ink font-medium">Kelola Key</strong> (key terikat ke 1 outlet).
        </p>
        <CodeBlock label="Header" code={`x-api-key: pos_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`} />
        <FieldTable
          rows={[
            { name: "x-api-key", type: "string", required: true, desc: "API key outlet. Tanpa ini → 401." },
          ]}
        />
      </section>

      {/* ── Endpoint A: Profiles ── */}
      <section className="space-y-5">
        <SectionTitle icon={List}>Endpoint — Daftar Paket WiFi</SectionTitle>
        <div className="flex items-center gap-3 flex-wrap">
          <MethodBadge method="GET" />
          <code className="font-mono text-sm text-ink break-all">/pos/v1/profiles</code>
        </div>
        <p className="text-body leading-relaxed">
          Mengambil daftar paket (profil hotspot) yang tersedia pada server yang terikat ke API key.
          Dipakai kasir untuk memilih paket sebelum membuat voucher.
        </p>

        <div>
          <h3 className="font-display font-semibold text-ink mb-2">Headers</h3>
          <FieldTable rows={[{ name: "x-api-key", type: "string", required: true, desc: "API key outlet." }]} />
        </div>

        <div>
          <h3 className="font-display font-semibold text-ink mb-2">Contoh Permintaan</h3>
          <CodeBlock
            label="cURL"
            code={`curl ${API_BASE}/pos/v1/profiles \\
  -H "x-api-key: pos_xxxxxxxx..."`}
          />
        </div>

        <div>
          <h3 className="font-display font-semibold text-ink mb-2">Contoh Respons</h3>
          <Badge tone="ok" dot className="mb-2">200 OK</Badge>
          <CodeBlock
            label="200 OK"
            code={`{
  "servers": [
    {
      "serverId": "cmqa8lvx40009z8us9542d23p",
      "serverName": "Outlet A",
      "profiles": [
        {
          "profileId": "cmqa8lw9u000bz8us0tip6xab",
          "name": "1 Jam",
          "rateLimit": "2M/2M",
          "validity": "1d",
          "sharedUsers": 1
        }
      ]
    }
  ]
}`}
          />
        </div>

        <div>
          <h3 className="font-display font-semibold text-ink mb-2">Deskripsi Respons</h3>
          <FieldTable
            rows={[
              { name: "servers[]", type: "array", required: true, desc: "Daftar server (berisi 1, milik API key)." },
              { name: "serverId", type: "string", required: true, desc: "ID server." },
              { name: "serverName", type: "string", required: true, desc: "Nama server/outlet." },
              { name: "profiles[]", type: "array", required: true, desc: "Daftar paket pada server." },
              { name: "profileId", type: "string", required: true, desc: "ID paket — dipakai saat trigger voucher." },
              { name: "name", type: "string", required: true, desc: "Nama paket (mis. '1 Jam')." },
              { name: "rateLimit", type: "string", required: true, desc: "Batas kecepatan (upload/download)." },
              { name: "validity", type: "string", required: false, desc: "Masa aktif (mis. '1d')." },
              { name: "sharedUsers", type: "number", required: true, desc: "Jumlah perangkat per voucher." },
            ]}
          />
        </div>
      </section>

      {/* ── Endpoint B: Trigger Voucher ── */}
      <section className="space-y-5">
        <SectionTitle icon={Ticket}>Endpoint — Buat Voucher</SectionTitle>
        <div className="flex items-center gap-3 flex-wrap">
          <MethodBadge method="POST" />
          <code className="font-mono text-sm text-ink break-all">/pos/v1/trigger-voucher</code>
        </div>
        <p className="text-body leading-relaxed">
          Membuat 1 voucher baru di MikroTik lalu mengembalikan datanya (kode, QR, instruksi) untuk
          dicetak di struk. <strong className="text-ink font-medium">Tidak perlu kirim serverId</strong> —
          sudah ditentukan oleh API key.
        </p>

        <div>
          <h3 className="font-display font-semibold text-ink mb-2">Headers</h3>
          <FieldTable
            rows={[
              { name: "x-api-key", type: "string", required: true, desc: "API key outlet." },
              { name: "Content-Type", type: "string", required: true, desc: "application/json" },
            ]}
          />
        </div>

        <div>
          <h3 className="font-display font-semibold text-ink mb-2">Body (JSON)</h3>
          <FieldTable
            rows={[
              { name: "transactionId", type: "string", required: true, desc: "ID transaksi unik dari POS. Kunci idempotensi (cegah voucher dobel)." },
              { name: "profileId", type: "string", required: true, desc: "ID paket yang dipilih kasir (dari endpoint profiles)." },
              { name: "outletName", type: "string", required: false, desc: "Nama outlet — tampil di struk." },
              { name: "customerName", type: "string", required: false, desc: "Nama pelanggan." },
            ]}
          />
        </div>

        <div>
          <h3 className="font-display font-semibold text-ink mb-2">Contoh Permintaan</h3>
          <CodeBlock
            label="cURL"
            code={`curl -X POST ${API_BASE}/pos/v1/trigger-voucher \\
  -H "x-api-key: pos_xxxxxxxx..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "transactionId": "TRX-POS-001",
    "profileId": "cmqa8lw9u000bz8us0tip6xab",
    "outletName": "Outlet A",
    "customerName": "Budi"
  }'`}
          />
        </div>

        <div>
          <h3 className="font-display font-semibold text-ink mb-2">Contoh Respons</h3>
          <Badge tone="ok" dot className="mb-2">201 Created</Badge>
          <CodeBlock
            label="201 Created"
            code={`{
  "transactionId": "TRX-POS-001",
  "voucher": {
    "username": "738142",
    "password": "738142",
    "profileName": "1 Jam",
    "rateLimit": "2M/2M",
    "validity": "1d",
    "loginUrl": "http://hotspot.outletA.com/login?username=738142&password=738142",
    "qrBase64": "data:image/png;base64,iVBORw0KGgo...",
    "instructions": "Sambungkan ke WiFi 'Outlet A' → scan QR atau buka halaman login → masukkan username & password."
  }
}`}
          />
        </div>

        <div>
          <h3 className="font-display font-semibold text-ink mb-2">Deskripsi Respons</h3>
          <FieldTable
            rows={[
              { name: "transactionId", type: "string", required: true, desc: "Echo transactionId dari permintaan." },
              { name: "voucher.username", type: "string", required: true, desc: "Kode voucher (juga username login)." },
              { name: "voucher.password", type: "string", required: true, desc: "Password login (sama dengan kode)." },
              { name: "voucher.profileName", type: "string", required: true, desc: "Nama paket." },
              { name: "voucher.rateLimit", type: "string", required: true, desc: "Batas kecepatan." },
              { name: "voucher.validity", type: "string", required: false, desc: "Masa aktif." },
              { name: "voucher.loginUrl", type: "string", required: true, desc: "URL halaman login hotspot." },
              { name: "voucher.qrBase64", type: "string", required: true, desc: "Gambar QR (data URI) — siap dicetak/ditampilkan." },
              { name: "voucher.instructions", type: "string", required: true, desc: "Tata cara pakai untuk pelanggan." },
            ]}
          />
        </div>
      </section>

      {/* ── Kode Respons / Error ── */}
      <section className="space-y-4">
        <SectionTitle icon={AlertTriangle}>Kode Respons</SectionTitle>
        <div className="rounded-[12px] border border-hairline overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-surface-soft text-mute text-xs border-b border-hairline">
              <tr>
                <th className="px-4 py-2.5 font-medium w-20">Kode</th>
                <th className="px-4 py-2.5 font-medium">Arti</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {[
                { c: "200", t: "transactionId sudah pernah diproses — voucher yang sama dikembalikan (idempoten)." },
                { c: "201", t: "Voucher baru berhasil dibuat." },
                { c: "400", t: "Body tidak valid (mis. transactionId kosong)." },
                { c: "401", t: "API key tidak valid / kosong / nonaktif." },
                { c: "403", t: "API key tidak berhak mengakses server tersebut." },
                { c: "404", t: "Profil tidak ditemukan pada server." },
                { c: "502", t: "Router tidak dapat dijangkau saat membuat voucher — coba lagi." },
              ].map((r) => (
                <tr key={r.c}>
                  <td className="px-4 py-2.5 font-mono font-medium text-ink">{r.c}</td>
                  <td className="px-4 py-2.5 text-body">{r.t}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Alur singkat ── */}
      <section className="space-y-4">
        <SectionTitle icon={ArrowRight}>Alur Integrasi Singkat</SectionTitle>
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { n: "01", t: "Buat API key", d: "Di tab Kelola Key, buat key untuk outletmu (terikat 1 server). Salin key (tampil sekali)." },
            { n: "02", t: "Ambil paket", d: "POS panggil GET /profiles → tampilkan daftar paket ke kasir." },
            { n: "03", t: "Buat voucher", d: "Saat transaksi, POS panggil POST /trigger-voucher → cetak voucher + QR di struk." },
          ].map((s) => (
            <div key={s.n} className="rounded-[12px] border border-hairline p-5">
              <div className="font-display text-2xl font-semibold text-mute">{s.n}</div>
              <h4 className="mt-2 font-display font-semibold text-ink">{s.t}</h4>
              <p className="mt-1 text-sm text-body leading-relaxed">{s.d}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default PosApiDocs;
