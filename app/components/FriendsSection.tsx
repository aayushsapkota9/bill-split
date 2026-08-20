import React from "react";
import { BillItem, Friend } from "../types";
import { formatCurrency, formatShareText, personItemCost } from "../lib/utils";

interface FriendsSectionProps {
  friends: Friend[];
  items: BillItem[];
  personTotals: Record<string, number>;
  newFriendName: string;
  setNewFriendName: (name: string) => void;
  onAddFriend: () => void;
  onRemoveFriend: (id: string) => void;
}

export function FriendsSection({
  friends,
  items,
  personTotals,
  newFriendName,
  setNewFriendName,
  onAddFriend,
  onRemoveFriend,
}: FriendsSectionProps) {
  return (
    <aside className="friends-sidebar">
      <div className="section-header">
        <h2 className="section-title">
          <span style={{ fontSize: 18 }}>👥</span> Friends
          <span className="badge-count">
            {friends.length}
          </span>
        </h2>
      </div>

      <div className="add-friend-form">
        <input
          id="add-friend-input"
          className="input"
          placeholder="Friend's name..."
          value={newFriendName}
          onChange={(e) => setNewFriendName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onAddFriend()}
        />
        <button
          type="button"
          className="btn btn-primary add-friend-btn"
          onClick={onAddFriend}
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

      <div className="friends-list">
        {friends.map((f) => {
          const total = personTotals[f.id] || 0;
          const myItems = items.filter((item) =>
            item.shares.some((s) => s.friendId === f.id),
          );
          return (
            <div key={f.id} className="friend-card">
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
                            <span className="friend-item-share">
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
