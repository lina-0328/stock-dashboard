export function formatNumber(n: number | null | undefined): string {
  if (n == null) return "-";
  return n.toLocaleString("ko-KR");
}

export function formatPercent(n: number | null | undefined): string {
  if (n == null) return "-";
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(2)}%`;
}

export function formatMoney(n: number | null | undefined): string {
  if (n == null) return "-";
  const m = n / 10000;
  const sign = m > 0 ? "+" : "";
  return `${sign}${m.toFixed(0)}만원`;
}

export function returnColor(n: number | null | undefined): string {
  if (n == null) return "";
  if (n > 0) return "text-emerald-500";
  if (n < 0) return "text-red-500";
  return "text-muted-foreground";
}

export function returnBg(n: number | null | undefined): string {
  if (n == null) return "";
  if (n > 0) return "bg-emerald-500/10";
  if (n < 0) return "bg-red-500/10";
  return "";
}

export function marketBadge(market: string): string {
  return market === "KOSPI"
    ? "bg-blue-500/15 text-blue-600 dark:text-blue-400"
    : "bg-purple-500/15 text-purple-600 dark:text-purple-400";
}

export function naverStockUrl(code: string): string {
  return `https://finance.naver.com/item/main.naver?code=${code}`;
}
