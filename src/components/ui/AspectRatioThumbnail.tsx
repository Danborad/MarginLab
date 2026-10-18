import React from "react";
import { ImageAspectRatio } from "../../types/ai";

interface AspectRatioThumbnailProps {
  ratioId: ImageAspectRatio;
  isSelected?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const AspectRatioThumbnail: React.FC<AspectRatioThumbnailProps> = ({
  ratioId,
  isSelected = false,
  size = "md",
  className = "",
}) => {
  const isAuto = ratioId === "auto";

  // Coordinates centered at (14, 14) within a 28x28 viewport
  const rects: Record<string, { x: number; y: number; w: number; h: number; rx: number }> = {
    auto: { x: 4, y: 4, w: 20, h: 20, rx: 3 },
    "1:1": { x: 5, y: 5, w: 18, h: 18, rx: 2.5 },
    "3:2": { x: 2, y: 6, w: 24, h: 16, rx: 2.5 },
    "2:3": { x: 6, y: 2, w: 16, h: 24, rx: 2.5 },
    "4:3": { x: 3, y: 5.75, w: 22, h: 16.5, rx: 2.5 },
    "3:4": { x: 5.75, y: 3, w: 16.5, h: 22, rx: 2.5 },
    "16:9": { x: 1.5, y: 7, w: 25, h: 14, rx: 2 },
    "21:9": { x: 0.5, y: 8.25, w: 27, h: 11.5, rx: 2 },
    "9:16": { x: 7, y: 1.5, w: 14, h: 25, rx: 2 },
  };

  const dim = size === "sm" ? 22 : size === "lg" ? 32 : 28;
  const config = rects[ratioId] || rects["1:1"];

  if (isAuto) {
    return (
      <svg
        viewBox="0 0 28 28"
        width={dim}
        height={dim}
        className={`shrink-0 ${className}`}
        aria-hidden="true"
      >
        <rect
          x={config.x}
          y={config.y}
          width={config.w}
          height={config.h}
          rx={config.rx}
          fill="currentColor"
          fillOpacity={isSelected ? 0.28 : 0.08}
          stroke="currentColor"
          strokeWidth="1.6"
          strokeDasharray="2.5,2"
        />
        <text
          x="14"
          y="17"
          textAnchor="middle"
          fontSize="7.5"
          fontWeight="900"
          fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
          fill="currentColor"
          letterSpacing="0.5"
        >
          AUTO
        </text>
      </svg>
    );
  }

  const isWide = config.w > config.h;
  const isTall = config.h > config.w;

  return (
    <svg
      viewBox="0 0 28 28"
      width={dim}
      height={dim}
      className={`shrink-0 ${className}`}
      aria-hidden="true"
    >
      {/* Outer Proportion Rectangle */}
      <rect
        x={config.x}
        y={config.y}
        width={config.w}
        height={config.h}
        rx={config.rx}
        fill="currentColor"
        fillOpacity={isSelected ? 0.28 : 0.08}
        stroke="currentColor"
        strokeWidth={isSelected ? 1.8 : 1.5}
      />

      {/* Internal orientation cue (dashed dividing guide to immediately signal landscape vs portrait) */}
      {isWide ? (
        <line
          x1={config.x + 3}
          y1={config.y + config.h / 2}
          x2={config.x + config.w - 3}
          y2={config.y + config.h / 2}
          stroke="currentColor"
          strokeWidth="1"
          strokeDasharray="2,2"
          opacity={isSelected ? 0.5 : 0.25}
        />
      ) : isTall ? (
        <line
          x1={config.x + config.w / 2}
          y1={config.y + 3}
          x2={config.x + config.w / 2}
          y2={config.y + config.h - 3}
          stroke="currentColor"
          strokeWidth="1"
          strokeDasharray="2,2"
          opacity={isSelected ? 0.5 : 0.25}
        />
      ) : null}
    </svg>
  );
};
