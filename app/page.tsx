"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { BillItem, FeeConfig, Friend, SavedBill } from "./types";
import {
  downloadJSON,
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
import { JsonModal } from "./components/JsonModal";

export default function BillSplitPage() {
  const isLoadedRef = useRef(false);

  const [billTitle, setBillTitle] = useState("Dinner with Friends");
  const [friends, setFriends] = useState<Friend[]>([]);
  const [newFriendName, setNewFriendName] = useState("");
  const [items, setItems] = useState<BillItem[]>([
    { id: uid(), name: "", price: 0, totalQty: 1, shares: [] },
  ]);
  const [flatFee, setFlatFee] = useState<FeeConfig>({ type: "flat", value: 0 });
  const [discount, setDiscount] = useState<FeeConfig>({
    type: "flat",
    value: 0,
  });
  const [tax, setTax] = useState<FeeConfig>({ type: "percent", value: 0 });
  const [tip, setTip] = useState<FeeConfig>({ type: "percent", value: 0 });

  // Persistence state
  const [isHydrated, setIsHydrated] = useState(false);
  const [savedBills, setSavedBills] = useState<SavedBill[]>([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving">("saved");

  // JSON Export / Import state
  const [showJsonModal, setShowJsonModal] = useState(false);
  const [jsonTab, setJsonTab] = useState<"export" | "import">("export");
  const [jsonPasteText, setJsonPasteText] = useState("");
  const [importStatusMessage, setImportStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Export
  const [exporting, setExporting] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  // ─── Load from LocalStorage on mount ───
  useEffect(() => {
    try {
      const currentDraft = localStorage.getItem("billsplit_current_draft");
      if (currentDraft) {
        const parsed = JSON.parse(currentDraft);
        if (parsed.billTitle !== undefined) setBillTitle(parsed.billTitle);
        if (Array.isArray(parsed.friends))
          setFriends(sanitizeFriends(parsed.friends));
        if (Array.isArray(parsed.items) && parsed.items.length > 0)
          setItems(sanitizeItems(parsed.items));
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
    setSaveStatus("saving");
    const timeout = setTimeout(() => {
      try {
        const draft = {
          billTitle,
          friends,
          items,
          flatFee,
          discount,
          tax,
          tip,
          updatedAt: new Date().toISOString(),
        };
        localStorage.setItem("billsplit_current_draft", JSON.stringify(draft));
        setSaveStatus("saved");
      } catch (err) {
        console.error("Auto-save failed", err);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [billTitle, friends, items, flatFee, discount, tax, tip, isHydrated]);

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
      flatFee,
      discount,
      tax,
      tip,
      grandTotal,
    };
    const updated = [newBill, ...savedBills.filter((b) => b.id !== newBill.id)];
    setSavedBills(updated);
    localStorage.setItem("billsplit_saved_history", JSON.stringify(updated));
    alert("Bill saved to your saved bills history!");
  }

  function loadSavedBill(bill: SavedBill) {
    setBillTitle(bill.title);
    setFriends(bill.friends);
    setItems(bill.items);
    setFlatFee(bill.flatFee);
    setDiscount(bill.discount);
    setTax(bill.tax);
    setTip(bill.tip);
    setShowHistoryModal(false);
  }

  function deleteSavedBill(id: string) {
    const updated = savedBills.filter((b) => b.id !== id);
    setSavedBills(updated);
    localStorage.setItem("billsplit_saved_history", JSON.stringify(updated));
  }

  function handleResetNewBill() {
    if (
      confirm(
        "Start a new bill? Make sure to save the current bill to history if you need it later.",
      )
    ) {
      setBillTitle("Dinner with Friends");
      setFriends([]);
      setItems([{ id: uid(), name: "", price: 0, totalQty: 1, shares: [] }]);
      setFlatFee({ type: "flat", value: 0 });
      setDiscount({ type: "flat", value: 0 });
      setTax({ type: "percent", value: 0 });
      setTip({ type: "percent", value: 0 });
    }
  }

  // ─── JSON Export & Import Handlers ───
  function loadBillData(data: {
    billTitle?: string;
    title?: string;
    friends?: unknown;
    items?: unknown;
    flatFee?: unknown;
    discount?: unknown;
    tax?: unknown;
    tip?: unknown;
  }) {
    if (data.billTitle !== undefined) setBillTitle(String(data.billTitle));
    else if (data.title !== undefined) setBillTitle(String(data.title));

    if (Array.isArray(data.friends)) {
      setFriends(sanitizeFriends(data.friends));
    }
    if (Array.isArray(data.items)) {
      const sItems = sanitizeItems(data.items);
      setItems(
        sItems.length > 0
          ? sItems
          : [{ id: uid(), name: "", price: 0, totalQty: 1, shares: [] }],
      );
    }
    if (data.flatFee) setFlatFee(sanitizeFee(data.flatFee, "flat"));
    if (data.discount) setDiscount(sanitizeFee(data.discount, "flat"));
    if (data.tax) setTax(sanitizeFee(data.tax, "percent"));
    if (data.tip) setTip(sanitizeFee(data.tip, "percent"));
  }

  function exportCurrentBillJSON() {
    const payload = {
      version: 1,
      type: "billsplit_current_bill",
      exportedAt: new Date().toISOString(),
      bill: {
        title: billTitle.trim() || "Untitled Bill",
        friends,
        items,
        flatFee,
        discount,
        tax,
        tip,
        grandTotal,
      },
    };
    const safeTitle = (billTitle.trim() || "Bill").replace(
      /[^a-zA-Z0-9_-]/g,
      "_",
    );
    downloadJSON(payload, `${safeTitle}_current_bill.json`);
  }

  function exportFullBackupJSON() {
    const payload = {
      version: 1,
      type: "billsplit_full_backup",
      exportedAt: new Date().toISOString(),
      currentBill: {
        title: billTitle.trim() || "Untitled Bill",
        friends,
        items,
        flatFee,
        discount,
        tax,
        tip,
        grandTotal,
      },
      savedBills,
    };
    const dateStr = new Date().toLocaleDateString("en-IN").replace(/\//g, "-");
    downloadJSON(payload, `BillSplit_Full_Backup_${dateStr}.json`);
  }

  function exportSavedBillJSON(bill: SavedBill) {
    const payload = {
      version: 1,
      type: "billsplit_saved_bill",
      exportedAt: new Date().toISOString(),
      bill,
    };
    const safeTitle = (bill.title.trim() || "Bill").replace(
      /[^a-zA-Z0-9_-]/g,
      "_",
    );
    downloadJSON(payload, `${safeTitle}_bill.json`);
  }

  function exportAllSavedBillsJSON() {
    const payload = {
      version: 1,
      type: "billsplit_saved_history",
      exportedAt: new Date().toISOString(),
      savedBills,
    };
    const dateStr = new Date().toLocaleDateString("en-IN").replace(/\//g, "-");
    downloadJSON(payload, `BillSplit_Saved_Bills_${dateStr}.json`);
  }

  function processImportedJSON(parsed: any): boolean {
    if (!parsed || typeof parsed !== "object") {
      setImportStatusMessage({
        type: "error",
        text: "Invalid JSON structure.",
      });
      return false;
    }

    // Case 1: Full Backup
    if (
      parsed.type === "billsplit_full_backup" ||
      (parsed.savedBills &&
        (parsed.currentBill || parsed.currentDraft || parsed.bill))
    ) {
      const billData =
        parsed.currentBill || parsed.currentDraft || parsed.bill;
      if (billData) loadBillData(billData);
      if (Array.isArray(parsed.savedBills)) {
        const importedSaved = sanitizeSavedBills(parsed.savedBills);
        setSavedBills((prev) => {
          const existingIds = new Set(prev.map((b) => b.id));
          const newOnes = importedSaved.filter((b) => !existingIds.has(b.id));
          const merged = [...newOnes, ...prev];
          localStorage.setItem(
            "billsplit_saved_history",
            JSON.stringify(merged),
          );
          return merged;
        });
      }
      setImportStatusMessage({
        type: "success",
        text: `Full backup restored! Loaded bill and synced ${parsed.savedBills?.length || 0} saved bills.`,
      });
      return true;
    }

    // Case 2: Array of Saved Bills
    if (
      Array.isArray(parsed) ||
      (parsed.type === "billsplit_saved_history" &&
        Array.isArray(parsed.savedBills))
    ) {
      const list = Array.isArray(parsed) ? parsed : parsed.savedBills;
      const importedSaved = sanitizeSavedBills(list);
      if (importedSaved.length > 0) {
        setSavedBills((prev) => {
          const existingIds = new Set(prev.map((b) => b.id));
          const newOnes = importedSaved.filter((b) => !existingIds.has(b.id));
          const merged = [...newOnes, ...prev];
          localStorage.setItem(
            "billsplit_saved_history",
            JSON.stringify(merged),
          );
          return merged;
        });
        setImportStatusMessage({
          type: "success",
          text: `Successfully imported ${importedSaved.length} saved bills into history!`,
        });
        return true;
      }
    }

    // Case 3: Single Bill
    const singleBill = parsed.bill || parsed;
    if (
      singleBill &&
      (Array.isArray(singleBill.friends) ||
        Array.isArray(singleBill.items) ||
        singleBill.title ||
        singleBill.billTitle)
    ) {
      loadBillData(singleBill);
      const title = singleBill.title || singleBill.billTitle || "Bill";
      setImportStatusMessage({
        type: "success",
        text: `Successfully loaded bill: "${title}" with ${singleBill.friends?.length || 0} friends and ${singleBill.items?.length || 0} items!`,
      });
      return true;
    }

    setImportStatusMessage({
      type: "error",
      text: "Could not recognize BillSplit data in this JSON.",
    });
    return false;
  }

  // ─── Export Handlers ───
  const handleExportPDF = useCallback(async () => {
    if (!exportRef.current) return;
    setExporting(true);
    try {
      await exportAsPDF(exportRef.current, billTitle);
    } catch (err) {
      console.error("PDF export failed", err);
    } finally {
      setExporting(false);
    }
  }, [billTitle]);

  const handleExportImage = useCallback(async () => {
    if (!exportRef.current) return;
    setExporting(true);
    try {
      await exportAsImage(exportRef.current, billTitle);
    } catch (err) {
      console.error("Image export failed", err);
    } finally {
      setExporting(false);
    }
  }, [billTitle]);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)" }}>
      {/* Header */}
      <Header
        billTitle={billTitle}
        setBillTitle={setBillTitle}
        saveStatus={saveStatus}
        savedBillsCount={savedBills.length}
        isHydrated={isHydrated}
        exporting={exporting}
        friends={friends}
        onOpenHistory={() => setShowHistoryModal(true)}
        onSaveHistory={saveToHistory}
        onResetBill={handleResetNewBill}
        onOpenJsonModal={() => {
          setImportStatusMessage(null);
          setShowJsonModal(true);
        }}
        onExportImage={handleExportImage}
        onExportPdf={handleExportPDF}
      />

      {/* Main Grid */}
      <div className="main-grid">
        {/* LEFT: Friends Section */}
        <FriendsSection
          friends={friends}
          items={items}
          personTotals={personTotals}
          newFriendName={newFriendName}
          setNewFriendName={setNewFriendName}
          onAddFriend={addFriend}
          onRemoveFriend={removeFriend}
        />

        {/* CENTER: Items Section */}
        <ItemsSection
          items={items}
          friends={friends}
          setItems={setItems}
          onAddItem={addItem}
        />

        {/* RIGHT: Bill Totals Sidebar */}
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
          exporting={exporting}
          onOpenJsonModal={() => {
            setImportStatusMessage(null);
            setShowJsonModal(true);
          }}
          onExportImage={handleExportImage}
          onExportPdf={handleExportPDF}
        />
      </div>

      {/* Saved Bills History Modal */}
      <HistoryModal
        isOpen={showHistoryModal}
        savedBills={savedBills}
        onClose={() => setShowHistoryModal(false)}
        onLoadBill={loadSavedBill}
        onDeleteBill={deleteSavedBill}
        onExportSavedBillJson={exportSavedBillJSON}
        onExportAllSavedBillsJson={exportAllSavedBillsJSON}
        onOpenImportJson={() => {
          setShowHistoryModal(false);
          setJsonTab("import");
          setImportStatusMessage(null);
          setShowJsonModal(true);
        }}
      />

      {/* JSON Export / Import Modal */}
      <JsonModal
        isOpen={showJsonModal}
        onClose={() => setShowJsonModal(false)}
        jsonTab={jsonTab}
        setJsonTab={setJsonTab}
        importStatusMessage={importStatusMessage}
        setImportStatusMessage={setImportStatusMessage}
        billTitle={billTitle}
        friendsCount={friends.length}
        itemsCount={items.length}
        savedBills={savedBills}
        jsonPasteText={jsonPasteText}
        setJsonPasteText={setJsonPasteText}
        onExportCurrentBill={exportCurrentBillJSON}
        onExportFullBackup={exportFullBackupJSON}
        onExportAllSavedBills={exportAllSavedBillsJSON}
        onProcessImportedJson={processImportedJSON}
      />

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
