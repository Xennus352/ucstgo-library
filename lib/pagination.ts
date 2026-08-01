// Builds the page-number list for a pager: `1, 2, 3, …, 9, 10` with ellipses
// replacing the middle when there are many pages.
export function getPageNumbers(
  current: number,
  total: number,
): Array<number | "…"> {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const pages = new Set<number>([
    1,
    2,
    total - 1,
    total,
    current - 1,
    current,
    current + 1,
  ]);
  const sorted = [...pages]
    .filter((p) => p >= 1 && p <= total)
    .sort((a, b) => a - b);
  const out: Array<number | "…"> = [];
  let prev = 0;
  for (const p of sorted) {
    if (p - prev > 1) out.push("…");
    out.push(p);
    prev = p;
  }
  return out;
}
