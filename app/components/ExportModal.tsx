import React from "react";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExportPdf: () => void;
  onExportImage: () => void;
  exporting: boolean;
  friendsCount: number;
}

export function ExportModal({
  isOpen,
  onClose,
  onExportPdf,
  onExportImage,
  exporting,
  friendsCount,
}: ExportModalProps) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: 460 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
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
              <circle cx="18" cy="5" r="3" />
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
            </svg>
            <span>Export &amp; Share Bill</span>
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

        <div
          style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 16 }}
        >
          Choose a format to download and share with your friends:
        </div>

        {friendsCount === 0 && (
          <div className="warning-banner" style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 7 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <span>Add at least one friend to generate a complete itemized bill.</span>
          </div>
        )}

        {/* Options */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* PDF Option */}
          <div
            className="export-choice-card"
            onClick={() => {
              if (!exporting && friendsCount > 0) {
                onExportPdf();
                onClose();
              }
            }}
            style={{
              opacity: friendsCount === 0 ? 0.6 : 1,
              cursor:
                friendsCount === 0 || exporting ? "not-allowed" : "pointer",
            }}
          >
            <div
              className="export-choice-icon"
              style={{
                background: "rgba(245, 158, 11, 0.15)",
                color: "var(--accent-amber)",
              }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontWeight: 700,
                  fontSize: 14.5,
                  color: "var(--text-primary)",
                }}
              >
                PDF Document
              </div>
            </div>
            <button
              type="button"
              className="btn btn-amber btn-sm"
              disabled={exporting || friendsCount === 0}
              onClick={(e) => {
                e.stopPropagation();
                onExportPdf();
                onClose();
              }}
            >
              {exporting ? "Generating..." : "Download PDF"}
            </button>
          </div>

          {/* Image Option */}
          <div
            className="export-choice-card"
            onClick={() => {
              if (!exporting && friendsCount > 0) {
                onExportImage();
                onClose();
              }
            }}
            style={{
              opacity: friendsCount === 0 ? 0.6 : 1,
              cursor:
                friendsCount === 0 || exporting ? "not-allowed" : "pointer",
            }}
          >
            <div
              className="export-choice-icon"
              style={{
                background: "rgba(20, 184, 166, 0.15)",
                color: "var(--accent-teal-light)",
              }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontWeight: 700,
                  fontSize: 14.5,
                  color: "var(--text-primary)",
                }}
              >
                PNG Image
              </div>
            </div>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              disabled={exporting || friendsCount === 0}
              onClick={(e) => {
                e.stopPropagation();
                onExportImage();
                onClose();
              }}
            >
              {exporting ? "Generating..." : "Download Image"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
