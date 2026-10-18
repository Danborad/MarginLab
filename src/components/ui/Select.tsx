import React from 'react';
import { cn } from '../../lib/utils';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { label: string; value: string | number }[];
}

export const Select: React.FC<SelectProps> = ({ label, options, className, ...props }) => {
  return (
    <div className="space-y-1">
      {label && <label className="text-[11px] font-mono text-studio-muted uppercase">{label}</label>}
      <select
        className={cn(
          'w-full px-2.5 py-1.5 bg-studio-card border border-studio-border rounded-md text-xs text-studio-text focus:outline-none focus:border-studio-accent transition-colors cursor-pointer',
          className
        )}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-studio-panel text-studio-text">
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
};
