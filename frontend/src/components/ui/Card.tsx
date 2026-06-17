"use client";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  // `dark` = momen "look here" tunggal (surface-dark + teks putih).
  variant?: "default" | "dark";
  // padding internal; `false` untuk konten yang atur padding sendiri (mis. tabel).
  padded?: boolean;
}

// Kartu = satu-satunya pengecualian pill: rounded-[12px] + 1px hairline, NO shadow.
export function Card({
  variant = "default",
  padded = true,
  className = "",
  children,
  ...props
}: CardProps) {
  const base = "rounded-[12px] border";
  const tone =
    variant === "dark"
      ? "bg-surface-dark text-on-dark border-transparent"
      : "bg-canvas text-ink border-hairline";
  const pad = padded ? "p-6" : "";

  return (
    <div className={`${base} ${tone} ${pad} ${className}`} {...props}>
      {children}
    </div>
  );
}

export default Card;
