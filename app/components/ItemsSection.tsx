import React from "react";
import { BillItem, Friend } from "../types";
import { ItemRow } from "./ItemRow";
import { uid } from "../lib/utils";

interface ItemsSectionProps {
  items: BillItem[];
  friends: Friend[];
  setItems: React.Dispatch<React.SetStateAction<BillItem[]>>;
  onAddItem: () => void;
}

export function ItemsSection({
  items,
  friends,
  setItems,
  onAddItem,
}: ItemsSectionProps) {
  return (
    <section className="items-section">
      <div className="section-header">
        <h2 className="section-title">
          <span style={{ fontSize: 18 }}>🛒</span> Bill Items
          <span className="badge-count-secondary">
            {items.length}
          </span>
        </h2>
        <button
          type="button"
          className="btn btn-primary"
          onClick={onAddItem}
          id="add-item-btn"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add Item
        </button>
      </div>

      {items.length === 0 && (
        <div className="empty-items-card">
          <div style={{ fontSize: 36, marginBottom: 10 }}>📋</div>
          <div style={{ fontSize: 15, fontWeight: 500 }}>No items yet</div>
          <div style={{ fontSize: 13, marginTop: 4 }}>
            Click &quot;Add Item&quot; to start
          </div>
        </div>
      )}

      {items.map((item) => (
        <ItemRow
          key={item.id}
          item={item}
          friends={friends}
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
          onSplitIntoIndividuals={(newItems) =>
            setItems((prev) => {
              const idx = prev.findIndex((i) => i.id === item.id);
              const next = [...prev];
              next.splice(idx, 1, ...newItems);
              return next;
            })
          }
        />
      ))}

      <button
        type="button"
        className="btn btn-ghost add-item-dashed-btn"
        onClick={onAddItem}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        Add Another Item
      </button>
    </section>
  );
}
