import React, { useState, useEffect } from "react";

interface AvatarViewProps {
  avatar?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
}

export const AvatarView: React.FC<AvatarViewProps> = ({
  avatar = "🎨",
  size = "md",
  className = "",
}) => {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [avatar]);

  const isImage =
    avatar &&
    !imgError &&
    (avatar.startsWith("http://") ||
      avatar.startsWith("https://") ||
      avatar.startsWith("data:image"));

  const sizeClasses = {
    xs: "w-5 h-5 text-xs",
    sm: "w-7 h-7 text-sm",
    md: "w-8 h-8 text-base",
    lg: "w-11 h-11 text-xl",
    xl: "w-14 h-14 text-2xl",
  };

  if (isImage) {
    return (
      <div
        className={`overflow-hidden rounded-xl shrink-0 flex items-center justify-center bg-gray-100 border border-gray-200 ${sizeClasses[size]} ${className}`}
      >
        <img
          src={avatar}
          alt="Avatar"
          referrerPolicy="no-referrer"
          loading="lazy"
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
      </div>
    );
  }

  return (
    <span
      className={`inline-flex items-center justify-center shrink-0 leading-none ${sizeClasses[size]} ${className}`}
    >
      {imgError ? "👤" : avatar || "🎨"}
    </span>
  );
};
