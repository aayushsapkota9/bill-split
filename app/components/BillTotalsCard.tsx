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
  exporting: boolean;
  onOpenJsonModal: () => void;
  onExportImage: () => void;
  onExportPdf: () => void;
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
  exporting,
  onOpenJsonModal,
  onExportImage,
  onExportPdf,
}: BillTotalsCardProps) {
  return (
    <aside className="summary-sidebar">
      <div className="card bill-totals-card">
        <h3 className="section-title" style={{ marginBottom: 14, fontSize: 15 }}>
          <span style={{ fontSize: 17 }}>🧮</span> Bill Totals
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

      <div className="sidebar-export-actions">
        <button
          type="button"
          className="btn btn-ghost"
          onClick={onOpenJsonModal}
          style={{ flex: 1, justifyContent: "center" }}
          title="Export or Import JSON"
        >
          {"{ }"} JSON
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={onExportImage}
          disabled={exporting || !hasFriends}
          style={{ flex: 1, justifyContent: "center" }}
          title="Export as PNG Image"
        >
          📷 Image
        </button>
        <button
          type="button"
          className="btn btn-amber"
          onClick={onExportPdf}
          disabled={exporting || !hasFriends}
          style={{ flex: 1, justifyContent: "center" }}
          title="Export as PDF Document"
        >
          📄 PDF
        </button>
      </div>
    </aside>
  );
}
