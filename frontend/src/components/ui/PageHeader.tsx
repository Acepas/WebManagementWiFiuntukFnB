"use client";

// Kepala halaman: judul display (Nunito) + deskripsi + slot aksi kanan.
export function PageHeader({
  title,
  description,
  action,
  className = "",
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 ${className}`}
    >
      <div className="min-w-0">
        <h1 className="font-display text-[30px] leading-tight font-semibold text-ink truncate">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-sm text-body">{description}</p>
        )}
      </div>
      {action && <div className="flex items-center gap-2 shrink-0">{action}</div>}
    </div>
  );
}

export default PageHeader;
