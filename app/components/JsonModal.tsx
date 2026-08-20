import React, { useRef } from "react";
import { SavedBill } from "../types";

interface JsonModalProps {
  isOpen: boolean;
  onClose: () => void;
  jsonTab: "export" | "import";
  setJsonTab: (tab: "export" | "import") => void;
  importStatusMessage: { type: "success" | "error"; text: string } | null;
  setImportStatusMessage: (msg: { type: "success" | "error"; text: string } | null) => void;
  billTitle: string;
  friendsCount: number;
  itemsCount: number;
  savedBills: SavedBill[];
  jsonPasteText: string;
  setJsonPasteText: (text: string) => void;
  onExportCurrentBill: () => void;
  onExportFullBackup: () => void;
  onExportAllSavedBills: () => void;
  onProcessImportedJson: (parsed: unknown) => boolean;
}

export function JsonModal({
  isOpen,
  onClose,
  jsonTab,
  setJsonTab,
  importStatusMessage,
  setImportStatusMessage,
  billTitle,
  friendsCount,
  itemsCount,
  savedBills,
  jsonPasteText,
  setJsonPasteText,
  onExportCurrentBill,
  onExportFullBackup,
  onExportAllSavedBills,
  onProcessImportedJson,
}: JsonModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        onProcessImportedJson(parsed);
      } catch (err) {
        setImportStatusMessage({
          type: "error",
          text:
            "Invalid JSON file: " +
            (err instanceof Error ? err.message : "Parse error"),
        });
      }
    };
    reader.readAsText(file);
    if (e.target) e.target.value = "";
  }

  function handlePasteImport() {
    try {
      const parsed = JSON.parse(jsonPasteText.trim());
      const success = onProcessImportedJson(parsed);
      if (success) setJsonPasteText("");
    } catch (err) {
      setImportStatusMessage({
        type: "error",
        text:
          "Invalid JSON string: " +
          (err instanceof Error ? err.message : "Parse error"),
      });
    }
  }

  return (
    <div
      className="modal-backdrop"
      onClick={() => {
        onClose();
        setImportStatusMessage(null);
      }}
    >
      <div
        className="modal-content"
        style={{ maxWidth: 580 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header">
          <div>
            <h2 className="modal-title">
              <span>📦</span> Export &amp; Import JSON
            </h2>
            <div className="modal-subtitle">
              Transfer your bills, friends, items, and history between devices
            </div>
          </div>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => {
              onClose();
              setImportStatusMessage(null);
            }}
            style={{ padding: "4px 8px" }}
          >
            ✕
          </button>
        </div>

        {/* Tab navigation */}
        <div className="json-tab-bar">
          <button
            type="button"
            className={`btn ${jsonTab === "export" ? "btn-primary" : "btn-ghost"} json-tab-btn`}
            onClick={() => {
              setJsonTab("export");
              setImportStatusMessage(null);
            }}
          >
            📤 Export JSON
          </button>
          <button
            type="button"
            className={`btn ${jsonTab === "import" ? "btn-primary" : "btn-ghost"} json-tab-btn`}
            onClick={() => {
              setJsonTab("import");
              setImportStatusMessage(null);
            }}
          >
            📥 Import JSON
          </button>
        </div>

        {/* Notification banner */}
        {importStatusMessage && (
          <div
            className={`json-status-banner ${importStatusMessage.type}`}
          >
            <span>{importStatusMessage.type === "success" ? "✓" : "⚠"}</span>
            <span style={{ flex: 1 }}>{importStatusMessage.text}</span>
            <button
              type="button"
              onClick={() => setImportStatusMessage(null)}
              className="json-banner-close"
            >
              ✕
            </button>
          </div>
        )}

        {/* EXPORT TAB */}
        {jsonTab === "export" && (
          <div className="json-export-cards">
            {/* Current Bill Export Card */}
            <div className="json-card">
              <div>
                <div className="json-card-title">
                  Current Bill JSON
                </div>
                <div className="json-card-meta">
                  &ldquo;{billTitle || "Untitled Bill"}&rdquo; •{" "}
                  {friendsCount} friends • {itemsCount} items
                </div>
                <div className="json-card-desc">
                  Exports current bill details, friend shares, quantities,
                  VAT, and fees.
                </div>
              </div>
              <button
                type="button"
                className="btn btn-primary json-card-btn"
                onClick={onExportCurrentBill}
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
                Export Current
              </button>
            </div>

            {/* Full Backup Card */}
            <div className="json-card">
              <div>
                <div className="json-card-title">
                  Full Backup JSON
                </div>
                <div className="json-card-meta">
                  Current draft + all {savedBills.length} saved history bills
                </div>
                <div className="json-card-desc">
                  Complete snapshot for backup or moving to another browser /
                  device.
                </div>
              </div>
              <button
                type="button"
                className="btn btn-amber json-card-btn"
                onClick={onExportFullBackup}
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
                Export All Backup
              </button>
            </div>

            {/* Saved Bills History Export Card */}
            {savedBills.length > 0 && (
              <div className="json-card">
                <div>
                  <div className="json-card-title">
                    Saved Bills Archive
                  </div>
                  <div className="json-card-meta">
                    {savedBills.length} saved{" "}
                    {savedBills.length === 1 ? "bill" : "bills"} in history
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-ghost json-card-btn"
                  onClick={onExportAllSavedBills}
                >
                  Export History Only
                </button>
              </div>
            )}
          </div>
        )}

        {/* IMPORT TAB */}
        {jsonTab === "import" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {/* File picker dropzone */}
            <div
              className="json-dropzone"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                e.currentTarget.classList.add("dragover");
              }}
              onDragLeave={(e) => {
                e.currentTarget.classList.remove("dragover");
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.currentTarget.classList.remove("dragover");
                const file = e.dataTransfer.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = (event) => {
                    try {
                      const parsed = JSON.parse(
                        event.target?.result as string,
                      );
                      onProcessImportedJson(parsed);
                    } catch (err) {
                      setImportStatusMessage({
                        type: "error",
                        text:
                          "Failed to parse dropped JSON: " +
                          (err instanceof Error
                            ? err.message
                            : "Invalid JSON"),
                      });
                    }
                  };
                  reader.readAsText(file);
                }
              }}
            >
              <input
                type="file"
                ref={fileInputRef}
                accept=".json,application/json"
                style={{ display: "none" }}
                onChange={handleFileSelect}
              />
              <div style={{ fontSize: 32, marginBottom: 6 }}>📂</div>
              <div className="dropzone-title">
                Choose a JSON file or drag &amp; drop
              </div>
              <div className="dropzone-subtitle">
                Supports single bills, saved history archives, and full
                backup files
              </div>
              <button
                type="button"
                className="btn btn-primary"
                style={{
                  marginTop: 12,
                  padding: "6px 16px",
                  fontSize: 13,
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
              >
                Select .json File
              </button>
            </div>

            {/* Divider */}
            <div className="json-divider">
              <div className="json-divider-line" />
              <span className="json-divider-text">
                or paste json text
              </span>
              <div className="json-divider-line" />
            </div>

            {/* Textarea paste import */}
            <div>
              <textarea
                className="input json-textarea"
                rows={4}
                value={jsonPasteText}
                onChange={(e) => setJsonPasteText(e.target.value)}
                placeholder='Paste JSON here, e.g. {"bill": { "title": "Dinner", "friends": [...], "items": [...] }}'
              />
              <button
                type="button"
                className="btn btn-ghost"
                onClick={handlePasteImport}
                disabled={!jsonPasteText.trim()}
                style={{
                  marginTop: 8,
                  width: "100%",
                  justifyContent: "center",
                  fontSize: 13,
                  padding: "8px 12px",
                }}
              >
                📥 Import from Pasted JSON
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
