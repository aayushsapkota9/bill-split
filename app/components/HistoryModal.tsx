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
          <h2 className="modal-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ color: "var(--accent-teal)" }}
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span>Saved Bills History</span>
          </h2>
          <div className="modal-header-actions" style={{ display: "flex", alignItems: "center", gap: 6 }}>
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
              style={{ display: "inline-flex", alignItems: "center", gap: 5 }}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              <span>Import</span>
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={onExportBackupJson}
              title="Export complete backup as JSON"
              style={{ display: "inline-flex", alignItems: "center", gap: 5 }}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              <span>Export All</span>
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
          <div className="modal-empty-state" style={{ padding: "28px 16px", textAlign: "center" }}>
            <div
              style={{
                background: "rgba(20, 184, 166, 0.12)",
                color: "var(--accent-teal)",
                width: 46,
                height: 46,
                borderRadius: 12,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 12px",
              }}
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <div style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: 14.5 }}>
              No saved bills yet
            </div>
            <div style={{ fontSize: 12.5, marginTop: 5, color: "var(--text-muted)", lineHeight: 1.4 }}>
              Click the save button in the top header to store snapshots of your bills.
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
