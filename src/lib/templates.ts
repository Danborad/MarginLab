import { CollageDocument, CollageElement } from '../types/document';
import { generateId } from './utils';

export interface TemplateDefinition {
  id: string;
  name: string;
  category: 'Full Bleed' | 'Editorial' | 'Lookbook' | 'Gallery' | 'Polaroid' | 'Minimalist' | 'Brutalist';
  description: string;
  preview: string;
  photoCount: number;
  badge?: string;
  createDocument: (targetW?: number, targetH?: number, targetBg?: string) => CollageDocument;
}

export const TEMPLATES: TemplateDefinition[] = [
  {
    id: 'quiet-journeys-grid',
    name: 'Quiet Journeys • 旅途留白 (18 Photos)',
    category: 'Gallery',
    description: 'Canva 经典 18 图文艺旅行矩阵，4×5 优雅网格留白与中心诗意随笔卡片',
    preview: 'https://images.unsplash.com/photo-1452421822248-d4c2b47f0c81?w=600&auto=format&fit=crop&q=80',
    photoCount: 18,
    badge: '18图矩阵',
    createDocument: (tw = 1200, th = 1600, tbg = '#FFFFFF'): CollageDocument => {
      const s = Math.min(tw, th) / 1200;
      const bg = tbg === '#FFFFFF' || !tbg ? '#FFFFFF' : tbg;
      const padX = Math.round(44 * s);
      const padY = Math.round(48 * s);
      const gap = Math.round(14 * s);
      const cols = 4;
      const rows = 5;

      const totalGridW = tw - 2 * padX;
      const cellW = Math.round((totalGridW - (cols - 1) * gap) / cols);
      const actualPadX = Math.round((tw - (cols * cellW + (cols - 1) * gap)) / 2);

      const totalGridH = th - 2 * padY;
      const cellH = Math.round((totalGridH - (rows - 1) * gap) / rows);
      const actualPadY = Math.round((th - (rows * cellH + (rows - 1) * gap)) / 2);

      const photoStock = [
        { src: 'https://images.unsplash.com/photo-1452421822248-d4c2b47f0c81?w=800&auto=format&fit=crop&q=80', name: 'Vintage Camera & Map' },
        { src: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&auto=format&fit=crop&q=80', name: 'Mountain Road Journey' },
        { src: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&auto=format&fit=crop&q=80', name: 'Vintage Leather Luggage' },
        { src: 'https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?w=800&auto=format&fit=crop&q=80', name: 'Campervan Interior' },
        { src: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&auto=format&fit=crop&q=80', name: 'Historic Clock Tower' },
        { src: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&auto=format&fit=crop&q=80', name: 'Woven Chair & Mimosa' },
        { src: 'https://images.unsplash.com/photo-1474487548417-781cb71495f3?w=800&auto=format&fit=crop&q=80', name: 'Autumn Train Journey' },
        { src: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80', name: 'Ancient Stone Village' },
        { src: 'https://images.unsplash.com/photo-1497250681960-ef046c08a56e?w=800&auto=format&fit=crop&q=80', name: 'Afternoon Sunlight Table' },
        { src: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&auto=format&fit=crop&q=80', name: 'Villa Columns & Foliage' },
        { src: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&auto=format&fit=crop&q=80', name: 'Sunlit Stone Alley' },
        { src: 'https://images.unsplash.com/photo-1581553680321-4fffae59fccd?w=800&auto=format&fit=crop&q=80', name: 'Suitcase Packing Flatlay' },
        { src: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800&auto=format&fit=crop&q=80', name: 'Airy Balcony Bedroom' },
        { src: 'https://images.unsplash.com/photo-1507371341162-763b5e419408?w=800&auto=format&fit=crop&q=80', name: 'Golden Autumn Foliage' },
        { src: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&auto=format&fit=crop&q=80', name: 'Coffee & Tart Platter' },
        { src: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80', name: 'Rugged Coastal Waves' },
        { src: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&auto=format&fit=crop&q=80', name: 'Bus Interior Sunbeam' },
        { src: 'https://images.unsplash.com/photo-1533158307587-828f0a76ef46?w=800&auto=format&fit=crop&q=80', name: 'Dry Stone Masonry Wall' },
      ];

      const elements: CollageElement[] = [];
      let photoIdx = 0;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = actualPadX + c * (cellW + gap);
          const y = actualPadY + r * (cellH + gap);

          if (r === 2 && (c === 1 || c === 2)) {
            if (c === 1) {
              const cardW = 2 * cellW + gap;
              const cardH = cellH;
              elements.push({
                id: generateId('shp'),
                type: 'shape',
                name: 'Center Card Background',
                x,
                y,
                width: cardW,
                height: cardH,
                rotation: 0,
                opacity: 1,
                zIndex: 2,
                locked: false,
                visible: true,
                shapeType: 'rect',
                fill: '#FFFFFF',
                stroke: 'transparent',
                strokeWidth: 0,
                borderRadius: Math.round(4 * s),
              });

              elements.push({
                id: generateId('txt'),
                type: 'text',
                name: 'Quiet Journeys Title',
                x,
                y: y + Math.round(cardH * 0.12),
                width: cardW,
                height: Math.round(cardH * 0.34),
                rotation: 0,
                opacity: 1,
                zIndex: 3,
                locked: false,
                visible: true,
                text: 'Quiet Journeys',
                fontFamily: '"Alex Brush", "Playfair Display", "Cormorant Garamond", cursive, serif',
                fontSize: Math.max(26, Math.round(46 * s)),
                fontWeight: 600,
                fontStyle: 'italic',
                letterSpacing: 2,
                lineHeight: 1.1,
                textAlign: 'center',
                color: '#7D6448',
              });

              elements.push({
                id: generateId('txt'),
                type: 'text',
                name: 'Quiet Journeys Subtitle',
                x: x + Math.round(cardW * 0.05),
                y: y + Math.round(cardH * 0.44),
                width: Math.round(cardW * 0.9),
                height: Math.round(cardH * 0.52),
                rotation: 0,
                opacity: 1,
                zIndex: 3,
                locked: false,
                visible: true,
                text: 'Moments gathered along\nquiet roads, soft light, and\nplaces that feel like a pause\nworth keeping',
                fontFamily: '"Instrument Serif", "Cormorant Garamond", "Playfair Display", serif',
                fontSize: Math.max(13, Math.round(18 * s)),
                fontWeight: 400,
                fontStyle: 'normal',
                letterSpacing: 0.5,
                lineHeight: 1.55,
                textAlign: 'center',
                color: '#282421',
              });
            }
            continue;
          }

          const photo = photoStock[photoIdx % photoStock.length];
          elements.push({
            id: generateId('img'),
            type: 'image',
            name: 'Grid Photo ' + (photoIdx + 1) + ' - ' + photo.name,
            x,
            y,
            width: cellW,
            height: cellH,
            rotation: 0,
            opacity: 1,
            zIndex: 1,
            locked: false,
            visible: true,
            src: photo.src,
            originalWidth: 800,
            originalHeight: 800,
            fit: 'cover',
            borderRadius: Math.round(3 * s),
          });
          photoIdx++;
        }
      }

      return {
        id: generateId('doc'),
        version: 1,
        name: 'Quiet Journeys • 旅途留白',
        canvas: {
          width: tw,
          height: th,
          unit: 'px',
          backgroundType: 'color',
          backgroundColor: bg,
          presetName: 'Quiet Journeys (Gallery)',
        },
        elements,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    },
  },
  {
    id: 'summer-recap-film',
    name: 'Summer Recap • 夏日胶片手帐 (3 Photos)',
    category: 'Lookbook',
    description: 'Canva 流行款 35mm 胶片底片与拍立得错位拼贴、手写体夏日随笔与和纸胶带',
    preview: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&auto=format&fit=crop&q=80',
    photoCount: 3,
    badge: '胶片手帐',
    createDocument: (tw = 1200, th = 1600, tbg = '#FFFFFF'): CollageDocument => {
      const s = Math.min(tw, th) / 1200;
      const bg = tbg === '#FFFFFF' || !tbg ? '#FFFFFF' : tbg;

      const elements: CollageElement[] = [];

      // 1. Photo 1: Polaroid Frame (Top Left, tilted -4°)
      const f1X = Math.round(tw * 0.07);
      const f1Y = Math.round(th * 0.05);
      const f1W = Math.round(tw * 0.40);
      const f1H = Math.round(th * 0.35);

      elements.push({
        id: generateId('shp'),
        type: 'shape',
        name: 'Polaroid Frame 1',
        x: f1X,
        y: f1Y,
        width: f1W,
        height: f1H,
        rotation: -4,
        opacity: 1,
        zIndex: 2,
        locked: false,
        visible: true,
        shapeType: 'rect',
        fill: '#FFFFFF',
        stroke: 'rgba(0,0,0,0.06)',
        strokeWidth: 1,
        borderRadius: Math.round(4 * s),
        shadowBlur: Math.round(20 * s),
        shadowColor: 'rgba(0,0,0,0.1)',
        shadowOffsetY: Math.round(6 * s),
      });

      elements.push({
        id: generateId('img'),
        type: 'image',
        name: 'Photo 1 - Sunshine Portrait',
        x: Math.round(tw * 0.095),
        y: Math.round(th * 0.07),
        width: Math.round(tw * 0.35),
        height: Math.round(th * 0.27),
        rotation: -4,
        opacity: 1,
        zIndex: 3,
        locked: false,
        visible: true,
        src: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1200&auto=format&fit=crop&q=85',
        originalWidth: 1200,
        originalHeight: 1600,
        fit: 'cover',
        borderRadius: 0,
      });

      elements.push({
        id: generateId('txt'),
        type: 'text',
        name: 'Film Code 13',
        x: Math.round(tw * 0.095),
        y: Math.round(th * 0.355),
        width: Math.round(tw * 0.35),
        height: Math.round(th * 0.03),
        rotation: -4,
        opacity: 0.9,
        zIndex: 4,
        locked: false,
        visible: true,
        text: '▶ 13        13 A',
        fontFamily: '"Space Grotesk", "JetBrains Mono", monospace',
        fontSize: Math.max(9, Math.round(11 * s)),
        fontWeight: 700,
        fontStyle: 'normal',
        letterSpacing: 2,
        lineHeight: 1.2,
        textAlign: 'left',
        color: '#333333',
      });

      elements.push({
        id: generateId('stk'),
        type: 'sticker',
        name: 'Washi Tape 1',
        x: Math.round(tw * 0.20),
        y: Math.round(th * 0.035),
        width: Math.round(115 * s),
        height: Math.round(28 * s),
        rotation: 2,
        opacity: 0.92,
        zIndex: 5,
        locked: false,
        visible: true,
        stickerType: 'washi-tape',
        label: 'SUMMER',
        color: '#E6D9C5',
      });

      // 2. Photo 2: Polaroid Frame (Top Right, tilted +3°)
      const f2X = Math.round(tw * 0.53);
      const f2Y = Math.round(th * 0.07);
      const f2W = Math.round(tw * 0.41);
      const f2H = Math.round(th * 0.30);

      elements.push({
        id: generateId('shp'),
        type: 'shape',
        name: 'Polaroid Frame 2',
        x: f2X,
        y: f2Y,
        width: f2W,
        height: f2H,
        rotation: 3,
        opacity: 1,
        zIndex: 2,
        locked: false,
        visible: true,
        shapeType: 'rect',
        fill: '#FFFFFF',
        stroke: 'rgba(0,0,0,0.06)',
        strokeWidth: 1,
        borderRadius: Math.round(4 * s),
        shadowBlur: Math.round(20 * s),
        shadowColor: 'rgba(0,0,0,0.1)',
        shadowOffsetY: Math.round(6 * s),
      });

      elements.push({
        id: generateId('img'),
        type: 'image',
        name: 'Photo 2 - Beach Coast',
        x: Math.round(tw * 0.555),
        y: Math.round(th * 0.09),
        width: Math.round(tw * 0.36),
        height: Math.round(th * 0.22),
        rotation: 3,
        opacity: 1,
        zIndex: 3,
        locked: false,
        visible: true,
        src: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&auto=format&fit=crop&q=85',
        originalWidth: 1600,
        originalHeight: 1200,
        fit: 'cover',
        borderRadius: 0,
      });

      elements.push({
        id: generateId('txt'),
        type: 'text',
        name: 'Film Code 24',
        x: Math.round(tw * 0.555),
        y: Math.round(th * 0.325),
        width: Math.round(tw * 0.36),
        height: Math.round(th * 0.025),
        rotation: 3,
        opacity: 0.85,
        zIndex: 4,
        locked: false,
        visible: true,
        text: 'KODAK PORTRA 400 • EXP 24',
        fontFamily: '"Space Grotesk", "JetBrains Mono", monospace',
        fontSize: Math.max(8, Math.round(10 * s)),
        fontWeight: 600,
        fontStyle: 'normal',
        letterSpacing: 2,
        lineHeight: 1.2,
        textAlign: 'right',
        color: '#444444',
      });

      elements.push({
        id: generateId('stk'),
        type: 'sticker',
        name: 'Washi Tape 2',
        x: Math.round(tw * 0.67),
        y: Math.round(th * 0.055),
        width: Math.round(125 * s),
        height: Math.round(28 * s),
        rotation: -2,
        opacity: 0.92,
        zIndex: 5,
        locked: false,
        visible: true,
        stickerType: 'washi-tape',
        label: 'COAST',
        color: '#D8C6B0',
      });

      // 3. Photo 3: Large Hero Polaroid Frame (Bottom Right, tilted -2°)
      const f3X = Math.round(tw * 0.45);
      const f3Y = Math.round(th * 0.44);
      const f3W = Math.round(tw * 0.49);
      const f3H = Math.round(th * 0.50);

      elements.push({
        id: generateId('shp'),
        type: 'shape',
        name: 'Polaroid Frame 3',
        x: f3X,
        y: f3Y,
        width: f3W,
        height: f3H,
        rotation: -2,
        opacity: 1,
        zIndex: 2,
        locked: false,
        visible: true,
        shapeType: 'rect',
        fill: '#FFFFFF',
        stroke: 'rgba(0,0,0,0.06)',
        strokeWidth: 1,
        borderRadius: Math.round(4 * s),
        shadowBlur: Math.round(26 * s),
        shadowColor: 'rgba(0,0,0,0.12)',
        shadowOffsetY: Math.round(8 * s),
      });

      elements.push({
        id: generateId('img'),
        type: 'image',
        name: 'Photo 3 - Cliff Horizon',
        x: Math.round(tw * 0.48),
        y: Math.round(th * 0.465),
        width: Math.round(tw * 0.43),
        height: Math.round(th * 0.39),
        rotation: -2,
        opacity: 1,
        zIndex: 3,
        locked: false,
        visible: true,
        src: 'https://images.unsplash.com/photo-1500534623283-312aade485b7?w=1200&auto=format&fit=crop&q=85',
        originalWidth: 1600,
        originalHeight: 1200,
        fit: 'cover',
        borderRadius: 0,
      });

      elements.push({
        id: generateId('txt'),
        type: 'text',
        name: 'Film Negative Markings 14',
        x: Math.round(tw * 0.48),
        y: Math.round(th * 0.88),
        width: Math.round(tw * 0.43),
        height: Math.round(th * 0.03),
        rotation: -2,
        opacity: 0.9,
        zIndex: 4,
        locked: false,
        visible: true,
        text: '▶ 14        14 A      FILM NEGATIVE',
        fontFamily: '"Space Grotesk", "JetBrains Mono", monospace',
        fontSize: Math.max(9, Math.round(11 * s)),
        fontWeight: 700,
        fontStyle: 'normal',
        letterSpacing: 2,
        lineHeight: 1.2,
        textAlign: 'left',
        color: '#333333',
      });

      // 4. Center-Left Typography
      elements.push({
        id: generateId('txt'),
        type: 'text',
        name: 'Summer Recap Title',
        x: Math.round(tw * 0.08),
        y: Math.round(th * 0.45),
        width: Math.round(tw * 0.38),
        height: Math.round(th * 0.12),
        rotation: 0,
        opacity: 1,
        zIndex: 6,
        locked: false,
        visible: true,
        text: 'Summer Recap',
        fontFamily: '"Alex Brush", "Playfair Display", "Cormorant Garamond", cursive, serif',
        fontSize: Math.max(28, Math.round(56 * s)),
        fontWeight: 600,
        fontStyle: 'italic',
        letterSpacing: 1.5,
        lineHeight: 1.1,
        textAlign: 'left',
        color: '#1C1B1A',
      });

      elements.push({
        id: generateId('txt'),
        type: 'text',
        name: 'Summer Recap Paragraph',
        x: Math.round(tw * 0.08),
        y: Math.round(th * 0.58),
        width: Math.round(tw * 0.35),
        height: Math.round(th * 0.16),
        rotation: 0,
        opacity: 1,
        zIndex: 6,
        locked: false,
        visible: true,
        text: 'Summer is when the world loosens its grip — rules bend, days stretch, and we remember what it’s like to feel alive without trying too hard.',
        fontFamily: '"Instrument Serif", "Cormorant Garamond", "Space Grotesk", serif',
        fontSize: Math.max(12, Math.round(16 * s)),
        fontWeight: 400,
        fontStyle: 'normal',
        letterSpacing: 0.5,
        lineHeight: 1.6,
        textAlign: 'left',
        color: '#2B2927',
      });

      elements.push({
        id: generateId('txt'),
        type: 'text',
        name: 'August Date Tag',
        x: Math.round(tw * 0.08),
        y: Math.round(th * 0.76),
        width: Math.round(tw * 0.35),
        height: Math.round(th * 0.035),
        rotation: 0,
        opacity: 0.85,
        zIndex: 6,
        locked: false,
        visible: true,
        text: 'AUGUST 2029 • SUMMER ARCHIVE',
        fontFamily: '"Space Grotesk", monospace',
        fontSize: Math.max(10, Math.round(11 * s)),
        fontWeight: 600,
        fontStyle: 'normal',
        letterSpacing: 3,
        lineHeight: 1.2,
        textAlign: 'left',
        color: '#666666',
      });

      // 5. Decorative Tag & Pin Tape (Bottom Left)
      elements.push({
        id: generateId('stk'),
        type: 'sticker',
        name: 'Archival Tag',
        x: Math.round(tw * 0.08),
        y: Math.round(th * 0.83),
        width: Math.round(tw * 0.25),
        height: Math.round(36 * s),
        rotation: 0,
        opacity: 0.95,
        zIndex: 6,
        locked: false,
        visible: true,
        stickerType: 'archival-tag',
        label: 'PLATE № 08 • 35MM',
        color: '#2C2B29',
        accentColor: '#E6D9C5',
      });

      elements.push({
        id: generateId('stk'),
        type: 'sticker',
        name: 'Washi Tape Corner',
        x: Math.round(tw * 0.27),
        y: Math.round(th * 0.82),
        width: Math.round(80 * s),
        height: Math.round(22 * s),
        rotation: -6,
        opacity: 0.9,
        zIndex: 7,
        locked: false,
        visible: true,
        stickerType: 'washi-tape',
        color: '#D8C6B0',
      });

      return {
        id: generateId('doc'),
        version: 1,
        name: 'Summer Recap • 夏日胶片手帐',
        canvas: {
          width: tw,
          height: th,
          unit: 'px',
          backgroundType: 'color',
          backgroundColor: bg,
          presetName: 'Summer Recap (Lookbook)',
        },
        elements,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    },
  },
  {
    id: 'vogue-fullbleed-cover',
    name: 'Vogue Full-Bleed • 全屏时尚大片封面 (1 Hero)',
    category: 'Full Bleed',
    description: '100% 满屏全画幅大片，覆盖式巨幅时尚粗衬线大字、特刊期号与条形码',
    preview: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&auto=format&fit=crop&q=80',
    photoCount: 1,
    badge: '全屏大字',
    createDocument: (tw = 1200, th = 1600, tbg = '#FFFFFF'): CollageDocument => {
      const s = Math.min(tw, th) / 1200;
      return {
        id: generateId('doc'),
        version: 1,
        name: 'Vogue 全屏时尚大片封面',
        canvas: {
          width: tw,
          height: th,
          unit: 'px',
          backgroundType: 'color',
          backgroundColor: tbg,
          presetName: '全屏大字封面 (Full Bleed)',
        },
        elements: [
          {
            id: generateId('img'),
            type: 'image',
            name: 'Full Bleed Hero Photo',
            x: 0,
            y: 0,
            width: tw,
            height: th,
            rotation: 0,
            opacity: 1,
            zIndex: 1,
            locked: false,
            visible: true,
            src: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1800&auto=format&fit=crop&q=90',
            originalWidth: 1800,
            originalHeight: 2700,
            fit: 'cover',
            borderRadius: 0,
          },
          {
            id: generateId('txt'),
            type: 'text',
            name: 'Hero Magazine Masthead',
            x: Math.round(tw * 0.04),
            y: Math.round(th * 0.05),
            width: Math.round(tw * 0.92),
            height: Math.round(th * 0.12),
            rotation: 0,
            opacity: 1,
            zIndex: 2,
            locked: false,
            visible: true,
            text: 'HAUTE COUTURE',
            fontFamily: '"Playfair Display", serif',
            fontSize: Math.max(28, Math.round(72 * (tw / 1200))),
            fontWeight: 900,
            fontStyle: 'normal',
            letterSpacing: 6,
            lineHeight: 1.1,
            textAlign: 'center',
            textTransform: 'uppercase',
            color: '#FFFFFF',
            shadowBlur: 20,
            shadowColor: 'rgba(0,0,0,0.6)',
            shadowOffsetY: 4,
          },
          {
            id: generateId('txt'),
            type: 'text',
            name: 'Issue Date Tag',
            x: Math.round(tw * 0.08),
            y: Math.round(th * 0.18),
            width: Math.round(tw * 0.84),
            height: Math.round(th * 0.03),
            rotation: 0,
            opacity: 0.9,
            zIndex: 3,
            locked: false,
            visible: true,
            text: 'ISSUE NO. 09 — THE SILENT REVOLUTION • PARIS / MILAN',
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: Math.max(10, Math.round(13 * s)),
            fontWeight: 600,
            fontStyle: 'normal',
            letterSpacing: 4,
            lineHeight: 1.2,
            textAlign: 'center',
            textTransform: 'uppercase',
            color: '#E5C49F',
            shadowBlur: 10,
            shadowColor: 'rgba(0,0,0,0.8)',
          },
          {
            id: generateId('txt'),
            type: 'text',
            name: 'Story Headline Left',
            x: Math.round(tw * 0.06),
            y: Math.round(th * 0.76),
            width: Math.round(tw * 0.45),
            height: Math.round(th * 0.15),
            rotation: 0,
            opacity: 0.95,
            zIndex: 4,
            locked: false,
            visible: true,
            text: 'THE NEW MODERNISM\nARCHITECTURE OF SILENCE\nAUTUMN / WINTER LOOKBOOK',
            fontFamily: '"Cinzel", serif',
            fontSize: Math.max(11, Math.round(18 * s)),
            fontWeight: 700,
            fontStyle: 'normal',
            letterSpacing: 2,
            lineHeight: 1.35,
            textAlign: 'left',
            textTransform: 'uppercase',
            color: '#FAF8F5',
            shadowBlur: 15,
            shadowColor: 'rgba(0,0,0,0.8)',
          },
          {
            id: generateId('stk'),
            type: 'sticker',
            name: 'Barcode Tag',
            x: Math.round(tw * 0.80),
            y: Math.round(th * 0.88),
            width: Math.round(tw * 0.14),
            height: Math.round(th * 0.05),
            rotation: 0,
            opacity: 0.85,
            zIndex: 5,
            locked: false,
            visible: true,
            stickerType: 'archival-tag',
            label: 'N° 0824',
            color: '#1A1817',
            accentColor: '#E5C49F',
          },
        ],
      };
    },
  },

  {
    id: 'bazaar-bold-masthead',
    name: 'Bazaar Bold Title • 极致时尚字号 (1 Hero)',
    category: 'Full Bleed',
    description: '单张人像张力满幅大片，配以夸张对比比例字形与左右故事索引',
    preview: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80',
    photoCount: 1,
    badge: '时尚大字',
    createDocument: (tw = 1200, th = 1600, tbg = '#FFFFFF'): CollageDocument => {
      const s = Math.min(tw, th) / 1200;
      return {
        id: generateId('doc'),
        version: 1,
        name: 'Bazaar 极致时尚大字封面',
        canvas: {
          width: tw,
          height: th,
          unit: 'px',
          backgroundType: 'color',
          backgroundColor: tbg,
          presetName: '时尚大字海报',
        },
        elements: [
          {
            id: generateId('img'),
            type: 'image',
            name: 'Portrait Hero',
            x: 0,
            y: 0,
            width: tw,
            height: th,
            rotation: 0,
            opacity: 1,
            zIndex: 1,
            locked: false,
            visible: true,
            src: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=1800&auto=format&fit=crop&q=90',
            originalWidth: 1800,
            originalHeight: 2700,
            fit: 'cover',
          },
          {
            id: generateId('txt'),
            type: 'text',
            name: 'Editorial Masthead',
            x: Math.round(tw * 0.05),
            y: Math.round(th * 0.04),
            width: Math.round(tw * 0.9),
            height: Math.round(th * 0.14),
            rotation: 0,
            opacity: 1,
            zIndex: 2,
            locked: false,
            visible: true,
            text: 'ELEGANTE',
            fontFamily: '"Cormorant Garamond", serif',
            fontSize: Math.max(36, Math.round(92 * (tw / 1200))),
            fontWeight: 700,
            fontStyle: 'normal',
            letterSpacing: 10,
            lineHeight: 1.0,
            textAlign: 'center',
            textTransform: 'uppercase',
            color: '#FAF8F5',
            shadowBlur: 25,
            shadowColor: 'rgba(0,0,0,0.7)',
          },
          {
            id: generateId('txt'),
            type: 'text',
            name: 'Sub-deck Text',
            x: Math.round(tw * 0.06),
            y: Math.round(th * 0.82),
            width: Math.round(tw * 0.4),
            height: Math.round(th * 0.1),
            rotation: 0,
            opacity: 0.9,
            zIndex: 3,
            locked: false,
            visible: true,
            text: 'A PERSPECTIVE ON LIGHT\nAND CONTEMPORARY FORM',
            fontFamily: '"Space Grotesk", sans-serif',
            fontSize: Math.max(10, Math.round(14 * s)),
            fontWeight: 600,
            fontStyle: 'normal',
            letterSpacing: 2,
            lineHeight: 1.4,
            textAlign: 'left',
            color: '#E5C49F',
          },
        ],
      };
    },
  },

  {
    id: 'dazed-heavy-title',
    name: 'DAZED Heavy-Type • 先锋大字重构 (1 Hero)',
    category: 'Full Bleed',
    description: '前卫无衬线粗体字贯穿全画幅，充满街头先锋美学与张力',
    preview: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600&auto=format&fit=crop&q=80',
    photoCount: 1,
    badge: '先锋大字',
    createDocument: (tw = 1200, th = 1600, tbg = '#FFFFFF'): CollageDocument => {
      const s = Math.min(tw, th) / 1200;
      return {
        id: generateId('doc'),
        version: 1,
        name: 'DAZED 先锋大字重构',
        canvas: {
          width: tw,
          height: th,
          unit: 'px',
          backgroundType: 'color',
          backgroundColor: tbg,
          presetName: '先锋大字',
        },
        elements: [
          {
            id: generateId('img'),
            type: 'image',
            name: 'Subversive Fashion Photo',
            x: 0,
            y: 0,
            width: tw,
            height: th,
            rotation: 0,
            opacity: 1,
            zIndex: 1,
            locked: false,
            visible: true,
            src: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=1800&auto=format&fit=crop&q=90',
            originalWidth: 1800,
            originalHeight: 2400,
            fit: 'cover',
          },
          {
            id: generateId('txt'),
            type: 'text',
            name: 'Giant Masthead',
            x: Math.round(tw * 0.04),
            y: Math.round(th * 0.03),
            width: Math.round(tw * 0.92),
            height: Math.round(th * 0.16),
            rotation: 0,
            opacity: 0.95,
            zIndex: 2,
            locked: false,
            visible: true,
            text: 'AVANT-GARDE',
            fontFamily: '"Syne", sans-serif',
            fontSize: Math.max(32, Math.round(76 * (tw / 1200))),
            fontWeight: 800,
            fontStyle: 'normal',
            letterSpacing: -1,
            lineHeight: 0.95,
            textAlign: 'center',
            textTransform: 'uppercase',
            color: '#FAF8F5',
            shadowBlur: 20,
            shadowColor: '#000000',
          },
          {
            id: generateId('txt'),
            type: 'text',
            name: 'Bottom Tag',
            x: Math.round(tw * 0.06),
            y: Math.round(th * 0.88),
            width: Math.round(tw * 0.88),
            height: Math.round(th * 0.06),
            rotation: 0,
            opacity: 0.9,
            zIndex: 3,
            locked: false,
            visible: true,
            text: 'PARIS EDITION // ISSUE 08 // ALL RIGHTS RESERVED',
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: Math.max(9, Math.round(12 * s)),
            fontWeight: 500,
            fontStyle: 'normal',
            letterSpacing: 3,
            lineHeight: 1.2,
            textAlign: 'center',
            color: '#E5C49F',
          },
        ],
      };
    },
  },

  {
    id: 'paris-fashion-poster',
    name: 'Paris Runway • 时装大秀艺术海报 (1 Hero)',
    category: 'Full Bleed',
    description: '法式衬线居中构图，底部展讯与高定巴黎发布会标题',
    preview: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600&auto=format&fit=crop&q=80',
    photoCount: 1,
    badge: '时装大秀',
    createDocument: (tw = 1200, th = 1600, tbg = '#FFFFFF'): CollageDocument => {
      const s = Math.min(tw, th) / 1200;
      return {
        id: generateId('doc'),
        version: 1,
        name: 'Paris Runway 时装大秀海报',
        canvas: {
          width: tw,
          height: th,
          unit: 'px',
          backgroundType: 'color',
          backgroundColor: tbg,
          presetName: '时装海报',
        },
        elements: [
          {
            id: generateId('img'),
            type: 'image',
            name: 'Runway Model',
            x: Math.round(tw * 0.06),
            y: Math.round(th * 0.05),
            width: Math.round(tw * 0.88),
            height: Math.round(th * 0.74),
            rotation: 0,
            opacity: 1,
            zIndex: 1,
            locked: false,
            visible: true,
            src: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1800&auto=format&fit=crop&q=90',
            originalWidth: 1800,
            originalHeight: 2400,
            fit: 'cover',
            borderRadius: 4,
          },
          {
            id: generateId('txt'),
            type: 'text',
            name: 'Collection Title',
            x: Math.round(tw * 0.06),
            y: Math.round(th * 0.82),
            width: Math.round(tw * 0.88),
            height: Math.round(th * 0.08),
            rotation: 0,
            opacity: 1,
            zIndex: 2,
            locked: false,
            visible: true,
            text: 'LA COLLECTION D’AUTOMNE',
            fontFamily: '"Cormorant Garamond", serif',
            fontSize: Math.max(20, Math.round(36 * (tw / 1200))),
            fontWeight: 700,
            fontStyle: 'normal',
            letterSpacing: 8,
            lineHeight: 1.1,
            textAlign: 'center',
            color: '#1C1B1A',
          },
          {
            id: generateId('txt'),
            type: 'text',
            name: 'Location Date',
            x: Math.round(tw * 0.06),
            y: Math.round(th * 0.90),
            width: Math.round(tw * 0.88),
            height: Math.round(th * 0.04),
            rotation: 0,
            opacity: 0.75,
            zIndex: 3,
            locked: false,
            visible: true,
            text: 'PALAIS GALLIERA • PARIS • OCTOBRE 2026',
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: Math.max(10, Math.round(13 * s)),
            fontWeight: 500,
            fontStyle: 'normal',
            letterSpacing: 4,
            lineHeight: 1.2,
            textAlign: 'center',
            color: '#7A756D',
          },
        ],
      };
    },
  },

  {
    id: 'cinema-ultrawide-title',
    name: 'Cinema Anamorphic • 电影宽银幕 (1 Hero)',
    category: 'Full Bleed',
    description: '2.39:1 电影宽画幅黑边胶片质感，配以优雅电影字幕排版',
    preview: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600&auto=format&fit=crop&q=80',
    photoCount: 1,
    badge: '电影胶卷',
    createDocument: (tw = 1200, th = 1600, tbg = '#FFFFFF'): CollageDocument => {
      const s = Math.min(tw, th) / 1200;
      const cinemaH = Math.round(tw / 2.39);
      const cinemaY = Math.round((th - cinemaH) / 2);
      return {
        id: generateId('doc'),
        version: 1,
        name: 'Cinema 电影宽银幕',
        canvas: {
          width: tw,
          height: th,
          unit: 'px',
          backgroundType: 'color',
          backgroundColor: '#FFFFFF',
          presetName: '电影海报',
        },
        elements: [
          {
            id: generateId('img'),
            type: 'image',
            name: 'Cinema Stills',
            x: 0,
            y: cinemaY,
            width: tw,
            height: cinemaH,
            rotation: 0,
            opacity: 1,
            zIndex: 1,
            locked: false,
            visible: true,
            src: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1800&auto=format&fit=crop&q=90',
            originalWidth: 1800,
            originalHeight: 753,
            fit: 'cover',
          },
          {
            id: generateId('txt'),
            type: 'text',
            name: 'Top Movie Title',
            x: Math.round(tw * 0.08),
            y: Math.round(th * 0.12),
            width: Math.round(tw * 0.84),
            height: Math.round(th * 0.08),
            rotation: 0,
            opacity: 0.9,
            zIndex: 2,
            locked: false,
            visible: true,
            text: 'MEMORIES OF THE PAST',
            fontFamily: '"Cinzel", serif',
            fontSize: Math.max(18, Math.round(32 * s)),
            fontWeight: 600,
            fontStyle: 'normal',
            letterSpacing: 10,
            lineHeight: 1.2,
            textAlign: 'center',
            color: '#1C1B1A',
          },
          {
            id: generateId('txt'),
            type: 'text',
            name: 'Bottom Subtitle Quote',
            x: Math.round(tw * 0.1),
            y: Math.round(th * 0.78),
            width: Math.round(tw * 0.8),
            height: Math.round(th * 0.08),
            rotation: 0,
            opacity: 0.8,
            zIndex: 3,
            locked: false,
            visible: true,
            text: '“Some moments are captured in silence, living forever in light.”',
            fontFamily: '"Instrument Serif", serif',
            fontSize: Math.max(13, Math.round(22 * s)),
            fontWeight: 400,
            fontStyle: 'italic',
            letterSpacing: 2,
            lineHeight: 1.4,
            textAlign: 'center',
            color: '#555555',
          },
        ],
      };
    },
  },

  {
    id: 'numero-avant-garde',
    name: 'Numéro Avant-Garde • 前卫艺术特刊 (1 Hero)',
    category: 'Full Bleed',
    description: '纯黑背景与高对比人像，银色细衬线标与反光质感',
    preview: 'https://images.unsplash.com/photo-1508746829417-e6f548d8d6ed?w=600&auto=format&fit=crop&q=80',
    photoCount: 1,
    badge: '前卫大字',
    createDocument: (tw = 1200, th = 1600, tbg = '#FFFFFF'): CollageDocument => {
      const s = Math.min(tw, th) / 1200;
      return {
        id: generateId('doc'),
        version: 1,
        name: 'Numéro 前卫艺术特刊',
        canvas: {
          width: tw,
          height: th,
          unit: 'px',
          backgroundType: 'color',
          backgroundColor: '#FFFFFF',
          presetName: '前卫艺术',
        },
        elements: [
          {
            id: generateId('img'),
            type: 'image',
            name: 'High Contrast Model',
            x: 0,
            y: 0,
            width: tw,
            height: th,
            rotation: 0,
            opacity: 1,
            zIndex: 1,
            locked: false,
            visible: true,
            src: 'https://images.unsplash.com/photo-1508746829417-e6f548d8d6ed?w=1800&auto=format&fit=crop&q=90',
            originalWidth: 1800,
            originalHeight: 2400,
            fit: 'cover',
          },
          {
            id: generateId('txt'),
            type: 'text',
            name: 'Silver Masthead',
            x: Math.round(tw * 0.05),
            y: Math.round(th * 0.04),
            width: Math.round(tw * 0.9),
            height: Math.round(th * 0.12),
            rotation: 0,
            opacity: 0.95,
            zIndex: 2,
            locked: false,
            visible: true,
            text: 'NUMÉRO ART',
            fontFamily: '"Cormorant Garamond", serif',
            fontSize: Math.max(32, Math.round(84 * s)),
            fontWeight: 700,
            fontStyle: 'italic',
            letterSpacing: 8,
            lineHeight: 1.0,
            textAlign: 'center',
            textTransform: 'uppercase',
            color: '#E8E8EE',
            shadowBlur: 20,
            shadowColor: '#000000',
          },
        ],
      };
    },
  },

  // ==========================================
  // 2. 杂志画报与艺术排版 (EDITORIAL & MAGAZINE)
  // ==========================================
  {
    id: 'cereal-white-editorial',
    name: 'Cereal White • 极致留白画报 (1 Hero)',
    category: 'Editorial',
    description: '大面积素雅米白留白，沉静诗意短句与极简东方意境',
    preview: 'https://images.unsplash.com/photo-1494526585095-c41746248156?w=600&auto=format&fit=crop&q=80',
    photoCount: 1,
    badge: '极致留白',
    createDocument: (tw = 1200, th = 1600, tbg = '#FFFFFF'): CollageDocument => {
      const s = Math.min(tw, th) / 1200;
      const imgW = Math.round(tw * 0.72);
      const imgH = Math.round(th * 0.60);
      const imgX = Math.round((tw - imgW) / 2);
      const imgY = Math.round(th * 0.12);

      return {
        id: generateId('doc'),
        version: 1,
        name: 'Cereal 极简留白画报',
        canvas: {
          width: tw,
          height: th,
          unit: 'px',
          backgroundType: 'color',
          backgroundColor: tbg,
          presetName: '极简画报',
        },
        elements: [
          {
            id: generateId('img'),
            type: 'image',
            name: 'Center Photo',
            x: imgX,
            y: imgY,
            width: imgW,
            height: imgH,
            rotation: 0,
            opacity: 1,
            zIndex: 1,
            locked: false,
            visible: true,
            src: 'https://images.unsplash.com/photo-1494526585095-c41746248156?w=1800&auto=format&fit=crop&q=90',
            originalWidth: 1800,
            originalHeight: 1200,
            fit: 'cover',
            borderRadius: 2,
            shadowBlur: 25,
            shadowOpacity: 0.12,
          },
          {
            id: generateId('txt'),
            type: 'text',
            name: 'Top Brand Name',
            x: imgX,
            y: Math.round(th * 0.05),
            width: imgW,
            height: Math.round(th * 0.04),
            rotation: 0,
            opacity: 0.8,
            zIndex: 2,
            locked: false,
            visible: true,
            text: 'C E R E A L',
            fontFamily: '"Plus Jakarta Sans", sans-serif',
            fontSize: Math.max(12, Math.round(16 * s)),
            fontWeight: 600,
            fontStyle: 'normal',
            letterSpacing: 12,
            lineHeight: 1.2,
            textAlign: 'center',
            textTransform: 'uppercase',
            color: '#383633',
          },
          {
            id: generateId('txt'),
            type: 'text',
            name: 'Bottom Editorial Title',
            x: imgX,
            y: Math.round(th * 0.77),
            width: imgW,
            height: Math.round(th * 0.08),
            rotation: 0,
            opacity: 0.9,
            zIndex: 3,
            locked: false,
            visible: true,
            text: 'THE ESSENCE OF SOLITUDE',
            fontFamily: '"Cormorant Garamond", serif',
            fontSize: Math.max(18, Math.round(30 * s)),
            fontWeight: 600,
            fontStyle: 'normal',
            letterSpacing: 6,
            lineHeight: 1.2,
            textAlign: 'center',
            textTransform: 'uppercase',
            color: '#211F1D',
          },
          {
            id: generateId('txt'),
            type: 'text',
            name: 'Bottom Description Paragraph',
            x: Math.round(tw * 0.22),
            y: Math.round(th * 0.86),
            width: Math.round(tw * 0.56),
            height: Math.round(th * 0.07),
            rotation: 0,
            opacity: 0.7,
            zIndex: 4,
            locked: false,
            visible: true,
            text: 'An exploration of architecture, landscape and spatial harmony across the northern coast.',
            fontFamily: '"Plus Jakarta Sans", sans-serif',
            fontSize: Math.max(9, Math.round(11 * s)),
            fontWeight: 400,
            fontStyle: 'normal',
            letterSpacing: 0.5,
            lineHeight: 1.6,
            textAlign: 'center',
            color: '#6E6B65',
          },
        ],
      };
    },
  },

  {
    id: 'kinfolk-slow-living',
    name: 'Kinfolk Slow Living • 慢调生活 (2 Photos)',
    category: 'Editorial',
    description: '温润燕麦米色底板，一大一小错落图文组合，温暖自然生活感',
    preview: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=600&auto=format&fit=crop&q=80',
    photoCount: 2,
    badge: '慢调生活',
    createDocument: (tw = 1200, th = 1600, tbg = '#FFFFFF'): CollageDocument => {
      const s = Math.min(tw, th) / 1200;
      return {
        id: generateId('doc'),
        version: 1,
        name: 'Kinfolk 慢调生活双图',
        canvas: {
          width: tw,
          height: th,
          unit: 'px',
          backgroundType: 'color',
          backgroundColor: tbg,
          presetName: '生活画报',
        },
        elements: [
          {
            id: generateId('img'),
            type: 'image',
            name: 'Hero Photo',
            x: Math.round(tw * 0.08),
            y: Math.round(th * 0.12),
            width: Math.round(tw * 0.52),
            height: Math.round(th * 0.65),
            rotation: 0,
            opacity: 1,
            zIndex: 1,
            locked: false,
            visible: true,
            src: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=1800&auto=format&fit=crop&q=90',
            originalWidth: 1800,
            originalHeight: 2400,
            fit: 'cover',
            borderRadius: 3,
            shadowBlur: 20,
            shadowOpacity: 0.1,
          },
          {
            id: generateId('img'),
            type: 'image',
            name: 'Detail Photo',
            x: Math.round(tw * 0.54),
            y: Math.round(th * 0.32),
            width: Math.round(tw * 0.38),
            height: Math.round(th * 0.38),
            rotation: 0,
            opacity: 1,
            zIndex: 2,
            locked: false,
            visible: true,
            src: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1800&auto=format&fit=crop&q=90',
            originalWidth: 1800,
            originalHeight: 1800,
            fit: 'cover',
            borderRadius: 3,
            shadowBlur: 25,
            shadowOpacity: 0.15,
          },
          {
            id: generateId('txt'),
            type: 'text',
            name: 'Masthead Title',
            x: Math.round(tw * 0.08),
            y: Math.round(th * 0.04),
            width: Math.round(tw * 0.84),
            height: Math.round(th * 0.06),
            rotation: 0,
            opacity: 0.9,
            zIndex: 3,
            locked: false,
            visible: true,
            text: 'K I N F O L K',
            fontFamily: '"Cormorant Garamond", serif',
            fontSize: Math.max(16, Math.round(28 * s)),
            fontWeight: 600,
            fontStyle: 'normal',
            letterSpacing: 14,
            lineHeight: 1.2,
            textAlign: 'left',
            color: '#282522',
          },
          {
            id: generateId('txt'),
            type: 'text',
            name: 'Quote Paragraph',
            x: Math.round(tw * 0.56),
            y: Math.round(th * 0.74),
            width: Math.round(tw * 0.36),
            height: Math.round(th * 0.18),
            rotation: 0,
            opacity: 0.85,
            zIndex: 4,
            locked: false,
            visible: true,
            text: '“Finding beauty in the simplest routines and peaceful moments of daylight.”',
            fontFamily: '"Instrument Serif", serif',
            fontSize: Math.max(12, Math.round(18 * s)),
            fontWeight: 400,
            fontStyle: 'italic',
            letterSpacing: 1,
            lineHeight: 1.4,
            textAlign: 'left',
            color: '#4A4641',
          },
        ],
      };
    },
  },

  {
    id: 'zurich-swiss-poster',
    name: 'Zürich Swiss • 瑞士国际主义排版 (1 Hero)',
    category: 'Editorial',
    description: '网格化严格对齐、红白黑经典对比、现代主义大字',
    preview: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&auto=format&fit=crop&q=80',
    photoCount: 1,
    badge: '瑞士排版',
    createDocument: (tw = 1200, th = 1600, tbg = '#FFFFFF'): CollageDocument => {
      const s = Math.min(tw, tw) / 1200;
      return {
        id: generateId('doc'),
        version: 1,
        name: 'Zürich 瑞士国际主义海报',
        canvas: {
          width: tw,
          height: th,
          unit: 'px',
          backgroundType: 'color',
          backgroundColor: '#FFFFFF',
          presetName: '瑞士风格',
        },
        elements: [
          {
            id: generateId('shp'),
            type: 'shape',
            name: 'Red Block',
            x: 0,
            y: 0,
            width: tw,
            height: Math.round(th * 0.22),
            rotation: 0,
            opacity: 1,
            zIndex: 1,
            locked: false,
            visible: true,
            shapeType: 'rect',
            fill: '#E03E22',
            stroke: 'transparent',
            strokeWidth: 0,
          },
          {
            id: generateId('txt'),
            type: 'text',
            name: 'Swiss Bold Number',
            x: Math.round(tw * 0.05),
            y: Math.round(th * 0.03),
            width: Math.round(tw * 0.9),
            height: Math.round(th * 0.16),
            rotation: 0,
            opacity: 1,
            zIndex: 2,
            locked: false,
            visible: true,
            text: 'ZÜRICH 1968',
            fontFamily: '"Space Grotesk", sans-serif',
            fontSize: Math.max(30, Math.round(76 * (tw / 1200))),
            fontWeight: 800,
            fontStyle: 'normal',
            letterSpacing: -1,
            lineHeight: 1.0,
            textAlign: 'left',
            color: '#FFFFFF',
          },
          {
            id: generateId('img'),
            type: 'image',
            name: 'Architecture Grid',
            x: Math.round(tw * 0.05),
            y: Math.round(th * 0.26),
            width: Math.round(tw * 0.9),
            height: Math.round(th * 0.58),
            rotation: 0,
            opacity: 1,
            zIndex: 3,
            locked: false,
            visible: true,
            src: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1800&auto=format&fit=crop&q=90',
            originalWidth: 1800,
            originalHeight: 1200,
            fit: 'cover',
          },
        ],
      };
    },
  },

  {
    id: 'botanical-fine-art-wedding',
    name: 'Botanical Romance • 植物浪漫婚纱海报 (2 Photos)',
    category: 'Editorial',
    description: '柔粉晨曦底色，细双线金框，主肖像与花卉细节双联',
    preview: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=600&auto=format&fit=crop&q=80',
    photoCount: 2,
    badge: '法式浪漫',
    createDocument: (tw = 1200, th = 1600, tbg = '#FFFFFF'): CollageDocument => {
      const s = Math.min(tw, th) / 1200;
      return {
        id: generateId('doc'),
        version: 1,
        name: 'Botanical 浪漫艺术双联',
        canvas: {
          width: tw,
          height: th,
          unit: 'px',
          backgroundType: 'color',
          backgroundColor: tbg,
          presetName: '浪漫海报',
        },
        elements: [
          {
            id: generateId('img'),
            type: 'image',
            name: 'Main Portrait',
            x: Math.round(tw * 0.08),
            y: Math.round(th * 0.12),
            width: Math.round(tw * 0.84),
            height: Math.round(th * 0.54),
            rotation: 0,
            opacity: 1,
            zIndex: 1,
            locked: false,
            visible: true,
            src: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=1800&auto=format&fit=crop&q=90',
            originalWidth: 1800,
            originalHeight: 1200,
            fit: 'cover',
            borderRadius: 4,
            borderWidth: 1,
            borderColor: '#E5C49F',
          },
          {
            id: generateId('img'),
            type: 'image',
            name: 'Detail Flora',
            x: Math.round(tw * 0.08),
            y: Math.round(th * 0.69),
            width: Math.round(tw * 0.38),
            height: Math.round(th * 0.22),
            rotation: 0,
            opacity: 1,
            zIndex: 2,
            locked: false,
            visible: true,
            src: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1800&auto=format&fit=crop&q=90',
            originalWidth: 1800,
            originalHeight: 1800,
            fit: 'cover',
            borderRadius: 3,
          },
          {
            id: generateId('txt'),
            type: 'text',
            name: 'Wedding Names',
            x: Math.round(tw * 0.50),
            y: Math.round(th * 0.72),
            width: Math.round(tw * 0.42),
            height: Math.round(th * 0.12),
            rotation: 0,
            opacity: 1,
            zIndex: 3,
            locked: false,
            visible: true,
            text: 'JULIAN & CLAIRE\nFOREVER IN BLOOM',
            fontFamily: '"Cormorant Garamond", serif',
            fontSize: Math.max(16, Math.round(24 * s)),
            fontWeight: 700,
            fontStyle: 'normal',
            letterSpacing: 4,
            lineHeight: 1.3,
            textAlign: 'left',
            color: '#1C1B1A',
          },
        ],
      };
    },
  },

  // ==========================================
  // 3. 高定画册与双联/三联型录 (LOOKBOOK & TRIPTYCH)
  // ==========================================
  {
    id: 'couture-split-dual-bleed',
    name: 'Haute Couture Split • 双联画册 (2 Photos)',
    category: 'Lookbook',
    description: '左右 1:1 严谨对称双联大片，配以居中胶带标签与底部档案编码',
    preview: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=600&auto=format&fit=crop&q=80',
    photoCount: 2,
    badge: '双联画册',
    createDocument: (tw = 1200, th = 1600, tbg = '#FFFFFF'): CollageDocument => {
      const gap = Math.round(tw * 0.02);
      const pad = Math.round(tw * 0.04);
      const cardW = Math.round((tw - pad * 2 - gap) / 2);
      const cardH = Math.round(th * 0.82);

      return {
        id: generateId('doc'),
        version: 1,
        name: 'Haute Couture 双联画册',
        canvas: {
          width: tw,
          height: th,
          unit: 'px',
          backgroundType: 'color',
          backgroundColor: '#FFFFFF',
          presetName: '双联画册',
        },
        elements: [
          {
            id: generateId('img'),
            type: 'image',
            name: 'Left Lookbook Portrait',
            x: pad,
            y: Math.round(th * 0.06),
            width: cardW,
            height: cardH,
            rotation: 0,
            opacity: 1,
            zIndex: 1,
            locked: false,
            visible: true,
            src: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=1800&auto=format&fit=crop&q=90',
            originalWidth: 1800,
            originalHeight: 2700,
            fit: 'cover',
            borderRadius: 2,
          },
          {
            id: generateId('img'),
            type: 'image',
            name: 'Right Lookbook Architecture',
            x: pad + cardW + gap,
            y: Math.round(th * 0.06),
            width: cardW,
            height: cardH,
            rotation: 0,
            opacity: 1,
            zIndex: 2,
            locked: false,
            visible: true,
            src: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1800&auto=format&fit=crop&q=90',
            originalWidth: 1800,
            originalHeight: 2700,
            fit: 'cover',
            borderRadius: 2,
          },
          {
            id: generateId('stk'),
            type: 'sticker',
            name: 'Center Seal Tag',
            x: Math.round(tw / 2 - 40),
            y: Math.round(th * 0.84),
            width: 80,
            height: 28,
            rotation: 0,
            opacity: 0.9,
            zIndex: 3,
            locked: false,
            visible: true,
            stickerType: 'archival-tag',
            label: 'MARGINLAB',
            color: '#1C1B1A',
            accentColor: '#E5C49F',
          },
        ],
      };
    },
  },

  {
    id: 'asymmetric-fashion-trio',
    name: 'Asymmetric Trio • 非对称三图焦点 (3 Photos)',
    category: 'Lookbook',
    description: '左侧黄金分割主焦大图，右侧纵向排列双联特写，动静相宜',
    preview: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=600&auto=format&fit=crop&q=80',
    photoCount: 3,
    badge: '非对称三图',
    createDocument: (tw = 1200, th = 1600, tbg = '#FFFFFF'): CollageDocument => {
      const pad = Math.round(tw * 0.04);
      const gap = Math.round(tw * 0.02);
      const leftW = Math.round((tw - pad * 2 - gap) * 0.58);
      const rightW = tw - pad * 2 - gap - leftW;
      const totalH = Math.round(th * 0.88);
      const rightH = Math.round((totalH - gap) / 2);

      return {
        id: generateId('doc'),
        version: 1,
        name: '非对称三图焦点 Lookbook',
        canvas: {
          width: tw,
          height: th,
          unit: 'px',
          backgroundType: 'color',
          backgroundColor: '#FFFFFF',
          presetName: '三图画册',
        },
        elements: [
          {
            id: generateId('img'),
            type: 'image',
            name: 'Hero Left Full',
            x: pad,
            y: pad,
            width: leftW,
            height: totalH,
            rotation: 0,
            opacity: 1,
            zIndex: 1,
            locked: false,
            visible: true,
            src: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1800&auto=format&fit=crop&q=90',
            originalWidth: 1800,
            originalHeight: 2700,
            fit: 'cover',
            borderRadius: 2,
          },
          {
            id: generateId('img'),
            type: 'image',
            name: 'Right Top Detail',
            x: pad + leftW + gap,
            y: pad,
            width: rightW,
            height: rightH,
            rotation: 0,
            opacity: 1,
            zIndex: 2,
            locked: false,
            visible: true,
            src: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1800&auto=format&fit=crop&q=90',
            originalWidth: 1800,
            originalHeight: 1800,
            fit: 'cover',
            borderRadius: 2,
          },
          {
            id: generateId('img'),
            type: 'image',
            name: 'Right Bottom Detail',
            x: pad + leftW + gap,
            y: pad + rightH + gap,
            width: rightW,
            height: rightH,
            rotation: 0,
            opacity: 1,
            zIndex: 3,
            locked: false,
            visible: true,
            src: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=1800&auto=format&fit=crop&q=90',
            originalWidth: 1800,
            originalHeight: 1800,
            fit: 'cover',
            borderRadius: 2,
          },
        ],
      };
    },
  },

  {
    id: 'triptych-vertical-bleed',
    name: 'Triptych Strips • 竖向三联画卷 (3 Photos)',
    category: 'Lookbook',
    description: '三联等宽并列竖画幅，极佳展现连续动作、景深过渡与人像情绪',
    preview: 'https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=600&auto=format&fit=crop&q=80',
    photoCount: 3,
    badge: '纵向三联',
    createDocument: (tw = 1200, th = 1600, tbg = '#FFFFFF'): CollageDocument => {
      const gap = Math.round(tw * 0.015);
      const pad = Math.round(tw * 0.03);
      const colW = Math.round((tw - pad * 2 - gap * 2) / 3);
      const colH = Math.round(th * 0.86);

      return {
        id: generateId('doc'),
        version: 1,
        name: 'Triptych 竖向三联画卷',
        canvas: {
          width: tw,
          height: th,
          unit: 'px',
          backgroundType: 'color',
          backgroundColor: '#FFFFFF',
          presetName: '三联画卷',
        },
        elements: [
          {
            id: generateId('img'),
            type: 'image',
            name: 'Frame 01',
            x: pad,
            y: Math.round(th * 0.06),
            width: colW,
            height: colH,
            rotation: 0,
            opacity: 1,
            zIndex: 1,
            locked: false,
            visible: true,
            src: 'https://images.unsplash.com/photo-1508746829417-e6f548d8d6ed?w=1800&auto=format&fit=crop&q=90',
            originalWidth: 1800,
            originalHeight: 2700,
            fit: 'cover',
          },
          {
            id: generateId('img'),
            type: 'image',
            name: 'Frame 02',
            x: pad + colW + gap,
            y: Math.round(th * 0.06),
            width: colW,
            height: colH,
            rotation: 0,
            opacity: 1,
            zIndex: 2,
            locked: false,
            visible: true,
            src: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=1800&auto=format&fit=crop&q=90',
            originalWidth: 1800,
            originalHeight: 2700,
            fit: 'cover',
          },
          {
            id: generateId('img'),
            type: 'image',
            name: 'Frame 03',
            x: pad + (colW + gap) * 2,
            y: Math.round(th * 0.06),
            width: colW,
            height: colH,
            rotation: 0,
            opacity: 1,
            zIndex: 3,
            locked: false,
            visible: true,
            src: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1800&auto=format&fit=crop&q=90',
            originalWidth: 1800,
            originalHeight: 2700,
            fit: 'cover',
          },
        ],
      };
    },
  },

  // ==========================================
  // 4. 多图画廊与作品集 (GALLERY & MULTI-GRID)
  // ==========================================
  {
    id: 'editorial-quad-grid',
    name: 'Editorial Quad • 四图几何画廊 (4 Photos)',
    category: 'Gallery',
    description: '四张照片等距几何网格，带内白边与典雅中心小标，高级平衡感',
    preview: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&auto=format&fit=crop&q=80',
    photoCount: 4,
    badge: '四图画廊',
    createDocument: (tw = 1200, th = 1600, tbg = '#FFFFFF'): CollageDocument => {
      const pad = Math.round(tw * 0.06);
      const gap = Math.round(tw * 0.03);
      const colW = Math.round((tw - pad * 2 - gap) / 2);
      const rowH = Math.round((th * 0.84 - gap) / 2);

      const photos = [
        'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1800&auto=format&fit=crop&q=90',
        'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1800&auto=format&fit=crop&q=90',
        'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=1800&auto=format&fit=crop&q=90',
        'https://images.unsplash.com/photo-1494526585095-c41746248156?w=1800&auto=format&fit=crop&q=90',
      ];

      return {
        id: generateId('doc'),
        version: 1,
        name: '四图几何画廊',
        canvas: {
          width: tw,
          height: th,
          unit: 'px',
          backgroundType: 'color',
          backgroundColor: tbg,
          presetName: '四图画廊',
        },
        elements: [
          ...photos.map((src, i) => {
            const col = i % 2;
            const row = Math.floor(i / 2);
            return {
              id: generateId('img'),
              type: 'image' as const,
              name: `Gallery Photo 0${i + 1}`,
              x: pad + col * (colW + gap),
              y: Math.round(th * 0.07) + row * (rowH + gap),
              width: colW,
              height: rowH,
              rotation: 0,
              opacity: 1,
              zIndex: i + 1,
              locked: false,
              visible: true,
              src,
              originalWidth: 1800,
              originalHeight: 1800,
              fit: 'cover' as const,
              borderRadius: 3,
            };
          }),
        ],
      };
    },
  },

  {
    id: 'four-tile-fullbleed',
    name: 'Four-Tile Bleed • 四图无界满版 (4 Photos)',
    category: 'Gallery',
    description: '2x2 满版紧凑无界拼贴，适合米家 6 寸相纸无损冲印与生活照片集',
    preview: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=600&auto=format&fit=crop&q=80',
    photoCount: 4,
    badge: '四图满版',
    createDocument: (tw = 1200, th = 1600, tbg = '#FFFFFF'): CollageDocument => {
      const halfW = Math.round(tw / 2);
      const halfH = Math.round(th / 2);

      const photos = [
        'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=1800&auto=format&fit=crop&q=90',
        'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1800&auto=format&fit=crop&q=90',
        'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1800&auto=format&fit=crop&q=90',
        'https://images.unsplash.com/photo-1544816155-12df9643f363?w=1800&auto=format&fit=crop&q=90',
      ];

      return {
        id: generateId('doc'),
        version: 1,
        name: '四图无界满版',
        canvas: {
          width: tw,
          height: th,
          unit: 'px',
          backgroundType: 'color',
          backgroundColor: '#FFFFFF',
          presetName: '四图满版',
        },
        elements: [
          ...photos.map((src, i) => {
            const col = i % 2;
            const row = Math.floor(i / 2);
            return {
              id: generateId('img'),
              type: 'image' as const,
              name: `Tile 0${i + 1}`,
              x: col * halfW,
              y: row * halfH,
              width: halfW,
              height: halfH,
              rotation: 0,
              opacity: 1,
              zIndex: i + 1,
              locked: false,
              visible: true,
              src,
              originalWidth: 1800,
              originalHeight: 1800,
              fit: 'cover' as const,
              borderRadius: 0,
            };
          }),
        ],
      };
    },
  },

  {
    id: 'cinematic-five-frames',
    name: 'Cinematic 5 Frames • 电影叙事五帧 (5 Photos)',
    category: 'Gallery',
    description: '顶部宽幅全景大图，底部 4 联连续故事分镜，极具电影质感',
    preview: 'https://images.unsplash.com/photo-1503602642458-232111445657?w=600&auto=format&fit=crop&q=80',
    photoCount: 5,
    badge: '电影五帧',
    createDocument: (tw = 1200, th = 1600, tbg = '#FFFFFF'): CollageDocument => {
      const pad = Math.round(tw * 0.04);
      const gap = Math.round(tw * 0.015);
      const topH = Math.round(th * 0.52);
      const botH = Math.round(th * 0.28);
      const botW = Math.round((tw - pad * 2 - gap * 3) / 4);

      return {
        id: generateId('doc'),
        version: 1,
        name: '电影叙事五帧',
        canvas: {
          width: tw,
          height: th,
          unit: 'px',
          backgroundType: 'color',
          backgroundColor: '#FFFFFF',
          presetName: '五帧电影',
        },
        elements: [
          {
            id: generateId('img'),
            type: 'image',
            name: 'Hero Panorama Frame',
            x: pad,
            y: Math.round(th * 0.08),
            width: tw - pad * 2,
            height: topH,
            rotation: 0,
            opacity: 1,
            zIndex: 1,
            locked: false,
            visible: true,
            src: 'https://images.unsplash.com/photo-1494526585095-c41746248156?w=1800&auto=format&fit=crop&q=90',
            originalWidth: 1800,
            originalHeight: 1200,
            fit: 'cover',
            borderRadius: 3,
          },
          ...[
            'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&q=85',
            'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=800&q=85',
            'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=85',
            'https://images.unsplash.com/photo-1544816155-12df9643f363?w=800&q=85',
          ].map((src, i) => ({
            id: generateId('img'),
            type: 'image' as const,
            name: `Storyboard 0${i + 1}`,
            x: pad + i * (botW + gap),
            y: Math.round(th * 0.08) + topH + Math.round(th * 0.03),
            width: botW,
            height: botH,
            rotation: 0,
            opacity: 1,
            zIndex: i + 2,
            locked: false,
            visible: true,
            src,
            originalWidth: 800,
            originalHeight: 1200,
            fit: 'cover' as const,
            borderRadius: 2,
          })),
        ],
      };
    },
  },

  {
    id: 'portfolio-six-grid',
    name: 'Studio 6-Grid • 六图作品集矩阵 (6 Photos)',
    category: 'Gallery',
    description: '2x3 精准对齐画廊，适合摄影合集、建筑专题与人像多机位',
    preview: 'https://images.unsplash.com/photo-1518005020951-eccb494ad742?w=600&auto=format&fit=crop&q=80',
    photoCount: 6,
    badge: '六图矩阵',
    createDocument: (tw = 1200, th = 1600, tbg = '#FFFFFF'): CollageDocument => {
      const pad = Math.round(tw * 0.05);
      const gap = Math.round(tw * 0.025);
      const colW = Math.round((tw - pad * 2 - gap) / 2);
      const rowH = Math.round((th * 0.82 - gap * 2) / 3);

      const photos = [
        'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&q=85',
        'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=85',
        'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=800&q=85',
        'https://images.unsplash.com/photo-1494526585095-c41746248156?w=800&q=85',
        'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&q=85',
        'https://images.unsplash.com/photo-1544816155-12df9643f363?w=800&q=85',
      ];

      return {
        id: generateId('doc'),
        version: 1,
        name: '六图作品集矩阵',
        canvas: {
          width: tw,
          height: th,
          unit: 'px',
          backgroundType: 'color',
          backgroundColor: tbg,
          presetName: '六图矩阵',
        },
        elements: [
          ...photos.map((src, i) => {
            const col = i % 2;
            const row = Math.floor(i / 2);
            return {
              id: generateId('img'),
              type: 'image' as const,
              name: `Grid Photo 0${i + 1}`,
              x: pad + col * (colW + gap),
              y: Math.round(th * 0.08) + row * (rowH + gap),
              width: colW,
              height: rowH,
              rotation: 0,
              opacity: 1,
              zIndex: i + 1,
              locked: false,
              visible: true,
              src,
              originalWidth: 800,
              originalHeight: 800,
              fit: 'cover' as const,
              borderRadius: 3,
            };
          }),
        ],
      };
    },
  },

  {
    id: 'film-contact-sheet',
    name: '35mm Contact Sheet • 经典暗房印相 (6 Photos)',
    category: 'Gallery',
    description: '经典黑白暗房冲印底片排版，带胶卷编号、齿孔标与曝光手记',
    preview: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&auto=format&fit=crop&q=80',
    photoCount: 6,
    badge: '胶片印相',
    createDocument: (tw = 1200, th = 1600, tbg = '#FFFFFF'): CollageDocument => {
      const pad = Math.round(tw * 0.05);
      const gap = Math.round(tw * 0.02);
      const colW = Math.round((tw - pad * 2 - gap) / 2);
      const rowH = Math.round((th * 0.78 - gap * 2) / 3);

      const photos = [
        'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&q=85',
        'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=85',
        'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=800&q=85',
        'https://images.unsplash.com/photo-1494526585095-c41746248156?w=800&q=85',
        'https://images.unsplash.com/photo-1508746829417-e6f548d8d6ed?w=800&q=85',
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&q=85',
      ];

      return {
        id: generateId('doc'),
        version: 1,
        name: '35mm 胶片暗房印相',
        canvas: {
          width: tw,
          height: th,
          unit: 'px',
          backgroundType: 'color',
          backgroundColor: '#FFFFFF',
          presetName: '暗房印相',
        },
        elements: [
          ...photos.map((src, i) => {
            const col = i % 2;
            const row = Math.floor(i / 2);
            return {
              id: generateId('img'),
              type: 'image' as const,
              name: `Negative Frame 0${i + 1}`,
              x: pad + col * (colW + gap),
              y: Math.round(th * 0.12) + row * (rowH + gap),
              width: colW,
              height: rowH,
              rotation: 0,
              opacity: 1,
              zIndex: i + 1,
              locked: false,
              visible: true,
              src,
              originalWidth: 800,
              originalHeight: 800,
              fit: 'cover' as const,
              borderRadius: 1,
              filters: { grayscale: 1, contrast: 15 },
            };
          }),
        ],
      };
    },
  },

  {
    id: 'nine-grid-archive',
    name: 'Editorial 9-Grid • 九宫格灵感板 (9 Photos)',
    category: 'Gallery',
    description: '3x3 纯净九宫格画廊，紧凑排布与灵感画板，高保真冲印',
    preview: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=600&auto=format&fit=crop&q=80',
    photoCount: 9,
    badge: '九宫格',
    createDocument: (tw = 1200, th = 1600, tbg = '#FFFFFF'): CollageDocument => {
      const pad = Math.round(tw * 0.04);
      const gap = Math.round(tw * 0.015);
      const cellW = Math.round((tw - pad * 2 - gap * 2) / 3);
      const cellH = Math.round((th * 0.86 - gap * 2) / 3);

      const photos = [
        'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&q=80',
        'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&q=80',
        'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=600&q=80',
        'https://images.unsplash.com/photo-1494526585095-c41746248156?w=600&q=80',
        'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&q=80',
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&q=80',
        'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600&q=80',
        'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600&q=80',
        'https://images.unsplash.com/photo-1544816155-12df9643f363?w=600&q=80',
      ];

      return {
        id: generateId('doc'),
        version: 1,
        name: '九宫格灵感板',
        canvas: {
          width: tw,
          height: th,
          unit: 'px',
          backgroundType: 'color',
          backgroundColor: '#FFFFFF',
          presetName: '九宫格',
        },
        elements: [
          ...photos.map((src, i) => {
            const col = i % 3;
            const row = Math.floor(i / 3);
            return {
              id: generateId('img'),
              type: 'image' as const,
              name: `Grid ${i + 1}`,
              x: pad + col * (cellW + gap),
              y: Math.round(th * 0.06) + row * (cellH + gap),
              width: cellW,
              height: cellH,
              rotation: 0,
              opacity: 1,
              zIndex: i + 1,
              locked: false,
              visible: true,
              src,
              originalWidth: 600,
              originalHeight: 600,
              fit: 'cover' as const,
              borderRadius: 2,
            };
          }),
        ],
      };
    },
  },

  // ==========================================
  // 5. 拍立得与复古相纸卡片 (POLAROID & POCKET PRINTS)
  // ==========================================
  {
    id: 'polaroid-pocket-card',
    name: 'Polaroid Classic • 拍立得口袋卡 (1 Photo)',
    category: 'Polaroid',
    description: '米家 3 寸口袋相纸专属，经典宽下巴白边相框与手写体日期',
    preview: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80',
    photoCount: 1,
    badge: '3寸口袋卡',
    createDocument: (tw = 1200, th = 1600, tbg = '#FFFFFF'): CollageDocument => {
      const s = Math.min(tw, th) / 1200;
      const frameW = Math.round(tw * 0.84);
      const frameH = Math.round(th * 0.86);
      const frameX = Math.round((tw - frameW) / 2);
      const frameY = Math.round((th - frameH) / 2);

      const innerPad = Math.round(frameW * 0.07);
      const photoW = frameW - innerPad * 2;
      const photoH = Math.round(photoW * 1.05);

      return {
        id: generateId('doc'),
        version: 1,
        name: '拍立得经典口袋卡',
        canvas: {
          width: tw,
          height: th,
          unit: 'px',
          backgroundType: 'color',
          backgroundColor: tbg,
          presetName: '米家 3寸',
        },
        elements: [
          {
            id: generateId('shp'),
            type: 'shape',
            name: 'Polaroid White Border',
            x: frameX,
            y: frameY,
            width: frameW,
            height: frameH,
            rotation: 0,
            opacity: 1,
            zIndex: 1,
            locked: false,
            visible: true,
            shapeType: 'rect',
            fill: '#FFFFFF',
            stroke: '#E5E2DA',
            strokeWidth: 1,
            borderRadius: 4,
          },
          {
            id: generateId('img'),
            type: 'image',
            name: 'Polaroid Photo',
            x: frameX + innerPad,
            y: frameY + innerPad,
            width: photoW,
            height: photoH,
            rotation: 0,
            opacity: 1,
            zIndex: 2,
            locked: false,
            visible: true,
            src: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=1800&auto=format&fit=crop&q=90',
            originalWidth: 1800,
            originalHeight: 1800,
            fit: 'cover',
            borderRadius: 2,
          },
          {
            id: generateId('txt'),
            type: 'text',
            name: 'Handwritten Note',
            x: frameX + innerPad,
            y: frameY + innerPad + photoH + Math.round(th * 0.02),
            width: photoW,
            height: Math.round(th * 0.08),
            rotation: -1,
            opacity: 0.9,
            zIndex: 3,
            locked: false,
            visible: true,
            text: 'Afternoon sun in Paris • 2026.08',
            fontFamily: '"Instrument Serif", serif',
            fontSize: Math.max(16, Math.round(26 * s)),
            fontWeight: 400,
            fontStyle: 'italic',
            letterSpacing: 2,
            lineHeight: 1.2,
            textAlign: 'center',
            color: '#2A2825',
          },
        ],
      };
    },
  },

  {
    id: 'polaroid-quad-pack',
    name: 'Polaroid Quad Pack • 四联拍立得 (4 Photos)',
    category: 'Polaroid',
    description: '单张米家 6 寸相纸冲印 4 张独立拍立得白边相框，带裁切线',
    preview: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=600&auto=format&fit=crop&q=80',
    photoCount: 4,
    badge: '四联拍立得',
    createDocument: (tw = 1200, th = 1600, tbg = '#FFFFFF'): CollageDocument => {
      const pad = Math.round(tw * 0.04);
      const gap = Math.round(tw * 0.03);
      const cardW = Math.round((tw - pad * 2 - gap) / 2);
      const cardH = Math.round((th - pad * 2 - gap) / 2);
      const innerPad = Math.round(cardW * 0.07);
      const photoW = cardW - innerPad * 2;
      const photoH = Math.round(photoW * 0.95);

      const photos = [
        'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&q=85',
        'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=85',
        'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=800&q=85',
        'https://images.unsplash.com/photo-1494526585095-c41746248156?w=800&q=85',
      ];

      const elements: CollageElement[] = [];

      photos.forEach((src, i) => {
        const col = i % 2;
        const row = Math.floor(i / 2);
        const cardX = pad + col * (cardW + gap);
        const cardY = pad + row * (cardH + gap);

        elements.push({
          id: generateId('shp'),
          type: 'shape',
          name: `Polaroid Frame 0${i + 1}`,
          x: cardX,
          y: cardY,
          width: cardW,
          height: cardH,
          rotation: 0,
          opacity: 1,
          zIndex: i * 3 + 1,
          locked: false,
          visible: true,
          shapeType: 'rect',
          fill: '#FFFFFF',
            stroke: '#E5E2DA',
            strokeWidth: 1,
          borderRadius: 3,
        });

        elements.push({
          id: generateId('img'),
          type: 'image',
          name: `Polaroid Photo 0${i + 1}`,
          x: cardX + innerPad,
          y: cardY + innerPad,
          width: photoW,
          height: photoH,
          rotation: 0,
          opacity: 1,
          zIndex: i * 3 + 2,
          locked: false,
          visible: true,
          src,
          originalWidth: 800,
          originalHeight: 800,
          fit: 'cover',
          borderRadius: 1,
        });

        elements.push({
          id: generateId('txt'),
          type: 'text',
          name: `Caption 0${i + 1}`,
          x: cardX + innerPad,
          y: cardY + innerPad + photoH + 6,
          width: photoW,
          height: 24,
          rotation: 0,
          opacity: 0.8,
          zIndex: i * 3 + 3,
          locked: false,
          visible: true,
          text: `DAYLIGHT • 0${i + 1}`,
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: 10,
          fontWeight: 600,
          fontStyle: 'normal',
          letterSpacing: 2,
          lineHeight: 1.2,
          textAlign: 'center',
          color: '#3A3632',
        });
      });

      return {
        id: generateId('doc'),
        version: 1,
        name: '四联拍立得相纸包',
        canvas: {
          width: tw,
          height: th,
          unit: 'px',
          backgroundType: 'color',
          backgroundColor: tbg,
          presetName: '米家 6寸',
        },
        elements,
      };
    },
  },

  {
    id: 'polaroid-six-pack',
    name: 'Mijia 6-Pack • 米家 6 联拍立得 (6 Photos)',
    category: 'Polaroid',
    description: '单张 6 寸相纸冲印 6 联微型拍立得，冲印后可沿虚线剪下即成 6 张手账卡',
    preview: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=600&auto=format&fit=crop&q=80',
    photoCount: 6,
    badge: '6联拍立得',
    createDocument: (tw = 1200, th = 1600, tbg = '#FFFFFF'): CollageDocument => {
      const pad = Math.round(tw * 0.03);
      const gap = Math.round(tw * 0.02);
      const cardW = Math.round((tw - pad * 2 - gap) / 2);
      const cardH = Math.round((th - pad * 2 - gap * 2) / 3);
      const innerPad = Math.round(cardW * 0.06);
      const photoW = cardW - innerPad * 2;
      const photoH = Math.round(photoW * 0.95);

      const photos = [
        'https://images.unsplash.com/photo-1544816155-12df9643f363?w=600&q=80',
        'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&q=80',
        'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&q=80',
        'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=600&q=80',
        'https://images.unsplash.com/photo-1494526585095-c41746248156?w=600&q=80',
        'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&q=80',
      ];

      const elements: CollageElement[] = [];

      photos.forEach((src, i) => {
        const col = i % 2;
        const row = Math.floor(i / 2);
        const cardX = pad + col * (cardW + gap);
        const cardY = pad + row * (cardH + gap);

        elements.push({
          id: generateId('shp'),
          type: 'shape',
          name: `Polaroid Frame 0${i + 1}`,
          x: cardX,
          y: cardY,
          width: cardW,
          height: cardH,
          rotation: 0,
          opacity: 1,
          zIndex: i * 3 + 1,
          locked: false,
          visible: true,
          shapeType: 'rect',
          fill: '#FFFFFF',
            stroke: '#E5E2DA',
            strokeWidth: 1,
          borderRadius: 2,
        });

        elements.push({
          id: generateId('img'),
          type: 'image',
          name: `Photo 0${i + 1}`,
          x: cardX + innerPad,
          y: cardY + innerPad,
          width: photoW,
          height: photoH,
          rotation: 0,
          opacity: 1,
          zIndex: i * 3 + 2,
          locked: false,
          visible: true,
          src,
          originalWidth: 600,
          originalHeight: 600,
          fit: 'cover',
          borderRadius: 1,
        });

        elements.push({
          id: generateId('txt'),
          type: 'text',
          name: `Label 0${i + 1}`,
          x: cardX + innerPad,
          y: cardY + innerPad + photoH + 4,
          width: photoW,
          height: 18,
          rotation: 0,
          opacity: 0.8,
          zIndex: i * 3 + 3,
          locked: false,
          visible: true,
          text: `SNAP 0${i + 1} // 2026`,
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: 9,
          fontWeight: 600,
          fontStyle: 'normal',
          letterSpacing: 1.5,
          lineHeight: 1.2,
          textAlign: 'center',
          color: '#3A3632',
        });
      });

      return {
        id: generateId('doc'),
        version: 1,
        name: '米家 6 联拍立得',
        canvas: {
          width: tw,
          height: th,
          unit: 'px',
          backgroundType: 'color',
          backgroundColor: tbg,
          presetName: '米家 6寸 6联',
        },
        elements,
      };
    },
  },

  // ==========================================
  // 6. 东方留白与极简侘寂 (MINIMALIST & ZEN)
  // ==========================================
  {
    id: 'zen-minimalist',
    name: 'ZEN Silence • 东方意境留白 (1 Photo)',
    category: 'Minimalist',
    description: '极宽留白、居中竖排思源宋体、朱红印章与自然意象',
    preview: 'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?w=600&auto=format&fit=crop&q=80',
    photoCount: 1,
    badge: '东方侘寂',
    createDocument: (tw = 1200, th = 1600, tbg = '#FFFFFF'): CollageDocument => {
      const s = Math.min(tw, th) / 1200;
      const imgW = Math.round(tw * 0.62);
      const imgH = Math.round(th * 0.52);
      const imgX = Math.round((tw - imgW) / 2);
      const imgY = Math.round(th * 0.16);

      return {
        id: generateId('doc'),
        version: 1,
        name: 'ZEN 东方意境留白',
        canvas: {
          width: tw,
          height: th,
          unit: 'px',
          backgroundType: 'color',
          backgroundColor: tbg,
          presetName: '东方意境',
        },
        elements: [
          {
            id: generateId('img'),
            type: 'image',
            name: 'Zen Landscape',
            x: imgX,
            y: imgY,
            width: imgW,
            height: imgH,
            rotation: 0,
            opacity: 1,
            zIndex: 1,
            locked: false,
            visible: true,
            src: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1800&auto=format&fit=crop&q=90',
            originalWidth: 1800,
            originalHeight: 1200,
            fit: 'cover',
            borderRadius: 2,
          },
          {
            id: generateId('txt'),
            type: 'text',
            name: 'Chinese Poetry Title',
            x: imgX,
            y: Math.round(th * 0.74),
            width: imgW,
            height: Math.round(th * 0.08),
            rotation: 0,
            opacity: 0.9,
            zIndex: 2,
            locked: false,
            visible: true,
            text: '天地有大美而不言',
            fontFamily: '"Noto Serif SC", serif',
            fontSize: Math.max(18, Math.round(28 * s)),
            fontWeight: 600,
            fontStyle: 'normal',
            letterSpacing: 12,
            lineHeight: 1.3,
            textAlign: 'center',
            color: '#1E1D1B',
          },
          {
            id: generateId('stk'),
            type: 'sticker',
            name: 'Vermilion Seal Stamp',
            x: Math.round(tw / 2 - 20),
            y: Math.round(th * 0.85),
            width: 40,
            height: 40,
            rotation: -3,
            opacity: 0.9,
            zIndex: 3,
            locked: false,
            visible: true,
            stickerType: 'date-stamp',
            label: 'MARGINLAB',
            color: '#B85444',
          },
        ],
      };
    },
  },

  {
    id: 'borderless-photo-print',
    name: 'Borderless Clean • 纯粹无界单幅 (1 Photo)',
    category: 'Minimalist',
    description: '100% 满版纯粹照片冲印，不添加任何多余元素，原画直出',
    preview: 'https://images.unsplash.com/photo-1500534623283-312aade485b7?w=600&auto=format&fit=crop&q=80',
    photoCount: 1,
    badge: '纯粹无界',
    createDocument: (tw = 1200, th = 1600, tbg = '#FFFFFF'): CollageDocument => {
      return {
        id: generateId('doc'),
        version: 1,
        name: '纯粹无界单幅冲印',
        canvas: {
          width: tw,
          height: th,
          unit: 'px',
          backgroundType: 'color',
          backgroundColor: '#FFFFFF',
          presetName: '无界直出',
        },
        elements: [
          {
            id: generateId('img'),
            type: 'image',
            name: 'Pure Fullbleed Photo',
            x: 0,
            y: 0,
            width: tw,
            height: th,
            rotation: 0,
            opacity: 1,
            zIndex: 1,
            locked: false,
            visible: true,
            src: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1800&auto=format&fit=crop&q=90',
            originalWidth: 1800,
            originalHeight: 2700,
            fit: 'cover',
            borderRadius: 0,
          },
        ],
      };
    },
  },
];


// ---------------------------------------------------------------------------
// Extended art-direction library: grid systems, brutalist posters, social
// covers, product stories and paper/print compositions.
// ---------------------------------------------------------------------------
const advancedTemplateConfigs = [
  {
    id: 'swiss-grid-poster', name: 'Swiss Grid System • 瑞士网格海报', category: 'Brutalist',
    description: '严格 12 栏网格、红色锚点与超大编号，适合建筑、品牌与展览视觉', preview: 'https://images.unsplash.com/photo-1487958449943-2429e8be8625?w=600&auto=format&fit=crop&q=80', photoCount: 1, badge: '12 栏网格',
    accent: '#E45745', bg: '#FFFFFF', title: 'GRID / 012', subtitle: 'FORM FOLLOWS FUNCTION\nA STUDY IN STRUCTURE', layout: 'swiss'
  },
  {
    id: 'brutalist-type-poster', name: 'Brutalist Type • 粗野主义字构', category: 'Brutalist',
    description: '黑白高反差、错位巨型字与警示色块，适合先锋活动和视觉实验', preview: 'https://images.unsplash.com/photo-1519608487953-e999c86e7455?w=600&auto=format&fit=crop&q=80', photoCount: 1, badge: '巨型字构',
    accent: '#D7FF3F', bg: '#FFFFFF', title: 'NO / RULES', subtitle: 'VISUAL RESEARCH\nISSUE 004 — 2026', layout: 'brutalist'
  },
  {
    id: 'bauhaus-color-study', name: 'Bauhaus Color Study • 包豪斯色彩', category: 'Brutalist',
    description: '基础几何与红黄蓝色块叠加摄影，形成平面设计感强的实验海报', preview: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&auto=format&fit=crop&q=80', photoCount: 1, badge: '几何色块',
    accent: '#D94B42', bg: '#FFFFFF', title: 'PRIMARY / FORM', subtitle: 'COLOR • SPACE • RHYTHM', layout: 'bauhaus'
  },
  {
    id: 'newspaper-column-editorial', name: 'Newspaper Columns • 报刊专栏', category: 'Editorial',
    description: '窄栏正文、报头、页码和图片注释，适合访谈、专题与作品说明页', preview: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=600&auto=format&fit=crop&q=80', photoCount: 2, badge: '报刊多栏',
    accent: '#202020', bg: '#FFFFFF', title: 'THE NEW\nVISUAL DIARY', subtitle: 'A FIELD GUIDE TO CONTEMPORARY IMAGE-MAKING', layout: 'newspaper'
  },
  {
    id: 'fashion-contact-editorial', name: 'Fashion Contact • 时装接触印样', category: 'Lookbook',
    description: '大图、接触印样与细线标签组合，适合系列 Lookbook 和拍摄提案', preview: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=600&auto=format&fit=crop&q=80', photoCount: 4, badge: '接触印样',
    accent: '#D0B08A', bg: '#FFFFFF', title: 'COLLECTION / 26', subtitle: 'CONTACT SHEET\nLOOK 01 — 04', layout: 'contact'
  },
  {
    id: 'portfolio-case-study', name: 'Case Study • 项目案例页', category: 'Gallery',
    description: '一张主视觉配三张细节图和项目元数据，适合设计作品集与品牌案例展示', preview: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=600&auto=format&fit=crop&q=80', photoCount: 4, badge: '案例展示',
    accent: '#7C6FF2', bg: '#FFFFFF', title: 'CASE STUDY\n/ 014', subtitle: 'SPACE, LIGHT & HUMAN SCALE', layout: 'case'
  },
  {
    id: 'split-screen-story', name: 'Split Screen Story • 分屏叙事', category: 'Gallery',
    description: '左右视觉对撞、中心细线标题和底部信息条，适合旅行、建筑及品牌故事', preview: 'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?w=600&auto=format&fit=crop&q=80', photoCount: 2, badge: '左右分屏',
    accent: '#F3B562', bg: '#FFFFFF', title: 'TWO / DIRECTIONS', subtitle: 'A VISUAL ESSAY IN CONTRAST', layout: 'split'
  },
  {
    id: 'film-festival-poster', name: 'Film Festival • 电影节海报', category: 'Full Bleed',
    description: '电影剧照、竖排片名、放映信息和底部节目单，适合影展与活动宣传', preview: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&auto=format&fit=crop&q=80', photoCount: 1, badge: '影展海报',
    accent: '#F0C36D', bg: '#FFFFFF', title: 'AFTER\nDARK', subtitle: 'INTERNATIONAL FILM SERIES\nFRI 24 — SUN 26 / 08', layout: 'film'
  },
  {
    id: 'record-sleeve-collage', name: 'Record Sleeve • 黑胶唱片封套', category: 'Minimalist',
    description: '方形封套、圆形唱片、目录编号与极简曲目列表，适合音乐与艺术项目', preview: 'https://images.unsplash.com/photo-1461360228754-6e81c478b882?w=600&auto=format&fit=crop&q=80', photoCount: 1, badge: '唱片封套',
    accent: '#C45A3D', bg: '#FFFFFF', title: 'SIDE A / B', subtitle: 'FIELD RECORDINGS\nVOL. 02 — 2026', layout: 'record'
  },
  {
    id: 'travel-postcard-grid', name: 'Travel Postcard • 旅行明信片', category: 'Polaroid',
    description: '邮戳、坐标、边框与三图明信片组合，兼具纪实感与高级旅行手记气质', preview: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600&auto=format&fit=crop&q=80', photoCount: 3, badge: '旅行手记',
    accent: '#268A85', bg: '#FFFFFF', title: 'POSTCARD\nFROM EVERYWHERE', subtitle: '35°41′N / 139°41′E', layout: 'postcard'
  },
  {
    id: 'botanical-specimen-sheet', name: 'Specimen Sheet • 植物标本图鉴', category: 'Minimalist',
    description: '自然摄影、编号、细线标注与博物图鉴式留白，适合植物和生活方式视觉', preview: 'https://images.unsplash.com/photo-1497250681960-ef046c08a56e?w=600&auto=format&fit=crop&q=80', photoCount: 3, badge: '博物图鉴',
    accent: '#5F7D55', bg: '#FFFFFF', title: 'HERBARIUM\nNOTES', subtitle: 'BOTANICAL ARCHIVE / PLATE 06', layout: 'specimen'
  },
  {
    id: 'mono-portfolio-index', name: 'Mono Index • 黑白作品索引', category: 'Gallery',
    description: '黑白照片九宫格、索引编号和精密线框，适合作品集目录与摄影档案', preview: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=600&auto=format&fit=crop&q=80', photoCount: 6, badge: '档案索引',
    accent: '#E6E0D3', bg: '#FFFFFF', title: 'INDEX / 006', subtitle: 'A MONOCHROME ARCHIVE', layout: 'index'
  },
  {
    id: 'social-carousel-cover', name: 'Carousel Cover • 社媒轮播首图', category: 'Full Bleed',
    description: '适合社交媒体轮播首图的超强标题层级，兼顾裁切安全区和品牌识别', preview: 'https://images.unsplash.com/photo-1524250502761-1ac6f2e30d43?w=600&auto=format&fit=crop&q=80', photoCount: 1, badge: '社媒首图',
    accent: '#FFFFFF', bg: '#FFFFFF', title: 'THE\nNEW EDIT', subtitle: 'A VISUAL GUIDE / 2026', layout: 'social'
  },
  {
    id: 'product-lookbook-grid', name: 'Product Lookbook • 产品画册', category: 'Lookbook',
    description: '产品大图、规格数字和小图组，适合家居、服装和生活方式品牌画册', preview: 'https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?w=600&auto=format&fit=crop&q=80', photoCount: 4, badge: '产品画册',
    accent: '#B7794B', bg: '#FFFFFF', title: 'OBJECTS\nOF USE', subtitle: 'FORM / MATERIAL / DETAIL', layout: 'product'
  },
  {
    id: 'quiet-luxury-cover', name: 'Quiet Luxury • 静奢封面', category: 'Editorial',
    description: '奶油色底、精致衬线字体与偏置人像，适合高级生活方式和精品品牌', preview: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=600&auto=format&fit=crop&q=80', photoCount: 1, badge: '静奢风格',
    accent: '#9B7653', bg: '#FFFFFF', title: 'THE ART\nOF LIVING', subtitle: 'A QUIET STUDY IN EVERYDAY BEAUTY', layout: 'quiet'
  },
  {
    id: 'data-visual-poster', name: 'Data Visual • 数据视觉海报', category: 'Brutalist',
    description: '大数字、进度线、图像窗口与信息层级，适合发布会、研究和科技视觉', preview: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&auto=format&fit=crop&q=80', photoCount: 2, badge: '数据图形',
    accent: '#6CF2C2', bg: '#FFFFFF', title: '98.4%', subtitle: 'SIGNALS / SYSTEMS / HUMAN\nANNUAL REPORT 2026', layout: 'data'
  },
  {
    id: 'zine-cutout-spread', name: 'Zine Cutout • 独立杂志拼贴', category: 'Editorial',
    description: '剪贴字、胶带、错位图片和手工注释，适合独立杂志、展览和青年文化主题', preview: 'https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?w=600&auto=format&fit=crop&q=80', photoCount: 3, badge: 'Zine 拼贴',
    accent: '#FF7043', bg: '#FFFFFF', title: 'MAKE\nSOMETHING', subtitle: 'NOTES FROM THE STUDIO / 08', layout: 'zine'
  },
  {
    id: 'architectural-blueprint', name: 'Blueprint • 建筑蓝图版式', category: 'Minimalist',
    description: '蓝图底色、精密标尺、轴线和建筑图片，适合空间、建筑与工程类项目', preview: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=600&auto=format&fit=crop&q=80', photoCount: 2, badge: '蓝图系统',
    accent: '#F3D36B', bg: '#FFFFFF', title: 'PLANS / 07', subtitle: 'A STUDY OF SPACE\nAND PROPORTION', layout: 'blueprint'
  },
  {
    id: 'wedding-invitation-suite', name: 'Invitation Suite • 婚礼邀请函', category: 'Minimalist',
    description: '高雅衬线、花卉摄影、日期与细边框，适合婚礼请柬和高级活动邀请', preview: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=600&auto=format&fit=crop&q=80', photoCount: 2, badge: '邀请函',
    accent: '#B78C75', bg: '#FFFFFF', title: 'ELENA\n& LUCA', subtitle: 'AN AUTUMN EVENING\n12 OCTOBER 2026', layout: 'invitation'
  },
  {
    id: 'album-tour-poster', name: 'Album Tour • 巡演宣传海报', category: 'Full Bleed',
    description: '大面积彩色摄影、巡演日期、强烈层级和票务信息，适合音乐活动传播', preview: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=600&auto=format&fit=crop&q=80', photoCount: 1, badge: '巡演海报',
    accent: '#FF5C8A', bg: '#FFFFFF', title: 'LIVE / 26', subtitle: 'TOKYO • SEOUL • SHANGHAI\nWORLD TOUR', layout: 'tour'
  },
  {
    id: 'museum-exhibition-label', name: 'Museum Label • 博物馆展签', category: 'Editorial',
    description: '作品图、展览信息、策展文字与编号体系，适合作品展示和展览导览', preview: 'https://images.unsplash.com/photo-1561214115-f2f134cc4912?w=600&auto=format&fit=crop&q=80', photoCount: 2, badge: '展览导览',
    accent: '#B92D2D', bg: '#FFFFFF', title: 'AFTER\nIMAGE', subtitle: 'CONTEMPORARY IMAGE / ROOM 04', layout: 'museum'
  },
] as const;

const advancedImageUrls = [
  'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1800&auto=format&fit=crop&q=90',
  'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1800&auto=format&fit=crop&q=90',
  'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1800&auto=format&fit=crop&q=90',
  'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=1800&auto=format&fit=crop&q=90',
  'https://images.unsplash.com/photo-1497250681960-ef046c08a56e?w=1800&auto=format&fit=crop&q=90',
  'https://images.unsplash.com/photo-1500534623283-312aade485b7?w=1800&auto=format&fit=crop&q=90',
  'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1800&auto=format&fit=crop&q=90',
  'https://images.unsplash.com/photo-1487958449943-2429e8be8625?w=1800&auto=format&fit=crop&q=90',
];

const advancedTemplateDocument = (config: (typeof advancedTemplateConfigs)[number], tw: number, th: number, tbg: string): CollageDocument => {
  const s = Math.min(tw, th) / 1200;
  const bg = tbg === '#FFFFFF' ? '#FFFFFF' : tbg;
  const margin = Math.round(Math.min(tw, th) * 0.06);
  const image = (index: number, x: number, y: number, width: number, height: number, zIndex = 1): CollageElement => ({
    id: generateId('img'), type: 'image', name: `Photo ${index + 1}`, x, y, width, height, rotation: 0, opacity: 1, zIndex, locked: false, visible: true,
    src: advancedImageUrls[index % advancedImageUrls.length], originalWidth: 1800, originalHeight: 1200, fit: 'cover', borderRadius: config.layout === 'quiet' ? Math.round(4 * s) : 0,
  });
  const text = (name: string, value: string, x: number, y: number, width: number, height: number, size: number, color: string = config.accent, extra: Partial<Extract<CollageElement, { type: 'text' }>> = {}): CollageElement => ({
    id: generateId('txt'), type: 'text', name, x, y, width, height, rotation: 0, opacity: 1, zIndex: 5, locked: false, visible: true,
    text: value, fontFamily: extra.fontFamily || (config.layout === 'brutalist' || config.layout === 'data' ? 'Space Grotesk, sans-serif' : 'Playfair Display, serif'), fontSize: Math.max(10, Math.round(size * s)), fontWeight: extra.fontWeight || 700, fontStyle: extra.fontStyle || 'normal', letterSpacing: extra.letterSpacing ?? 1, lineHeight: extra.lineHeight || 1.1, textAlign: extra.textAlign || 'left', color, ...extra,
  });
  const shape = (name: string, x: number, y: number, width: number, height: number, fill: string, zIndex = 2, radius = 0): CollageElement => ({
    id: generateId('shp'), type: 'shape', name, x, y, width, height, rotation: 0, opacity: 1, zIndex, locked: false, visible: true, shapeType: 'rect', fill, stroke: 'transparent', strokeWidth: 0, borderRadius: radius,
  });
  const line = (name: string, x: number, y: number, width: number, height: number, color: string = config.accent, zIndex = 4): CollageElement => ({
    id: generateId('shp'), type: 'shape', name, x, y, width, height, rotation: 0, opacity: 1, zIndex, locked: false, visible: true, shapeType: 'line', fill: color, stroke: color, strokeWidth: Math.max(1, Math.round(s * 2)),
  });
  const sticker = (name: string, x: number, y: number, width: number, height: number, stickerType: 'washi-tape' | 'date-stamp' | 'archival-tag' | 'film-strip' | 'grid-cross', label: string, color: string = config.accent): CollageElement => ({
    id: generateId('stk'), type: 'sticker', name, x, y, width, height, rotation: 0, opacity: 0.95, zIndex: 8, locked: false, visible: true, stickerType, label, color, accentColor: color,
  });
  const elements: CollageElement[] = [];
  const L = config.layout;
  if (L === 'swiss') {
    elements.push(image(0, margin * 2.1, Math.round(th * 0.27), tw - margin * 3.1, Math.round(th * 0.49)), shape('Red Anchor', margin, margin, Math.round(tw * 0.14), Math.round(th * 0.08), config.accent, 3), text('Index', '01', margin, margin + Math.round(th * 0.095), tw * .18, th * .06, 16, '#202020', { fontFamily: 'Space Grotesk, sans-serif', fontWeight: 500 }), text('Title', config.title, margin, Math.round(th * .06), tw * .9, th * .18, 72, '#202020', { fontFamily: 'Space Grotesk, sans-serif', fontWeight: 800 }), text('Subtitle', config.subtitle, margin, Math.round(th * .81), tw * .52, th * .1, 16, '#202020', { fontFamily: 'Space Grotesk, sans-serif', fontWeight: 500, lineHeight: 1.5 }), line('Rule', margin, Math.round(th * .79), tw - margin * 2, 2, '#202020'), sticker('Date', tw - margin * 2.3, margin, margin * 1.3, margin * .42, 'date-stamp', '08 / 26', config.accent));
  } else if (L === 'brutalist') {
    elements.push(image(0, Math.round(tw * .1), Math.round(th * .16), Math.round(tw * .8), Math.round(th * .56)), shape('Neon Block', Math.round(tw * .06), Math.round(th * .08), Math.round(tw * .42), Math.round(th * .25), config.accent, 3), text('Title', config.title, margin, Math.round(th * .05), tw * .9, th * .16, 78, '#111111', { fontFamily: 'Space Grotesk, sans-serif', fontWeight: 900, letterSpacing: -2 }), text('Subtitle', config.subtitle, margin, Math.round(th * .77), tw * .6, th * .1, 16, '#333333', { fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, lineHeight: 1.45 }), text('Corner', 'STUDIO / 26', tw - margin * 2.7, th - margin * 1.5, margin * 2.1, 40, 11, config.accent, { fontFamily: 'Space Grotesk, sans-serif', textAlign: 'right' }));
  } else if (L === 'bauhaus') {
    elements.push(image(0, Math.round(tw * .12), Math.round(th * .16), Math.round(tw * .68), Math.round(th * .56)), shape('Blue Circle', tw * .63, th * .08, tw * .23, tw * .23, '#3158A5', 3, tw * .12), shape('Yellow Bar', tw * .1, th * .74, tw * .62, th * .06, '#E6B943', 3), text('Title', config.title, tw * .08, th * .04, tw * .78, th * .13, 62, '#1D1D1D', { fontFamily: 'Space Grotesk, sans-serif', fontWeight: 800 }), text('Subtitle', config.subtitle, tw * .1, th * .84, tw * .8, th * .06, 15, '#1D1D1D', { fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, letterSpacing: 3 }));
  } else if (L === 'newspaper') {
    elements.push(image(0, margin, Math.round(th * .26), tw * .56, th * .42), image(1, tw * .68, Math.round(th * .26), tw * .25, th * .2), text('Masthead', config.title, margin, margin, tw * .9, th * .18, 55, '#202020', { fontFamily: 'Playfair Display, serif', fontWeight: 800 }), text('Deck', config.subtitle, tw * .68, th * .5, tw * .25, th * .1, 13, '#202020', { fontFamily: 'Space Grotesk, sans-serif', fontWeight: 500, lineHeight: 1.5 }), text('Body', 'A visual record of places, objects and the people who give them meaning.\n\nIssue 014 / Vol. 06', margin, th * .72, tw * .56, th * .13, 14, '#202020', { fontFamily: 'Space Grotesk, sans-serif', fontWeight: 400, lineHeight: 1.55 }), line('Column Rule', tw * .64, th * .25, 2, th * .53, '#202020'), sticker('Issue', tw - margin * 2.1, th - margin * 1.3, margin * 1.6, 26, 'archival-tag', 'NO. 014', '#202020'));
  } else if (L === 'contact') {
    elements.push(image(0, margin, margin, tw * .63, th * .62), image(1, tw * .75, margin, tw * .19, th * .18), image(2, tw * .75, th * .25, tw * .19, th * .18), image(3, tw * .75, th * .45, tw * .19, th * .18), text('Title', config.title, margin, th * .72, tw * .65, th * .1, 42, '#111111', { fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700 }), text('Subtitle', config.subtitle, margin, th * .84, tw * .7, th * .08, 14, '#8C6D4A', { fontFamily: 'Space Grotesk, sans-serif', fontWeight: 500, lineHeight: 1.35 }), sticker('Frame Code', tw * .75, th * .72, tw * .19, 30, 'film-strip', 'LOOK 01 — 04', config.accent));
  } else if (L === 'case') {
    elements.push(shape('Lavender Field', 0, 0, tw, th, '#FFFFFF', 0), image(0, margin, margin, tw - margin * 2, th * .42, 2), image(1, margin, th * .57, tw * .27, th * .18, 2), image(2, tw * .37, th * .57, tw * .27, th * .18, 2), image(3, tw * .68, th * .57, tw * .27, th * .18, 2), text('Title', config.title, margin, th * .08, tw * .6, th * .12, 52, '#211F2F', { fontFamily: 'Space Grotesk, sans-serif', fontWeight: 800 }), text('Subtitle', config.subtitle, margin, th * .78, tw * .7, th * .08, 14, '#211F2F', { fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, letterSpacing: 2 }), text('Meta', 'CLIENT / MARGINLAB\nYEAR / 2026\nROLE / ART DIRECTION', tw * .72, th * .8, tw * .22, th * .12, 10, '#211F2F', { fontFamily: 'Space Grotesk, sans-serif', fontWeight: 500, lineHeight: 1.5 }));
  } else if (L === 'split') {
    elements.push(image(0, 0, 0, tw * .5, th), image(1, tw * .5, 0, tw * .5, th), shape('Center Divider', tw * .5 - 1, 0, 2, th, '#F3B562', 5), text('Title', config.title, margin, th * .07, tw * .8, th * .12, 55, '#FFFFFF', { fontFamily: 'Space Grotesk, sans-serif', fontWeight: 800, textAlign: 'center' }), text('Subtitle', config.subtitle, tw * .14, th * .84, tw * .72, th * .07, 13, '#F3B562', { fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, textAlign: 'center', letterSpacing: 2 }));
  } else if (L === 'film') {
    elements.push(image(0, 0, 0, tw, th), shape('Dark Veil', 0, 0, tw, th, 'rgba(20,12,10,0.35)', 2), text('Title', config.title, margin, th * .16, tw * .55, th * .3, 82, '#FFF8E8', { fontFamily: 'Space Grotesk, sans-serif', fontWeight: 900, letterSpacing: 4 }), text('Subtitle', config.subtitle, margin, th * .8, tw * .8, th * .1, 13, '#F0C36D', { fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, lineHeight: 1.5 }), sticker('Festival', tw - margin * 2.2, margin, margin * 1.5, 34, 'date-stamp', 'FEST / 26', '#F0C36D'));
  } else if (L === 'record') {
    elements.push(shape('Sleeve', 0, 0, tw, th, '#FFFFFF', 0), image(0, margin, margin, tw - margin * 2, tw - margin * 2), shape('Record', tw * .52, th * .47, tw * .42, tw * .42, '#242424', 4, tw * .21), shape('Label', tw * .72, th * .67, tw * .1, tw * .1, config.accent, 5, tw * .05), text('Title', config.title, margin, th * .78, tw * .65, th * .1, 40, '#25211E', { fontFamily: 'Space Grotesk, sans-serif', fontWeight: 800 }), text('Subtitle', config.subtitle, tw * .65, th * .81, tw * .28, th * .1, 11, '#25211E', { fontFamily: 'Space Grotesk, sans-serif', fontWeight: 500, textAlign: 'right', lineHeight: 1.5 }));
  } else if (L === 'postcard') {
    elements.push(shape('Paper', 0, 0, tw, th, '#FFFFFF', 0), image(0, margin, margin, tw - margin * 2, th * .43), image(1, margin, th * .57, tw * .42, th * .2), image(2, tw * .54, th * .57, tw * .4, th * .2), text('Title', config.title, margin, th * .8, tw * .7, th * .1, 39, '#193B3B', { fontFamily: 'Playfair Display, serif', fontWeight: 700 }), text('Subtitle', config.subtitle, tw * .68, th * .81, tw * .25, th * .08, 11, config.accent, { fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, textAlign: 'right', lineHeight: 1.45 }), sticker('Postmark', tw * .79, margin, tw * .12, 42, 'date-stamp', 'AIR MAIL', config.accent));
  } else if (L === 'specimen') {
    elements.push(shape('Paper', 0, 0, tw, th, '#FFFFFF', 0), image(0, margin, th * .16, tw * .42, th * .54), image(1, tw * .56, th * .16, tw * .35, th * .24), image(2, tw * .56, th * .47, tw * .35, th * .23), text('Title', config.title, margin, margin, tw * .85, th * .11, 44, '#2D3B29', { fontFamily: 'Playfair Display, serif', fontWeight: 700 }), text('Label', config.subtitle, tw * .56, th * .77, tw * .35, th * .08, 12, '#2D3B29', { fontFamily: 'Space Grotesk, sans-serif', fontWeight: 500, lineHeight: 1.5 }), sticker('Plate', margin, th * .78, tw * .25, 32, 'archival-tag', 'PLATE 06', config.accent));
  } else if (L === 'index') {
    for (let i = 0; i < 6; i++) elements.push(image(i, margin + (i % 3) * tw * .3, th * .2 + Math.floor(i / 3) * th * .27, tw * .25, th * .21));
    elements.push(text('Title', config.title, margin, margin, tw * .6, th * .12, 48, '#111111', { fontFamily: 'Space Grotesk, sans-serif', fontWeight: 800 }), text('Subtitle', config.subtitle, tw * .63, margin, tw * .3, th * .1, 13, '#555555', { fontFamily: 'Space Grotesk, sans-serif', fontWeight: 500, textAlign: 'right' }), line('Bottom Rule', margin, th * .86, tw - margin * 2, 2, '#111111'), sticker('Index Tag', margin, th * .89, tw * .22, 30, 'archival-tag', 'ARCHIVE / 006', '#111111'));
  } else if (L === 'social') {
    elements.push(image(0, 0, 0, tw, th), shape('Purple Veil', 0, 0, tw, th, 'rgba(66,31,160,0.4)', 2), text('Title', config.title, margin, th * .16, tw * .83, th * .32, 96, '#FFFFFF', { fontFamily: 'Space Grotesk, sans-serif', fontWeight: 900, letterSpacing: -3 }), text('Subtitle', config.subtitle, margin, th * .78, tw * .8, th * .09, 15, '#FFFFFF', { fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, letterSpacing: 2 }), sticker('Carousel', tw - margin * 2, margin, margin * 1.2, 32, 'date-stamp', '01 / 08', '#FFFFFF'));
  } else if (L === 'product') {
    elements.push(shape('Warm Paper', 0, 0, tw, th, '#FFFFFF', 0), image(0, margin, margin, tw * .56, th * .46), image(1, tw * .69, margin, tw * .25, th * .2), image(2, tw * .69, th * .27, tw * .25, th * .2), image(3, margin, th * .58, tw * .25, th * .2), text('Title', config.title, tw * .37, th * .62, tw * .58, th * .16, 43, '#352A21', { fontFamily: 'Space Grotesk, sans-serif', fontWeight: 800 }), text('Subtitle', config.subtitle, tw * .37, th * .82, tw * .55, th * .08, 12, '#352A21', { fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, lineHeight: 1.5 }));
  } else if (L === 'quiet') {
    elements.push(shape('Cream', 0, 0, tw, th, '#FFFFFF', 0), image(0, tw * .16, th * .2, tw * .68, th * .53), text('Title', config.title, margin, margin, tw * .9, th * .14, 48, '#45382F', { fontFamily: 'Cormorant Garamond, serif', fontWeight: 600, textAlign: 'center', letterSpacing: 4 }), text('Subtitle', config.subtitle, margin, th * .8, tw * .9, th * .08, 12, '#45382F', { fontFamily: 'Space Grotesk, sans-serif', fontWeight: 500, textAlign: 'center', letterSpacing: 2 }), line('Quiet Rule', tw * .42, th * .76, tw * .16, 2, config.accent));
  } else if (L === 'data') {
    elements.push(shape('Navy', 0, 0, tw, th, '#FFFFFF', 0), image(0, margin, th * .23, tw * .57, th * .43), image(1, tw * .7, th * .23, tw * .22, th * .43), text('Title', config.title, margin, margin, tw * .9, th * .17, 78, '#111111', { fontFamily: 'Space Grotesk, sans-serif', fontWeight: 900, letterSpacing: -2 }), text('Subtitle', config.subtitle, margin, th * .74, tw * .8, th * .1, 13, '#047857', { fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, lineHeight: 1.5 }), line('Data Rule', margin, th * .7, tw * .75, 3, '#047857'), sticker('Data Tag', tw * .76, margin, tw * .16, 32, 'archival-tag', 'LIVE', '#047857'));
  } else if (L === 'zine') {
    elements.push(shape('Paper', 0, 0, tw, th, '#FFFFFF', 0), image(0, tw * .11, th * .19, tw * .52, th * .4, 2), image(1, tw * .55, th * .38, tw * .32, th * .34, 3), image(2, tw * .18, th * .67, tw * .28, th * .18, 2), shape('Orange Tab', tw * .07, th * .1, tw * .27, th * .08, config.accent, 4), text('Title', config.title, margin, margin, tw * .8, th * .16, 60, '#191919', { fontFamily: 'Space Grotesk, sans-serif', fontWeight: 900, letterSpacing: -2 }), text('Subtitle', config.subtitle, tw * .08, th * .87, tw * .75, th * .06, 12, '#191919', { fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, letterSpacing: 2 }), sticker('Tape', tw * .66, th * .08, tw * .2, 32, 'washi-tape', 'NOTES', '#E9A88D'));
  } else if (L === 'blueprint') {
    elements.push(shape('Blueprint', 0, 0, tw, th, '#FFFFFF', 0), image(0, margin, th * .23, tw * .58, th * .48), image(1, tw * .7, th * .23, tw * .2, th * .48), text('Title', config.title, margin, margin, tw * .6, th * .12, 50, '#1E3A8A', { fontFamily: 'Space Grotesk, sans-serif', fontWeight: 800 }), text('Subtitle', config.subtitle, margin, th * .78, tw * .8, th * .1, 13, '#1E3A8A', { fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, lineHeight: 1.5 }), line('Axis', tw * .65, margin, 2, th - margin * 2, '#1E3A8A'), line('Axis 2', margin, th * .18, tw - margin * 2, 2, '#1E3A8A'), sticker('Drawing', tw * .72, th * .8, tw * .18, 30, 'grid-cross', 'A—07', '#1E3A8A'));
  } else if (L === 'invitation') {
    elements.push(shape('Invite Paper', 0, 0, tw, th, '#FFFFFF', 0), image(0, margin, margin, tw - margin * 2, th * .38), image(1, tw * .69, th * .59, tw * .22, th * .2), text('Title', config.title, margin, th * .53, tw * .62, th * .18, 48, '#4E3E37', { fontFamily: 'Cormorant Garamond, serif', fontWeight: 600, textAlign: 'center' }), text('Subtitle', config.subtitle, margin, th * .82, tw * .62, th * .09, 12, '#4E3E37', { fontFamily: 'Space Grotesk, sans-serif', fontWeight: 500, textAlign: 'center', lineHeight: 1.5 }), line('Invite Rule', margin * 2, th * .78, tw * .52, 1, config.accent));
  } else if (L === 'tour') {
    elements.push(image(0, 0, 0, tw, th), shape('Tour Wash', 0, th * .58, tw, th * .42, 'rgba(36,16,52,0.85)', 2), text('Title', config.title, margin, th * .12, tw * .9, th * .2, 72, '#FFFFFF', { fontFamily: 'Space Grotesk, sans-serif', fontWeight: 900, textAlign: 'center', letterSpacing: 4 }), text('Subtitle', config.subtitle, margin, th * .72, tw * .9, th * .12, 15, '#FF9CBB', { fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, textAlign: 'center', lineHeight: 1.5 }), sticker('Tour Date', margin, th - margin * 1.5, tw * .22, 32, 'date-stamp', 'LIVE / 26', '#FF5C8A'));
  } else {
    elements.push(shape('Museum Paper', 0, 0, tw, th, '#FFFFFF', 0), image(0, margin, th * .2, tw * .56, th * .48), image(1, tw * .7, th * .2, tw * .2, th * .25), text('Title', config.title, margin, margin, tw * .8, th * .12, 54, '#202020', { fontFamily: 'Playfair Display, serif', fontWeight: 700 }), text('Subtitle', config.subtitle, tw * .7, th * .52, tw * .23, th * .11, 11, '#202020', { fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, lineHeight: 1.5 }), text('Curatorial Note', 'An image is never only an image.\nIt is evidence, atmosphere, and memory.', margin, th * .77, tw * .56, th * .1, 13, '#202020', { fontFamily: 'Space Grotesk, sans-serif', fontWeight: 400, lineHeight: 1.5 }), sticker('Museum Code', tw - margin * 2.2, th - margin * 1.3, tw * .16, 30, 'archival-tag', 'ROOM 04', config.accent));
  }
  return { id: generateId('doc'), version: 1, name: config.name.split('•')[0].trim(), canvas: { width: tw, height: th, unit: 'px', backgroundType: 'color', backgroundColor: bg, presetName: config.name }, elements, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
};

export const ADVANCED_TEMPLATES: TemplateDefinition[] = advancedTemplateConfigs.map((config) => ({
  ...config,
  createDocument: (targetW = 1200, targetH = 1600, targetBg = '#FFFFFF') => advancedTemplateDocument(config, targetW, targetH, targetBg),
}));

TEMPLATES.push(...ADVANCED_TEMPLATES);
