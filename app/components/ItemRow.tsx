import React, { useState, useEffect, useRef } from "react";
import { BillItem, Friend, ItemShare } from "../types";
import { uid } from "../lib/utils";
import { SplitItemModal } from "./SplitItemModal";

export interface ItemRowProps {
  item: BillItem;
  friends: Friend[];
  isVatBill: boolean;
  autoFocusName?: boolean;
  nameInputRefCallback?: (el: HTMLInputElement | null) => void;
  onRequestNextItem?: () => void;
  onChange: (updated: BillItem) => void;
  onRemove: () => void;
  onDuplicate: () => void;
  onSplitIntoIndividuals: (items: BillItem[]) => void;
}

function distributeEqualShares(
  shares: ItemShare[],
  totalQty: number,
): ItemShare[] {
  if (shares.length === 0) return [];
  const qty = totalQty > 0 ? totalQty : 1;
  const each = Math.round((qty / shares.length) * 100) / 100;
  return shares.map((s) => ({ ...s, qty: each }));
}

export function ItemRow({
  item,
  friends,
  isVatBill,
  autoFocusName,
  nameInputRefCallback,
  onRequestNextItem,
  onChange,
  onRemove,
  onDuplicate,
  onSplitIntoIndividuals,
}: ItemRowProps) {
  const [showCustomPortions, setShowCustomPortions] = useState<boolean>(() => {
    if (item.shares.length <= 1) return false;
    const firstQty = item.shares[0]?.qty;
    return item.shares.some((s) => s.qty !== firstQty);
  });
  const [showSplitModal, setShowSplitModal] = useState(false);
  const [rawInputs, setRawInputs] = useState<Record<string, string>>({});

  const nameInputRef = useRef<HTMLInputElement | null>(null);
  const qtyInputRef = useRef<HTMLInputElement | null>(null);
  const priceInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (autoFocusName && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [autoFocusName]);

  function handleSplitConfirm(pieces: number) {
    const qtyPerPiece =
      item.totalQty > 0 ? Math.round((item.totalQty / pieces) * 100) / 100 : 1;
    const newItems: BillItem[] = Array.from({ length: pieces }, (_, i) => ({
      id: uid(),
      name: `${item.name || "Item"} ${i + 1}`,
      price: item.price,
      totalQty: qtyPerPiece,
      shares: [],
    }));
    onSplitIntoIndividuals(newItems);
  }

  const assignedTotal = item.shares.reduce((s, sh) => s + sh.qty, 0);
  const diff = Math.abs(assignedTotal - (item.totalQty || 0));
  const mismatch =
    showCustomPortions &&
    diff > 0.05 &&
    item.totalQty > 0 &&
    item.shares.length > 0;

  function toggleFriend(fid: string) {
    const existing = item.shares.find((s) => s.friendId === fid);
    let selectedFriendIds: string[];
    if (existing) {
      selectedFriendIds = item.shares
        .filter((s) => s.friendId !== fid)
        .map((s) => s.friendId);
    } else {
      selectedFriendIds = [...item.shares.map((s) => s.friendId), fid];
    }

    const newShares = distributeEqualShares(
      selectedFriendIds.map((id) => ({ friendId: id, qty: 1 })),
      item.totalQty,
    );

    setRawInputs({});
    onChange({ ...item, shares: newShares });
  }

  function handleQtyInputChange(fid: string, val: string) {
    setRawInputs((prev) => ({ ...prev, [fid]: val }));

    if (val === "" || val === ".") {
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

  function handleQtyBlur(fid: string) {
    setRawInputs((prev) => {
      const next = { ...prev };
      delete next[fid];
      return next;
    });
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
        let updatedShares = item.shares;
        if (!showCustomPortions && item.shares.length > 0) {
          updatedShares = distributeEqualShares(item.shares, newQty);
        }
        onChange({ ...item, totalQty: newQty, shares: updatedShares });
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

  function handleNonVatPriceChange(val: string) {
    if (val === "") {
      onChange({ ...item, price: 0 });
      return;
    }
    const num = parseFloat(val);
    if (!isNaN(num)) {
      onChange({ ...item, price: num });
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
  const nonVatPriceDisplay = item.price > 0 ? Number(item.price.toFixed(2)) : "";
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
      {/* Top Header: Name & Row Lifecycle Actions (Duplicate, Split, Delete) */}
      <div className="item-header-row">
        <div className="item-name-wrap">
          <input
            ref={(el) => {
              nameInputRef.current = el;
              nameInputRefCallback?.(el);
            }}
            className="input item-name-input"
            placeholder="Item name (e.g. Momos)"
            value={item.name}
            onChange={(e) => updateField("name", e.target.value)}
            onFocus={(e) => e.target.select()}
            enterKeyHint="next"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                qtyInputRef.current?.focus();
                qtyInputRef.current?.select();
              }
            }}
          />
        </div>

        {/* Row Operations */}
        <div className="item-row-actions">
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={onDuplicate}
            title="Duplicate this item row"
          >
            Duplicate
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => setShowSplitModal(true)}
            title="Split this item row into multiple rows"
          >
            Split...
          </button>
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
      </div>

      {/* Numeric Inputs Grid (Labels placed cleanly ON TOP) */}
      <div className={`item-numeric-grid ${!isVatBill ? "non-vat-grid" : ""}`}>
        {/* Total Qty - HIGHLIGHTED */}
        <div className="input-block qty-block">
          <div className="input-label" style={{ color: "var(--accent-amber)", fontWeight: 600 }}>
            Qty
          </div>
          <input
            ref={qtyInputRef}
            className="input qty-highlight-input"
            type="number"
            min="0"
            step="any"
            placeholder="Qty"
            value={item.totalQty || ""}
            onChange={(e) => updateField("totalQty", e.target.value)}
            onFocus={(e) => e.target.select()}
            enterKeyHint="next"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                priceInputRef.current?.focus();
                priceInputRef.current?.select();
              }
            }}
            title="Total servings/quantity of this item"
            style={{
              borderColor: "rgba(245, 158, 11, 0.45)",
              fontWeight: 600,
            }}
          />
        </div>

        {/* 13% VAT Bill Mode */}
        {isVatBill ? (
          <>
            <div className="input-block price-block">
              <div className="input-label" style={{ color: "var(--accent-emerald)", fontWeight: 600 }}>
                Price (No VAT)
              </div>
              <div className="input-with-symbol">
                <span
                  className="input-symbol"
                  style={{ color: "var(--accent-emerald)", fontWeight: 700 }}
                >
                  Rs
                </span>
                <input
                  ref={priceInputRef}
                  className="input price-highlight-input"
                  type="number"
                  min="0"
                  step="any"
                  placeholder="0.00"
                  value={withoutVatDisplay}
                  onChange={(e) => handleWithoutVatChange(e.target.value)}
                  onFocus={(e) => e.target.select()}
                  enterKeyHint="next"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      onRequestNextItem?.();
                    }
                  }}
                  style={{
                    paddingLeft: 26,
                    borderColor: "rgba(16, 185, 129, 0.45)",
                    fontWeight: 600,
                    color: "var(--accent-emerald)",
                  }}
                  title="Unit price without VAT (e.g. 100)"
                />
              </div>
            </div>

            {/* Unit With VAT (13%) - NON-HIGHLIGHTED */}
            <div className="input-block price-block">
              <div className="input-label">Unit (13% VAT)</div>
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
            </div>
          </>
        ) : (
          /* Non-VAT Bill Mode: Direct Unit Price (HIGHLIGHTED) */
          <div className="input-block price-block">
            <div className="input-label" style={{ color: "var(--accent-emerald)", fontWeight: 600 }}>
              Price / Unit
            </div>
            <div className="input-with-symbol">
              <span
                className="input-symbol"
                style={{ color: "var(--accent-emerald)", fontWeight: 700 }}
              >
                Rs
              </span>
              <input
                ref={priceInputRef}
                className="input price-highlight-input"
                type="number"
                min="0"
                step="any"
                placeholder="0.00"
                value={nonVatPriceDisplay}
                onChange={(e) => handleNonVatPriceChange(e.target.value)}
                onFocus={(e) => e.target.select()}
                enterKeyHint="next"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    onRequestNextItem?.();
                  }
                }}
                style={{
                  paddingLeft: 26,
                  borderColor: "rgba(16, 185, 129, 0.45)",
                  fontWeight: 600,
                  color: "var(--accent-emerald)",
                }}
                title="Direct Unit Price (No VAT)"
              />
            </div>
          </div>
        )}

        {/* Total Actual Price - NON-HIGHLIGHTED */}
        <div className="input-block price-block total-price-block">
          <div className="input-label">Total Price</div>
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
        </div>
      </div>

      {/* Friends Assignment Section */}
      {friends.length > 0 && (
        <div className="item-friends-section">
          {/* Internal Friends Operations Header */}
          <div className="item-friends-header">
            <span className="item-friends-title">
              Split with:
            </span>

            {/* Clear 2-State Segmented Control (Equal vs Custom) + Quick Actions */}
            <div className="item-assignment-actions">
              {/* Segmented Control */}
              <div className="item-mode-segmented">
                <button
                  type="button"
                  className={`item-mode-btn ${!showCustomPortions ? "active" : ""}`}
                  onClick={() => {
                    if (showCustomPortions) {
                      setShowCustomPortions(false);
                      const equalShares = distributeEqualShares(
                        item.shares,
                        item.totalQty,
                      );
                      setRawInputs({});
                      onChange({ ...item, shares: equalShares });
                    }
                  }}
                  title="Split quantity equally among selected friends"
                >
                  Equal
                </button>
                <button
                  type="button"
                  className={`item-mode-btn ${showCustomPortions ? "active" : ""}`}
                  onClick={() => {
                    if (!showCustomPortions) {
                      setShowCustomPortions(true);
                    }
                  }}
                  title="Enter custom portion decimals/points for each friend"
                >
                  Custom
                </button>
              </div>

              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  const allShares = distributeEqualShares(
                    friends.map((f) => ({ friendId: f.id, qty: 1 })),
                    item.totalQty,
                  );
                  setRawInputs({});
                  onChange({ ...item, shares: allShares });
                }}
                title="Assign all friends to this item"
              >
                Select all
              </button>

              {item.shares.length > 0 && (
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => {
                    setRawInputs({});
                    onChange({ ...item, shares: [] });
                  }}
                  title="Clear friend assignments"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Friend Pills Grid (5-col in Equal mode, 4-col in Custom mode on wide screens) */}
          <div className={`friend-pills-grid ${showCustomPortions ? "custom-mode" : "equal-mode"}`}>
            {friends.map((f) => {
              const share = item.shares.find((s) => s.friendId === f.id);
              const checked = Boolean(share);
              const inputValue =
                rawInputs[f.id] !== undefined
                  ? rawInputs[f.id]
                  : share?.qty !== undefined && share?.qty !== null
                    ? String(Number(share.qty.toFixed(2)))
                    : "";

              return (
                <div key={f.id} className="friend-pill-container">
                  <button
                    type="button"
                    className={`friend-pill-btn ${checked ? "checked" : ""}`}
                    onClick={() => toggleFriend(f.id)}
                    title={f.name}
                  >
                    <span className="friend-pill-name">{f.name}</span>
                    <span className={`pill-checkbox ${checked ? "checked" : ""}`} />
                  </button>
                  {checked && showCustomPortions && (
                    <input
                      className="qty-input"
                      type="text"
                      inputMode="decimal"
                      value={inputValue}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (/^[0-9]*\.?[0-9]*$/.test(val)) {
                          handleQtyInputChange(f.id, val);
                        }
                      }}
                      onBlur={() => handleQtyBlur(f.id)}
                      onFocus={(e) => e.target.select()}
                      onClick={(e) => e.stopPropagation()}
                      title={`Portion for ${f.name}`}
                      placeholder="0"
                    />
                  )}
                </div>
              );
            })}
          </div>

          {mismatch && (
            <div className="warning-banner">
              Assigned {assignedTotal.toFixed(2)} but item total is{" "}
              {item.totalQty}. Difference:{" "}
              {assignedTotal - item.totalQty > 0 ? "+" : ""}
              {(assignedTotal - item.totalQty).toFixed(2)}
            </div>
          )}
        </div>
      )}

      {/* Split Item Modal */}
      <SplitItemModal
        isOpen={showSplitModal}
        onClose={() => setShowSplitModal(false)}
        itemName={item.name}
        totalQty={item.totalQty}
        price={item.price}
        onConfirmSplit={handleSplitConfirm}
      />

      {friends.length === 0 && (
        <div style={{ marginTop: 8, fontSize: 12, color: "var(--text-muted)" }}>
          Add friends on the left to assign this item
        </div>
      )}
    </div>
  );
}
