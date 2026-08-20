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
          <h2 className="modal-title">
            <span>📤</span> Export &amp; Share Bill
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

        <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 16 }}>
          Choose a format to download and share with your friends:
        </div>

        {friendsCount === 0 && (
          <div className="warning-banner" style={{ marginBottom: 16 }}>
            ⚠️ Add at least one friend to generate a complete itemized bill.
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
              cursor: friendsCount === 0 || exporting ? "not-allowed" : "pointer",
            }}
          >
            <div className="export-choice-icon" style={{ background: "rgba(245, 158, 11, 0.15)", color: "var(--accent-amber)" }}>
              📄
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 14.5, color: "var(--text-primary)" }}>
                PDF Document (.pdf)
              </div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                Printable itemized receipt with who owes what and total summary
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
              cursor: friendsCount === 0 || exporting ? "not-allowed" : "pointer",
            }}
          >
            <div className="export-choice-icon" style={{ background: "rgba(20, 184, 166, 0.15)", color: "var(--accent-teal-light)" }}>
              🖼️
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 14.5, color: "var(--text-primary)" }}>
                PNG Image (.png)
              </div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                High-resolution picture ideal for sharing on WhatsApp or Messenger
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
