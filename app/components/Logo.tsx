import React from "react";

interface LogoProps {
  size?: number;
  showText?: boolean;
  className?: string;
}

export function KaskoKatiLogo({ size = 28, showText = true, className = "" }: LogoProps) {
  return (
    <div
      className={`logo-container ${className}`}
      style={{ display: "inline-flex", alignItems: "center", gap: 9, userSelect: "none" }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ flexShrink: 0 }}
      >
        <defs>
          <linearGradient id="kkBrandGrad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#14b8a6" />
            <stop offset="100%" stopColor="#0d9488" />
          </linearGradient>
        </defs>

        {/* Minimal rounded squircle icon container */}
        <rect width="32" height="32" rx="8.5" fill="url(#kkBrandGrad)" />

        {/* Minimalist Split / 'K' Geometry */}
        {/* Left vertical spine */}
        <rect x="7.5" y="7" width="3" height="18" rx="1.5" fill="#ffffff" />

        {/* Top-right branch */}
        <path
          d="M11.5 16.5L20.5 8C21.2 7.3 22.3 7.8 22.3 8.8V10C22.3 10.5 22 11 21.6 11.3L15.5 16.5L11.5 16.5Z"
          fill="#ffffff"
        />

        {/* Bottom-right branch (accented) */}
        <path
          d="M13.5 15.5L21.8 23.2C22.2 23.6 22.5 24.1 22.5 24.6V24.8C22.5 25.6 21.6 26.1 20.9 25.5L11.5 16.5L13.5 15.5Z"
          fill="#fef08a"
        />

        {/* Subtle division node */}
        <circle cx="21" cy="16" r="1.75" fill="#ffffff" opacity="0.9" />
      </svg>

      {showText && (
        <span
          className="brand-wordmark"
          style={{
            fontWeight: 800,
            fontSize: 16,
            letterSpacing: "-0.025em",
            color: "var(--text-primary)",
            lineHeight: 1,
            whiteSpace: "nowrap",
          }}
        >
          Kasko Kati
        </span>
      )}
    </div>
  );
}
