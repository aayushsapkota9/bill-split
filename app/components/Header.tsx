import React from "react";
import { KaskoKatiLogo } from "./Logo";

interface HeaderProps {
  billTitle: string;
  setBillTitle: (title: string) => void;
  savedBillsCount: number;
  isHydrated: boolean;
  onOpenHistory: () => void;
  onSaveHistory: () => void;
  onResetBill: () => void;
}

export function Header({
  billTitle,
  setBillTitle,
  savedBillsCount,
  isHydrated,
  onOpenHistory,
  onSaveHistory,
  onResetBill,
}: HeaderProps) {
  return (
    <header className="app-header">
      {/* Brand & Title */}
      <div className="header-brand-container">
        <KaskoKatiLogo size={26} showText={false} />
        <div className="header-title-wrap">
          <input
            value={billTitle}
            onChange={(e) => setBillTitle(e.target.value)}
            placeholder="Kasko Kati — Bill Title..."
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
      </div>
    </header>
  );
}
