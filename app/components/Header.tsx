import React from "react";
import { Friend } from "../types";

interface HeaderProps {
  billTitle: string;
  setBillTitle: (title: string) => void;
  saveStatus: "saved" | "saving";
  savedBillsCount: number;
  isHydrated: boolean;
  exporting: boolean;
  friends: Friend[];
  onOpenHistory: () => void;
  onSaveHistory: () => void;
  onResetBill: () => void;
  onOpenJsonModal: () => void;
  onExportImage: () => void;
  onExportPdf: () => void;
}

export function Header({
  billTitle,
  setBillTitle,
  saveStatus,
  savedBillsCount,
  isHydrated,
  exporting,
  friends,
  onOpenHistory,
  onSaveHistory,
  onResetBill,
  onOpenJsonModal,
  onExportImage,
  onExportPdf,
}: HeaderProps) {
  return (
    <header className="app-header">
      <div className="header-brand-container">
        <div className="header-logo">
          🧾
        </div>
        <div className="header-title-block">
          <div className="header-title-row">
            <input
              value={billTitle}
              onChange={(e) => setBillTitle(e.target.value)}
              placeholder="Bill Title..."
              className="header-title-input"
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
              />
              <span className="status-badge-text">
                {saveStatus === "saving" ? "Saving..." : "Auto-saved"}
              </span>
            </span>
          </div>
          <div className="header-subtitle">
            Fair and effortless bill splitting
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="header-actions">
        <button
          type="button"
          className="btn btn-ghost header-btn"
          onClick={onOpenHistory}
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
          <span className="btn-label">Saved Bills ({isHydrated ? savedBillsCount : 0})</span>
        </button>

        <button
          type="button"
          className="btn btn-ghost header-btn"
          onClick={onSaveHistory}
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
          <span className="btn-label">Save Bill</span>
        </button>

        <button
          type="button"
          className="btn btn-ghost header-btn"
          onClick={onResetBill}
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
          <span className="btn-label">New Bill</span>
        </button>

        <button
          type="button"
          className="btn btn-ghost header-btn"
          onClick={onOpenJsonModal}
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
          <span className="btn-label">JSON</span>
        </button>

        <button
          type="button"
          className="btn btn-ghost header-btn"
          onClick={onExportImage}
          disabled={exporting || friends.length === 0}
          title="Export bill as PNG image"
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
          <span className="btn-label">Image</span>
        </button>

        <button
          type="button"
          className="btn btn-amber header-btn"
          onClick={onExportPdf}
          disabled={exporting || friends.length === 0}
          id="export-pdf-btn"
          title="Export bill as PDF document"
        >
          {exporting ? (
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="spin-animation"
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
          <span className="btn-label">PDF</span>
        </button>
      </div>
    </header>
  );
}
