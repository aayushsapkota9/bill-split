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
        <h2 className="section-title">
          <span style={{ fontSize: 18 }}>👥</span> Friends
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
        <div className="empty-friends-card">
          <div style={{ fontSize: 28, marginBottom: 8 }}>🤝</div>
          Add friends to
          <br />
          start splitting
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
