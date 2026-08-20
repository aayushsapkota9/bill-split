import React from "react";
import { FeeConfig } from "../types";
import { formatCurrency } from "../lib/utils";
import { FeeRow } from "./FeeRow";

interface BillTotalsCardProps {
  itemsCount: number;
  subtotal: number;
  flatFee: FeeConfig;
  setFlatFee: (c: FeeConfig) => void;
  tax: FeeConfig;
  setTax: (c: FeeConfig) => void;
  discount: FeeConfig;
  setDiscount: (c: FeeConfig) => void;
  tip: FeeConfig;
  setTip: (c: FeeConfig) => void;
  feeAmount: number;
  taxAmount: number;
  discountAmount: number;
  tipAmount: number;
  grandTotal: number;
  hasFriends: boolean;
  onOpenExportModal: () => void;
}

export function BillTotalsCard({
  itemsCount,
  subtotal,
  flatFee,
  setFlatFee,
  tax,
  setTax,
  discount,
  setDiscount,
  tip,
  setTip,
  feeAmount,
  taxAmount,
  discountAmount,
  tipAmount,
  grandTotal,
  hasFriends,
  onOpenExportModal,
}: BillTotalsCardProps) {
  return (
    <aside className="summary-sidebar">
      <div className="card bill-totals-card">
        <h3 className="section-title" style={{ marginBottom: 14, fontSize: 15, display: "flex", alignItems: "center", gap: 7 }}>
          <svg
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ color: "var(--accent-amber)" }}
          >
            <rect x="4" y="2" width="16" height="20" rx="2" />
            <line x1="8" y1="6" x2="16" y2="6" />
            <line x1="16" y1="14" x2="16" y2="18" />
            <path d="M8 10h.01M12 10h.01M16 10h.01M8 14h.01M12 14h.01M8 18h.01M12 18h.01" />
          </svg>
          <span>Bill Totals</span>
        </h3>

        <div className="total-row">
          <span style={{ color: "var(--text-secondary)", fontSize: 13 }}>
            Subtotal ({itemsCount} items)
          </span>
          <span className="total-amount">{formatCurrency(subtotal)}</span>
        </div>

        <FeeRow label="Flat Fees" config={flatFee} onChange={setFlatFee} />
        <FeeRow label="Tax" config={tax} onChange={setTax} />
        <FeeRow label="Discount" config={discount} onChange={setDiscount} />
        <FeeRow label="Tip" config={tip} onChange={setTip} />

        {/* Arithmetic Breakdown */}
        <div className="bill-breakdown-box">
          <div className="breakdown-row">
            <span>Subtotal</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          {feeAmount > 0 && (
            <div className="breakdown-row">
              <span>
                + Flat Fees{" "}
                {flatFee.type === "percent" ? `(${flatFee.value}%)` : ""}
              </span>
              <span>+{formatCurrency(feeAmount)}</span>
            </div>
          )}
          {taxAmount > 0 && (
            <div className="breakdown-row">
              <span>
                + Tax {tax.type === "percent" ? `(${tax.value}%)` : ""}
              </span>
              <span>+{formatCurrency(taxAmount)}</span>
            </div>
          )}
          {discountAmount > 0 && (
            <div className="breakdown-row discount">
              <span>
                - Discount{" "}
                {discount.type === "percent" ? `(${discount.value}%)` : ""}
              </span>
              <span>-{formatCurrency(discountAmount)}</span>
            </div>
          )}
          {tipAmount > 0 && (
            <div className="breakdown-row">
              <span>
                + Tip {tip.type === "percent" ? `(${tip.value}%)` : ""}
              </span>
              <span>+{formatCurrency(tipAmount)}</span>
            </div>
          )}
        </div>

        <div className="grand-total-row">
          <span>Grand Total</span>
          <span className="grand-total-amount">
            {formatCurrency(grandTotal)}
          </span>
        </div>
      </div>

      <button
        type="button"
        className="btn btn-primary"
        onClick={onOpenExportModal}
        disabled={!hasFriends}
        style={{ width: "100%", justifyContent: "center", padding: "10px 14px", fontSize: 13.5, gap: 7 }}
        title="Share or Export bill as PDF / Image"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="18" cy="5" r="3" />
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="19" r="3" />
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
        </svg>
        <span>Share Bill</span>
      </button>
    </aside>
  );
}
