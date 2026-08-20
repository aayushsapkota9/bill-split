"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Friend {
  id: string;
  name: string;
  colorIdx: number;
}

interface ItemShare {
  friendId: string;
  qty: number; // can be 0.5, 1, 2, etc.
}

interface BillItem {
  id: string;
  name: string;
  price: number;
  totalQty: number;
  shares: ItemShare[];
}

interface FeeConfig {
  type: "flat" | "percent";
  value: number;
}

interface SavedBill {
  id: string;
  title: string;
  date: string;
  friends: Friend[];
  items: BillItem[];
  flatFee: FeeConfig;
  discount: FeeConfig;
  tax: FeeConfig;
  tip: FeeConfig;
  grandTotal: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PERSON_COLORS = [
  "#14b8a6",
  "#8b5cf6",
  "#f59e0b",
  "#f43f5e",
  "#10b981",
  "#3b82f6",
  "#ec4899",
  "#f97316",
];

const uid = () => Math.random().toString(36).slice(2, 9);

function initials(name: string) {
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

function formatCurrency(n: number) {
  return "Rs " + (isNaN(n) ? 0 : n).toFixed(2);
}

function getItemTotalPrice(item: BillItem): number {
  return (item.price || 0) * (item.totalQty > 0 ? item.totalQty : 1);
}

function personItemCost(item: BillItem, friendId: string): number {
  const totalShares = item.shares.reduce((s, sh) => s + sh.qty, 0);
  if (totalShares === 0) return 0;
  const share = item.shares.find((s) => s.friendId === friendId);
  if (!share || share.qty === 0) return 0;
  return (share.qty / totalShares) * getItemTotalPrice(item);
}

function gcd(a: number, b: number): number {
  a = Math.abs(Math.round(a));
  b = Math.abs(Math.round(b));
  while (b) {
    const t = b;
    b = a % b;
    a = t;
  }
  return a || 1;
}

function formatShareText(item: BillItem, friendId: string): string {
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
  // portion = (share.qty / totalShares) * qty
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

function downloadJSON(data: unknown, filename: string) {
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

function sanitizeFriends(raw: unknown): Friend[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((f, idx) => ({
    id: typeof f?.id === "string" && f.id ? f.id : uid(),
    name: typeof f?.name === "string" ? f.name : `Friend ${idx + 1}`,
    colorIdx:
      typeof f?.colorIdx === "number" ? f.colorIdx : idx % PERSON_COLORS.length,
  }));
}

function sanitizeItems(raw: unknown): BillItem[] {
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

function sanitizeFee(
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

function sanitizeSavedBills(list: unknown): SavedBill[] {
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

// ─── Avatar ───────────────────────────────────────────────────────────────────

function AvatarCircle({
  name,
  colorIdx,
  size = 34,
}: {
  name: string;
  colorIdx: number;
  size?: number;
}) {
  const color = PERSON_COLORS[colorIdx % PERSON_COLORS.length];
  return (
    <div
      className="avatar"
      style={{
        width: size,
        height: size,
        background: color + "28",
        border: `2px solid ${color}55`,
        color,
        fontSize: size < 30 ? 11 : 14,
      }}
    >
      {initials(name)}
    </div>
  );
}

// ─── Item Row ─────────────────────────────────────────────────────────────────

interface ItemRowProps {
  item: BillItem;
  friends: Friend[];
  onChange: (updated: BillItem) => void;
  onRemove: () => void;
  onDuplicate: () => void;
  onSplitIntoIndividuals: (items: BillItem[]) => void;
}

function ItemRow({
  item,
  friends,
  onChange,
  onRemove,
  onDuplicate,
  onSplitIntoIndividuals,
}: ItemRowProps) {
  const [showFractions, setShowFractions] = useState<boolean>(() =>
    item.shares.some((s) => s.qty !== 1),
  );

  useEffect(() => {
    if (item.shares.some((s) => s.qty !== 1)) {
      setShowFractions(true);
    }
  }, [item.shares]);

  const canSplit = item.totalQty >= 2 && Number.isInteger(item.totalQty);

  function handleSplit() {
    const n = Math.round(item.totalQty);
    const newItems: BillItem[] = Array.from({ length: n }, (_, i) => ({
      id: uid(),
      name: `${item.name || "Item"} ${i + 1}`,
      price: item.price,
      totalQty: 1,
      shares: [],
    }));
    onSplitIntoIndividuals(newItems);
  }

  const assignedTotal = item.shares.reduce((s, sh) => s + sh.qty, 0);
  const diff = Math.abs(assignedTotal - (item.totalQty || 0));
  const mismatch = diff > 0.05 && item.totalQty > 0 && item.shares.length > 0;

  function toggleFriend(fid: string) {
    const existing = item.shares.find((s) => s.friendId === fid);
    let newShares: ItemShare[];
    if (existing) {
      newShares = item.shares.filter((s) => s.friendId !== fid);
    } else {
      const defaultQty =
        showFractions && item.totalQty > 0
          ? Math.round((item.totalQty / (item.shares.length + 1)) * 100) / 100
          : 1;
      newShares = [...item.shares, { friendId: fid, qty: defaultQty }];
    }
    onChange({ ...item, shares: newShares });
  }

  function updateQty(fid: string, val: string) {
    if (val === "") {
      onChange({
        ...item,
        shares: item.shares.map((s) =>
          s.friendId === fid ? { ...s, qty: 0 } : s,
        ),
      });
      return;
    }
    const num = parseFloat(val);
    if (!isNaN(num)) {
      onChange({
        ...item,
        shares: item.shares.map((s) =>
          s.friendId === fid ? { ...s, qty: num } : s,
        ),
      });
    }
  }

  function updateField(field: "name" | "totalQty", val: string) {
    if (field === "name") {
      onChange({ ...item, name: val });
    } else {
      if (val === "") {
        onChange({ ...item, totalQty: 0 });
        return;
      }
      const newQty = parseFloat(val);
      if (!isNaN(newQty)) {
        onChange({ ...item, totalQty: newQty });
      }
    }
  }

  function handleWithoutVatChange(val: string) {
    if (val === "") {
      onChange({ ...item, price: 0 });
      return;
    }
    const num = parseFloat(val);
    if (!isNaN(num)) {
      const withVat = Math.round(num * 1.13 * 100) / 100;
      onChange({ ...item, price: withVat });
    }
  }

  function handleWithVatChange(val: string) {
    if (val === "") {
      onChange({ ...item, price: 0 });
      return;
    }
    const num = parseFloat(val);
    if (!isNaN(num)) {
      onChange({ ...item, price: num });
    }
  }

  function handleTotalPriceChange(val: string) {
    if (val === "") {
      onChange({ ...item, price: 0 });
      return;
    }
    const num = parseFloat(val);
    if (!isNaN(num)) {
      const qty = item.totalQty > 0 ? item.totalQty : 1;
      const unitWithVat = Math.round((num / qty) * 100) / 100;
      onChange({ ...item, price: unitWithVat });
    }
  }

  const withoutVatDisplay =
    item.price > 0 ? Number((item.price / 1.13).toFixed(2)) : "";
  const withVatDisplay = item.price > 0 ? Number(item.price.toFixed(2)) : "";
  const totalPriceDisplay =
    item.price > 0
      ? Number(
          ((item.price || 0) * (item.totalQty > 0 ? item.totalQty : 1)).toFixed(
            2,
          ),
        )
      : "";

  return (
    <div className="item-row">
      <div
        style={{
          display: "flex",
          gap: 10,
          alignItems: "flex-start",
          flexWrap: "wrap",
        }}
      >
        <div style={{ flex: 3, minWidth: 160 }}>
          <input
            className="input"
            placeholder="Item name (e.g. Momos)"
            value={item.name}
            onChange={(e) => updateField("name", e.target.value)}
            style={{ fontSize: 14, fontWeight: 500 }}
          />
          <div
            style={{
              fontSize: 11,
              color: "var(--text-muted)",
              marginTop: 2,
              paddingLeft: 2,
            }}
          >
            item name
          </div>
        </div>

        {/* Total Qty (Left of Price) */}
        <div style={{ flex: 1, minWidth: 80 }}>
          <input
            className="input"
            type="number"
            min="0"
            step="any"
            placeholder="Qty"
            value={item.totalQty || ""}
            onChange={(e) => updateField("totalQty", e.target.value)}
            onFocus={(e) => e.target.select()}
            title="Total servings/quantity of this item"
          />
          <div
            style={{
              fontSize: 11,
              color: "var(--text-muted)",
              marginTop: 2,
              paddingLeft: 2,
            }}
          >
            qty
          </div>
        </div>

        {canSplit && (
          <button
            className="btn btn-ghost"
            onClick={handleSplit}
            title={`Split into ${Math.round(item.totalQty)} individual items`}
            style={{
              marginTop: 2,
              fontSize: 11,
              padding: "5px 8px",
              color: "var(--accent-violet)",
              borderColor: "rgba(139, 92, 246, 0.4)",
              borderRadius: 6,
              whiteSpace: "nowrap",
              height: "fit-content",
            }}
          >
            <svg
              width="11"
              height="11"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path d="M16 3h5v5" />
              <path d="M4 20L21 3" />
              <path d="M21 16v5h-5" />
              <path d="M15 15l6 6" />
              <path d="M4 4l5 5" />
            </svg>
            Split x{Math.round(item.totalQty)}
          </button>
        )}

        {/* Unit Without VAT box */}
        <div style={{ flex: 1, minWidth: 95 }}>
          <div style={{ position: "relative" }}>
            <span
              style={{
                position: "absolute",
                left: 7,
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--text-muted)",
                fontSize: 11,
                fontWeight: 600,
              }}
            >
              Rs
            </span>
            <input
              className="input"
              type="number"
              min="0"
              step="any"
              placeholder="0.00"
              value={withoutVatDisplay}
              onChange={(e) => handleWithoutVatChange(e.target.value)}
              onFocus={(e) => e.target.select()}
              style={{ paddingLeft: 26, fontSize: 13 }}
              title="Unit price without VAT (e.g. 100)"
            />
          </div>
          <div
            style={{
              fontSize: 11,
              color: "var(--text-muted)",
              marginTop: 2,
              paddingLeft: 2,
            }}
          >
            Unit (No VAT)
          </div>
        </div>

        {/* Unit With VAT (13%) box */}
        <div style={{ flex: 1, minWidth: 95 }}>
          <div style={{ position: "relative" }}>
            <span
              style={{
                position: "absolute",
                left: 7,
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--accent-teal-light)",
                fontSize: 11,
                fontWeight: 600,
              }}
            >
              Rs
            </span>
            <input
              className="input"
              type="number"
              min="0"
              step="any"
              placeholder="0.00"
              value={withVatDisplay}
              onChange={(e) => handleWithVatChange(e.target.value)}
              onFocus={(e) => e.target.select()}
              style={{
                paddingLeft: 26,
                fontSize: 13,
                borderColor:
                  item.price > 0 ? "rgba(20, 184, 166, 0.4)" : undefined,
              }}
              title="Unit price with 13% VAT (e.g. 113)"
            />
          </div>
          <div
            style={{
              fontSize: 11,
              color: "var(--accent-teal-light)",
              marginTop: 2,
              paddingLeft: 2,
            }}
          >
            Unit (13% VAT)
          </div>
        </div>

        {/* Total Actual Price (Item Total) */}
        <div style={{ flex: 1, minWidth: 105 }}>
          <div style={{ position: "relative" }}>
            <span
              style={{
                position: "absolute",
                left: 7,
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--accent-emerald)",
                fontSize: 11,
                fontWeight: 700,
              }}
            >
              Rs
            </span>
            <input
              className="input"
              type="number"
              min="0"
              step="any"
              placeholder="0.00"
              value={totalPriceDisplay}
              onChange={(e) => handleTotalPriceChange(e.target.value)}
              onFocus={(e) => e.target.select()}
              style={{
                paddingLeft: 26,
                fontSize: 13,
                fontWeight: 700,
                borderColor: "rgba(16, 185, 129, 0.45)",
                color: "var(--accent-emerald)",
              }}
              title="Total actual price for this item (Unit price × Qty)"
            />
          </div>
          <div
            style={{
              fontSize: 11,
              color: "var(--accent-emerald)",
              marginTop: 2,
              paddingLeft: 2,
              fontWeight: 600,
            }}
          >
            Total Price
          </div>
        </div>

        <button
          className="btn btn-danger"
          onClick={onRemove}
          title="Remove item"
          style={{ marginTop: 2 }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {friends.length > 0 && (
        <div style={{ marginTop: 14 }}>
          {/* Friend pills */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 8,
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            {friends.map((f) => {
              const share = item.shares.find((s) => s.friendId === f.id);
              const checked = !!share;
              return (
                <div
                  key={f.id}
                  style={{ display: "flex", alignItems: "center", gap: 6 }}
                >
                  <button
                    type="button"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 10,
                      padding: "6px 12px",
                      borderRadius: 8,
                      border: `1px solid ${checked ? "#f59e0b" : "var(--border)"}`,
                      background: checked
                        ? "rgba(245, 158, 11, 0.08)"
                        : "var(--bg-secondary)",
                      color: checked ? "#fef3c7" : "var(--text-primary)",
                      cursor: "pointer",
                      fontSize: 13,
                      fontWeight: 500,
                      transition: "all 0.15s ease",
                      userSelect: "none",
                    }}
                    onClick={() => toggleFriend(f.id)}
                  >
                    <span>{f.name}</span>
                    <span
                      style={{
                        width: 14,
                        height: 14,
                        borderRadius: 3,
                        background: checked ? "#f59e0b" : "transparent",
                        border: `1.5px solid ${checked ? "#f59e0b" : "var(--border-hover)"}`,
                        display: "inline-block",
                        transition: "all 0.15s ease",
                      }}
                    />
                  </button>
                  {checked && showFractions && (
                    <input
                      className="qty-input"
                      type="text"
                      inputMode="decimal"
                      value={
                        share?.qty !== undefined && share?.qty !== null
                          ? String(Number(share.qty.toFixed(2)))
                          : ""
                      }
                      onChange={(e) => {
                        const val = e.target.value;
                        if (/^[0-9]*\.?[0-9]*$/.test(val)) {
                          updateQty(f.id, val);
                        }
                      }}
                      onFocus={(e) => e.target.select()}
                      onClick={(e) => e.stopPropagation()}
                      title={`How many did ${f.name} have? (e.g. 0.5, 1, 2)`}
                      placeholder="0"
                      style={{ width: 62 }}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {showFractions && mismatch && (
            <div className="warning-banner" style={{ marginBottom: 12 }}>
              Assigned {assignedTotal.toFixed(2)} but item total is{" "}
              {item.totalQty}. Difference:{" "}
              {assignedTotal - item.totalQty > 0 ? "+" : ""}
              {(assignedTotal - item.totalQty).toFixed(2)}
            </div>
          )}

          {/* Bottom actions toolbar */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 8,
              paddingTop: 10,
              borderTop: "1px solid var(--border)",
            }}
          >
            <div>
              <button
                type="button"
                className="btn btn-ghost"
                style={{ padding: "4px 10px", fontSize: 12, borderRadius: 6 }}
                onClick={onDuplicate}
                title="Duplicate this item"
              >
                Duplicate
              </button>
            </div>

            <div
              style={{
                display: "flex",
                gap: 6,
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <button
                type="button"
                className={`btn ${showFractions ? "btn-primary" : "btn-ghost"}`}
                style={{ padding: "4px 10px", fontSize: 12, borderRadius: 6 }}
                onClick={() => {
                  const next = !showFractions;
                  setShowFractions(next);
                  if (next) {
                    if (item.shares.length > 0) {
                      const each =
                        Math.round(
                          ((item.totalQty || 1) / item.shares.length) * 100,
                        ) / 100;
                      onChange({
                        ...item,
                        shares: item.shares.map((s) => ({ ...s, qty: each })),
                      });
                    }
                  } else {
                    onChange({
                      ...item,
                      shares: item.shares.map((s) => ({ ...s, qty: 1 })),
                    });
                  }
                }}
              >
                {showFractions ? "Standard split" : "Assign quantities"}
              </button>

              {showFractions && item.shares.length > 0 && (
                <button
                  type="button"
                  className="btn btn-ghost"
                  style={{
                    padding: "4px 10px",
                    fontSize: 12,
                    borderRadius: 6,
                  }}
                  onClick={() => {
                    const each =
                      Math.round(
                        ((item.totalQty || 1) / item.shares.length) * 100,
                      ) / 100;
                    onChange({
                      ...item,
                      shares: item.shares.map((s) => ({ ...s, qty: each })),
                    });
                  }}
                  title="Distribute item quantity evenly among selected friends"
                >
                  Split evenly
                </button>
              )}

              <button
                type="button"
                className="btn btn-amber"
                style={{ padding: "4px 10px", fontSize: 12, borderRadius: 6 }}
                onClick={() => {
                  const each =
                    showFractions && friends.length > 0
                      ? Math.round(((item.totalQty || 1) / friends.length) * 100) / 100
                      : 1;
                  onChange({
                    ...item,
                    shares: friends.map((f) => ({ friendId: f.id, qty: each })),
                  });
                }}
              >
                Add all friends
              </button>

              {item.shares.length > 0 && (
                <button
                  type="button"
                  className="btn btn-ghost"
                  style={{ padding: "4px 10px", fontSize: 12, borderRadius: 6 }}
                  onClick={() => onChange({ ...item, shares: [] })}
                >
                  Remove all friends
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {friends.length === 0 && (
        <div style={{ marginTop: 8, fontSize: 12, color: "var(--text-muted)" }}>
          Add friends on the left to assign this item
        </div>
      )}
    </div>
  );
}

// ─── Export View ─────────────────────────────────────────────────────────────

interface ExportProps {
  title: string;
  friends: Friend[];
  items: BillItem[];
  flatFee: FeeConfig;
  discount: FeeConfig;
  tax: FeeConfig;
  tip: FeeConfig;
  subtotal: number;
  grandTotal: number;
  personTotals: Record<string, number>;
}

function SummaryExportView({
  title,
  friends,
  items,
  flatFee,
  discount,
  tax,
  tip,
  subtotal,
  grandTotal,
  personTotals,
}: ExportProps) {
  const feeAmount =
    flatFee.type === "flat" ? flatFee.value : (subtotal * flatFee.value) / 100;
  const discountAmount =
    discount.type === "flat"
      ? discount.value
      : (subtotal * discount.value) / 100;
  const taxAmount =
    tax.type === "flat" ? tax.value : (subtotal * tax.value) / 100;
  const tipAmount =
    tip.type === "flat" ? tip.value : (subtotal * tip.value) / 100;

  return (
    <div
      style={{
        background: "#ffffff",
        color: "#0f172a",
        fontFamily:
          "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        padding: "32px 40px 36px 32px",
        width: 860,
        boxSizing: "border-box",
      }}
    >
      {/* ── Header ── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          borderBottom: "2.5px solid #0d9488",
          paddingBottom: 16,
          marginBottom: 24,
        }}
      >
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 3,
            }}
          >
            <span style={{ fontSize: 20 }}>🧾</span>
            <h1
              style={{
                fontSize: 21,
                fontWeight: 800,
                color: "#0f172a",
                margin: 0,
                letterSpacing: "-0.02em",
              }}
            >
              {title || "BillSplit"}
            </h1>
          </div>
          <div style={{ fontSize: 11.5, color: "#64748b" }} suppressHydrationWarning>
            {new Date().toLocaleDateString("en-IN", {
              weekday: "short",
              year: "numeric",
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}{" "}
            • {friends.length} {friends.length === 1 ? "friend" : "friends"} •{" "}
            {items.length} {items.length === 1 ? "item" : "items"}
          </div>
        </div>
        <div
          style={{
            background: "#f0fdfa",
            border: "1.5px solid #0d9488",
            borderRadius: 8,
            padding: "8px 16px",
            textAlign: "right",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              fontSize: 9,
              fontWeight: 700,
              color: "#0f766e",
              textTransform: "uppercase",
              letterSpacing: "0.07em",
              marginBottom: 2,
            }}
          >
            Grand Total
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#0f766e" }}>
            {formatCurrency(grandTotal)}
          </div>
        </div>
      </div>

      {/* ── SECTION 1: Who Owes What ── */}
      <div style={{ marginBottom: 28 }}>
        <div
          style={{
            fontSize: 10.5,
            fontWeight: 700,
            color: "#64748b",
            textTransform: "uppercase",
            letterSpacing: "0.07em",
            marginBottom: 12,
          }}
        >
          👤 Who Owes What
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 10,
          }}
        >
          {friends.map((f) => {
            const total = personTotals[f.id] || 0;
            const myItems = items.filter((item) =>
              item.shares.some((s) => s.friendId === f.id),
            );
            return (
              <div
                key={f.id}
                style={{
                  background: "#fafafa",
                  border: "1px solid #e2e8f0",
                  borderRadius: 8,
                  padding: "10px 12px",
                }}
              >
                {/* Name */}
                <div
                  style={{
                    fontWeight: 800,
                    fontSize: 13.5,
                    color: "#0f172a",
                    textDecoration: "underline",
                    textUnderlineOffset: 3,
                    marginBottom: 2,
                  }}
                >
                  {f.name}
                </div>
                <div
                  style={{
                    fontStyle: "italic",
                    fontSize: 10,
                    color: "#64748b",
                    marginBottom: 7,
                  }}
                >
                  {myItems.length === 0
                    ? "had 0 items"
                    : `had ${myItems.length} ${myItems.length === 1 ? "item" : "items"}:`}
                </div>
                {/* Itemized list */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 2,
                    marginBottom: 8,
                  }}
                >
                  {myItems.map((item) => {
                    const cost = personItemCost(item, f.id);
                    if (cost <= 0) return null;
                    const shareText = formatShareText(item, f.id);
                    return (
                      <div
                        key={item.id}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          fontSize: 10.5,
                          gap: 6,
                        }}
                      >
                        <span
                          style={{ color: "#475569", flex: 1, minWidth: 0 }}
                        >
                          <span style={{ fontStyle: "italic" }}>
                            {item.name || "Unnamed"}
                          </span>
                          {shareText && (
                            <span style={{ color: "#94a3b8", marginLeft: 2 }}>
                              ({shareText})
                            </span>
                          )}
                        </span>
                        <span
                          style={{
                            color: "#0f172a",
                            fontWeight: 600,
                            whiteSpace: "nowrap",
                            flexShrink: 0,
                          }}
                        >
                          {formatCurrency(cost)}
                        </span>
                      </div>
                    );
                  })}
                </div>
                {/* Total */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderTop: "1px solid #e2e8f0",
                    paddingTop: 6,
                  }}
                >
                  <span
                    style={{
                      fontSize: 10.5,
                      fontWeight: 600,
                      color: "#64748b",
                    }}
                  >
                    Total
                  </span>
                  <span
                    style={{
                      fontSize: 13.5,
                      fontWeight: 800,
                      color: "#0d9488",
                    }}
                  >
                    {formatCurrency(total)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── SECTION 2: Bill Items (styled like the app UI cards) ── */}
      <div style={{ marginBottom: 24 }}>
        <div
          style={{
            fontSize: 10.5,
            fontWeight: 700,
            color: "#64748b",
            textTransform: "uppercase",
            letterSpacing: "0.07em",
            marginBottom: 12,
          }}
        >
          🛒 Bill Items &amp; Consumption
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {items.map((item) => {
            const itemTot = getItemTotalPrice(item);
            const assignedShares = item.shares.filter((s) => s.qty > 0);
            return (
              <div
                key={item.id}
                style={{
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: 10,
                  padding: "12px 14px",
                }}
              >
                {/* Top row: name + price info */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 10,
                    marginBottom: 10,
                    flexWrap: "wrap",
                  }}
                >
                  {/* Item name */}
                  <div style={{ flex: "1 1 180px", minWidth: 140 }}>
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: 13,
                        color: "#0f172a",
                      }}
                    >
                      {item.name || "Unnamed Item"}
                    </div>
                  </div>
                  {/* Qty box */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      minWidth: 44,
                    }}
                  >
                    <div
                      style={{
                        background: "#ffffff",
                        border: "1px solid #cbd5e1",
                        borderRadius: 6,
                        paddingTop: 2,
                        paddingBottom: 9,
                        paddingLeft: 12,
                        paddingRight: 12,
                        fontSize: 12,
                        fontWeight: 600,
                        color: "#0f172a",
                        textAlign: "center",
                      }}
                    >
                      {item.totalQty || 1}
                    </div>
                    <div
                      style={{
                        fontSize: 9,
                        color: "#94a3b8",
                        marginTop: 4,
                        textAlign: "center",
                      }}
                    >
                      qty
                    </div>
                  </div>
                  {/* Unit Without VAT */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      minWidth: 100,
                    }}
                  >
                    <div
                      style={{
                        background: "#ffffff",
                        border: "1px solid #cbd5e1",
                        borderRadius: 6,
                        paddingTop: 2,
                        paddingBottom: 9,
                        paddingLeft: 12,
                        paddingRight: 12,
                        fontSize: 11.5,
                        fontWeight: 600,
                        color: "#475569",
                        textAlign: "center",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {formatCurrency(item.price > 0 ? item.price / 1.13 : 0)}
                    </div>
                    <div
                      style={{
                        fontSize: 9,
                        color: "#94a3b8",
                        marginTop: 4,
                        fontWeight: 500,
                        textAlign: "center",
                      }}
                    >
                      Unit (No VAT)
                    </div>
                  </div>
                  {/* Unit With VAT */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      minWidth: 100,
                    }}
                  >
                    <div
                      style={{
                        background: "#f0fdfa",
                        border: "1.5px solid #5eead4",
                        borderRadius: 6,
                        paddingTop: 2,
                        paddingBottom: 9,
                        paddingLeft: 12,
                        paddingRight: 12,
                        fontSize: 11.5,
                        fontWeight: 600,
                        color: "#0f766e",
                        textAlign: "center",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {formatCurrency(item.price)}
                    </div>
                    <div
                      style={{
                        fontSize: 9,
                        color: "#0d9488",
                        marginTop: 4,
                        fontWeight: 500,
                        textAlign: "center",
                      }}
                    >
                      Unit (13% VAT)
                    </div>
                  </div>
                  {/* Total Price */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      minWidth: 110,
                    }}
                  >
                    <div
                      style={{
                        background: "#f0fdf4",
                        border: "1.5px solid #86efac",
                        borderRadius: 6,
                        paddingTop: 2,
                        paddingBottom: 9,
                        paddingLeft: 12,
                        paddingRight: 12,
                        fontSize: 12,
                        fontWeight: 700,
                        color: "#15803d",
                        textAlign: "center",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {formatCurrency(itemTot)}
                    </div>
                    <div
                      style={{
                        fontSize: 9,
                        color: "#16a34a",
                        marginTop: 4,
                        fontWeight: 600,
                        textAlign: "center",
                      }}
                    >
                      Total Price
                    </div>
                  </div>
                </div>

                {/* Friend pills row */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {friends.map((f) => {
                    const isAssigned = assignedShares.some(
                      (s) => s.friendId === f.id,
                    );
                    const shareText = isAssigned
                      ? formatShareText(item, f.id)
                      : "";
                    return (
                      <span
                        key={f.id}
                        style={{
                          display: "inline-block",
                          background: isAssigned ? "#fffbeb" : "#ffffff",
                          border: isAssigned
                            ? "1.5px solid #f59e0b"
                            : "1px solid #e2e8f0",
                          borderRadius: 6,
                          paddingTop: 2,
                          paddingBottom: 10,
                          paddingLeft: 9,
                          paddingRight: 9,
                          fontSize: 11,
                          fontWeight: isAssigned ? 600 : 400,
                          color: isAssigned ? "#1e293b" : "#94a3b8",
                          whiteSpace: "nowrap",
                        }}
                      >
                        <span style={{ verticalAlign: "middle" }}>
                          {f.name}
                        </span>
                        {isAssigned && shareText && (
                          <span
                            style={{
                              fontSize: 9.5,
                              color: "#92400e",
                              fontWeight: 600,
                              verticalAlign: "middle",
                              marginLeft: 4,
                            }}
                          >
                            ({shareText})
                          </span>
                        )}
                        <span
                          style={{
                            width: 11,
                            height: 11,
                            borderRadius: 2,
                            background: isAssigned ? "#f59e0b" : "#e2e8f0",
                            border: isAssigned
                              ? "1px solid #d97706"
                              : "1px solid #cbd5e1",
                            display: "inline-block",
                            verticalAlign: "middle",
                            marginLeft: 6,
                            marginTop: 10,
                          }}
                        />
                      </span>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── SECTION 3: Bill Summary ── */}
      <div>
        <div
          style={{
            fontSize: 10.5,
            fontWeight: 700,
            color: "#64748b",
            textTransform: "uppercase",
            letterSpacing: "0.07em",
            marginBottom: 10,
          }}
        >
          📋 Bill Summary
        </div>
        <div
          style={{
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
            borderRadius: 8,
            padding: "14px 16px",
            fontSize: 12,
            maxWidth: 360,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 7,
            }}
          >
            <span style={{ color: "#64748b" }}>
              Subtotal ({items.length} items)
            </span>
            <span style={{ fontWeight: 600 }}>{formatCurrency(subtotal)}</span>
          </div>
          {feeAmount !== 0 && (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 7,
              }}
            >
              <span style={{ color: "#64748b" }}>+ Flat Fee</span>
              <span style={{ fontWeight: 600 }}>
                +{formatCurrency(feeAmount)}
              </span>
            </div>
          )}
          {taxAmount !== 0 && (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 7,
              }}
            >
              <span style={{ color: "#64748b" }}>+ Tax</span>
              <span style={{ fontWeight: 600 }}>
                +{formatCurrency(taxAmount)}
              </span>
            </div>
          )}
          {discountAmount !== 0 && (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 7,
              }}
            >
              <span style={{ color: "#64748b" }}>- Discount</span>
              <span style={{ fontWeight: 600, color: "#10b981" }}>
                -{formatCurrency(discountAmount)}
              </span>
            </div>
          )}
          {tipAmount !== 0 && (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 7,
              }}
            >
              <span style={{ color: "#64748b" }}>+ Tip</span>
              <span style={{ fontWeight: 600 }}>
                +{formatCurrency(tipAmount)}
              </span>
            </div>
          )}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              paddingTop: 10,
              marginTop: 6,
              borderTop: "2px solid #0d9488",
            }}
          >
            <span style={{ fontWeight: 800, fontSize: 13 }}>Grand Total</span>
            <span style={{ fontWeight: 800, fontSize: 15, color: "#0d9488" }}>
              {formatCurrency(grandTotal)}
            </span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          marginTop: 24,
          paddingTop: 10,
          borderTop: "1px solid #e2e8f0",
          display: "flex",
          justifyContent: "space-between",
          fontSize: 10.5,
          color: "#94a3b8",
        }}
      >
        <span>Generated by BillSplit</span>
        <span>Fair &amp; Effortless Bill Splitting</span>
      </div>
    </div>
  );
}

// ─── Fee Row Component ────────────────────────────────────────────────────────

function FeeRow({
  label,
  config,
  onChange,
}: {
  label: string;
  config: FeeConfig;
  onChange: (c: FeeConfig) => void;
}) {
  return (
    <div className="total-row">
      <span style={{ color: "var(--text-secondary)", fontSize: 13 }}>
        {label}
      </span>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <button
          type="button"
          className={`btn ${config.type === "flat" ? "btn-primary" : "btn-ghost"}`}
          style={{ padding: "3px 9px", fontSize: 12, borderRadius: 6 }}
          onClick={() => onChange({ ...config, type: "flat" })}
        >
          Flat
        </button>
        <button
          type="button"
          className={`btn ${config.type === "percent" ? "btn-primary" : "btn-ghost"}`}
          style={{ padding: "3px 9px", fontSize: 12, borderRadius: 6 }}
          onClick={() => onChange({ ...config, type: "percent" })}
        >
          %
        </button>
        <div style={{ position: "relative", width: 90 }}>
          {config.type === "flat" && (
            <span
              style={{
                position: "absolute",
                left: 7,
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--text-muted)",
                fontSize: 11,
                fontWeight: 600,
                pointerEvents: "none",
              }}
            >
              Rs
            </span>
          )}
          <input
            className="qty-input"
            type="text"
            inputMode="decimal"
            value={config.value === 0 ? "" : String(config.value)}
            onChange={(e) => {
              const val = e.target.value;
              if (val === "") {
                onChange({ ...config, value: 0 });
              } else if (/^[0-9]*\.?[0-9]*$/.test(val)) {
                const num = parseFloat(val);
                onChange({ ...config, value: isNaN(num) ? 0 : num });
              }
            }}
            onFocus={(e) => e.target.select()}
            style={{
              width: 90,
              paddingLeft: config.type === "flat" ? 26 : 8,
              paddingRight: config.type === "percent" ? 22 : 8,
              textAlign: config.type === "flat" ? "left" : "center",
            }}
            placeholder="0"
          />
          {config.type === "percent" && (
            <span
              style={{
                position: "absolute",
                right: 8,
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--text-muted)",
                fontSize: 13,
                pointerEvents: "none",
              }}
            >
              %
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function BillSplitPage() {
  const isLoadedRef = useRef(false);

  const [billTitle, setBillTitle] = useState("Dinner with Friends");
  const [friends, setFriends] = useState<Friend[]>([]);
  const [newFriendName, setNewFriendName] = useState("");
  const [items, setItems] = useState<BillItem[]>([
    { id: uid(), name: "", price: 0, totalQty: 1, shares: [] },
  ]);
  const [flatFee, setFlatFee] = useState<FeeConfig>({ type: "flat", value: 0 });
  const [discount, setDiscount] = useState<FeeConfig>({
    type: "flat",
    value: 0,
  });
  const [tax, setTax] = useState<FeeConfig>({ type: "percent", value: 0 });
  const [tip, setTip] = useState<FeeConfig>({ type: "percent", value: 0 });

  // Persistence state
  const [isHydrated, setIsHydrated] = useState(false);
  const [savedBills, setSavedBills] = useState<SavedBill[]>([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving">("saved");

  // JSON Export / Import state
  const [showJsonModal, setShowJsonModal] = useState(false);
  const [jsonTab, setJsonTab] = useState<"export" | "import">("export");
  const [jsonPasteText, setJsonPasteText] = useState("");
  const [importStatusMessage, setImportStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Export
  const [exporting, setExporting] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  // ─── Load from LocalStorage on mount ───
  useEffect(() => {
    try {
      const currentDraft = localStorage.getItem("billsplit_current_draft");
      if (currentDraft) {
        const parsed = JSON.parse(currentDraft);
        if (parsed.billTitle !== undefined) setBillTitle(parsed.billTitle);
        if (Array.isArray(parsed.friends))
          setFriends(sanitizeFriends(parsed.friends));
        if (Array.isArray(parsed.items) && parsed.items.length > 0)
          setItems(sanitizeItems(parsed.items));
        if (parsed.flatFee) setFlatFee(sanitizeFee(parsed.flatFee, "flat"));
        if (parsed.discount) setDiscount(sanitizeFee(parsed.discount, "flat"));
        if (parsed.tax) setTax(sanitizeFee(parsed.tax, "percent"));
        if (parsed.tip) setTip(sanitizeFee(parsed.tip, "percent"));
      }

      const storedHistory = localStorage.getItem("billsplit_saved_history");
      if (storedHistory) {
        const parsedHistory = JSON.parse(storedHistory);
        if (Array.isArray(parsedHistory))
          setSavedBills(sanitizeSavedBills(parsedHistory));
      }
    } catch (err) {
      console.error("Failed to load saved bill data from localStorage", err);
    } finally {
      setIsHydrated(true);
      isLoadedRef.current = true;
    }
  }, []);

  // ─── Auto-save to LocalStorage whenever state updates ───
  useEffect(() => {
    if (!isHydrated || !isLoadedRef.current) return;
    setSaveStatus("saving");
    const timeout = setTimeout(() => {
      try {
        const draft = {
          billTitle,
          friends,
          items,
          flatFee,
          discount,
          tax,
          tip,
          updatedAt: new Date().toISOString(),
        };
        localStorage.setItem("billsplit_current_draft", JSON.stringify(draft));
        setSaveStatus("saved");
      } catch (err) {
        console.error("Auto-save failed", err);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [billTitle, friends, items, flatFee, discount, tax, tip, isHydrated]);

  // ─── Computed totals ───
  const subtotal = items.reduce((s, i) => s + getItemTotalPrice(i), 0);
  const feeAmount =
    flatFee.type === "flat"
      ? flatFee.value
      : (subtotal * (flatFee.value || 0)) / 100;
  const discountAmount =
    discount.type === "flat"
      ? discount.value
      : (subtotal * (discount.value || 0)) / 100;
  const taxAmount =
    tax.type === "flat" ? tax.value : (subtotal * (tax.value || 0)) / 100;
  const tipAmount =
    tip.type === "flat" ? tip.value : (subtotal * (tip.value || 0)) / 100;
  const grandTotal = Math.max(
    0,
    subtotal + feeAmount - discountAmount + taxAmount + tipAmount,
  );

  const personSubtotals: Record<string, number> = {};
  friends.forEach((f) => {
    personSubtotals[f.id] = items.reduce(
      (s, item) => s + personItemCost(item, f.id),
      0,
    );
  });
  const personTotals: Record<string, number> = {};
  const totalSubtotal = Object.values(personSubtotals).reduce(
    (s, v) => s + v,
    0,
  );
  friends.forEach((f) => {
    const ratio =
      totalSubtotal > 0
        ? personSubtotals[f.id] / totalSubtotal
        : 1 / Math.max(friends.length, 1);
    personTotals[f.id] =
      personSubtotals[f.id] +
      (feeAmount - discountAmount + taxAmount + tipAmount) * ratio;
  });

  // ─── Friends handlers ───
  function addFriend() {
    const name = newFriendName.trim();
    if (!name) return;
    setFriends((prev) => [...prev, { id: uid(), name, colorIdx: prev.length }]);
    setNewFriendName("");
  }

  function removeFriend(fid: string) {
    setFriends((prev) => prev.filter((f) => f.id !== fid));
    setItems((prev) =>
      prev.map((item) => ({
        ...item,
        shares: item.shares.filter((s) => s.friendId !== fid),
      })),
    );
  }

  // ─── Items handlers ───
  function addItem() {
    setItems((prev) => [
      ...prev,
      { id: uid(), name: "", price: 0, totalQty: 1, shares: [] },
    ]);
  }

  // ─── Save snapshot to History ───
  function saveToHistory() {
    const newBill: SavedBill = {
      id: uid(),
      title: billTitle.trim() || "Untitled Bill",
      date: new Date().toLocaleDateString("en-IN", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      friends,
      items,
      flatFee,
      discount,
      tax,
      tip,
      grandTotal,
    };
    const updated = [newBill, ...savedBills.filter((b) => b.id !== newBill.id)];
    setSavedBills(updated);
    localStorage.setItem("billsplit_saved_history", JSON.stringify(updated));
    alert("Bill saved to your saved bills history!");
  }

  function loadSavedBill(bill: SavedBill) {
    setBillTitle(bill.title);
    setFriends(bill.friends);
    setItems(bill.items);
    setFlatFee(bill.flatFee);
    setDiscount(bill.discount);
    setTax(bill.tax);
    setTip(bill.tip);
    setShowHistoryModal(false);
  }

  function deleteSavedBill(id: string) {
    const updated = savedBills.filter((b) => b.id !== id);
    setSavedBills(updated);
    localStorage.setItem("billsplit_saved_history", JSON.stringify(updated));
  }

  function handleResetNewBill() {
    if (
      confirm(
        "Start a new bill? Make sure to save the current bill to history if you need it later.",
      )
    ) {
      setBillTitle("New Bill");
      setFriends([]);
      setItems([{ id: uid(), name: "", price: 0, totalQty: 1, shares: [] }]);
      setFlatFee({ type: "flat", value: 0 });
      setDiscount({ type: "flat", value: 0 });
      setTax({ type: "percent", value: 0 });
      setTip({ type: "percent", value: 0 });
    }
  }

  // ─── JSON Export & Import Handlers ───
  function loadBillData(data: {
    billTitle?: string;
    title?: string;
    friends?: unknown;
    items?: unknown;
    flatFee?: unknown;
    discount?: unknown;
    tax?: unknown;
    tip?: unknown;
  }) {
    if (data.billTitle !== undefined) setBillTitle(String(data.billTitle));
    else if (data.title !== undefined) setBillTitle(String(data.title));

    if (Array.isArray(data.friends)) {
      setFriends(sanitizeFriends(data.friends));
    }
    if (Array.isArray(data.items)) {
      const sItems = sanitizeItems(data.items);
      setItems(
        sItems.length > 0
          ? sItems
          : [{ id: uid(), name: "", price: 0, totalQty: 1, shares: [] }],
      );
    }
    if (data.flatFee) setFlatFee(sanitizeFee(data.flatFee, "flat"));
    if (data.discount) setDiscount(sanitizeFee(data.discount, "flat"));
    if (data.tax) setTax(sanitizeFee(data.tax, "percent"));
    if (data.tip) setTip(sanitizeFee(data.tip, "percent"));
  }

  function exportCurrentBillJSON() {
    const payload = {
      version: 1,
      type: "billsplit_current_bill",
      exportedAt: new Date().toISOString(),
      bill: {
        title: billTitle.trim() || "Untitled Bill",
        friends,
        items,
        flatFee,
        discount,
        tax,
        tip,
        grandTotal,
      },
    };
    const safeTitle = (billTitle.trim() || "Bill").replace(
      /[^a-zA-Z0-9_-]/g,
      "_",
    );
    downloadJSON(payload, `${safeTitle}_current_bill.json`);
  }

  function exportFullBackupJSON() {
    const payload = {
      version: 1,
      type: "billsplit_full_backup",
      exportedAt: new Date().toISOString(),
      currentBill: {
        title: billTitle.trim() || "Untitled Bill",
        friends,
        items,
        flatFee,
        discount,
        tax,
        tip,
        grandTotal,
      },
      savedBills,
    };
    const dateStr = new Date().toLocaleDateString("en-IN").replace(/\//g, "-");
    downloadJSON(payload, `BillSplit_Full_Backup_${dateStr}.json`);
  }

  function exportSavedBillJSON(bill: SavedBill) {
    const payload = {
      version: 1,
      type: "billsplit_saved_bill",
      exportedAt: new Date().toISOString(),
      bill,
    };
    const safeTitle = (bill.title.trim() || "Bill").replace(
      /[^a-zA-Z0-9_-]/g,
      "_",
    );
    downloadJSON(payload, `${safeTitle}_bill.json`);
  }

  function exportAllSavedBillsJSON() {
    const payload = {
      version: 1,
      type: "billsplit_saved_history",
      exportedAt: new Date().toISOString(),
      savedBills,
    };
    const dateStr = new Date().toLocaleDateString("en-IN").replace(/\//g, "-");
    downloadJSON(payload, `BillSplit_Saved_Bills_${dateStr}.json`);
  }

  function processImportedJSON(parsed: any): boolean {
    if (!parsed || typeof parsed !== "object") {
      setImportStatusMessage({
        type: "error",
        text: "Invalid JSON structure.",
      });
      return false;
    }

    // Case 1: Full Backup
    if (
      parsed.type === "billsplit_full_backup" ||
      (parsed.savedBills &&
        (parsed.currentBill || parsed.currentDraft || parsed.bill))
    ) {
      const billData =
        parsed.currentBill || parsed.currentDraft || parsed.bill;
      if (billData) loadBillData(billData);
      if (Array.isArray(parsed.savedBills)) {
        const importedSaved = sanitizeSavedBills(parsed.savedBills);
        setSavedBills((prev) => {
          const existingIds = new Set(prev.map((b) => b.id));
          const newOnes = importedSaved.filter((b) => !existingIds.has(b.id));
          const merged = [...newOnes, ...prev];
          localStorage.setItem(
            "billsplit_saved_history",
            JSON.stringify(merged),
          );
          return merged;
        });
      }
      setImportStatusMessage({
        type: "success",
        text: `Full backup restored! Loaded bill and synced ${parsed.savedBills?.length || 0} saved bills.`,
      });
      return true;
    }

    // Case 2: Array of Saved Bills
    if (
      Array.isArray(parsed) ||
      (parsed.type === "billsplit_saved_history" &&
        Array.isArray(parsed.savedBills))
    ) {
      const list = Array.isArray(parsed) ? parsed : parsed.savedBills;
      const importedSaved = sanitizeSavedBills(list);
      if (importedSaved.length > 0) {
        setSavedBills((prev) => {
          const existingIds = new Set(prev.map((b) => b.id));
          const newOnes = importedSaved.filter((b) => !existingIds.has(b.id));
          const merged = [...newOnes, ...prev];
          localStorage.setItem(
            "billsplit_saved_history",
            JSON.stringify(merged),
          );
          return merged;
        });
        setImportStatusMessage({
          type: "success",
          text: `Successfully imported ${importedSaved.length} saved bills into history!`,
        });
        return true;
      }
    }

    // Case 3: Single Bill (either wrapped or unwrapped)
    const singleBill = parsed.bill || parsed;
    if (
      singleBill &&
      (Array.isArray(singleBill.friends) ||
        Array.isArray(singleBill.items) ||
        singleBill.title ||
        singleBill.billTitle)
    ) {
      loadBillData(singleBill);
      const title = singleBill.title || singleBill.billTitle || "Bill";
      setImportStatusMessage({
        type: "success",
        text: `Successfully loaded bill: "${title}" with ${singleBill.friends?.length || 0} friends and ${singleBill.items?.length || 0} items!`,
      });
      return true;
    }

    setImportStatusMessage({
      type: "error",
      text: "Could not recognize BillSplit data in this JSON.",
    });
    return false;
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        processImportedJSON(parsed);
      } catch (err) {
        setImportStatusMessage({
          type: "error",
          text:
            "Failed to parse JSON file: " +
            (err instanceof Error ? err.message : "Invalid JSON"),
        });
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsText(file);
  }

  function handlePasteImport() {
    if (!jsonPasteText.trim()) {
      setImportStatusMessage({
        type: "error",
        text: "Please paste some JSON text first.",
      });
      return;
    }
    try {
      const parsed = JSON.parse(jsonPasteText);
      const success = processImportedJSON(parsed);
      if (success) {
        setJsonPasteText("");
      }
    } catch (err) {
      setImportStatusMessage({
        type: "error",
        text:
          "Invalid JSON format: " +
          (err instanceof Error ? err.message : "Syntax error"),
      });
    }
  }

  // ─── Export Handlers ───
  const handleExportPDF = useCallback(async () => {
    if (!exportRef.current) return;
    setExporting(true);
    try {
      const el = exportRef.current;
      const canvas = await html2canvas(el, {
        backgroundColor: "#ffffff",
        scale: 2,
        useCORS: true,
        logging: false,
        width: el.scrollWidth,
        height: el.scrollHeight,
        windowWidth: el.scrollWidth,
        windowHeight: el.scrollHeight,
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "px",
        format: [canvas.width / 2, canvas.height / 2],
      });
      pdf.addImage(imgData, "PNG", 0, 0, canvas.width / 2, canvas.height / 2);
      const safeTitle =
        billTitle.replace(/[^a-zA-Z0-9_-]/g, "_") || "BillSplit";
      pdf.save(
        `${safeTitle}_${new Date().toLocaleDateString("en-IN").replace(/\//g, "-")}.pdf`,
      );
    } finally {
      setExporting(false);
    }
  }, [billTitle]);

  const handleExportImage = useCallback(async () => {
    if (!exportRef.current) return;
    setExporting(true);
    try {
      const el = exportRef.current;
      const canvas = await html2canvas(el, {
        backgroundColor: "#ffffff",
        scale: 2,
        useCORS: true,
        logging: false,
        width: el.scrollWidth,
        height: el.scrollHeight,
        windowWidth: el.scrollWidth,
        windowHeight: el.scrollHeight,
      });
      const link = document.createElement("a");
      const safeTitle =
        billTitle.replace(/[^a-zA-Z0-9_-]/g, "_") || "BillSplit";
      link.download = `${safeTitle}_${new Date().toLocaleDateString("en-IN").replace(/\//g, "-")}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } finally {
      setExporting(false);
    }
  }, [billTitle]);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)" }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 1150px) { .main-grid { grid-template-columns: 310px 1fr !important; } .summary-col { grid-column: 1 / -1; } }
        @media (max-width: 768px) { .main-grid { grid-template-columns: 1fr !important; } }
      `}</style>

      {/* Header */}
      <header
        style={{
          background: "rgba(15,17,23,0.88)",
          borderBottom: "1px solid var(--border)",
          padding: "14px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
          position: "sticky",
          top: 0,
          zIndex: 50,
          backdropFilter: "blur(12px)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background:
                "linear-gradient(135deg, var(--accent-teal), var(--accent-violet))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 18,
            }}
          >
            🧾
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                value={billTitle}
                onChange={(e) => setBillTitle(e.target.value)}
                placeholder="Bill Title..."
                style={{
                  background: "transparent",
                  border: "none",
                  borderBottom: "1px dashed var(--border-hover)",
                  color: "var(--text-primary)",
                  fontSize: 18,
                  fontWeight: 700,
                  outline: "none",
                  padding: "2px 4px",
                  minWidth: 180,
                }}
                title="Click to edit bill title"
              />
              <span
                className="status-badge"
                title="Changes auto-saved to your browser automatically"
              >
                <span
                  className="status-dot"
                  style={
                    saveStatus === "saving"
                      ? {
                          background: "var(--accent-amber)",
                          boxShadow: "0 0 8px var(--accent-amber)",
                        }
                      : {}
                  }
                ></span>
                {saveStatus === "saving" ? "Saving..." : "Auto-saved"}
              </span>
            </div>
            <div
              style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}
            >
              Fair and effortless bill splitting
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div
          style={{
            display: "flex",
            gap: 8,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <button
            className="btn btn-ghost"
            onClick={() => setShowHistoryModal(true)}
            title="View previously saved bills"
            suppressHydrationWarning
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            Saved Bills ({isHydrated ? savedBills.length : 0})
          </button>
          <button
            className="btn btn-ghost"
            onClick={saveToHistory}
            title="Save a permanent snapshot of this bill"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
              <polyline points="17 21 17 13 7 13 7 21" />
              <polyline points="7 3 7 8 15 8" />
            </svg>
            Save Bill
          </button>
          <button
            className="btn btn-ghost"
            onClick={handleResetNewBill}
            title="Clear and start new bill"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
              <path d="M21 3v5h-5" />
              <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
              <path d="M3 21v-5h5" />
            </svg>
            New Bill
          </button>
          <button
            className="btn btn-ghost"
            onClick={() => {
              setImportStatusMessage(null);
              setShowJsonModal(true);
            }}
            title="Export or Import bill data as JSON"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="16 18 22 12 16 6" />
              <polyline points="8 6 2 12 8 18" />
            </svg>
            JSON
          </button>
          <button
            className="btn btn-ghost"
            onClick={handleExportImage}
            disabled={exporting || friends.length === 0}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Image
          </button>
          <button
            className="btn btn-amber"
            onClick={handleExportPDF}
            disabled={exporting || friends.length === 0}
            id="export-pdf-btn"
          >
            {exporting ? (
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                style={{ animation: "spin 1s linear infinite" }}
              >
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
              </svg>
            ) : (
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="12" y1="18" x2="12" y2="12" />
                <line x1="9" y1="15" x2="15" y2="15" />
              </svg>
            )}
            PDF
          </button>
        </div>
      </header>

      {/* Main Grid */}
      <div
        className="main-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "310px 1fr 290px",
          gap: 0,
          maxWidth: 1720,
          margin: "0 auto",
          padding: "24px 20px",
          alignItems: "start",
        }}
      >
        {/* LEFT: Friends */}
        <aside style={{ paddingRight: 20, position: "sticky", top: 100 }}>
          <div className="section-header">
            <h2 className="section-title">
              <span style={{ fontSize: 18 }}>&#128101;</span> Friends
              <span
                style={{
                  background: "var(--accent-teal)",
                  color: "white",
                  borderRadius: 20,
                  padding: "1px 8px",
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                {friends.length}
              </span>
            </h2>
          </div>
          <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
            <input
              id="add-friend-input"
              className="input"
              placeholder="Friend's name..."
              value={newFriendName}
              onChange={(e) => setNewFriendName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addFriend()}
            />
            <button
              className="btn btn-primary"
              onClick={addFriend}
              id="add-friend-btn"
              style={{ flexShrink: 0, padding: "10px 12px" }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
          </div>
          {friends.length === 0 && (
            <div
              style={{
                textAlign: "center",
                padding: "28px 0",
                color: "var(--text-muted)",
                fontSize: 13,
              }}
            >
              <div style={{ fontSize: 28, marginBottom: 8 }}>&#129309;</div>
              Add friends to
              <br />
              start splitting
            </div>
          )}
          {friends.map((f) => {
            const total = personTotals[f.id] || 0;
            const myItems = items.filter((item) =>
              item.shares.some((s) => s.friendId === f.id),
            );
            return (
              <div
                key={f.id}
                style={{
                  background: "var(--bg-secondary)",
                  border: "1px solid var(--border)",
                  borderRadius: 10,
                  padding: "14px 16px",
                  marginBottom: 12,
                  position: "relative",
                  transition: "all 0.15s ease",
                }}
              >
                {/* Header: Underlined Name + Close button */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    marginBottom: 4,
                  }}
                >
                  <h3
                    style={{
                      fontWeight: 800,
                      fontSize: 18,
                      color: "var(--text-primary)",
                      textDecoration: "underline",
                      textUnderlineOffset: 4,
                      letterSpacing: "-0.01em",
                      margin: 0,
                    }}
                  >
                    {f.name}
                  </h3>
                  <button
                    onClick={() => removeFriend(f.id)}
                    title="Remove friend"
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "var(--text-muted)",
                      cursor: "pointer",
                      fontSize: 14,
                      lineHeight: 1,
                      padding: "2px 4px",
                      borderRadius: 4,
                    }}
                  >
                    ✕
                  </button>
                </div>

                {/* Subtitle: had X items: */}
                <div
                  style={{
                    fontStyle: "italic",
                    fontSize: 13,
                    color: "var(--text-muted)",
                    marginBottom: 8,
                  }}
                >
                  {myItems.length === 0
                    ? "had 0 items"
                    : `had ${myItems.length} ${myItems.length === 1 ? "item" : "items"}:`}
                </div>

                {/* Items breakdown with individual prices */}
                {myItems.length > 0 && (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 4,
                      marginBottom: 8,
                    }}
                  >
                    {myItems.map((item) => {
                      const cost = personItemCost(item, f.id);
                      if (cost <= 0) return null;
                      const shareText = formatShareText(item, f.id);
                      return (
                        <div
                          key={item.id}
                          style={{
                            fontSize: 12,
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            gap: 8,
                          }}
                        >
                          <span
                            style={{
                              color: "var(--text-secondary)",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            <span style={{ fontStyle: "italic" }}>
                              {item.name || "Unnamed"}
                            </span>
                            {shareText && (
                              <span
                                style={{
                                  fontSize: 11,
                                  color: "var(--text-muted)",
                                  marginLeft: 4,
                                }}
                              >
                                ({shareText})
                              </span>
                            )}
                          </span>
                          <span
                            style={{
                              color: "var(--text-primary)",
                              fontWeight: 500,
                              whiteSpace: "nowrap",
                              fontSize: 12,
                            }}
                          >
                            {formatCurrency(cost)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Total row at the bottom */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderTop: "1px solid var(--border)",
                    paddingTop: 8,
                    marginTop: 4,
                  }}
                >
                  <span
                    style={{
                      fontWeight: 600,
                      fontSize: 13,
                      color: "var(--text-secondary)",
                    }}
                  >
                    Total
                  </span>
                  <span
                    style={{
                      fontSize: 15,
                      fontWeight: 700,
                      color: "var(--accent-teal-light)",
                    }}
                  >
                    {formatCurrency(total)}
                  </span>
                </div>
              </div>
            );
          })}
        </aside>

        {/* CENTER: Items */}
        <main
          style={{
            padding: "0 28px",
            borderLeft: "1px solid var(--border)",
            borderRight: "1px solid var(--border)",
            minHeight: "70vh",
          }}
        >
          <div className="section-header">
            <h2 className="section-title">
              <span style={{ fontSize: 18 }}>&#128722;</span> Bill Items
              <span
                style={{
                  background: "var(--bg-secondary)",
                  color: "var(--text-secondary)",
                  borderRadius: 20,
                  padding: "1px 8px",
                  fontSize: 12,
                  fontWeight: 700,
                  border: "1px solid var(--border)",
                }}
              >
                {items.length}
              </span>
            </h2>
            <button
              className="btn btn-primary"
              onClick={addItem}
              id="add-item-btn"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Add Item
            </button>
          </div>
          {items.length === 0 && (
            <div
              style={{
                textAlign: "center",
                padding: "48px 0",
                color: "var(--text-muted)",
              }}
            >
              <div style={{ fontSize: 36, marginBottom: 10 }}>&#128203;</div>
              <div style={{ fontSize: 15, fontWeight: 500 }}>No items yet</div>
              <div style={{ fontSize: 13, marginTop: 4 }}>
                Click &quot;Add Item&quot; to start
              </div>
            </div>
          )}
          {items.map((item) => (
            <ItemRow
              key={item.id}
              item={item}
              friends={friends}
              onChange={(updated) =>
                setItems((prev) =>
                  prev.map((i) => (i.id === item.id ? updated : i)),
                )
              }
              onRemove={() =>
                setItems((prev) => prev.filter((i) => i.id !== item.id))
              }
              onDuplicate={() => {
                setItems((prev) => {
                  const index = prev.findIndex((i) => i.id === item.id);
                  const copy: BillItem = {
                    ...item,
                    id: uid(),
                    name: item.name ? `${item.name} (Copy)` : "",
                    shares: item.shares.map((s) => ({ ...s })),
                  };
                  const next = [...prev];
                  next.splice(index + 1, 0, copy);
                  return next;
                });
              }}
              onSplitIntoIndividuals={(newItems) =>
                setItems((prev) => {
                  const idx = prev.findIndex((i) => i.id === item.id);
                  const next = [...prev];
                  next.splice(idx, 1, ...newItems);
                  return next;
                })
              }
            />
          ))}
          <button
            className="btn btn-ghost"
            onClick={addItem}
            style={{
              width: "100%",
              justifyContent: "center",
              marginTop: 4,
              borderStyle: "dashed",
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add another item
          </button>
        </main>

        {/* RIGHT: Totals */}
        <aside
          className="summary-col"
          style={{ paddingLeft: 20, position: "sticky", top: 100 }}
        >
          <div
            className="card"
            style={{ padding: "18px 20px", marginBottom: 16 }}
          >
            <h3
              className="section-title"
              style={{ marginBottom: 14, fontSize: 15 }}
            >
              <span style={{ fontSize: 17 }}>&#129518;</span> Bill Totals
            </h3>
            <div className="total-row">
              <span style={{ color: "var(--text-secondary)", fontSize: 13 }}>
                Subtotal ({items.length} items)
              </span>
              <span className="total-amount">{formatCurrency(subtotal)}</span>
            </div>
            <FeeRow label="Flat Fees" config={flatFee} onChange={setFlatFee} />
            <FeeRow label="Tax" config={tax} onChange={setTax} />
            <FeeRow label="Discount" config={discount} onChange={setDiscount} />
            <FeeRow label="Tip" config={tip} onChange={setTip} />

            {/* Arithmetic Breakdown */}
            <div
              style={{
                marginTop: 12,
                padding: "10px 12px",
                background: "var(--bg-secondary)",
                borderRadius: 10,
                border: "1px solid var(--border)",
                fontSize: 12,
                display: "flex",
                flexDirection: "column",
                gap: 5,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  color: "var(--text-secondary)",
                }}
              >
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              {feeAmount > 0 && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    color: "var(--text-secondary)",
                  }}
                >
                  <span>
                    + Flat Fees{" "}
                    {flatFee.type === "percent" ? `(${flatFee.value}%)` : ""}
                  </span>
                  <span>+{formatCurrency(feeAmount)}</span>
                </div>
              )}
              {taxAmount > 0 && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    color: "var(--text-secondary)",
                  }}
                >
                  <span>
                    + Tax {tax.type === "percent" ? `(${tax.value}%)` : ""}
                  </span>
                  <span>+{formatCurrency(taxAmount)}</span>
                </div>
              )}
              {discountAmount > 0 && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    color: "var(--accent-emerald)",
                  }}
                >
                  <span>
                    - Discount{" "}
                    {discount.type === "percent" ? `(${discount.value}%)` : ""}
                  </span>
                  <span>-{formatCurrency(discountAmount)}</span>
                </div>
              )}
              {tipAmount > 0 && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    color: "var(--text-secondary)",
                  }}
                >
                  <span>
                    + Tip {tip.type === "percent" ? `(${tip.value}%)` : ""}
                  </span>
                  <span>+{formatCurrency(tipAmount)}</span>
                </div>
              )}
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: 12,
                paddingTop: 12,
                borderTop: "2px solid var(--border)",
                fontWeight: 700,
                fontSize: 18,
              }}
            >
              <span>Grand Total</span>
              <span style={{ color: "var(--accent-teal-light)" }}>
                {formatCurrency(grandTotal)}
              </span>
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
            <button
              className="btn btn-ghost"
              onClick={() => {
                setImportStatusMessage(null);
                setShowJsonModal(true);
              }}
              style={{ flex: 1, justifyContent: "center" }}
              title="Export or Import JSON"
            >
              {`{ }`} JSON
            </button>
            <button
              className="btn btn-ghost"
              onClick={handleExportImage}
              disabled={exporting || friends.length === 0}
              style={{ flex: 1, justifyContent: "center" }}
            >
              &#128247; Image
            </button>
            <button
              className="btn btn-amber"
              onClick={handleExportPDF}
              disabled={exporting || friends.length === 0}
              style={{ flex: 1, justifyContent: "center" }}
            >
              &#128196; PDF
            </button>
          </div>
        </aside>
      </div>

      {/* ─── Saved Bills History Modal ─── */}
      {showHistoryModal && (
        <div
          className="modal-backdrop"
          onClick={() => setShowHistoryModal(false)}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 18,
                flexWrap: "wrap",
                gap: 8,
              }}
            >
              <h2 style={{ fontSize: 18, fontWeight: 700 }}>
                📜 Saved Bills History
              </h2>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                {savedBills.length > 0 && (
                  <button
                    className="btn btn-ghost"
                    onClick={exportAllSavedBillsJSON}
                    style={{ padding: "4px 10px", fontSize: 12 }}
                    title="Export all saved bills as JSON"
                  >
                    Export All JSON
                  </button>
                )}
                <button
                  className="btn btn-ghost"
                  onClick={() => {
                    setShowHistoryModal(false);
                    setJsonTab("import");
                    setImportStatusMessage(null);
                    setShowJsonModal(true);
                  }}
                  style={{ padding: "4px 10px", fontSize: 12 }}
                  title="Import bills from JSON"
                >
                  Import JSON
                </button>
                <button
                  className="btn btn-ghost"
                  onClick={() => setShowHistoryModal(false)}
                  style={{ padding: "4px 8px" }}
                >
                  ✕
                </button>
              </div>
            </div>

            {savedBills.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "36px 0",
                  color: "var(--text-muted)",
                }}
              >
                <div style={{ fontSize: 32, marginBottom: 8 }}>💾</div>
                <div style={{ fontWeight: 500 }}>No saved bills yet</div>
                <div style={{ fontSize: 13, marginTop: 4 }}>
                  Click &quot;Save Bill&quot; in the header to save the current
                  bill for future reference.
                </div>
              </div>
            ) : (
              <div
                style={{ display: "flex", flexDirection: "column", gap: 10 }}
              >
                {savedBills.map((bill) => (
                  <div
                    key={bill.id}
                    style={{
                      background: "var(--bg-secondary)",
                      border: "1px solid var(--border)",
                      borderRadius: 12,
                      padding: "14px 16px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 12,
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontWeight: 600,
                          fontSize: 15,
                          color: "var(--text-primary)",
                        }}
                      >
                        {bill.title}
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: "var(--text-muted)",
                          marginTop: 2,
                        }}
                      >
                        {bill.date} • {bill.friends.length} friends •{" "}
                        {bill.items.length} items
                      </div>
                      <div
                        style={{
                          fontSize: 13,
                          color: "var(--accent-teal-light)",
                          fontWeight: 700,
                          marginTop: 4,
                        }}
                      >
                        Total: {formatCurrency(bill.grandTotal)}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <button
                        className="btn btn-ghost"
                        onClick={() => exportSavedBillJSON(bill)}
                        title="Export this bill as JSON"
                        style={{ padding: "6px 10px", fontSize: 12 }}
                      >
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="7 10 12 15 17 10" />
                          <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                        JSON
                      </button>
                      <button
                        className="btn btn-primary"
                        onClick={() => loadSavedBill(bill)}
                        style={{ padding: "6px 12px", fontSize: 13 }}
                      >
                        Load
                      </button>
                      <button
                        className="btn btn-danger"
                        onClick={() => deleteSavedBill(bill.id)}
                        title="Delete bill"
                      >
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                        >
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── JSON Export / Import Modal ─── */}
      {showJsonModal && (
        <div
          className="modal-backdrop"
          onClick={() => {
            setShowJsonModal(false);
            setImportStatusMessage(null);
          }}
        >
          <div
            className="modal-content"
            style={{ maxWidth: 580 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <div>
                <h2
                  style={{
                    fontSize: 18,
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <span>📦</span> Export &amp; Import JSON
                </h2>
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--text-muted)",
                    marginTop: 2,
                  }}
                >
                  Transfer your bills, friends, items, and history between devices
                </div>
              </div>
              <button
                className="btn btn-ghost"
                onClick={() => {
                  setShowJsonModal(false);
                  setImportStatusMessage(null);
                }}
                style={{ padding: "4px 8px" }}
              >
                ✕
              </button>
            </div>

            {/* Tab navigation */}
            <div
              style={{
                display: "flex",
                background: "var(--bg-secondary)",
                borderRadius: 10,
                padding: 4,
                marginBottom: 18,
                border: "1px solid var(--border)",
              }}
            >
              <button
                type="button"
                className={`btn ${jsonTab === "export" ? "btn-primary" : "btn-ghost"}`}
                style={{
                  flex: 1,
                  justifyContent: "center",
                  padding: "8px 12px",
                  fontSize: 13,
                  borderRadius: 8,
                  border: "none",
                }}
                onClick={() => {
                  setJsonTab("export");
                  setImportStatusMessage(null);
                }}
              >
                📤 Export JSON
              </button>
              <button
                type="button"
                className={`btn ${jsonTab === "import" ? "btn-primary" : "btn-ghost"}`}
                style={{
                  flex: 1,
                  justifyContent: "center",
                  padding: "8px 12px",
                  fontSize: 13,
                  borderRadius: 8,
                  border: "none",
                }}
                onClick={() => {
                  setJsonTab("import");
                  setImportStatusMessage(null);
                }}
              >
                📥 Import JSON
              </button>
            </div>

            {/* Notification banner */}
            {importStatusMessage && (
              <div
                style={{
                  marginBottom: 16,
                  padding: "10px 14px",
                  borderRadius: 8,
                  fontSize: 13,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  background:
                    importStatusMessage.type === "success"
                      ? "rgba(16, 185, 129, 0.15)"
                      : "rgba(244, 63, 94, 0.15)",
                  border: `1px solid ${
                    importStatusMessage.type === "success"
                      ? "rgba(16, 185, 129, 0.3)"
                      : "rgba(244, 63, 94, 0.3)"
                  }`,
                  color:
                    importStatusMessage.type === "success"
                      ? "var(--accent-emerald)"
                      : "var(--accent-rose)",
                }}
              >
                <span>{importStatusMessage.type === "success" ? "✓" : "⚠"}</span>
                <span style={{ flex: 1 }}>{importStatusMessage.text}</span>
                <button
                  type="button"
                  onClick={() => setImportStatusMessage(null)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "inherit",
                    cursor: "pointer",
                    padding: 2,
                  }}
                >
                  ✕
                </button>
              </div>
            )}

            {/* EXPORT TAB */}
            {jsonTab === "export" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {/* Current Bill Export Card */}
                <div
                  style={{
                    background: "var(--bg-secondary)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    padding: "16px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontWeight: 600,
                        fontSize: 14,
                        color: "var(--text-primary)",
                      }}
                    >
                      Current Bill JSON
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: "var(--text-muted)",
                        marginTop: 2,
                      }}
                    >
                      &ldquo;{billTitle || "Untitled Bill"}&rdquo; •{" "}
                      {friends.length} friends • {items.length} items
                    </div>
                    <div
                      style={{
                        fontSize: 11.5,
                        color: "var(--text-secondary)",
                        marginTop: 4,
                      }}
                    >
                      Exports current bill details, friend shares, quantities,
                      VAT, and fees.
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={exportCurrentBillJSON}
                    style={{
                      padding: "8px 14px",
                      fontSize: 13,
                      flexShrink: 0,
                    }}
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    Export Current
                  </button>
                </div>

                {/* Full Backup Card */}
                <div
                  style={{
                    background: "var(--bg-secondary)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    padding: "16px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontWeight: 600,
                        fontSize: 14,
                        color: "var(--text-primary)",
                      }}
                    >
                      Full Backup JSON
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: "var(--text-muted)",
                        marginTop: 2,
                      }}
                    >
                      Current draft + all {savedBills.length} saved history bills
                    </div>
                    <div
                      style={{
                        fontSize: 11.5,
                        color: "var(--text-secondary)",
                        marginTop: 4,
                      }}
                    >
                      Complete snapshot for backup or moving to another browser /
                      device.
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn btn-amber"
                    onClick={exportFullBackupJSON}
                    style={{
                      padding: "8px 14px",
                      fontSize: 13,
                      flexShrink: 0,
                    }}
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                      <polyline points="17 21 17 13 7 13 7 21" />
                      <polyline points="7 3 7 8 15 8" />
                    </svg>
                    Export All Backup
                  </button>
                </div>

                {/* Saved Bills History Export Card */}
                {savedBills.length > 0 && (
                  <div
                    style={{
                      background: "var(--bg-secondary)",
                      border: "1px solid var(--border)",
                      borderRadius: 12,
                      padding: "16px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 12,
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontWeight: 600,
                          fontSize: 14,
                          color: "var(--text-primary)",
                        }}
                      >
                        Saved Bills Archive
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: "var(--text-muted)",
                          marginTop: 2,
                        }}
                      >
                        {savedBills.length} saved{" "}
                        {savedBills.length === 1 ? "bill" : "bills"} in history
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={exportAllSavedBillsJSON}
                      style={{
                        padding: "8px 14px",
                        fontSize: 13,
                        flexShrink: 0,
                      }}
                    >
                      Export History Only
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* IMPORT TAB */}
            {jsonTab === "import" && (
              <div
                style={{ display: "flex", flexDirection: "column", gap: 14 }}
              >
                {/* File picker dropzone */}
                <div
                  style={{
                    background: "var(--bg-secondary)",
                    border: "2px dashed var(--border)",
                    borderRadius: 12,
                    padding: "24px 16px",
                    textAlign: "center",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.currentTarget.style.borderColor = "var(--accent-teal)";
                  }}
                  onDragLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--border)";
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.currentTarget.style.borderColor = "var(--border)";
                    const file = e.dataTransfer.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        try {
                          const parsed = JSON.parse(
                            event.target?.result as string,
                          );
                          processImportedJSON(parsed);
                        } catch (err) {
                          setImportStatusMessage({
                            type: "error",
                            text:
                              "Failed to parse dropped JSON: " +
                              (err instanceof Error
                                ? err.message
                                : "Invalid JSON"),
                          });
                        }
                      };
                      reader.readAsText(file);
                    }
                  }}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".json,application/json"
                    style={{ display: "none" }}
                    onChange={handleFileSelect}
                  />
                  <div style={{ fontSize: 32, marginBottom: 6 }}>📂</div>
                  <div
                    style={{
                      fontWeight: 600,
                      fontSize: 14,
                      color: "var(--text-primary)",
                    }}
                  >
                    Choose a JSON file or drag &amp; drop
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--text-muted)",
                      marginTop: 4,
                    }}
                  >
                    Supports single bills, saved history archives, and full
                    backup files
                  </div>
                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{
                      marginTop: 12,
                      padding: "6px 16px",
                      fontSize: 13,
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                  >
                    Select .json File
                  </button>
                </div>

                {/* Divider */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    margin: "2px 0",
                  }}
                >
                  <div
                    style={{
                      flex: 1,
                      height: 1,
                      background: "var(--border)",
                    }}
                  />
                  <span
                    style={{
                      fontSize: 11,
                      color: "var(--text-muted)",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    or paste json text
                  </span>
                  <div
                    style={{
                      flex: 1,
                      height: 1,
                      background: "var(--border)",
                    }}
                  />
                </div>

                {/* Textarea paste import */}
                <div>
                  <textarea
                    className="input"
                    rows={4}
                    value={jsonPasteText}
                    onChange={(e) => setJsonPasteText(e.target.value)}
                    placeholder='Paste JSON here, e.g. {"bill": { "title": "Dinner", "friends": [...], "items": [...] }}'
                    style={{
                      fontFamily: "monospace",
                      fontSize: 12,
                      resize: "vertical",
                      width: "100%",
                      borderRadius: 8,
                      padding: "8px 10px",
                    }}
                  />
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={handlePasteImport}
                    disabled={!jsonPasteText.trim()}
                    style={{
                      marginTop: 8,
                      width: "100%",
                      justifyContent: "center",
                      fontSize: 13,
                      padding: "8px 12px",
                    }}
                  >
                    📥 Import from Pasted JSON
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Hidden export template */}
      <div
        style={{
          position: "absolute",
          left: -9999,
          top: 0,
          width: 780,
          pointerEvents: "none",
        }}
      >
        <div ref={exportRef}>
          {isHydrated && (
            <SummaryExportView
              title={billTitle}
              friends={friends}
              items={items}
              flatFee={flatFee}
              discount={discount}
              tax={tax}
              tip={tip}
              subtotal={subtotal}
              grandTotal={grandTotal}
              personTotals={personTotals}
            />
          )}
        </div>
      </div>
    </div>
  );
}
