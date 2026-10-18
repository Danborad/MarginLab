export interface StockPhoto {
  id: string;
  title: string;
  category: 'architecture' | 'fashion' | 'still-life' | 'botanical' | 'monochrome' | 'abstract';
  thumb: string;
  full: string;
  aspectRatio: number; // width / height
  credit: string;
}

export const STOCK_PHOTOS: StockPhoto[] = [
  // 建筑与几何光影
  {
    id: 'arch-1',
    title: 'Minimal Concrete Arch',
    category: 'architecture',
    thumb: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&auto=format&fit=crop&q=80',
    full: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1800&auto=format&fit=crop&q=90',
    aspectRatio: 0.67,
    credit: 'Unsplash Minimal',
  },
  {
    id: 'arch-2',
    title: 'Warm Light Staircase',
    category: 'architecture',
    thumb: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&auto=format&fit=crop&q=80',
    full: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1800&auto=format&fit=crop&q=90',
    aspectRatio: 1.5,
    credit: 'Unsplash Architecture',
  },
  {
    id: 'arch-3',
    title: 'Brutalist Monolith & Shadow',
    category: 'architecture',
    thumb: 'https://images.unsplash.com/photo-1494526585095-c41746248156?w=600&auto=format&fit=crop&q=80',
    full: 'https://images.unsplash.com/photo-1494526585095-c41746248156?w=1800&auto=format&fit=crop&q=90',
    aspectRatio: 0.8,
    credit: 'Unsplash Geometry',
  },
  {
    id: 'arch-4',
    title: 'Minimalist Terrace Sunbeam',
    category: 'architecture',
    thumb: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=600&auto=format&fit=crop&q=80',
    full: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=1800&auto=format&fit=crop&q=90',
    aspectRatio: 1.25,
    credit: 'Unsplash Space',
  },

  // 时尚与人像艺术
  {
    id: 'fash-1',
    title: 'Editorial Silhouette & Drapes',
    category: 'fashion',
    thumb: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&auto=format&fit=crop&q=80',
    full: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1800&auto=format&fit=crop&q=90',
    aspectRatio: 0.67,
    credit: 'Unsplash Fashion',
  },
  {
    id: 'fash-2',
    title: 'Linen Texture & Natural Pose',
    category: 'fashion',
    thumb: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600&auto=format&fit=crop&q=80',
    full: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1800&auto=format&fit=crop&q=90',
    aspectRatio: 0.67,
    credit: 'Unsplash Portrait',
  },
  {
    id: 'fash-3',
    title: 'Monochrome Coat & Shadows',
    category: 'fashion',
    thumb: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=600&auto=format&fit=crop&q=80',
    full: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=1800&auto=format&fit=crop&q=90',
    aspectRatio: 0.75,
    credit: 'Unsplash Editorial',
  },

  // 极简静物与器物
  {
    id: 'still-1',
    title: 'Ceramic Vase & Soft Clay',
    category: 'still-life',
    thumb: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=600&auto=format&fit=crop&q=80',
    full: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=1800&auto=format&fit=crop&q=90',
    aspectRatio: 0.8,
    credit: 'Unsplash Ceramic',
  },
  {
    id: 'still-2',
    title: 'Minimalist Coffee & Book',
    category: 'still-life',
    thumb: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80',
    full: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=1800&auto=format&fit=crop&q=90',
    aspectRatio: 1.33,
    credit: 'Unsplash Journal',
  },
  {
    id: 'still-3',
    title: 'Sculptural Glass & Light Refraction',
    category: 'still-life',
    thumb: 'https://images.unsplash.com/photo-1516962215378-7fa2e137ae93?w=600&auto=format&fit=crop&q=80',
    full: 'https://images.unsplash.com/photo-1516962215378-7fa2e137ae93?w=1800&auto=format&fit=crop&q=90',
    aspectRatio: 0.67,
    credit: 'Unsplash Glass',
  },

  // 自然与植物纹理
  {
    id: 'bot-1',
    title: 'Dried Palm & Warm Sunlight',
    category: 'botanical',
    thumb: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80',
    full: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1800&auto=format&fit=crop&q=90',
    aspectRatio: 0.67,
    credit: 'Unsplash Botanical',
  },
  {
    id: 'bot-2',
    title: 'Wild Grasses & Golden Hour',
    category: 'botanical',
    thumb: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600&auto=format&fit=crop&q=80',
    full: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1800&auto=format&fit=crop&q=90',
    aspectRatio: 1.4,
    credit: 'Unsplash Landscape',
  },

  // 极简黑白与光影
  {
    id: 'mono-1',
    title: 'Grain & Shadow Study',
    category: 'monochrome',
    thumb: 'https://images.unsplash.com/photo-1516802273409-68526ee1bdd6?w=600&auto=format&fit=crop&q=80',
    full: 'https://images.unsplash.com/photo-1516802273409-68526ee1bdd6?w=1800&auto=format&fit=crop&q=90',
    aspectRatio: 1.0,
    credit: 'Unsplash Monochrome',
  },
  {
    id: 'mono-2',
    title: 'High Contrast Wave Curves',
    category: 'monochrome',
    thumb: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&auto=format&fit=crop&q=80',
    full: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1800&auto=format&fit=crop&q=90',
    aspectRatio: 1.5,
    credit: 'Unsplash Ocean',
  },
];
