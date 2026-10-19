import React, { useState, useEffect } from 'react';
import { useEditorStore } from '../../store/useEditorStore';
import { extractExifFromUrl } from '../../lib/exif';
import {
  X,
  Camera,
  Check,
  Clock,
  Sparkles,
  Sliders,
  Image as ImageIcon,
  MapPin,
  Maximize2,
  RefreshCw,
  Eye,
  EyeOff,
  Smartphone,
  ChevronRight,
} from 'lucide-react';
import { StickerElement, WatermarkStyle, ImageElement } from '../../types/document';

export const WatermarkEditModal: React.FC = () => {
  const watermarkModalOpen = useEditorStore((s) => s.watermarkModalOpen);
  const setWatermarkModalOpen = useEditorStore((s) => s.setWatermarkModalOpen);
  const elements = useEditorStore((s) => s.document.elements);
  const canvas = useEditorStore((s) => s.document.canvas);
  const selectedIds = useEditorStore((s) => s.selectedIds);
  const selectElements = useEditorStore((s) => s.selectElements);
  const updateElement = useEditorStore((s) => s.updateElement);

  const [loadingExifId, setLoadingExifId] = useState<string | null>(null);
  const [exifSuccessMsg, setExifSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    const handler = (e: any) => {
      const id = e?.detail?.elementId;
      if (id) selectElements([id]);
      setWatermarkModalOpen(true);
    };
    window.addEventListener('open-watermark-modal', handler);
    return () => window.removeEventListener('open-watermark-modal', handler);
  }, [selectElements, setWatermarkModalOpen]);

  useEffect(() => {
    if (!watermarkModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setWatermarkModalOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [watermarkModalOpen, setWatermarkModalOpen]);

  if (!watermarkModalOpen) return null;

  // Find target watermark element
  const selectedElement = elements.find(
    (el) => selectedIds.includes(el.id) && el.type === 'sticker'
  ) as StickerElement | undefined;

  const activeSticker =
    selectedElement ||
    (elements.find((el) => el.type === 'sticker') as StickerElement | undefined);

  const imageElements = elements.filter(
    (el): el is ImageElement => el.type === 'image' && el.visible !== false && !!el.src
  );

  const handleAlignGrid = () => {
    if (!activeSticker || imageElements.length === 0) return;
    let minX = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const img of imageElements) {
      minX = Math.min(minX, img.x);
      maxX = Math.max(maxX, img.x + img.width);
      maxY = Math.max(maxY, img.y + img.height);
    }
    if (minX < maxX) {
      updateElement(activeSticker.id, {
        x: minX,
        width: maxX - minX,
        paddingX: 0,
        y: Math.min(maxY + 12, canvas.height - activeSticker.height - 10),
      });
    }
  };

  const handleExtractExif = async (img: ImageElement) => {
    if (!activeSticker || !img.src) return;
    setLoadingExifId(img.id);
    setExifSuccessMsg(null);
    try {
      const data = await extractExifFromUrl(img.src);
      if (data && (data.device || data.dateTime || data.params)) {
        updateElement(activeSticker.id, {
          device: data.device || activeSticker.device,
          dateTime: data.dateTime || activeSticker.dateTime,
          params: data.params || activeSticker.params,
          location: data.location || activeSticker.location,
          watermarkStyle: data.watermarkStyle || activeSticker.watermarkStyle,
        });
        setExifSuccessMsg(
          `已成功提取: ${data.device || '相机'} (${data.params || '拍摄参数'})`
        );
      } else {
        setExifSuccessMsg('该照片未检测到 EXIF 元数据，已保留原参数');
      }
    } catch (e: any) {
      setExifSuccessMsg('EXIF 解析失败，请手动填写');
    } finally {
      setLoadingExifId(null);
    }
  };

  const showDevice = activeSticker?.showDevice ?? true;
  const showDateTime = activeSticker?.showDateTime ?? true;
  const showParams = activeSticker?.showParams ?? true;
  const showLocation =
    activeSticker?.showLocation ??
    (activeSticker?.watermarkStyle === 'leica' || activeSticker?.watermarkStyle === 'fuji');
  const showBrandLogo = activeSticker?.showBrandLogo ?? true;
  const paddingX = activeSticker?.paddingX ?? 0;

  return (
    <div
      onClick={() => setWatermarkModalOpen(false)}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col max-h-[90vh] overflow-hidden text-gray-800"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900">相机与时间水印设置</h3>
              <p className="text-xs text-gray-500">双侧严密对齐 · EXIF 照片读取 · 模块显示开关</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setWatermarkModalOpen(false)}
            className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!activeSticker ? (
          <div className="p-8 text-center text-gray-500 space-y-3">
            <p>画布当前没有相机水印元素。</p>
            <p className="text-xs text-gray-400">请在右侧「时间水印」面板中添加一个水印。</p>
          </div>
        ) : (
          <div className="p-6 overflow-y-auto space-y-6">
            {/* 1. 对齐与快捷动作 */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-blue-50/70 border border-blue-100 rounded-xl">
              <div>
                <span className="text-xs font-semibold text-blue-900 block">
                  📐 拼图两侧精准对齐
                </span>
                <span className="text-[11px] text-blue-700/80 block mt-0.5">
                  自动获取拼图网格左右边缘，将水印左文字与右标/参数严丝合缝贴齐照片两侧
                </span>
              </div>
              <button
                type="button"
                onClick={handleAlignGrid}
                className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-colors shadow-sm flex items-center gap-1.5 shrink-0"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                一键贴齐拼图两侧
              </button>
            </div>

            {/* 2. 从画布照片提取 EXIF */}
            {imageElements.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-900 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    从画布照片一键读取 EXIF (机型/时间/参数/地点)
                  </span>
                  <span className="text-[11px] text-gray-400 font-mono">
                    共 {imageElements.length} 张照片
                  </span>
                </div>

                <div className="flex gap-2.5 overflow-x-auto pb-1 pt-1 no-scrollbar">
                  {imageElements.map((img, i) => (
                    <button
                      key={img.id}
                      type="button"
                      disabled={loadingExifId === img.id}
                      onClick={() => handleExtractExif(img)}
                      className="flex items-center gap-2 p-1.5 pr-3 rounded-xl border border-gray-200 hover:border-gray-900 bg-gray-50/80 hover:bg-white text-left transition-all shrink-0 group shadow-2xs"
                    >
                      <img
                        src={img.src}
                        alt=""
                        className="w-10 h-10 object-cover rounded-lg bg-gray-200 shrink-0"
                      />
                      <div className="min-w-0 max-w-[110px]">
                        <span className="text-xs font-medium text-gray-800 block truncate group-hover:text-blue-600">
                          照片 #{i + 1}
                        </span>
                        <span className="text-[10px] text-gray-400 block truncate font-mono">
                          {loadingExifId === img.id ? '读取中...' : '点击读取参数'}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>

                {exifSuccessMsg && (
                  <div className="p-2.5 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-lg text-xs font-mono flex items-center gap-2 animate-fade-in">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="truncate">{exifSuccessMsg}</span>
                  </div>
                )}
              </div>
            )}

            {/* 3. 字段显示开关 (User Toggles) */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-gray-900 block">
                显示模块开关 (适合不同照片信息不一时自定义隐藏)
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  {
                    key: 'showDevice',
                    label: '设备机型',
                    desc: '如 Xiaomi 15 / iPhone',
                    val: showDevice,
                  },
                  {
                    key: 'showDateTime',
                    label: '拍摄时间',
                    desc: '日期与具体时分秒',
                    val: showDateTime,
                  },
                  {
                    key: 'showParams',
                    label: '镜头曝光参数',
                    desc: '焦段 / 光圈 / 快门 / ISO',
                    val: showParams,
                  },
                  {
                    key: 'showLocation',
                    label: '地点 / 经纬坐标',
                    desc: '城市或精确 GPS 经纬度',
                    val: showLocation,
                  },
                  {
                    key: 'showBrandLogo',
                    label: '品牌影像徽标',
                    desc: 'Leica 红标 / 哈苏橙点 / 蔡司标',
                    val: showBrandLogo,
                  },
                ].map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() =>
                      updateElement(activeSticker.id, {
                        [item.key]: !item.val,
                      })
                    }
                    className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                      item.val
                        ? 'border-gray-900 bg-gray-900 text-white shadow-xs'
                        : 'border-gray-200 bg-white text-gray-400 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xs font-medium">{item.label}</span>
                      {item.val ? (
                        <Eye className="w-3.5 h-3.5 text-white shrink-0" />
                      ) : (
                        <EyeOff className="w-3.5 h-3.5 text-gray-300 shrink-0" />
                      )}
                    </div>
                    <span
                      className={`text-[10px] mt-1 block truncate ${
                        item.val ? 'text-gray-300' : 'text-gray-400'
                      }`}
                    >
                      {item.desc}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* 4. 水印风格与底色 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-900">水印品牌风格</label>
                <select
                  value={activeSticker.watermarkStyle || 'leica'}
                  onChange={(e) =>
                    updateElement(activeSticker.id, {
                      watermarkStyle: e.target.value as WatermarkStyle,
                    })
                  }
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 transition-all"
                >
                  <option value="leica">徕卡经典红标 (Leica Classic)</option>
                  <option value="hasselblad">哈苏影像标 (Hasselblad Orange)</option>
                  <option value="zeiss">蔡司蓝标影像 (Zeiss Blue T*)</option>
                  <option value="iphone">苹果极简条 (Shot on iPhone)</option>
                  <option value="fuji">富士胶片模拟印 (Fujifilm Simulation)</option>
                  <option value="film-date">复古胶片点阵日期戳 (Vintage Date)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-900">底色卡纸模式</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: 'white', label: '纯白卡纸' },
                    { id: 'dark', label: '沉稳曜黑' },
                    { id: 'transparent', label: '透明底色' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() =>
                        updateElement(activeSticker.id, { bgTheme: t.id as any })
                      }
                      className={`py-2 px-1 text-center rounded-xl text-xs font-medium border transition-all ${
                        (activeSticker.bgTheme || 'white') === t.id
                          ? 'border-gray-900 bg-gray-900 text-white'
                          : 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 5. 边距与具体文本编辑 */}
            <div className="space-y-3 pt-2 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-gray-900">
                  两侧边缘内边距 (Padding)
                </label>
                <div className="flex gap-1.5">
                  {[
                    { val: 0, label: '0px 严密贴齐' },
                    { val: 16, label: '16px 留白' },
                    { val: 24, label: '24px 宽松' },
                  ].map((pad) => (
                    <button
                      key={pad.val}
                      type="button"
                      onClick={() => updateElement(activeSticker.id, { paddingX: pad.val })}
                      className={`px-2.5 py-1 text-xs rounded-lg border font-mono transition-all ${
                        paddingX === pad.val
                          ? 'bg-gray-900 text-white border-gray-900'
                          : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      {pad.label}
                    </button>
                  ))}
                </div>
              </div>
              {/* Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-gray-500">设备型号 (Device)</label>
                  <input
                    type="text"
                    value={activeSticker.device || ''}
                    onChange={(e) => updateElement(activeSticker.id, { device: e.target.value })}
                    placeholder="如 Xiaomi 15, iPhone 16 Pro"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-medium text-gray-500">拍摄时间 (Timestamp)</label>
                    <button
                      type="button"
                      onClick={() => {
                        const now = new Date();
                        const y = now.getFullYear();
                        const m = String(now.getMonth() + 1).padStart(2, '0');
                        const d = String(now.getDate()).padStart(2, '0');
                        const hh = String(now.getHours()).padStart(2, '0');
                        const mm = String(now.getMinutes()).padStart(2, '0');
                        const ss = String(now.getSeconds()).padStart(2, '0');
                        updateElement(activeSticker.id, {
                          dateTime: `${y}.${m}.${d} ${hh}:${mm}:${ss}`,
                        });
                      }}
                      className="text-[10px] text-blue-600 hover:underline font-mono"
                    >
                      当前时间
                    </button>
                  </div>
                  <input
                    type="text"
                    value={activeSticker.dateTime || ''}
                    onChange={(e) => updateElement(activeSticker.id, { dateTime: e.target.value })}
                    placeholder="YYYY.MM.DD HH:mm:ss"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-gray-500">
                    镜头曝光参数 (Lens & Exposure)
                  </label>
                  <input
                    type="text"
                    value={activeSticker.params || ''}
                    onChange={(e) => updateElement(activeSticker.id, { params: e.target.value })}
                    placeholder="如 21mm f/2.0 1/217s ISO50"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-gray-500">
                    地点或经纬度 (Location / GPS)
                  </label>
                  <input
                    type="text"
                    value={activeSticker.location || ''}
                    onChange={(e) => updateElement(activeSticker.id, { location: e.target.value })}
                    placeholder="如 31°54′18″N 117°21′34″E 或 巴黎"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 font-mono"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-gray-100 bg-gray-50 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-gray-400">
            提示：双击画布上的相机水印可随时呼出此弹窗
          </span>
          <button
            type="button"
            onClick={() => setWatermarkModalOpen(false)}
            className="px-5 py-2 bg-gray-900 hover:bg-black text-white text-xs font-medium rounded-xl transition-colors shadow-xs"
          >
            完成并返回
          </button>
        </div>
      </div>
    </div>
  );
};
