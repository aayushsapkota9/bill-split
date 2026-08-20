import React, { useState, useEffect } from "react";
import { BillItem, Friend, ItemShare } from "../types";
import { uid } from "../lib/utils";

export interface ItemRowProps {
  item: BillItem;
  friends: Friend[];
  onChange: (updated: BillItem) => void;
  onRemove: () => void;
  onDuplicate: () => void;
  onSplitIntoIndividuals: (items: BillItem[]) => void;
}

export function ItemRow({
  item,
  friends,
  onChange,
  onRemove,
  onDuplicate,
  onSplitIntoIndividuals,
}: ItemRowProps) {
  const [showFractions, setShowFractions] = useState<boolean>(() =>
    item.shares.some((s) => s.qty !== 1),
  );

  useEffect(() => {
    if (item.shares.some((s) => s.qty !== 1)) {
      setShowFractions(true);
    }
  }, [item.shares]);

  const canSplit = item.totalQty >= 2 && Number.isInteger(item.totalQty);

  function handleSplit() {
    const n = Math.round(item.totalQty);
    const newItems: BillItem[] = Array.from({ length: n }, (_, i) => ({
      id: uid(),
      name: `${item.name || "Item"} ${i + 1}`,
      price: item.price,
      totalQty: 1,
      shares: [],
    }));
    onSplitIntoIndividuals(newItems);
  }

  const assignedTotal = item.shares.reduce((s, sh) => s + sh.qty, 0);
  const diff = Math.abs(assignedTotal - (item.totalQty || 0));
  const mismatch = diff > 0.05 && item.totalQty > 0 && item.shares.length > 0;

  function toggleFriend(fid: string) {
    const existing = item.shares.find((s) => s.friendId === fid);
    let newShares: ItemShare[];
    if (existing) {
      newShares = item.shares.filter((s) => s.friendId !== fid);
    } else {
      const defaultQty =
        showFractions && item.totalQty > 0
          ? Math.round((item.totalQty / (item.shares.length + 1)) * 100) / 100
          : 1;
      newShares = [...item.shares, { friendId: fid, qty: defaultQty }];
    }
    onChange({ ...item, shares: newShares });
  }

  function updateQty(fid: string, val: string) {
    if (val === "") {
      onChange({
        ...item,
        shares: item.shares.map((s) =>
          s.friendId === fid ? { ...s, qty: 0 } : s,
        ),
      });
      return;
    }
    const num = parseFloat(val);
    if (!isNaN(num)) {
      onChange({
        ...item,
        shares: item.shares.map((s) =>
          s.friendId === fid ? { ...s, qty: num } : s,
        ),
      });
    }
  }

  function updateField(field: "name" | "totalQty", val: string) {
    if (field === "name") {
      onChange({ ...item, name: val });
    } else {
      if (val === "") {
        onChange({ ...item, totalQty: 0 });
        return;
      }
      const newQty = parseFloat(val);
      if (!isNaN(newQty)) {
        onChange({ ...item, totalQty: newQty });
      }
    }
  }

  function handleWithoutVatChange(val: string) {
    if (val === "") {
      onChange({ ...item, price: 0 });
      return;
    }
    const num = parseFloat(val);
    if (!isNaN(num)) {
      const withVat = Math.round(num * 1.13 * 100) / 100;
      onChange({ ...item, price: withVat });
    }
  }

  function handleWithVatChange(val: string) {
    if (val === "") {
      onChange({ ...item, price: 0 });
      return;
    }
    const num = parseFloat(val);
    if (!isNaN(num)) {
      onChange({ ...item, price: num });
    }
  }

  function handleTotalPriceChange(val: string) {
    if (val === "") {
      onChange({ ...item, price: 0 });
      return;
    }
    const num = parseFloat(val);
    if (!isNaN(num)) {
      const qty = item.totalQty > 0 ? item.totalQty : 1;
      const unitWithVat = Math.round((num / qty) * 100) / 100;
      onChange({ ...item, price: unitWithVat });
    }
  }

  const withoutVatDisplay =
    item.price > 0 ? Number((item.price / 1.13).toFixed(2)) : "";
  const withVatDisplay = item.price > 0 ? Number(item.price.toFixed(2)) : "";
  const totalPriceDisplay =
    item.price > 0
      ? Number(
          ((item.price || 0) * (item.totalQty > 0 ? item.totalQty : 1)).toFixed(
            2,
          ),
        )
      : "";

  return (
    <div className="item-row">
      {/* Top Bar: Name & Delete */}
      <div className="item-header-row">
        <div className="item-name-wrap">
          <input
            className="input item-name-input"
            placeholder="Item name (e.g. Momos)"
            value={item.name}
            onChange={(e) => updateField("name", e.target.value)}
          />
          <div className="input-label">item name</div>
        </div>

        <button
          type="button"
          className="btn btn-danger item-delete-btn"
          onClick={onRemove}
          title="Remove item"
          aria-label="Remove item"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Numeric Inputs Grid */}
      <div className="item-numeric-grid">
        {/* Total Qty - HIGHLIGHTED */}
        <div className="input-block qty-block">
          <div className="qty-input-group">
            <input
              className="input qty-highlight-input"
              type="number"
              min="0"
              step="any"
              placeholder="Qty"
              value={item.totalQty || ""}
              onChange={(e) => updateField("totalQty", e.target.value)}
              onFocus={(e) => e.target.select()}
              title="Total servings/quantity of this item"
              style={{
                borderColor: "rgba(245, 158, 11, 0.45)",
                fontWeight: 600,
              }}
            />
            {canSplit && (
              <button
                type="button"
                className="btn btn-ghost split-x-btn"
                onClick={handleSplit}
                title={`Split into ${Math.round(item.totalQty)} individual items`}
              >
                Split x{Math.round(item.totalQty)}
              </button>
            )}
          </div>
          <div className="input-label" style={{ color: "var(--accent-amber)", fontWeight: 600 }}>
            qty
          </div>
        </div>

        {/* Unit Without VAT (Price) - HIGHLIGHTED */}
        <div className="input-block price-block">
          <div className="input-with-symbol">
            <span
              className="input-symbol"
              style={{ color: "var(--accent-emerald)", fontWeight: 700 }}
            >
              Rs
            </span>
            <input
              className="input price-highlight-input"
              type="number"
              min="0"
              step="any"
              placeholder="0.00"
              value={withoutVatDisplay}
              onChange={(e) => handleWithoutVatChange(e.target.value)}
              onFocus={(e) => e.target.select()}
              style={{
                paddingLeft: 26,
                borderColor: "rgba(16, 185, 129, 0.45)",
                fontWeight: 600,
                color: "var(--accent-emerald)",
              }}
              title="Unit price without VAT (e.g. 100)"
            />
          </div>
          <div className="input-label" style={{ color: "var(--accent-emerald)", fontWeight: 600 }}>
            Price (No VAT)
          </div>
        </div>

        {/* Unit With VAT (13%) - NON-HIGHLIGHTED */}
        <div className="input-block price-block">
          <div className="input-with-symbol">
            <span className="input-symbol">Rs</span>
            <input
              className="input"
              type="number"
              min="0"
              step="any"
              placeholder="0.00"
              value={withVatDisplay}
              onChange={(e) => handleWithVatChange(e.target.value)}
              onFocus={(e) => e.target.select()}
              style={{ paddingLeft: 26 }}
              title="Unit price with 13% VAT (e.g. 113)"
            />
          </div>
          <div className="input-label">Unit (13% VAT)</div>
        </div>

        {/* Total Actual Price - NON-HIGHLIGHTED */}
        <div className="input-block price-block total-price-block">
          <div className="input-with-symbol">
            <span className="input-symbol">Rs</span>
            <input
              className="input"
              type="number"
              min="0"
              step="any"
              placeholder="0.00"
              value={totalPriceDisplay}
              onChange={(e) => handleTotalPriceChange(e.target.value)}
              onFocus={(e) => e.target.select()}
              style={{ paddingLeft: 26 }}
              title="Total actual price for this item (Unit price × Qty)"
            />
          </div>
          <div className="input-label">Total Price</div>
        </div>
      </div>

      {/* Friends Assignment Pills */}
      {friends.length > 0 && (
        <div className="item-friends-section">
          <div className="friend-pills-wrap">
            {friends.map((f) => {
              const share = item.shares.find((s) => s.friendId === f.id);
              const checked = Boolean(share);
              return (
                <div key={f.id} className="friend-pill-container">
                  <button
                    type="button"
                    className={`friend-pill-btn ${checked ? "checked" : ""}`}
                    onClick={() => toggleFriend(f.id)}
                  >
                    <span>{f.name}</span>
                    <span className={`pill-checkbox ${checked ? "checked" : ""}`} />
                  </button>
                  {checked && showFractions && (
                    <input
                      className="qty-input"
                      type="text"
                      inputMode="decimal"
                      value={
                        share?.qty !== undefined && share?.qty !== null
                          ? String(Number(share.qty.toFixed(2)))
                          : ""
                      }
                      onChange={(e) => {
                        const val = e.target.value;
                        if (/^[0-9]*\.?[0-9]*$/.test(val)) {
                          updateQty(f.id, val);
                        }
                      }}
                      onFocus={(e) => e.target.select()}
                      onClick={(e) => e.stopPropagation()}
                      title={`How many did ${f.name} have? (e.g. 0.5, 1, 2)`}
                      placeholder="0"
                      style={{ width: 56 }}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {showFractions && mismatch && (
            <div className="warning-banner">
              Assigned {assignedTotal.toFixed(2)} but item total is{" "}
              {item.totalQty}. Difference:{" "}
              {assignedTotal - item.totalQty > 0 ? "+" : ""}
              {(assignedTotal - item.totalQty).toFixed(2)}
            </div>
          )}

          {/* Bottom actions toolbar */}
          <div className="item-bottom-toolbar">
            <div>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={onDuplicate}
                title="Duplicate this item"
              >
                Duplicate
              </button>
            </div>

            <div className="item-toolbar-actions">
              <button
                type="button"
                className={`btn btn-sm ${showFractions ? "btn-primary" : "btn-ghost"}`}
                onClick={() => {
                  const next = !showFractions;
                  setShowFractions(next);
                  if (next) {
                    if (item.shares.length > 0) {
                      const each =
                        Math.round(
                          ((item.totalQty || 1) / item.shares.length) * 100,
                        ) / 100;
                      onChange({
                        ...item,
                        shares: item.shares.map((s) => ({ ...s, qty: each })),
                      });
                    }
                  } else {
                    onChange({
                      ...item,
                      shares: item.shares.map((s) => ({ ...s, qty: 1 })),
                    });
                  }
                }}
              >
                {showFractions ? "Standard split" : "Assign quantities"}
              </button>

              {showFractions && item.shares.length > 0 && (
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => {
                    const each =
                      Math.round(
                        ((item.totalQty || 1) / item.shares.length) * 100,
                      ) / 100;
                    onChange({
                      ...item,
                      shares: item.shares.map((s) => ({ ...s, qty: each })),
                    });
                  }}
                  title="Distribute item quantity evenly among selected friends"
                >
                  Split evenly
                </button>
              )}

              <button
                type="button"
                className="btn btn-amber btn-sm"
                onClick={() => {
                  const each =
                    showFractions && friends.length > 0
                      ? Math.round(((item.totalQty || 1) / friends.length) * 100) / 100
                      : 1;
                  onChange({
                    ...item,
                    shares: friends.map((f) => ({ friendId: f.id, qty: each })),
                  });
                }}
              >
                Add all
              </button>

              {item.shares.length > 0 && (
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => onChange({ ...item, shares: [] })}
                >
                  Remove all
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {friends.length === 0 && (
        <div style={{ marginTop: 8, fontSize: 12, color: "var(--text-muted)" }}>
          Add friends on the left to assign this item
        </div>
      )}
    </div>
  );
}
