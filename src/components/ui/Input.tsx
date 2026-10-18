import React from 'react';
import { cn } from '../../lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Input: React.FC<InputProps> = ({ label, className, ...props }) => {
  return (
    <div className="space-y-1">
      {label && <label className="text-[11px] font-mono text-studio-muted uppercase">{label}</label>}
      <input
        className={cn(
          'w-full px-2.5 py-1.5 bg-studio-card border border-studio-border rounded-md text-xs text-studio-text placeholder-zinc-500 focus:outline-none focus:border-studio-accent transition-colors',
          className
        )}
        {...props}
      />
    </div>
  );
};
