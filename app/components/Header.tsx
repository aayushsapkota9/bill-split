import React from "react";

interface HeaderProps {
  billTitle: string;
  setBillTitle: (title: string) => void;
  savedBillsCount: number;
  isHydrated: boolean;
  onOpenHistory: () => void;
  onSaveHistory: () => void;
  onResetBill: () => void;
  onOpenExportModal: () => void;
}

export function Header({
  billTitle,
  setBillTitle,
  savedBillsCount,
  isHydrated,
  onOpenHistory,
  onSaveHistory,
  onResetBill,
  onOpenExportModal,
}: HeaderProps) {
  return (
    <header className="app-header">
      {/* Brand & Title */}
      <div className="header-brand-container">
        <span className="header-icon" role="img" aria-label="Receipt">
          🧾
        </span>
        <div className="header-title-wrap">
          <input
            value={billTitle}
            onChange={(e) => setBillTitle(e.target.value)}
            placeholder="Bill Title..."
            className="header-title-input"
            title="Click to edit bill title"
          />
        </div>
      </div>

      {/* Clean Icon-Based Action Bar */}
      <div className="header-actions">
        {/* New Bill */}
        <button
          type="button"
          className="header-icon-btn"
          onClick={onResetBill}
          title="New Bill (start fresh)"
          aria-label="New Bill"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>

        {/* Save Current Bill */}
        <button
          type="button"
          className="header-icon-btn"
          onClick={onSaveHistory}
          title="Save Bill snapshot"
          aria-label="Save Bill"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
          >
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
            <polyline points="17 21 17 13 7 13 7 21" />
            <polyline points="7 3 7 8 15 8" />
          </svg>
        </button>

        {/* Saved Bills & Backup */}
        <button
          type="button"
          className="header-icon-btn header-saved-btn"
          onClick={onOpenHistory}
          title="Saved Bills History & Backup"
          aria-label="Saved Bills History"
          suppressHydrationWarning
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
          >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          {isHydrated && savedBillsCount > 0 && (
            <span className="header-saved-badge">{savedBillsCount}</span>
          )}
        </button>

        {/* Share / Export (PDF or Image) */}
        <button
          type="button"
          className="header-icon-btn header-export-btn"
          onClick={onOpenExportModal}
          title="Export / Share Bill (PDF or Image)"
          aria-label="Export or Share Bill"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
          >
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
            <polyline points="16 6 12 2 8 6" />
            <line x1="12" y1="2" x2="12" y2="15" />
          </svg>
        </button>
      </div>
    </header>
  );
}
