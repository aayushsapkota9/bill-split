import { BillItem, FeeConfig, Friend, ItemShare, SavedBill } from "../types";

export const PERSON_COLORS = [
  "#14b8a6",
  "#8b5cf6",
  "#f59e0b",
  "#f43f5e",
  "#10b981",
  "#3b82f6",
  "#ec4899",
  "#f97316",
];

export const uid = () => Math.random().toString(36).slice(2, 9);

export function initials(name: string): string {
  return (
    name
      .trim()
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "?"
  );
}

export function formatCurrency(n: number): string {
  return "Rs " + (isNaN(n) ? 0 : n).toFixed(2);
}

export function getItemTotalPrice(item: BillItem): number {
  return (item.price || 0) * (item.totalQty > 0 ? item.totalQty : 1);
}

export function personItemCost(item: BillItem, friendId: string): number {
  const totalShares = item.shares.reduce((s, sh) => s + sh.qty, 0);
  if (totalShares === 0) return 0;
  const share = item.shares.find((s) => s.friendId === friendId);
  if (!share || share.qty === 0) return 0;
  return (share.qty / totalShares) * getItemTotalPrice(item);
}

export function gcd(a: number, b: number): number {
  a = Math.abs(Math.round(a));
  b = Math.abs(Math.round(b));
  while (b) {
    const t = b;
    b = a % b;
    a = t;
  }
  return a || 1;
}

export function formatShareText(item: BillItem, friendId: string): string {
  const share = item.shares.find((s) => s.friendId === friendId);
  if (!share || share.qty <= 0) return "";
  const totalShares = item.shares.reduce((s, sh) => s + sh.qty, 0);
  const qty = item.totalQty > 0 ? item.totalQty : 1;

  // Single person taking entire single item
  if (totalShares === 1 && qty === 1) return "";

  // Single person taking entire multi-quantity item
  if (item.shares.length === 1 && totalShares === share.qty) {
    return `x${qty}`;
  }

  // Calculate actual fraction of total quantity:
  const rawNum = share.qty * qty;
  const rawDen = totalShares;

  let intNum = Math.round(rawNum * 100);
  let intDen = Math.round(rawDen * 100);
  const divisor = gcd(intNum, intDen);
  intNum = intNum / divisor;
  intDen = intDen / divisor;

  if (intDen === 1) {
    return intNum === 1 && qty === 1 ? "" : `x${intNum}`;
  }

  return `x${intNum}/${intDen}`;
}

export function downloadJSON(data: unknown, filename: string): void {
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function sanitizeFriends(raw: unknown): Friend[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((f, idx) => ({
    id: typeof f?.id === "string" && f.id ? f.id : uid(),
    name: typeof f?.name === "string" ? f.name : `Friend ${idx + 1}`,
    colorIdx:
      typeof f?.colorIdx === "number" ? f.colorIdx : idx % PERSON_COLORS.length,
  }));
}

export function sanitizeItems(raw: unknown): BillItem[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((i) => ({
    id: typeof i?.id === "string" && i.id ? i.id : uid(),
    name: typeof i?.name === "string" ? i.name : "",
    price:
      typeof i?.price === "number" && !isNaN(i.price)
        ? Math.max(0, i.price)
        : 0,
    totalQty:
      typeof i?.totalQty === "number" && !isNaN(i.totalQty) && i.totalQty > 0
        ? i.totalQty
        : 1,
    shares: Array.isArray(i?.shares)
      ? i.shares
          .map((s: { friendId?: string; qty?: number }) => ({
            friendId: typeof s?.friendId === "string" ? s.friendId : "",
            qty: typeof s?.qty === "number" && !isNaN(s.qty) ? s.qty : 1,
          }))
          .filter((s: ItemShare) => Boolean(s.friendId))
      : [],
  }));
}

export function sanitizeFee(
  f: unknown,
  defaultType: "flat" | "percent" = "flat",
): FeeConfig {
  if (!f || typeof f !== "object") return { type: defaultType, value: 0 };
  const fee = f as { type?: string; value?: number };
  return {
    type: fee.type === "percent" ? "percent" : "flat",
    value:
      typeof fee.value === "number" && !isNaN(fee.value)
        ? Math.max(0, fee.value)
        : 0,
  };
}

export function sanitizeSavedBills(list: unknown): SavedBill[] {
  if (!Array.isArray(list)) return [];
  return list.map((b) => ({
    id: typeof b?.id === "string" && b.id ? b.id : uid(),
    title: typeof b?.title === "string" ? b.title : "Untitled Bill",
    date:
      typeof b?.date === "string"
        ? b.date
        : new Date().toLocaleDateString("en-IN"),
    friends: sanitizeFriends(b?.friends),
    items: sanitizeItems(b?.items),
    flatFee: sanitizeFee(b?.flatFee, "flat"),
    discount: sanitizeFee(b?.discount, "flat"),
    tax: sanitizeFee(b?.tax, "percent"),
    tip: sanitizeFee(b?.tip, "percent"),
    grandTotal:
      typeof b?.grandTotal === "number" && !isNaN(b.grandTotal)
        ? b.grandTotal
        : 0,
  }));
}
