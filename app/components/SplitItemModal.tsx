import React, { useState, useEffect } from "react";
import { formatCurrency } from "../lib/utils";

interface SplitItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemName: string;
  totalQty: number;
  price: number;
  onConfirmSplit: (pieces: number) => void;
}

export function SplitItemModal({
  isOpen,
  onClose,
  itemName,
  totalQty,
  price,
  onConfirmSplit,
}: SplitItemModalProps) {
  const [pieces, setPieces] = useState<number>(() => {
    const rounded = Math.round(totalQty);
    return rounded >= 2 ? rounded : 2;
  });

  useEffect(() => {
    if (isOpen) {
      const rounded = Math.round(totalQty);
      setPieces(rounded >= 2 ? rounded : 2);
    }
  }, [isOpen, totalQty]);

  if (!isOpen) return null;

  const validPieces = Math.max(2, Math.floor(pieces || 2));
  const qtyPerItem = totalQty > 0 ? Number((totalQty / validPieces).toFixed(2)) : 1;
  const eachTotal = price * (qtyPerItem > 0 ? qtyPerItem : 1);

  function handleConfirm() {
    onConfirmSplit(validPieces);
    onClose();
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: 420, padding: 20 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header" style={{ marginBottom: 12 }}>
          <h2 className="modal-title" style={{ fontSize: 16 }}>
            Split &quot;{itemName || "Item"}&quot;
          </h2>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={onClose}
            style={{ padding: "3px 7px" }}
          >
            ✕
          </button>
        </div>

        <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 16 }}>
          Split this item into separate individual rows so friends can be assigned individually:
        </p>

        {/* Number of Pieces Picker */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "var(--text-primary)", marginBottom: 6 }}>
            Number of items to split into:
          </label>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setPieces((prev) => Math.max(2, prev - 1))}
              disabled={validPieces <= 2}
              style={{ width: 38, height: 38, justifyContent: "center", fontSize: 18 }}
            >
              -
            </button>
            <input
              type="number"
              min="2"
              max="50"
              className="input"
              value={pieces}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                if (!isNaN(val)) setPieces(val);
                else if (e.target.value === "") setPieces(2);
              }}
              onFocus={(e) => e.target.select()}
              style={{ textAlign: "center", fontSize: 16, fontWeight: 700, flex: 1 }}
            />
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setPieces((prev) => prev + 1)}
              style={{ width: 38, height: 38, justifyContent: "center", fontSize: 18 }}
            >
              +
            </button>
          </div>

          {/* Quick presets */}
          <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
            {[2, 3, 4, 5, 6].map((n) => (
              <button
                key={n}
                type="button"
                className={`btn btn-sm ${validPieces === n ? "btn-primary" : "btn-ghost"}`}
                onClick={() => setPieces(n)}
                style={{ flex: 1, justifyContent: "center" }}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Preview Box */}
        <div
          style={{
            background: "var(--bg-secondary)",
            border: "1px solid var(--border)",
            borderRadius: 10,
            padding: 12,
            marginBottom: 18,
            fontSize: 12.5,
            color: "var(--text-secondary)",
          }}
        >
          <div style={{ fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>
            Result Preview:
          </div>
          <div>
            • Creates <strong style={{ color: "var(--accent-teal-light)" }}>{validPieces} items</strong> ({itemName || "Item"} 1, {itemName || "Item"} 2, …)
          </div>
          <div style={{ marginTop: 2 }}>
            • Each item: <strong>Qty {qtyPerItem}</strong> • <strong>Price {formatCurrency(eachTotal)}</strong>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn btn-primary" onClick={handleConfirm}>
            Split into {validPieces} Items
          </button>
        </div>
      </div>
    </div>
  );
}
