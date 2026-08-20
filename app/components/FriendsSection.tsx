import React, { useState, useRef } from "react";
import { BillItem, Friend } from "../types";
import { formatCurrency, formatShareText, personItemCost } from "../lib/utils";

interface FriendsSectionProps {
  friends: Friend[];
  items: BillItem[];
  personTotals: Record<string, number>;
  personSubtotals?: Record<string, number>;
  feeAmount?: number;
  taxAmount?: number;
  discountAmount?: number;
  tipAmount?: number;
  newFriendName: string;
  setNewFriendName: (name: string) => void;
  onAddFriend: () => void;
  onRemoveFriend: (id: string) => void;
}

export function FriendsSection({
  friends,
  items,
  personTotals,
  personSubtotals = {},
  feeAmount = 0,
  taxAmount = 0,
  discountAmount = 0,
  tipAmount = 0,
  newFriendName,
  setNewFriendName,
  onAddFriend,
  onRemoveFriend,
}: FriendsSectionProps) {
  const [hasError, setHasError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const totalSubtotal = Object.values(personSubtotals).reduce(
    (s, v) => s + v,
    0,
  );

  function handleAdd() {
    if (!newFriendName.trim()) {
      setHasError(true);
      inputRef.current?.focus();
      return;
    }
    setHasError(false);
    onAddFriend();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      handleAdd();
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (hasError) setHasError(false);
    setNewFriendName(e.target.value);
  }

  return (
    <aside className="friends-sidebar" style={{ width: "100%" }}>
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
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          <span>Friends</span>
          <span className="badge-count">
            {friends.length}
          </span>
        </h2>
      </div>

      {/* Add Friend Form */}
      <div className="add-friend-form" style={{ width: "100%" }}>
        <input
          ref={inputRef}
          id="add-friend-input"
          className={`input ${hasError ? "input-error" : ""}`}
          placeholder={hasError ? "Please enter a name first!" : "Friend's name..."}
          value={newFriendName}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          style={{ flex: 1 }}
        />
        <button
          type="button"
          className="btn btn-primary add-friend-btn"
          onClick={handleAdd}
          id="add-friend-btn"
          title="Add Friend"
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
          <span>Add</span>
        </button>
      </div>

      {friends.length === 0 && (
        <div className="empty-friends-card" style={{ padding: "28px 16px", textAlign: "center" }}>
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
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="8.5" cy="7" r="4" />
              <line x1="20" y1="8" x2="20" y2="14" />
              <line x1="23" y1="11" x2="17" y2="11" />
            </svg>
          </div>
          <div style={{ fontSize: 14.5, fontWeight: 600, color: "var(--text-primary)" }}>
            Add friends to start splitting
          </div>
        </div>
      )}

      {/* Friends Cards List */}
      <div className="friends-list" style={{ width: "100%" }}>
        {friends.map((f) => {
          const total = personTotals[f.id] || 0;
          const mySubtotal = personSubtotals[f.id] || 0;
          const ratio =
            totalSubtotal > 0
              ? mySubtotal / totalSubtotal
              : 1 / Math.max(friends.length, 1);

          const myFee = feeAmount * ratio;
          const myTax = taxAmount * ratio;
          const myDiscount = discountAmount * ratio;
          const myTip = tipAmount * ratio;
          const hasExtras =
            myFee > 0 || myTax > 0 || myDiscount > 0 || myTip > 0;

          const myItems = items.filter((item) =>
            item.shares.some((s) => s.friendId === f.id),
          );

          return (
            <div key={f.id} className="friend-card" style={{ width: "100%" }}>
              {/* Header: Underlined Name + Close button */}
              <div className="friend-card-header">
                <h3 className="friend-card-name">
                  {f.name}
                </h3>
                <button
                  type="button"
                  onClick={() => onRemoveFriend(f.id)}
                  title={`Remove ${f.name}`}
                  className="friend-remove-btn"
                  aria-label={`Remove ${f.name}`}
                >
                  ✕
                </button>
              </div>

              {/* Subtitle: had X items: */}
              <div className="friend-card-subtitle">
                {myItems.length === 0
                  ? "had 0 items"
                  : `had ${myItems.length} ${myItems.length === 1 ? "item" : "items"}:`}
              </div>

              {/* Items breakdown with individual prices */}
              {myItems.length > 0 && (
                <div className="friend-items-breakdown">
                  {myItems.map((item) => {
                    const cost = personItemCost(item, f.id);
                    if (cost <= 0) return null;
                    const shareText = formatShareText(item, f.id);
                    return (
                      <div key={item.id} className="friend-item-line">
                        <span className="friend-item-name">
                          <span style={{ fontStyle: "italic" }}>
                            {item.name || "Unnamed"}
                          </span>
                          {shareText && (
                            <span style={{ fontSize: 11, color: "var(--text-muted)", marginLeft: 4 }}>
                              ({shareText})
                            </span>
                          )}
                        </span>
                        <span className="friend-item-cost">
                          {formatCurrency(cost)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Fees & Taxes Breakdown if applied */}
              {hasExtras && (
                <div
                  className="friend-extras-breakdown"
                  style={{
                    borderTop: "1px dashed var(--border)",
                    paddingTop: 5,
                    marginTop: 4,
                    display: "flex",
                    flexDirection: "column",
                    gap: 2.5,
                  }}
                >
                  {myItems.length > 1 && (
                    <div
                      className="friend-item-line"
                      style={{ color: "var(--text-muted)", fontSize: 11 }}
                    >
                      <span>Subtotal</span>
                      <span>{formatCurrency(mySubtotal)}</span>
                    </div>
                  )}
                  {myFee > 0 && (
                    <div
                      className="friend-item-line"
                      style={{ color: "var(--text-secondary)", fontSize: 11 }}
                    >
                      <span>+ Fees</span>
                      <span>+{formatCurrency(myFee)}</span>
                    </div>
                  )}
                  {myTax > 0 && (
                    <div
                      className="friend-item-line"
                      style={{ color: "var(--text-secondary)", fontSize: 11 }}
                    >
                      <span>+ Tax</span>
                      <span>+{formatCurrency(myTax)}</span>
                    </div>
                  )}
                  {myDiscount > 0 && (
                    <div
                      className="friend-item-line"
                      style={{ color: "var(--accent-emerald)", fontSize: 11 }}
                    >
                      <span>- Discount</span>
                      <span>-{formatCurrency(myDiscount)}</span>
                    </div>
                  )}
                  {myTip > 0 && (
                    <div
                      className="friend-item-line"
                      style={{ color: "var(--text-secondary)", fontSize: 11 }}
                    >
                      <span>+ Tip</span>
                      <span>+{formatCurrency(myTip)}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Total row at the bottom */}
              <div className="friend-card-total-row">
                <span className="friend-card-total-label">
                  Total
                </span>
                <span className="friend-card-total-amount">
                  {formatCurrency(total)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
