import os

code = '''import { CollageDocument, CollageElement } from '../types/document';
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
  // ==========================================
  // 1. 全屏满版与时尚大字海报 (FULL-BLEED & BOLD FASHION)
  // ==========================================
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
            text: 'THE NEW MODERNISM\\nARCHITECTURE OF SILENCE\\nAUTUMN / WINTER LOOKBOOK',
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
    createDocument: (tw = 1200, th = 1600, tbg = '#0F0E0E'): CollageDocument => {
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
            text: 'A PERSPECTIVE ON LIGHT\\nAND CONTEMPORARY FORM',
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
    createDocument: (tw = 1200, th = 1600, tbg = '#141416'): CollageDocument => {
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
    createDocument: (tw = 1200, th = 1600, tbg = '#FAF8F5'): CollageDocument => {
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
    createDocument: (tw = 1200, th = 1600, tbg = '#08080A'): CollageDocument => {
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
          backgroundColor: '#050507',
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
            color: '#E5C49F',
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
            color: '#C5C0B8',
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
    createDocument: (tw = 1200, th = 1600, tbg = '#0A0A0C'): CollageDocument => {
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
          backgroundColor: '#0A0A0C',
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
    createDocument: (tw = 1200, th = 1600, tbg = '#F6F4F0'): CollageDocument => {
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
    createDocument: (tw = 1200, th = 1600, tbg = '#FAF7F2'): CollageDocument => {
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
    createDocument: (tw = 1200, th = 1600, tbg = '#FDF9F6'): CollageDocument => {
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
            text: 'JULIAN & CLAIRE\\nFOREVER IN BLOOM',
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
    createDocument: (tw = 1200, th = 1600, tbg = '#141417'): CollageDocument => {
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
          backgroundColor: '#0F0F12',
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
            label: 'ATELIER',
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
    preview: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600&auto=format&fit=crop&q=80',
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
          backgroundColor: '#FAF9F6',
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
    preview: 'https://images.unsplash.com/photo-1508746829417-e6f548d8d6ed?w=600&auto=format&fit=crop&q=80',
    photoCount: 3,
    badge: '纵向三联',
    createDocument: (tw = 1200, th = 1600, tbg = '#111114'): CollageDocument => {
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
          backgroundColor: '#0C0C0E',
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
    createDocument: (tw = 1200, th = 1600, tbg = '#FAF8F5'): CollageDocument => {
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
    createDocument: (tw = 1200, th = 1600, tbg = '#000000'): CollageDocument => {
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
          backgroundColor: '#000000',
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
    preview: 'https://images.unsplash.com/photo-1494526585095-c41746248156?w=600&auto=format&fit=crop&q=80',
    photoCount: 5,
    badge: '电影五帧',
    createDocument: (tw = 1200, th = 1600, tbg = '#0C0C0E'): CollageDocument => {
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
          backgroundColor: '#0A0A0C',
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
    preview: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&auto=format&fit=crop&q=80',
    photoCount: 6,
    badge: '六图矩阵',
    createDocument: (tw = 1200, th = 1600, tbg = '#F4F2EE'): CollageDocument => {
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
    preview: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&auto=format&fit=crop&q=80',
    photoCount: 6,
    badge: '胶片印相',
    createDocument: (tw = 1200, th = 1600, tbg = '#0F0E0E'): CollageDocument => {
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
          backgroundColor: '#0A0A0C',
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
    preview: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=600&auto=format&fit=crop&q=80',
    photoCount: 9,
    badge: '九宫格',
    createDocument: (tw = 1200, th = 1600, tbg = '#FAF8F5'): CollageDocument => {
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
    preview: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=600&auto=format&fit=crop&q=80',
    photoCount: 1,
    badge: '3寸口袋卡',
    createDocument: (tw = 1200, th = 1600, tbg = '#ECE8E1'): CollageDocument => {
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
            fill: '#FFFDF9',
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
    preview: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&auto=format&fit=crop&q=80',
    photoCount: 4,
    badge: '四联拍立得',
    createDocument: (tw = 1200, th = 1600, tbg = '#ECE8E1'): CollageDocument => {
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
          fill: '#FFFDF9',
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
    preview: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=600&auto=format&fit=crop&q=80',
    photoCount: 6,
    badge: '6联拍立得',
    createDocument: (tw = 1200, th = 1600, tbg = '#ECE8E1'): CollageDocument => {
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
          fill: '#FFFDF9',
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
    preview: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600&auto=format&fit=crop&q=80',
    photoCount: 1,
    badge: '东方侘寂',
    createDocument: (tw = 1200, th = 1600, tbg = '#F6F4EF'): CollageDocument => {
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
            label: '艺境',
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
    preview: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600&auto=format&fit=crop&q=80',
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
'''

with open("src/lib/templates.ts", "w") as f:
    f.write(code)

print("Generated templates.ts successfully!")
