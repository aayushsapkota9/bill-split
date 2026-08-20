import React from "react";
import { FeeConfig } from "../types";
import { formatCurrency } from "../lib/utils";
import { FeeRow } from "./FeeRow";

interface FeesModalProps {
  isOpen: boolean;
  onClose: () => void;
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
}

export function FeesModal({
  isOpen,
  onClose,
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
}: FeesModalProps) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content fees-modal-content"
        style={{ maxWidth: 440 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2 className="modal-title">
            <span>🧮</span> Fees, Tax &amp; Breakdown
          </h2>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={onClose}
            style={{ padding: "4px 8px" }}
          >
            ✕
          </button>
        </div>

        {/* Subtotal */}
        <div className="total-row">
          <span style={{ color: "var(--text-secondary)", fontSize: 13 }}>
            Subtotal ({itemsCount} items)
          </span>
          <span className="total-amount">{formatCurrency(subtotal)}</span>
        </div>

        {/* Fee rows */}
        <FeeRow label="Flat Fees" config={flatFee} onChange={setFlatFee} />
        <FeeRow label="Tax" config={tax} onChange={setTax} />
        <FeeRow label="Discount" config={discount} onChange={setDiscount} />
        <FeeRow label="Tip" config={tip} onChange={setTip} />

        {/* Arithmetic Breakdown */}
        <div className="bill-breakdown-box" style={{ marginTop: 14 }}>
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

        {/* Grand Total Row */}
        <div className="grand-total-row" style={{ marginBottom: 16 }}>
          <span>Grand Total</span>
          <span className="grand-total-amount">
            {formatCurrency(grandTotal)}
          </span>
        </div>

        <button
          type="button"
          className="btn btn-primary"
          onClick={onClose}
          style={{ width: "100%", justifyContent: "center", padding: "9px 14px" }}
        >
          Done
        </button>
      </div>
    </div>
  );
}
