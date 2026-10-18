import React from "react";

interface WebsiteLogoProps {
  className?: string;
  strokeWidth?: number;
}

/**
 * MarginLab 留白集 Brand Logo
 * Matches the exact SVG favicon definition in index.html:
 * A refined layout grid framing the golden ratio collage spaces.
 */
export const WebsiteLogo: React.FC<WebsiteLogoProps> = ({
  className = "w-4 h-4",
  strokeWidth = 1.6,
}) => {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect width="18" height="18" x="3" y="3" rx="2" />
      <path d="M3 9h18" />
      <path d="M9 21V9" />
    </svg>
  );
};

export default WebsiteLogo;
