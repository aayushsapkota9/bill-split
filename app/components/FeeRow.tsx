import React from "react";
import { FeeConfig } from "../types";

interface FeeRowProps {
  label: string;
  config: FeeConfig;
  onChange: (c: FeeConfig) => void;
}

export function FeeRow({ label, config, onChange }: FeeRowProps) {
  return (
    <div className="total-row">
      <span style={{ color: "var(--text-secondary)", fontSize: 13 }}>
        {label}
      </span>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <button
          type="button"
          className={`btn ${config.type === "flat" ? "btn-primary" : "btn-ghost"}`}
          style={{ padding: "3px 9px", fontSize: 12, borderRadius: 6 }}
          onClick={() => onChange({ ...config, type: "flat" })}
        >
          Flat
        </button>
        <button
          type="button"
          className={`btn ${config.type === "percent" ? "btn-primary" : "btn-ghost"}`}
          style={{ padding: "3px 9px", fontSize: 12, borderRadius: 6 }}
          onClick={() => onChange({ ...config, type: "percent" })}
        >
          %
        </button>
        <div style={{ position: "relative", width: 90 }}>
          {config.type === "flat" && (
            <span
              style={{
                position: "absolute",
                left: 7,
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--text-muted)",
                fontSize: 11,
                fontWeight: 600,
                pointerEvents: "none",
              }}
            >
              Rs
            </span>
          )}
          <input
            className="qty-input"
            type="text"
            inputMode="decimal"
            value={config.value === 0 ? "" : String(config.value)}
            onChange={(e) => {
              const val = e.target.value;
              if (val === "") {
                onChange({ ...config, value: 0 });
              } else if (/^[0-9]*\.?[0-9]*$/.test(val)) {
                const num = parseFloat(val);
                onChange({ ...config, value: isNaN(num) ? 0 : num });
              }
            }}
            onFocus={(e) => e.target.select()}
            style={{
              width: 90,
              paddingLeft: config.type === "flat" ? 26 : 8,
              paddingRight: config.type === "percent" ? 22 : 8,
              textAlign: config.type === "flat" ? "left" : "center",
            }}
            placeholder="0"
          />
          {config.type === "percent" && (
            <span
              style={{
                position: "absolute",
                right: 8,
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--text-muted)",
                fontSize: 13,
                pointerEvents: "none",
              }}
            >
              %
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
