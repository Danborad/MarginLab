import React from 'react';
import { cn } from '../../lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'accent' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'icon';
}

export const Button: React.FC<ButtonProps> = ({
  className,
  variant = 'secondary',
  size = 'md',
  children,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-medium transition-all duration-150 select-none disabled:opacity-40 disabled:pointer-events-none rounded-lg active:scale-[0.98]';

  const variants = {
    primary: 'bg-white text-zinc-950 hover:bg-zinc-100 shadow-sm',
    accent:
      'bg-studio-accent text-white hover:bg-studio-accentHover shadow-sm font-semibold tracking-wide',
    secondary:
      'bg-studio-panel border border-studio-border text-studio-text hover:bg-studio-hover hover:border-gray-200',
    ghost: 'text-studio-muted hover:text-studio-text hover:bg-black/[0.03]',
    danger: 'bg-red-500/10 border border-red-500/20 text-red-600 hover:bg-red-500/20',
  };

  const sizes = {
    sm: 'text-xs px-2.5 py-1.5 gap-1.5 h-7',
    md: 'text-xs px-3.5 py-2 gap-2 h-8',
    lg: 'text-sm px-4 py-2.5 gap-2.5 h-10',
    icon: 'p-1.5 w-8 h-8',
  };

  return (
    <button
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      {...props}
    >
      {children}
    </button>
  );
};
