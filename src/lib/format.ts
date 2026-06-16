export function formatBDT(value: number): string {
  if (!Number.isFinite(value)) return "৳0";
  return `৳${Math.round(value).toLocaleString("en-IN")}`;
}

export function formatDate(value?: string, lang: "en" | "bn" = "en"): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString(lang === "bn" ? "bn-BD" : "en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
