export interface FontOption {
  name: string;
  family: string;
  category: 'Serif' | 'Sans' | 'Display' | 'Chinese' | 'Mono';
  sampleText: string;
}

export const FONTS: FontOption[] = [
  {
    name: 'Alex Brush (文艺手写体)',
    family: '"Alex Brush", cursive, serif',
    category: 'Display',
    sampleText: 'Quiet Journeys • Summer Recap',
  },
  {
    name: 'Cormorant Garamond',
    family: '"Cormorant Garamond", serif',
    category: 'Serif',
    sampleText: 'Elegance & Stillness',
  },
  {
    name: 'Instrument Serif',
    family: '"Instrument Serif", serif',
    category: 'Serif',
    sampleText: 'Editorial Lookbook',
  },
  {
    name: 'Playfair Display',
    family: '"Playfair Display", serif',
    category: 'Serif',
    sampleText: 'Haute Couture Vogue',
  },
  {
    name: 'Cinzel',
    family: '"Cinzel", serif',
    category: 'Display',
    sampleText: 'ARCHITECTURAL ESSENCE',
  },
  {
    name: 'Syne',
    family: '"Syne", sans-serif',
    category: 'Display',
    sampleText: 'AVANT-GARDE STUDIO',
  },
  {
    name: 'Plus Jakarta Sans',
    family: '"Plus Jakarta Sans", sans-serif',
    category: 'Sans',
    sampleText: 'Minimal Clean Design',
  },
  {
    name: 'Space Grotesk',
    family: '"Space Grotesk", sans-serif',
    category: 'Sans',
    sampleText: 'SWISS MODERNISM 1968',
  },
  {
    name: '思源宋体 (Noto Serif)',
    family: '"Noto Serif SC", serif',
    category: 'Chinese',
    sampleText: '东方美学 • 留白意境',
  },
  {
    name: 'JetBrains Mono',
    family: '"JetBrains Mono", monospace',
    category: 'Mono',
    sampleText: 'NO. 0824 / ARCHIVE',
  },
];
