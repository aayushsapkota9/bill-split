import React from "react";
import { PERSON_COLORS, initials } from "../lib/utils";

interface AvatarProps {
  name: string;
  colorIdx: number;
  size?: number;
}

export function AvatarCircle({ name, colorIdx, size = 34 }: AvatarProps) {
  const color = PERSON_COLORS[colorIdx % PERSON_COLORS.length];
  return (
    <div
      className="avatar"
      style={{
        width: size,
        height: size,
        background: color + "28",
        border: `2px solid ${color}55`,
        color,
        fontSize: size < 30 ? 11 : 14,
      }}
    >
      {initials(name)}
    </div>
  );
}
