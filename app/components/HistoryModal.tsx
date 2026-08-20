import React from "react";
import { SavedBill } from "../types";
import { formatCurrency } from "../lib/utils";

interface HistoryModalProps {
  isOpen: boolean;
  savedBills: SavedBill[];
  onClose: () => void;
  onLoadBill: (bill: SavedBill) => void;
  onDeleteBill: (id: string) => void;
  onExportSavedBillJson: (bill: SavedBill) => void;
  onExportAllSavedBillsJson: () => void;
  onOpenImportJson: () => void;
}

export function HistoryModal({
  isOpen,
  savedBills,
  onClose,
  onLoadBill,
  onDeleteBill,
  onExportSavedBillJson,
  onExportAllSavedBillsJson,
  onOpenImportJson,
}: HistoryModalProps) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            📜 Saved Bills History
          </h2>
          <div className="modal-header-actions">
            {savedBills.length > 0 && (
              <button
                type="button"
                className="btn btn-ghost"
                onClick={onExportAllSavedBillsJson}
                style={{ padding: "4px 10px", fontSize: 12 }}
                title="Export all saved bills as JSON"
              >
                Export All JSON
              </button>
            )}
            <button
              type="button"
              className="btn btn-ghost"
              onClick={onOpenImportJson}
              style={{ padding: "4px 10px", fontSize: 12 }}
              title="Import bills from JSON"
            >
              Import JSON
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={onClose}
              style={{ padding: "4px 8px" }}
            >
              ✕
            </button>
          </div>
        </div>

        {savedBills.length === 0 ? (
          <div className="modal-empty-state">
            <div style={{ fontSize: 32, marginBottom: 8 }}>💾</div>
            <div style={{ fontWeight: 500 }}>No saved bills yet</div>
            <div style={{ fontSize: 13, marginTop: 4 }}>
              Click &quot;Save Bill&quot; in the header to save the current
              bill for future reference.
            </div>
          </div>
        ) : (
          <div className="modal-list-container">
            {savedBills.map((bill) => (
              <div key={bill.id} className="history-bill-card">
                <div className="history-bill-info">
                  <div className="history-bill-title">
                    {bill.title}
                  </div>
                  <div className="history-bill-meta">
                    {bill.date} • {bill.friends.length} friends •{" "}
                    {bill.items.length} items
                  </div>
                  <div className="history-bill-total">
                    Total: {formatCurrency(bill.grandTotal)}
                  </div>
                </div>
                <div className="history-bill-actions">
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => onExportSavedBillJson(bill)}
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
                    type="button"
                    className="btn btn-primary"
                    onClick={() => onLoadBill(bill)}
                    style={{ padding: "6px 12px", fontSize: 13 }}
                  >
                    Load
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={() => onDeleteBill(bill.id)}
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
  );
}
