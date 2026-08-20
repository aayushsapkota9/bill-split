"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { BillItem, FeeConfig, Friend, SavedBill } from "./types";
import {
  downloadJSON,
  formatCurrency,
  getItemTotalPrice,
  personItemCost,
  sanitizeFee,
  sanitizeFriends,
  sanitizeItems,
  sanitizeSavedBills,
  uid,
} from "./lib/utils";
import { exportAsImage, exportAsPDF } from "./lib/export";
import { Header } from "./components/Header";
import { FriendsSection } from "./components/FriendsSection";
import { ItemsSection } from "./components/ItemsSection";
import { BillTotalsCard } from "./components/BillTotalsCard";
import { SummaryExportView } from "./components/SummaryExportView";
import { HistoryModal } from "./components/HistoryModal";
import { ExportModal } from "./components/ExportModal";
import { FeesModal } from "./components/FeesModal";
import { ToastContainer, ToastMessage } from "./components/Toast";
import { ConfirmModal } from "./components/ConfirmModal";

export default function BillSplitPage() {
  const isLoadedRef = useRef(false);

  const [billTitle, setBillTitle] = useState("Kasko Kati");
  const [friends, setFriends] = useState<Friend[]>([]);
  const [newFriendName, setNewFriendName] = useState("");
  const [items, setItems] = useState<BillItem[]>([
    { id: uid(), name: "", price: 0, totalQty: 1, shares: [] },
  ]);
  const [isVatBill, setIsVatBill] = useState(true);
  const [flatFee, setFlatFee] = useState<FeeConfig>({ type: "flat", value: 0 });
  const [discount, setDiscount] = useState<FeeConfig>({
    type: "flat",
    value: 0,
  });
  const [tax, setTax] = useState<FeeConfig>({ type: "percent", value: 0 });
  const [tip, setTip] = useState<FeeConfig>({ type: "percent", value: 0 });

  // 2-Tab Mobile View State ("items" | "friends")
  const [mobileTab, setMobileTab] = useState<"items" | "friends">("items");

  // Persistence state
  const [isHydrated, setIsHydrated] = useState(false);
  const [savedBills, setSavedBills] = useState<SavedBill[]>([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showFeesModal, setShowFeesModal] = useState(false);

  // Custom Toast notifications state
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback(
    (text: string, type: ToastMessage["type"] = "success") => {
      const id = uid();
      setToasts((prev) => [...prev, { id, type, text }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3200);
    },
    [],
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Custom Confirm Modal state
  const [confirmModalState, setConfirmModalState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmVariant: "primary" | "danger" | "amber";
    confirmText: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    confirmVariant: "primary",
    confirmText: "Confirm",
    onConfirm: () => {},
  });

  // Export
  const [exporting, setExporting] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  // ─── Load from LocalStorage on mount ───
  useEffect(() => {
    try {
      const currentDraft = localStorage.getItem("billsplit_current_draft");
      if (currentDraft) {
        const parsed = JSON.parse(currentDraft);
        if (parsed.billTitle !== undefined) {
          if (parsed.billTitle === "Dinner with Friends" || !parsed.billTitle) {
            setBillTitle("Kasko Kati");
          } else {
            setBillTitle(parsed.billTitle);
          }
        }
        if (Array.isArray(parsed.friends))
          setFriends(sanitizeFriends(parsed.friends));
        if (Array.isArray(parsed.items) && parsed.items.length > 0)
          setItems(sanitizeItems(parsed.items));
        if (parsed.isVatBill !== undefined)
          setIsVatBill(Boolean(parsed.isVatBill));
        if (parsed.flatFee) setFlatFee(sanitizeFee(parsed.flatFee, "flat"));
        if (parsed.discount) setDiscount(sanitizeFee(parsed.discount, "flat"));
        if (parsed.tax) setTax(sanitizeFee(parsed.tax, "percent"));
        if (parsed.tip) setTip(sanitizeFee(parsed.tip, "percent"));
      }

      const storedHistory = localStorage.getItem("billsplit_saved_history");
      if (storedHistory) {
        const parsedHistory = JSON.parse(storedHistory);
        if (Array.isArray(parsedHistory))
          setSavedBills(sanitizeSavedBills(parsedHistory));
      }
    } catch (err) {
      console.error("Failed to load saved bill data from localStorage", err);
    } finally {
      setIsHydrated(true);
      isLoadedRef.current = true;
    }
  }, []);

  // ─── Auto-save to LocalStorage whenever state updates ───
  useEffect(() => {
    if (!isHydrated || !isLoadedRef.current) return;
    const timeout = setTimeout(() => {
      try {
        const draft = {
          billTitle,
          friends,
          items,
          isVatBill,
          flatFee,
          discount,
          tax,
          tip,
          updatedAt: new Date().toISOString(),
        };
        localStorage.setItem("billsplit_current_draft", JSON.stringify(draft));
      } catch (err) {
        console.error("Auto-save failed", err);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [billTitle, friends, items, isVatBill, flatFee, discount, tax, tip, isHydrated]);

  // ─── Computed totals ───
  const subtotal = items.reduce((s, i) => s + getItemTotalPrice(i), 0);
  const feeAmount =
    flatFee.type === "flat"
      ? flatFee.value
      : (subtotal * (flatFee.value || 0)) / 100;
  const discountAmount =
    discount.type === "flat"
      ? discount.value
      : (subtotal * (discount.value || 0)) / 100;
  const taxAmount =
    tax.type === "flat" ? tax.value : (subtotal * (tax.value || 0)) / 100;
  const tipAmount =
    tip.type === "flat" ? tip.value : (subtotal * (tip.value || 0)) / 100;

  const grandTotal = Math.max(
    0,
    subtotal + feeAmount - discountAmount + taxAmount + tipAmount,
  );

  const personSubtotals: Record<string, number> = {};
  friends.forEach((f) => {
    personSubtotals[f.id] = items.reduce(
      (s, item) => s + personItemCost(item, f.id),
      0,
    );
  });
  const personTotals: Record<string, number> = {};
  const totalSubtotal = Object.values(personSubtotals).reduce(
    (s, v) => s + v,
    0,
  );
  friends.forEach((f) => {
    const ratio =
      totalSubtotal > 0
        ? personSubtotals[f.id] / totalSubtotal
        : 1 / Math.max(friends.length, 1);
    personTotals[f.id] =
      personSubtotals[f.id] +
      (feeAmount - discountAmount + taxAmount + tipAmount) * ratio;
  });

  // ─── Friends handlers ───
  function addFriend() {
    const name = newFriendName.trim();
    if (!name) return;
    setFriends((prev) => [...prev, { id: uid(), name, colorIdx: prev.length }]);
    setNewFriendName("");
  }

  function removeFriend(fid: string) {
    setFriends((prev) => prev.filter((f) => f.id !== fid));
    setItems((prev) =>
      prev.map((item) => ({
        ...item,
        shares: item.shares.filter((s) => s.friendId !== fid),
      })),
    );
  }

  // ─── Items handlers ───
  function addItem() {
    setItems((prev) => [
      ...prev,
      { id: uid(), name: "", price: 0, totalQty: 1, shares: [] },
    ]);
  }

  function handleToggleVatBill(enable: boolean) {
    if (enable === isVatBill) return;
    setIsVatBill(enable);
    if (enable) {
      setItems((prev) =>
        prev.map((item) => ({
          ...item,
          price: item.price > 0 ? Math.round(item.price * 1.13 * 100) / 100 : 0,
        })),
      );
    } else {
      setItems((prev) =>
        prev.map((item) => ({
          ...item,
          price: item.price > 0 ? Number((item.price / 1.13).toFixed(2)) : 0,
        })),
      );
    }
  }

  // ─── Save snapshot to History ───
  function saveToHistory() {
    const newBill: SavedBill = {
      id: uid(),
      title: billTitle.trim() || "Untitled Bill",
      date: new Date().toLocaleDateString("en-IN", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      friends,
      items,
      isVatBill,
      flatFee,
      discount,
      tax,
      tip,
      grandTotal,
    };
    const updated = [newBill, ...savedBills.filter((b) => b.id !== newBill.id)];
    setSavedBills(updated);
    localStorage.setItem("billsplit_saved_history", JSON.stringify(updated));
    showToast("Bill saved to history!", "success");
  }

  function loadSavedBill(bill: SavedBill) {
    setBillTitle(bill.title);
    setFriends(bill.friends);
    setItems(bill.items);
    setIsVatBill(bill.isVatBill !== false);
    setFlatFee(bill.flatFee);
    setDiscount(bill.discount);
    setTax(bill.tax);
    setTip(bill.tip);
    setShowHistoryModal(false);
    showToast(`Loaded "${bill.title}"`, "info");
  }

  function deleteSavedBill(id: string) {
    setConfirmModalState({
      isOpen: true,
      title: "Delete Saved Bill?",
      message: "Are you sure you want to remove this saved bill from history? This cannot be undone.",
      confirmVariant: "danger",
      confirmText: "Delete",
      onConfirm: () => {
        const updated = savedBills.filter((b) => b.id !== id);
        setSavedBills(updated);
        localStorage.setItem("billsplit_saved_history", JSON.stringify(updated));
        showToast("Bill deleted from history", "info");
      },
    });
  }

  function handleResetNewBill() {
    setConfirmModalState({
      isOpen: true,
      title: "Start New Bill?",
      message: "Are you sure you want to clear current items and start a new bill? Your added friends will be preserved.",
      confirmVariant: "amber",
      confirmText: "Start Fresh",
      onConfirm: () => {
        setBillTitle("Kasko Kati");
        // Keep friends list intact; reset only items and fees
        setItems([{ id: uid(), name: "", price: 0, totalQty: 1, shares: [] }]);
        setIsVatBill(true);
        setFlatFee({ type: "flat", value: 0 });
        setDiscount({ type: "flat", value: 0 });
        setTax({ type: "percent", value: 0 });
        setTip({ type: "percent", value: 0 });
        showToast("Started a new bill (friends kept)", "info");
      },
    });
  }

  // ─── JSON Export All / Import All ───
  function exportFullBackupJSON() {
    const payload = {
      version: 1,
      type: "billsplit_full_backup",
      exportedAt: new Date().toISOString(),
      currentBill: {
        title: billTitle.trim() || "Untitled Bill",
        friends,
        items,
        isVatBill,
        flatFee,
        discount,
        tax,
        tip,
        grandTotal,
      },
      savedBills,
    };
    const dateStr = new Date().toLocaleDateString("en-IN").replace(/\//g, "-");
    downloadJSON(payload, `BillSplit_Backup_${dateStr}.json`);
    showToast("Downloaded backup JSON file", "success");
  }

  function processImportedJSON(parsed: any) {
    if (!parsed || typeof parsed !== "object") {
      showToast("Invalid JSON structure", "error");
      return;
    }

    // Restore Current Bill if present
    const billData =
      parsed.currentBill ||
      parsed.currentDraft ||
      parsed.bill ||
      (Array.isArray(parsed.items) ? parsed : null);
    if (billData) {
      if (billData.billTitle !== undefined) setBillTitle(String(billData.billTitle));
      else if (billData.title !== undefined) setBillTitle(String(billData.title));

      if (Array.isArray(billData.friends)) setFriends(sanitizeFriends(billData.friends));
      if (Array.isArray(billData.items)) setItems(sanitizeItems(billData.items));
      if (billData.isVatBill !== undefined) setIsVatBill(Boolean(billData.isVatBill));
      if (billData.flatFee) setFlatFee(sanitizeFee(billData.flatFee, "flat"));
      if (billData.discount) setDiscount(sanitizeFee(billData.discount, "flat"));
      if (billData.tax) setTax(sanitizeFee(billData.tax, "percent"));
      if (billData.tip) setTip(sanitizeFee(billData.tip, "percent"));
    }

    // Restore Saved Bills
    const rawSaved = Array.isArray(parsed.savedBills)
      ? parsed.savedBills
      : Array.isArray(parsed)
        ? parsed
        : [];
    if (rawSaved.length > 0) {
      const importedSaved = sanitizeSavedBills(rawSaved);
      setSavedBills((prev) => {
        const existingIds = new Set(prev.map((b) => b.id));
        const newOnes = importedSaved.filter((b) => !existingIds.has(b.id));
        const merged = [...newOnes, ...prev];
        localStorage.setItem("billsplit_saved_history", JSON.stringify(merged));
        return merged;
      });
    }

    showToast("Backup imported successfully!", "success");
    setShowHistoryModal(false);
  }

  // ─── Export Handlers ───
  const handleExportPDF = useCallback(async () => {
    if (!exportRef.current) return;
    setExporting(true);
    try {
      await exportAsPDF(exportRef.current, billTitle);
      showToast("PDF downloaded successfully!", "success");
    } catch (err) {
      console.error("PDF export failed", err);
      showToast("Failed to generate PDF", "error");
    } finally {
      setExporting(false);
    }
  }, [billTitle, showToast]);

  const handleExportImage = useCallback(async () => {
    if (!exportRef.current) return;
    setExporting(true);
    try {
      await exportAsImage(exportRef.current, billTitle);
      showToast("Image downloaded successfully!", "success");
    } catch (err) {
      console.error("Image export failed", err);
      showToast("Failed to generate Image", "error");
    } finally {
      setExporting(false);
    }
  }, [billTitle, showToast]);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)" }}>
      {/* Header */}
      <Header
        billTitle={billTitle}
        setBillTitle={setBillTitle}
        savedBillsCount={savedBills.length}
        isHydrated={isHydrated}
        onOpenHistory={() => setShowHistoryModal(true)}
        onSaveHistory={saveToHistory}
        onResetBill={handleResetNewBill}
      />

      {/* Clean 2-Segment Mobile Tab Control (< 1024px) */}
      <nav className="mobile-tab-nav" aria-label="Mobile section navigation">
        <div className="mobile-segmented-wrap">
          <button
            type="button"
            className={`mobile-segment-btn ${mobileTab === "items" ? "active" : ""}`}
            onClick={() => setMobileTab("items")}
            style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6 }}
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
            <span>Items ({items.length})</span>
          </button>
          <button
            type="button"
            className={`mobile-segment-btn ${mobileTab === "friends" ? "active" : ""}`}
            onClick={() => setMobileTab("friends")}
            style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6 }}
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <span>Friends ({friends.length})</span>
          </button>
        </div>
      </nav>

      {/* Main Grid */}
      <div className="main-grid">
        {/* Friends Section (Visible when tab is "friends" on mobile, always visible on desktop) */}
        <div
          className={`section-wrapper ${mobileTab !== "friends" ? "mobile-hidden" : ""}`}
          style={{ width: "100%" }}
        >
          <FriendsSection
            friends={friends}
            items={items}
            personTotals={personTotals}
            personSubtotals={personSubtotals}
            feeAmount={feeAmount}
            taxAmount={taxAmount}
            discountAmount={discountAmount}
            tipAmount={tipAmount}
            newFriendName={newFriendName}
            setNewFriendName={setNewFriendName}
            onAddFriend={addFriend}
            onRemoveFriend={removeFriend}
          />
        </div>

        {/* Items Section (Visible when tab is "items" on mobile, always visible on desktop) */}
        <div
          className={`section-wrapper ${mobileTab !== "items" ? "mobile-hidden" : ""}`}
          style={{ width: "100%" }}
        >
          <ItemsSection
            items={items}
            friends={friends}
            isVatBill={isVatBill}
            onToggleVatBill={handleToggleVatBill}
            setItems={setItems}
            onAddItem={addItem}
          />
        </div>

        {/* Bill Totals Sidebar (Desktop only sidebar) */}
        <div
          className="section-wrapper desktop-only-sidebar"
          style={{ width: "100%" }}
        >
          <BillTotalsCard
            itemsCount={items.length}
            subtotal={subtotal}
            flatFee={flatFee}
            setFlatFee={setFlatFee}
            tax={tax}
            setTax={setTax}
            discount={discount}
            setDiscount={setDiscount}
            tip={tip}
            setTip={setTip}
            feeAmount={feeAmount}
            taxAmount={taxAmount}
            discountAmount={discountAmount}
            tipAmount={tipAmount}
            grandTotal={grandTotal}
            hasFriends={friends.length > 0}
            onOpenExportModal={() => setShowExportModal(true)}
          />
        </div>
      </div>

      {/* Persistent Bottom Summary Bar on Mobile */}
      <div className="mobile-bottom-bar">
        <div
          className="mobile-bottom-total-col"
          onClick={() => setShowFeesModal(true)}
          role="button"
          tabIndex={0}
          title="Click to view & edit taxes, fees, and arithmetic breakdown"
        >
          <div className="mobile-bottom-total-row">
            <span className="mobile-bottom-label">Grand Total:</span>
            <span className="mobile-bottom-amount">{formatCurrency(grandTotal)}</span>
          </div>
          <div className="mobile-bottom-subtext">
            <span>Tap for breakdown ↗</span>
          </div>
        </div>

        <button
          type="button"
          className="btn btn-primary btn-sm mobile-bottom-export-btn"
          onClick={() => setShowExportModal(true)}
          disabled={friends.length === 0}
          title="Export bill as PDF or Image"
          style={{ display: "inline-flex", alignItems: "center", gap: 5 }}
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </svg>
          <span>Share</span>
        </button>
      </div>

      {/* Saved Bills History Modal with Import/Export All */}
      <HistoryModal
        isOpen={showHistoryModal}
        savedBills={savedBills}
        onClose={() => setShowHistoryModal(false)}
        onLoadBill={loadSavedBill}
        onDeleteBill={deleteSavedBill}
        onExportBackupJson={exportFullBackupJSON}
        onImportBackupJson={processImportedJSON}
        onError={(msg) => showToast(msg, "error")}
      />

      {/* Export / Share Modal (PDF or PNG) */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExportPdf={handleExportPDF}
        onExportImage={handleExportImage}
        exporting={exporting}
        friendsCount={friends.length}
      />

      {/* Mobile Fees & Taxes Bottom Sheet Modal */}
      <FeesModal
        isOpen={showFeesModal}
        onClose={() => setShowFeesModal(false)}
        itemsCount={items.length}
        subtotal={subtotal}
        flatFee={flatFee}
        setFlatFee={setFlatFee}
        tax={tax}
        setTax={setTax}
        discount={discount}
        setDiscount={setDiscount}
        tip={tip}
        setTip={setTip}
        feeAmount={feeAmount}
        taxAmount={taxAmount}
        discountAmount={discountAmount}
        tipAmount={tipAmount}
        grandTotal={grandTotal}
      />

      {/* Custom Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModalState.isOpen}
        title={confirmModalState.title}
        message={confirmModalState.message}
        confirmText={confirmModalState.confirmText}
        confirmVariant={confirmModalState.confirmVariant}
        onConfirm={confirmModalState.onConfirm}
        onCancel={() =>
          setConfirmModalState((prev) => ({ ...prev, isOpen: false }))
        }
      />

      {/* Toast Notification Container */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Hidden export template for PDF & PNG generation */}
      <div
        style={{
          position: "absolute",
          left: -9999,
          top: 0,
          width: 860,
          pointerEvents: "none",
        }}
      >
        <div ref={exportRef}>
          {isHydrated && (
            <SummaryExportView
              title={billTitle}
              friends={friends}
              items={items}
              flatFee={flatFee}
              discount={discount}
              tax={tax}
              tip={tip}
              subtotal={subtotal}
              grandTotal={grandTotal}
              personTotals={personTotals}
            />
          )}
        </div>
      </div>
    </div>
  );
}
