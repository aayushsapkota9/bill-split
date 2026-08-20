import React from "react";
import { BillItem, FeeConfig, Friend } from "../types";
import { formatCurrency, formatShareText, getItemTotalPrice, personItemCost } from "../lib/utils";
import { KaskoKatiLogo } from "./Logo";

export interface SummaryExportProps {
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

export function SummaryExportView({
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
}: SummaryExportProps) {
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
              gap: 10,
              marginBottom: 4,
            }}
          >
            <KaskoKatiLogo size={26} showText={false} />
            <h1
              style={{
                fontSize: 21,
                fontWeight: 800,
                color: "#0f172a",
                margin: 0,
                letterSpacing: "-0.02em",
              }}
            >
              {title || "Kasko Kati"}
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
        <span>Generated by Kasko Kati</span>
        <span>Fair &amp; Effortless Bill Splitting</span>
      </div>
    </div>
  );
}
