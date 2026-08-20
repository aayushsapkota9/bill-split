import React, { useRef, useState } from "react";
import { BillItem, Friend } from "../types";
import { ItemRow } from "./ItemRow";
import { uid } from "../lib/utils";

interface ItemsSectionProps {
  items: BillItem[];
  friends: Friend[];
  isVatBill: boolean;
  onToggleVatBill: (enable: boolean) => void;
  setItems: React.Dispatch<React.SetStateAction<BillItem[]>>;
  onAddItem: () => void;
}

export function ItemsSection({
  items,
  friends,
  isVatBill,
  onToggleVatBill,
  setItems,
  onAddItem,
}: ItemsSectionProps) {
  const nameInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [autoFocusLastId, setAutoFocusLastId] = useState<string | null>(null);

  function handleRequestNextItem(index: number) {
    if (index < items.length - 1) {
      // Focus the next existing item's name input
      const nextInput = nameInputRefs.current[index + 1];
      if (nextInput) {
        nextInput.focus();
        nextInput.select();
      }
    } else {
      // Add a new item and auto-focus it
      const newId = uid();
      setAutoFocusLastId(newId);
      setItems((prev) => [
        ...prev,
        { id: newId, name: "", price: 0, totalQty: 1, shares: [] },
      ]);
    }
  }

  return (
    <section className="items-section">
      <div className="section-header">
        <h2 className="section-title" style={{ display: "flex", alignItems: "center", gap: 7 }}>
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
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <path d="M16 10a4 4 0 0 1-8 0" />
          </svg>
          <span>Bill Items</span>
          <span className="badge-count-secondary">
            {items.length}
          </span>
        </h2>

        {/* Bill-Level VAT / Non-VAT Switch */}
        <div className="item-vat-segmented" title="Choose whether this entire bill uses 13% VAT or No VAT">
          <button
            type="button"
            className={`item-vat-btn ${isVatBill ? "active" : ""}`}
            onClick={() => onToggleVatBill(true)}
          >
            13% VAT
          </button>
          <button
            type="button"
            className={`item-vat-btn ${!isVatBill ? "active" : ""}`}
            onClick={() => onToggleVatBill(false)}
          >
            No VAT
          </button>
        </div>
      </div>

      {items.length === 0 && (
        <div className="empty-items-card" style={{ padding: "28px 16px", textAlign: "center" }}>
          <div
            style={{
              background: "rgba(20, 184, 166, 0.12)",
              color: "var(--accent-teal)",
              width: 48,
              height: 48,
              borderRadius: 12,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 12px",
            }}
          >
            <svg
              width="24"
              height="24"
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
          <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)" }}>No items yet</div>
          <div style={{ fontSize: 13, marginTop: 4, color: "var(--text-muted)" }}>
            Click &quot;+ Add Item&quot; below to start
          </div>
        </div>
      )}

      {items.map((item, idx) => (
        <ItemRow
          key={item.id}
          item={item}
          friends={friends}
          isVatBill={isVatBill}
          autoFocusName={autoFocusLastId === item.id}
          nameInputRefCallback={(el) => {
            nameInputRefs.current[idx] = el;
          }}
          onRequestNextItem={() => handleRequestNextItem(idx)}
          onChange={(updated) =>
            setItems((prev) =>
              prev.map((i) => (i.id === item.id ? updated : i)),
            )
          }
          onRemove={() =>
            setItems((prev) => prev.filter((i) => i.id !== item.id))
          }
          onDuplicate={() => {
            setItems((prev) => {
              const index = prev.findIndex((i) => i.id === item.id);
              const copy: BillItem = {
                ...item,
                id: uid(),
                name: item.name ? `${item.name} (Copy)` : "",
                shares: item.shares.map((s) => ({ ...s })),
              };
              const next = [...prev];
              next.splice(index + 1, 0, copy);
              return next;
            });
          }}
          onSplitIntoIndividuals={(newItems) => {
            setItems((prev) => {
              const index = prev.findIndex((i) => i.id === item.id);
              if (index === -1) return prev;
              const next = [...prev];
              next.splice(index, 1, ...newItems);
              return next;
            });
          }}
        />
      ))}

      {/* Bottom Add Item Button */}
      <button
        type="button"
        className="btn btn-ghost add-item-dashed-btn"
        onClick={() => {
          const newId = uid();
          setAutoFocusLastId(newId);
          setItems((prev) => [
            ...prev,
            { id: newId, name: "", price: 0, totalQty: 1, shares: [] },
          ]);
        }}
        id="add-item-btn"
        title="Add a new bill item"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        <span>Add Item</span>
      </button>
    </section>
  );
}
