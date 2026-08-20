import React, { useRef } from "react";
import { SavedBill } from "../types";
import { formatCurrency } from "../lib/utils";

interface HistoryModalProps {
  isOpen: boolean;
  savedBills: SavedBill[];
  onClose: () => void;
  onLoadBill: (bill: SavedBill) => void;
  onDeleteBill: (id: string) => void;
  onExportBackupJson: () => void;
  onImportBackupJson: (parsed: unknown) => void;
  onError: (msg: string) => void;
}

export function HistoryModal({
  isOpen,
  savedBills,
  onClose,
  onLoadBill,
  onDeleteBill,
  onExportBackupJson,
  onImportBackupJson,
  onError,
}: HistoryModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        onImportBackupJson(parsed);
      } catch (err) {
        onError(
          "Invalid backup file: " +
            (err instanceof Error ? err.message : "Parse error"),
        );
      }
    };
    reader.readAsText(file);
    if (e.target) e.target.value = "";
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            <span>📜</span> Saved Bills History
          </h2>
          <div className="modal-header-actions">
            <input
              type="file"
              ref={fileInputRef}
              accept=".json,application/json"
              style={{ display: "none" }}
              onChange={handleFileSelect}
            />
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => fileInputRef.current?.click()}
              title="Import bills and drafts from JSON backup"
            >
              📥 Import All
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={onExportBackupJson}
              title="Export complete backup as JSON"
            >
              📤 Export All
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
            <div style={{ fontWeight: 500, color: "var(--text-primary)" }}>No saved bills yet</div>
            <div style={{ fontSize: 13, marginTop: 4, color: "var(--text-muted)" }}>
              Click the save icon 💾 in the header to store snapshots of your bills.
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
                    {bill.date} • {bill.friends.length} {bill.friends.length === 1 ? "friend" : "friends"} •{" "}
                    {bill.items.length} {bill.items.length === 1 ? "item" : "items"}
                  </div>
                  <div className="history-bill-total">
                    Total: {formatCurrency(bill.grandTotal)}
                  </div>
                </div>
                <div className="history-bill-actions">
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => onLoadBill(bill)}
                  >
                    Load
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={() => onDeleteBill(bill.id)}
                    title="Delete bill"
                    aria-label="Delete bill"
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
