import React from "react";
import { ChevronDown } from "lucide-react";

export interface AccordionSectionProps {
  title: string;
  subtitle?: string;
  icon?: React.ComponentType<{ className?: string }>;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

/**
 * 纯白极简折叠面板：同一容器内一次只展开一个。
 */
export const AccordionSection: React.FC<AccordionSectionProps> = ({
  title,
  subtitle,
  icon: Icon,
  isOpen,
  onToggle,
  children,
}) => {
  return (
    <section className="border-b border-gray-200 last:border-b-0">
      <button
        onClick={onToggle}
        className={`w-full px-4 py-3 flex items-center justify-between gap-2 text-left transition-colors cursor-pointer ${
          isOpen ? "bg-gray-50" : "bg-white hover:bg-gray-50"
        }`}
      >
        <span className="flex items-center gap-2 min-w-0">
          {Icon && <Icon className={`w-4 h-4 shrink-0 ${isOpen ? "text-gray-950" : "text-gray-500"}`} />}
          <span className="min-w-0">
            <span className={`block text-[13px] font-extrabold truncate ${isOpen ? "text-gray-950" : "text-gray-700"}`}>
              {title}
            </span>
            {subtitle && (
              <span className="block text-[11px] text-gray-500 font-medium truncate">{subtitle}</span>
            )}
          </span>
        </span>
        <ChevronDown
          className={`w-4 h-4 shrink-0 transition-transform ${isOpen ? "rotate-180 text-gray-950" : "text-gray-400"}`}
        />
      </button>

      {isOpen && <div className="bg-white">{children}</div>}
    </section>
  );
};
