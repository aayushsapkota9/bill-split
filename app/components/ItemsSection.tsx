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
        <h2 className="section-title">
          <span style={{ fontSize: 18 }}>🛒</span> Bill Items
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
        <div className="empty-items-card">
          <div style={{ fontSize: 36, marginBottom: 10 }}>📋</div>
          <div style={{ fontSize: 15, fontWeight: 500 }}>No items yet</div>
          <div style={{ fontSize: 13, marginTop: 4 }}>
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
