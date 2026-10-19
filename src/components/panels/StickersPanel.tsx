import React from 'react';
import { useEditorStore } from '../../store/useEditorStore';
import { Camera, Sparkles, Clock, Compass, Layers, Maximize2 } from 'lucide-react';
import { WatermarkStyle, ImageElement } from '../../types/document';

export const StickersPanel: React.FC = () => {
  const addElement = useEditorStore((s) => s.addElement);
  const elements = useEditorStore((s) => s.document.elements);
  const canvas = useEditorStore((s) => s.document.canvas);
  const setWatermarkModalOpen = useEditorStore((s) => s.setWatermarkModalOpen);
  const selectedIds = useEditorStore((s) => s.selectedIds);
  const updateElement = useEditorStore((s) => s.updateElement);
  const [defaultBgTheme, setDefaultBgTheme] = React.useState<'white' | 'transparent'>('white');

  const getNowFormatted = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    return `${y}.${m}.${d} ${hh}:${mm}:${ss}`;
  };

  const getDateOnlyFormatted = () => {
    const now = new Date();
    const y = String(now.getFullYear()).slice(-2);
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `'${y} ${m} ${d}`;
  };

  const watermarks: {
    title: string;
    subtitle: string;
    watermarkStyle: WatermarkStyle;
    device: string;
    params: string;
    location: string;
    bgTheme: 'white' | 'dark' | 'transparent';
    badge: string;
    badgeColor: string;
  }[] = [
    {
      title: '徕卡经典水印 (Leica Classic)',
      subtitle: '设备型号 · 经典徕卡红圆标 · 镜头参数 · 经纬坐标',
      watermarkStyle: 'leica',
      device: 'iPhone 13 Pro',
      params: '26mm f/1.5 1/24 ISO1000',
      location: '52°13′14″N 124°41′31″W',
      bgTheme: 'white',
      badge: 'Leica 红标',
      badgeColor: '#E4002B',
    },
    {
      title: '哈苏影像水印 (Hasselblad)',
      subtitle: '斜体 HASSELBLAD · 经典橙点 · 镜头光圈快门',
      watermarkStyle: 'hasselblad',
      device: 'OPPO Find X6 Pro',
      params: '144mm f/2.6 1/1108 ISO100',
      location: '',
      bgTheme: 'white',
      badge: '哈苏橙标',
      badgeColor: '#E65A28',
    },
    {
      title: '蔡司蓝标影像 (Zeiss Blue T*)',
      subtitle: '蔡司深蓝矩形标 · 红色 T* 镀膜 · 黄金人像焦段参数',
      watermarkStyle: 'zeiss',
      device: 'vivo X100 Ultra',
      params: '85mm f/2.57 1/250 ISO125',
      location: '',
      bgTheme: 'white',
      badge: 'ZEISS T*',
      badgeColor: '#002D72',
    },
    {
      title: '苹果摄影极简条 (Shot on iPhone)',
      subtitle: ' Shot on iPhone · 极简焦段光圈 · 拍摄日期',
      watermarkStyle: 'iphone',
      device: 'iPhone 16 Pro',
      params: '24mm • f/1.78 • 1/120s • ISO64',
      location: '',
      bgTheme: 'white',
      badge: 'Shot on iPhone',
      badgeColor: '#111827',
    },
    {
      title: '富士胶片模拟框 (Fujifilm Simulation)',
      subtitle: 'FUJIFILM 原厂模拟印 · Classic Chrome 胶片配方',
      watermarkStyle: 'fuji',
      device: 'X-T5',
      params: '35mm f/1.4 1/500 ISO160',
      location: 'CLASSIC CHROME • FILM SIMULATION',
      bgTheme: 'white',
      badge: 'FUJIFILM',
      badgeColor: '#047857',
    },
    {
      title: '复古胶片点阵日期戳 (Vintage Date)',
      subtitle: '80/90年代液晶点阵发光日期戳 · 经典橙金刻印',
      watermarkStyle: 'film-date',
      device: '',
      params: '',
      location: '',
      bgTheme: 'transparent',
      badge: '点阵日期戳',
      badgeColor: '#FF8A00',
    },
  ];

  const handleAddWatermark = (w: (typeof watermarks)[0]) => {
    const height = w.watermarkStyle === 'film-date' ? 48 : 76;
    let width = Math.min(canvas.width - 60, 1040);
    let x = Math.round((canvas.width - width) / 2);
    let y = Math.max(20, Math.round(canvas.height - height - 36));

    // 自动贴齐拼图照片两侧边界
    const imageElements = elements.filter(
      (el): el is ImageElement => el.type === 'image' && el.visible !== false && !!el.src
    );
    if (imageElements.length > 0) {
      let minX = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;
      for (const img of imageElements) {
        minX = Math.min(minX, img.x);
        maxX = Math.max(maxX, img.x + img.width);
        maxY = Math.max(maxY, img.y + img.height);
      }
      if (minX < maxX) {
        x = minX;
        width = maxX - minX;
        y = Math.min(maxY + 12, canvas.height - height - 10);
      }
    }

    const finalBgTheme = w.watermarkStyle === 'film-date' ? 'transparent' : defaultBgTheme;

    addElement({
      type: 'sticker',
      name: w.title,
      stickerType: 'camera-watermark',
      watermarkStyle: w.watermarkStyle,
      device: w.device,
      dateTime: w.watermarkStyle === 'film-date' ? getDateOnlyFormatted() : getNowFormatted(),
      params: w.params,
      location: w.location,
      bgTheme: finalBgTheme,
      showDevice: true,
      showDateTime: true,
      showParams: true,
      showLocation: w.watermarkStyle === 'leica' || w.watermarkStyle === 'fuji',
      showBrandLogo: true,
      paddingX: 0,
      x,
      y,
      width,
      height,
      rotation: 0,
      opacity: 1,
    });
  };

  return (
    <div className="p-4 space-y-4">
      <div className="pb-2 border-b border-studio-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Camera className="w-4 h-4 text-studio-accent" />
          <h2 className="text-xs font-semibold tracking-wider text-studio-text">
            相机与时间水印
          </h2>
        </div>
        <span className="text-[10px] text-studio-muted font-mono">手机厂商精选</span>
      </div>

      {/* 水印底色模式快捷选择 */}
      <div className="p-2.5 rounded-xl bg-studio-card border border-studio-border space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium text-studio-text">底色预设模式</span>
          <span className="text-[10px] text-studio-muted font-mono">
            {defaultBgTheme === 'white' ? '纯白 (无阴影无缝融合同色画布)' : '透明 (无底色透出底层)'}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={() => {
              setDefaultBgTheme('white');
              const activeId = selectedIds[0];
              if (activeId) {
                const sel = elements.find((el) => el.id === activeId);
                if (sel?.type === 'sticker' && ((sel as any).stickerType === 'camera-watermark' || (sel as any).watermarkStyle)) {
                  updateElement(activeId, { bgTheme: 'white' });
                }
              }
            }}
            className={`py-1.5 px-2 rounded-lg text-xs font-mono border transition-all flex items-center justify-center gap-1.5 ${
              defaultBgTheme === 'white'
                ? 'border-studio-accent bg-studio-accent/10 text-studio-accent font-semibold'
                : 'border-studio-border bg-studio-card text-studio-muted hover:text-studio-text'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-sm bg-white border border-gray-300 inline-block shrink-0 shadow-xs" />
            纯白背景 (默认)
          </button>
          <button
            type="button"
            onClick={() => {
              setDefaultBgTheme('transparent');
              const activeId = selectedIds[0];
              if (activeId) {
                const sel = elements.find((el) => el.id === activeId);
                if (sel?.type === 'sticker' && ((sel as any).stickerType === 'camera-watermark' || (sel as any).watermarkStyle)) {
                  updateElement(activeId, { bgTheme: 'transparent' });
                }
              }
            }}
            className={`py-1.5 px-2 rounded-lg text-xs font-mono border transition-all flex items-center justify-center gap-1.5 ${
              defaultBgTheme === 'transparent'
                ? 'border-studio-accent bg-studio-accent/10 text-studio-accent font-semibold'
                : 'border-studio-border bg-studio-card text-studio-muted hover:text-studio-text'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-sm border border-dashed border-gray-400 bg-transparent inline-block shrink-0" />
            透明背景
          </button>
        </div>
      </div>

      <div className="space-y-2.5">
        <span className="text-[11px] font-mono text-studio-muted uppercase tracking-wider block">
          点击添加水印至画布底部（支持双击编辑参数与时间）
        </span>

        <div className="space-y-2">
          {watermarks.map((w, idx) => (
            <div
              key={idx}
              onClick={() => handleAddWatermark(w)}
              className="p-3 rounded-xl border border-studio-border bg-studio-card hover:border-studio-accent cursor-pointer transition-all flex items-center justify-between group shadow-sm hover:shadow"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 text-white font-bold text-[9px] shadow-sm text-center px-0.5"
                  style={{ backgroundColor: w.badgeColor }}
                >
                  {w.badge}
                </div>
                <div className="min-w-0 pr-2">
                  <span className="text-xs font-medium text-studio-text group-hover:text-studio-accent transition-colors block truncate">
                    {w.title}
                  </span>
                  <span className="text-[10px] text-studio-muted block mt-0.5 truncate">
                    {w.subtitle}
                  </span>
                </div>
              </div>
              <span className="text-xs text-studio-accent opacity-0 group-hover:opacity-100 transition-opacity font-mono shrink-0">
                + 添加
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
