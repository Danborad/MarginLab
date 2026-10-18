import React from 'react';
import { COLOR_PALETTES } from '../../lib/presets';

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  label?: string;
}

const COMMON_COLORS = [
  '#FAF8F5',
  '#F7F5F0',
  '#ECE7DE',
  '#E0D9CE',
  '#8E8B82',
  '#52504B',
  '#1E1D1B',
  '#0E0E10',
  '#FFFFFF',
  '#E5C49F',
  '#B85444',
  '#5B7065',
  '#2C4673',
];

export const ColorPicker: React.FC<ColorPickerProps> = ({ color, onChange, label }) => {
  return (
    <div className="space-y-2">
      {label && <label className="text-[11px] font-mono text-studio-muted uppercase">{label}</label>}
      <div className="flex flex-wrap gap-1.5 items-center">
        {COMMON_COLORS.map((c) => (
          <button
            key={c}
            onClick={() => onChange(c)}
            className={`w-6 h-6 rounded-md border transition-all ${
              color.toLowerCase() === c.toLowerCase()
                ? 'border-studio-accent ring-2 ring-studio-accent/30 scale-110'
                : 'border-studio-border hover:scale-105'
            }`}
            style={{ backgroundColor: c }}
            title={c}
          />
        ))}

        {/* Custom Color Input */}
        <div className="relative flex items-center">
          <input
            type="color"
            value={color}
            onChange={(e) => onChange(e.target.value)}
            className="w-6 h-6 rounded-md border border-studio-border cursor-pointer bg-transparent opacity-0 absolute inset-0 z-10"
          />
          <div
            className="w-6 h-6 rounded-md border border-studio-border flex items-center justify-center text-[10px] text-studio-muted bg-studio-card hover:bg-studio-hover"
            title="自定义颜色"
          >
            +
          </div>
        </div>

        <input
          type="text"
          value={color}
          onChange={(e) => onChange(e.target.value)}
          className="w-20 px-2 py-1 bg-studio-card border border-studio-border rounded text-[11px] font-mono text-studio-text focus:outline-none focus:border-studio-accent"
        />
      </div>
    </div>
  );
};
