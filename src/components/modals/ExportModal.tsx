import React, { useState, useEffect } from 'react';
import { useEditorStore } from '../../store/useEditorStore';
import { jsPDF } from 'jspdf';
import {
  Download,
  X,
  Check,
  Sparkles,
  FileImage,
  FileText,
  Copy,
  Loader2,
  Printer,
  Maximize2,
} from 'lucide-react';
import { Button } from '../ui/Button';

interface PrintPaper {
  id: string;
  label: string;
  desc: string;
  widthMm: number;
  heightMm: number;
  fileTag: string;
}

/**
 * 冲印相纸尺寸（物理毫米）。像素尺寸在导出时按 DPI 现算：
 * 米家 6 寸 = 100 × 148 mm → 300 DPI 下 1181 × 1748 px。
 */
const PRINT_PAPERS: PrintPaper[] = [
  { id: 'mijia-6inch-v', label: '米家 6 寸竖版', desc: '100 × 148 mm', widthMm: 100, heightMm: 148, fileTag: 'mijia-6inch' },
  { id: 'mijia-6inch-h', label: '米家 6 寸横版', desc: '148 × 100 mm', widthMm: 148, heightMm: 100, fileTag: 'mijia-6inch-h' },
  { id: 'mijia-3inch', label: '米家 3 寸口袋', desc: '50 × 76 mm', widthMm: 50, heightMm: 76, fileTag: 'mijia-3inch' },
];

const PAPER_DPI_OPTIONS = [
  { dpi: 300, label: '300 DPI', desc: '相纸标准' },
  { dpi: 600, label: '600 DPI', desc: '超清冲印' },
];

export const ExportModal: React.FC = () => {
  const exportModalOpen = useEditorStore((s) => s.exportModalOpen);
  const setExportModalOpen = useEditorStore((s) => s.setExportModalOpen);
  const document = useEditorStore((s) => s.document);
  const currentUserId = useEditorStore((s) => s.currentUser?.id || 'default');

  const [format, setFormat] = useState<'png' | 'jpeg' | 'pdf'>('jpeg');
  const [scale, setScale] = useState<number>(3); // Default 3x for 300 DPI print ready
  const [quality, setQuality] = useState<number>(0.96);
  const [isTransparent, setIsTransparent] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  // 相纸导出：默认按米家 6 寸竖版（100 × 148 mm）出片，避免 3:4 画面被米家自动裁切
  const [paperId, setPaperId] = useState<string>('mijia-6inch-v');
  const [paperFit, setPaperFit] = useState<'contain' | 'cover'>('contain');
  const [paperDpi, setPaperDpi] = useState<number>(300);
  const [exportNote, setExportNote] = useState<string | null>(null);

  const activePaper = PRINT_PAPERS.find((p) => p.id === paperId) || null;
  const paperPixelSize = activePaper
    ? {
        width: Math.round((activePaper.widthMm / 25.4) * paperDpi),
        height: Math.round((activePaper.heightMm / 25.4) * paperDpi),
      }
    : null;
  // 「填满相纸」时会从画面里切掉多少（百分比），用于提示文案
  const coverCropPercent = (() => {
    if (!activePaper || !paperPixelSize) return 0;
    const s = Math.max(
      paperPixelSize.width / document.canvas.width,
      paperPixelSize.height / document.canvas.height
    );
    const drawnW = document.canvas.width * s;
    const drawnH = document.canvas.height * s;
    const cropX = Math.max(0, (drawnW - paperPixelSize.width) / drawnW);
    const cropY = Math.max(0, (drawnH - paperPixelSize.height) / drawnH);
    return Math.round(Math.max(cropX, cropY) * 100);
  })();

  // Generate preview when modal opens
  useEffect(() => {
    if (!exportModalOpen) {
      setPreviewUrl(null);
      return;
    }

    generatePreview();
  }, [exportModalOpen, format, isTransparent, paperId, paperFit, paperDpi]);

  const getCanvasDataUrl = async (pixelRatio: number): Promise<string> => {
    const { width, height } = document.canvas;
    const offscreenCanvas = window.document.createElement('canvas');
    offscreenCanvas.width = width * pixelRatio;
    offscreenCanvas.height = height * pixelRatio;
    const ctx = offscreenCanvas.getContext('2d');

    if (!ctx) throw new Error('Could not get 2d context');

    // Fill background
    if (!isTransparent || format === 'jpeg') {
      ctx.fillStyle = document.canvas.backgroundColor || '#FFFFFF';
      ctx.fillRect(0, 0, offscreenCanvas.width, offscreenCanvas.height);
    }

    // Draw elements sorted by zIndex
    const sorted = [...document.elements].sort((a, b) => a.zIndex - b.zIndex);

    for (const el of sorted) {
      if (!el.visible) continue;

      ctx.save();
      ctx.globalAlpha = el.opacity ?? 1;

      // Position & transform
      const centerX = (el.x + el.width / 2) * pixelRatio;
      const centerY = (el.y + el.height / 2) * pixelRatio;
      ctx.translate(centerX, centerY);
      ctx.rotate(((el.rotation || 0) * Math.PI) / 180);
      ctx.translate(-centerX, -centerY);

      const renderX = el.x * pixelRatio;
      const renderY = el.y * pixelRatio;
      const renderW = el.width * pixelRatio;
      const renderH = el.height * pixelRatio;

      if (el.type === 'image') {
        const img = new window.Image();
        img.crossOrigin = 'anonymous';
        await new Promise<void>((resolve) => {
          img.onload = () => resolve();
          img.onerror = () => resolve();
          img.src = el.src;
        });

        if (img.complete && img.naturalWidth > 0) {
          ctx.save();

          // Apply filters
          const filters = [];
          if (el.filters?.grayscale) filters.push('grayscale(' + el.filters.grayscale * 100 + '%)');
          if (el.filters?.sepia) filters.push('sepia(' + el.filters.sepia * 100 + '%)');
          if (el.filters?.contrast) filters.push('contrast(' + (100 + el.filters.contrast) + '%)');
          if (el.filters?.brightness) filters.push('brightness(' + (100 + el.filters.brightness * 100) + '%)');
          if (el.filters?.blur) filters.push('blur(' + el.filters.blur * pixelRatio + 'px)');
          if (filters.length > 0) {
            ctx.filter = filters.join(' ');
          }

          // Rounded corners clipping
          if (el.borderRadius && el.borderRadius > 0) {
            const r = el.borderRadius * pixelRatio;
            ctx.beginPath();
            ctx.roundRect(renderX, renderY, renderW, renderH, r);
            ctx.clip();
          }

          // Calculate source crop rectangle
          const nw = img.naturalWidth || el.originalWidth || el.width;
          const nh = img.naturalHeight || el.originalHeight || el.height;
          let sx = 0;
          let sy = 0;
          let sw = nw;
          let sh = nh;

          if (el.crop) {
            sx = Math.max(0, el.crop.x);
            sy = Math.max(0, el.crop.y);
            sw = Math.min(nw - sx, el.crop.width);
            sh = Math.min(nh - sy, el.crop.height);
          } else if (el.fit !== 'contain') {
            // Default Cover fit
            const aspectContainer = el.width / el.height;
            const aspectImage = nw / nh;
            if (aspectContainer > aspectImage) {
              sh = nw / aspectContainer;
              sy = (nh - sh) / 2;
            } else {
              sw = nh * aspectContainer;
              sx = (nw - sw) / 2;
            }
          }

          // Flip image if needed
          if (el.crop?.flipX || el.crop?.flipY) {
            ctx.save();
            ctx.translate(renderX + renderW / 2, renderY + renderH / 2);
            ctx.scale(el.crop.flipX ? -1 : 1, el.crop.flipY ? -1 : 1);
            ctx.drawImage(img, sx, sy, sw, sh, -renderW / 2, -renderH / 2, renderW, renderH);
            ctx.restore();
          } else {
            ctx.drawImage(img, sx, sy, sw, sh, renderX, renderY, renderW, renderH);
          }

          // Border overlay
          if (el.borderWidth && el.borderWidth > 0) {
            ctx.strokeStyle = el.borderColor || '#FFFFFF';
            ctx.lineWidth = el.borderWidth * pixelRatio * 2;
            ctx.strokeRect(renderX, renderY, renderW, renderH);
          }
          ctx.restore();
        }
      } else if (el.type === 'shape') {
        ctx.fillStyle = el.fill;
        ctx.strokeStyle = el.stroke;
        ctx.lineWidth = (el.strokeWidth || 0) * pixelRatio;

        if (el.shapeType === 'rect') {
          if (el.borderRadius && el.borderRadius > 0) {
            ctx.beginPath();
            ctx.roundRect(renderX, renderY, renderW, renderH, el.borderRadius * pixelRatio);
            ctx.fill();
            if (el.strokeWidth) ctx.stroke();
          } else {
            ctx.fillRect(renderX, renderY, renderW, renderH);
            if (el.strokeWidth) ctx.strokeRect(renderX, renderY, renderW, renderH);
          }
        } else if (el.shapeType === 'circle') {
          ctx.beginPath();
          ctx.arc(
            renderX + renderW / 2,
            renderY + renderH / 2,
            Math.min(renderW, renderH) / 2,
            0,
            Math.PI * 2
          );
          ctx.fill();
          if (el.strokeWidth) ctx.stroke();
        } else if (el.shapeType === 'line') {
          ctx.beginPath();
          if (el.width >= el.height) {
            ctx.moveTo(renderX, renderY + renderH / 2);
            ctx.lineTo(renderX + renderW, renderY + renderH / 2);
          } else {
            ctx.moveTo(renderX + renderW / 2, renderY);
            ctx.lineTo(renderX + renderW / 2, renderY + renderH);
          }
          ctx.stroke();
        }
      } else if (el.type === 'text') {
        ctx.fillStyle = el.color;
        const fontStyle = el.fontStyle === 'italic' ? 'italic ' : '';
        const fontWeight = el.fontWeight || 400;
        const fontSizePx = Math.round(el.fontSize * pixelRatio);
        ctx.font = fontStyle + fontWeight + ' ' + fontSizePx + 'px ' + el.fontFamily;
        ctx.textAlign = el.textAlign === 'center' ? 'center' : el.textAlign === 'right' ? 'right' : 'left';
        ctx.textBaseline = 'top';

        if (el.shadowBlur) {
          ctx.shadowColor = el.shadowColor || '#000000';
          ctx.shadowBlur = el.shadowBlur * pixelRatio;
          ctx.shadowOffsetY = (el.shadowOffsetY || 0) * pixelRatio;
        }

        const lines = (el.text || '').split(/\r?\n/);
        const lineHeightPx = fontSizePx * (el.lineHeight || 1.2);

        lines.forEach((line, lineIdx) => {
          const textX =
            el.textAlign === 'center'
              ? renderX + renderW / 2
              : el.textAlign === 'right'
              ? renderX + renderW
              : renderX;

          ctx.fillText(line, textX, renderY + lineIdx * lineHeightPx);
        });
      } else if (el.type === 'sticker') {
        ctx.fillStyle = el.color || '#1A1918';
        ctx.fillRect(renderX, renderY, renderW, renderH);
        if (el.label) {
          ctx.fillStyle = el.accentColor || '#E5C49F';
          ctx.font = '600 ' + Math.round(11 * pixelRatio) + 'px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(el.label, renderX + renderW / 2, renderY + renderH / 2);
        }
      }

      ctx.restore();
    }

    const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png';
    return offscreenCanvas.toDataURL(mimeType, quality);
  };

  const loadImageEl = (src: string) =>
    new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new window.Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('image load failed'));
      img.src = src;
    });

  const triggerDownload = (href: string, filename: string) => {
    const a = window.document.createElement('a');
    a.href = href;
    a.download = filename;
    window.document.body.appendChild(a);
    a.click();
    window.document.body.removeChild(a);
  };

  /**
   * 把整页画面铺进相纸画布。
   * contain = 完整不裁切（画面居中，四周留白）；cover = 填满相纸（四周轻微裁切）。
   */
  const renderPaperPng = async (
    paper: PrintPaper,
    fit: 'contain' | 'cover',
    dpi: number,
    supersample = 2
  ): Promise<{ dataUrl: string; width: number; height: number }> => {
    const { width: canvasW, height: canvasH } = document.canvas;
    const targetW = Math.max(64, Math.round((paper.widthMm / 25.4) * dpi));
    const targetH = Math.max(64, Math.round((paper.heightMm / 25.4) * dpi));
    const fitScale =
      fit === 'cover'
        ? Math.max(targetW / canvasW, targetH / canvasH)
        : Math.min(targetW / canvasW, targetH / canvasH);
    // 手机 Safari 单个 canvas 上限约 16.7MP，超了会直接导出空白
    const maxAreaScale = Math.sqrt((16 * 1024 * 1024) / (canvasW * canvasH));
    const renderScale = Math.max(1, Math.min(4, fitScale * supersample, maxAreaScale));

    const docUrl = await getCanvasDataUrl(renderScale);
    const img = await loadImageEl(docUrl);

    const out = window.document.createElement('canvas');
    out.width = targetW;
    out.height = targetH;
    const ctx = out.getContext('2d');
    if (!ctx) throw new Error('Could not get 2d context');

    // 相纸是白的：留白区域与画面里的白底连成一片，冲印后不会出现灰边
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, targetW, targetH);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    const drawW = canvasW * fitScale;
    const drawH = canvasH * fitScale;
    ctx.drawImage(img, (targetW - drawW) / 2, (targetH - drawH) / 2, drawW, drawH);

    return { dataUrl: out.toDataURL('image/png'), width: targetW, height: targetH };
  };

  /** 交给服务端重编码成标准冲印 JPEG（8 位 / sRGB / 无 ICC / 基线 / 带 DPI 密度） */
  const exportPrintJpeg = async (pngDataUrl: string, dpi: number): Promise<string> => {
    const res = await fetch('/api/print/export', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image: pngDataUrl,
        dpi,
        // 冲印 JPEG 用 92：视觉上与 96 无差别，文件体积小一半，米家 / 相册识别更稳
        quality: 92,
        userId: currentUserId,
      }),
    });
    const json = await res.json();
    if (!json?.success || !json.url) throw new Error(json?.message || '冲印导出失败');
    return json.url as string;
  };

  const generatePreview = async () => {
    setIsGenerating(true);
    try {
      if (activePaper) {
        const { dataUrl } = await renderPaperPng(activePaper, paperFit, 150, 1);
        setPreviewUrl(dataUrl);
      } else {
        const dataUrl = await getCanvasDataUrl(1);
        setPreviewUrl(dataUrl);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async () => {
    setIsGenerating(true);
    setExportNote(null);
    try {
      const baseName = document.name.toLowerCase().replace(/\s+/g, '-') || 'collage';

      // 1. 相纸冲印：画面按物理尺寸出片，像素 = mm ÷ 25.4 × DPI
      if (activePaper) {
        const { dataUrl, width, height } = await renderPaperPng(activePaper, paperFit, paperDpi);
        const filename = `${baseName}_${activePaper.fileTag}_${width}x${height}`;

        if (format === 'pdf') {
          const pdf = new jsPDF({
            orientation: activePaper.widthMm > activePaper.heightMm ? 'landscape' : 'portrait',
            unit: 'mm',
            format: [activePaper.widthMm, activePaper.heightMm],
          });
          pdf.addImage(dataUrl, 'PNG', 0, 0, activePaper.widthMm, activePaper.heightMm);
          pdf.save(filename + '.pdf');
          return;
        }

        if (format === 'png') {
          triggerDownload(dataUrl, filename + '.png');
          return;
        }

        try {
          const url = await exportPrintJpeg(dataUrl, paperDpi);
          triggerDownload(url, filename + '.jpg');
        } catch (err) {
          console.error('Print JPEG export failed:', err);
          setExportNote('冲印编码服务不可用，已改用图片直出。可换成 PNG 再打印。');
          triggerDownload(dataUrl, filename + '.png');
        }
        return;
      }

      // 2. 按当前画布原始比例导出
      const dataUrl = await getCanvasDataUrl(scale);
      const filename = `${baseName}_${scale}x`;

      if (format === 'pdf') {
        const { width, height } = document.canvas;
        const orientation = width > height ? 'landscape' : 'portrait';
        const pdf = new jsPDF({
          orientation: orientation as any,
          unit: 'px',
          format: [width, height],
        });
        pdf.addImage(dataUrl, 'PNG', 0, 0, width, height);
        pdf.save(filename + '.pdf');
        return;
      }

      if (format === 'png') {
        triggerDownload(dataUrl, filename + '.png');
        return;
      }

      try {
        const url = await exportPrintJpeg(dataUrl, 300);
        triggerDownload(url, filename + '.jpg');
      } catch (err) {
        console.error('Print JPEG export failed:', err);
        triggerDownload(dataUrl, filename + '.jpg');
      }
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyToClipboard = async () => {
    try {
      const dataUrl = await getCanvasDataUrl(scale);
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      await navigator.clipboard.write([
        new ClipboardItem({
          [blob.type]: blob,
        }),
      ]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Clipboard copy failed:', err);
    }
  };

  if (!exportModalOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex items-center justify-center p-4 select-none"
      onClick={() => setExportModalOpen(false)}
    >
      <div
        className="bg-studio-panel border border-studio-border rounded-2xl w-[95vw] max-w-3xl overflow-hidden shadow-soft-float flex flex-col max-h-[90vh] ring-1 ring-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 border-b border-studio-border flex items-center justify-between bg-studio-sidebar/60">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-studio-accent" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-studio-text">
              导出画作 • 高保真冲印打印渲染
            </h2>
          </div>
          <button
            id="close-export-modal-btn"
            onClick={() => setExportModalOpen(false)}
            className="p-1 rounded-lg text-studio-muted hover:text-studio-text hover:bg-studio-card transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto">
          {/* Left Preview */}
          <div className="flex flex-col items-center justify-center bg-studio-card/60 border border-studio-border rounded-xl p-4 min-h-[300px]">
            {isGenerating && !previewUrl ? (
              <div className="flex flex-col items-center gap-2 text-studio-muted text-xs">
                <Loader2 className="w-5 h-5 animate-spin text-studio-accent" />
                <span>正在高保真渲染...</span>
              </div>
            ) : previewUrl ? (
              <div className="relative max-h-[340px] max-w-full flex items-center justify-center overflow-hidden rounded shadow-lg">
                <img
                  src={previewUrl}
                  alt="Export Preview"
                  className="max-h-[320px] max-w-full object-contain rounded"
                />
              </div>
            ) : (
              <span className="text-xs text-studio-muted">生成预览失败</span>
            )}
            <div className="mt-3 text-[11px] font-mono text-studio-muted flex items-center gap-2">
              <Maximize2 className="w-3 h-3 text-studio-accent" />
              <span>
                {activePaper && paperPixelSize
                  ? `输出尺寸：${paperPixelSize.width} × ${paperPixelSize.height} px · ${activePaper.widthMm} × ${activePaper.heightMm} mm · ${paperDpi} DPI`
                  : `输出分辨率：${document.canvas.width * scale} × ${document.canvas.height * scale} px`}
              </span>
            </div>
          </div>

          {/* Right Export Settings */}
          <div className="space-y-4">
            {/* 导出尺寸：按相纸物理尺寸出片 */}
            <div className="space-y-2">
              <span className="text-[11px] font-mono text-studio-muted uppercase tracking-wider block">
                导出尺寸（相纸冲印）
              </span>
              <div className="grid grid-cols-2 gap-2">
                {PRINT_PAPERS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setPaperId(p.id)}
                    className={
                      'py-2 px-2 rounded-xl border flex flex-col items-start gap-0.5 transition-all text-left ' +
                      (paperId === p.id
                        ? 'border-studio-accent bg-studio-card text-studio-text ring-1 ring-studio-accent/30'
                        : 'border-studio-border bg-studio-card/40 text-studio-muted hover:text-studio-text hover:bg-studio-card')
                    }
                  >
                    <span className="text-xs font-medium">{p.label}</span>
                    <span className="text-[10px] font-mono opacity-70">{p.desc}</span>
                  </button>
                ))}
                <button
                  onClick={() => setPaperId('canvas')}
                  className={
                    'py-2 px-2 rounded-xl border flex flex-col items-start gap-0.5 transition-all text-left ' +
                    (paperId === 'canvas'
                      ? 'border-studio-accent bg-studio-card text-studio-text ring-1 ring-studio-accent/30'
                      : 'border-studio-border bg-studio-card/40 text-studio-muted hover:text-studio-text hover:bg-studio-card')
                  }
                >
                  <span className="text-xs font-medium">当前画布</span>
                  <span className="text-[10px] font-mono opacity-70">
                    {document.canvas.width} × {document.canvas.height} × {scale}x
                  </span>
                </button>
              </div>
            </div>

            {activePaper && (
              <div className="space-y-2">
                <span className="text-[11px] font-mono text-studio-muted uppercase tracking-wider block">
                  画面适配
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setPaperFit('contain')}
                    className={
                      'py-2 px-2 rounded-xl border flex flex-col items-start gap-0.5 transition-all text-left ' +
                      (paperFit === 'contain'
                        ? 'border-studio-accent bg-studio-card text-studio-text ring-1 ring-studio-accent/30'
                        : 'border-studio-border bg-studio-card/40 text-studio-muted hover:text-studio-text hover:bg-studio-card')
                    }
                  >
                    <span className="text-xs font-medium">完整不裁切</span>
                    <span className="text-[10px] opacity-70">整页保留，多出的地方留白</span>
                  </button>
                  <button
                    onClick={() => setPaperFit('cover')}
                    className={
                      'py-2 px-2 rounded-xl border flex flex-col items-start gap-0.5 transition-all text-left ' +
                      (paperFit === 'cover'
                        ? 'border-studio-accent bg-studio-card text-studio-text ring-1 ring-studio-accent/30'
                        : 'border-studio-border bg-studio-card/40 text-studio-muted hover:text-studio-text hover:bg-studio-card')
                    }
                  >
                    <span className="text-xs font-medium">填满相纸</span>
                    <span className="text-[10px] opacity-70">铺满整张纸，四周会切掉一点</span>
                  </button>
                </div>
              </div>
            )}

            {activePaper && (
              <div className="space-y-2">
                <span className="text-[11px] font-mono text-studio-muted uppercase tracking-wider block">
                  冲印清晰度
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {PAPER_DPI_OPTIONS.map((d) => (
                    <button
                      key={d.dpi}
                      onClick={() => setPaperDpi(d.dpi)}
                      className={
                        'py-2 px-2 rounded-lg border text-center transition-all ' +
                        (paperDpi === d.dpi
                          ? 'border-studio-accent bg-studio-card text-studio-accent ring-1 ring-studio-accent/30'
                          : 'border-studio-border bg-studio-card/40 text-studio-muted hover:text-studio-text')
                      }
                    >
                      <span className="text-xs font-mono font-bold">{d.label}</span>
                      <span className="block text-[10px] opacity-70">{d.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Format Selection */}
            <div className="space-y-2">
              <span className="text-[11px] font-mono text-studio-muted uppercase tracking-wider block">
                导出文件格式
              </span>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'jpeg', label: 'JPG (相纸冲印)', icon: FileImage },
                  { id: 'png', label: 'PNG (高清无损)', icon: FileImage },
                  { id: 'pdf', label: 'PDF (印刷画册)', icon: FileText },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setFormat(f.id as any)}
                    className={'py-2.5 px-2 rounded-xl border flex flex-col items-center gap-1 transition-all ' +
                      (format === f.id
                        ? 'border-studio-accent bg-studio-card text-studio-accent ring-1 ring-studio-accent/30 font-medium'
                        : 'border-studio-border bg-studio-card/40 text-studio-muted hover:text-studio-text hover:bg-studio-card')}
                  >
                    <f.icon className="w-4 h-4" />
                    <span className="text-xs">{f.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Resolution Multiplier (仅在按画布导出时生效) */}
            {!activePaper && (
              <div className="space-y-2">
                <span className="text-[11px] font-mono text-studio-muted uppercase tracking-wider block">
                  清晰度倍率
                </span>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { scale: 1, label: '1x (标清)' },
                    { scale: 2, label: '2x (超清)' },
                    { scale: 3, label: '3x (300 DPI)' },
                    { scale: 4, label: '4x (极清)' },
                  ].map((item) => (
                    <button
                      key={item.scale}
                      onClick={() => setScale(item.scale)}
                      className={'py-2 px-1 text-center rounded-lg border transition-all text-xs font-mono ' +
                        (scale === item.scale
                          ? 'border-studio-accent bg-studio-card text-studio-accent ring-1 ring-studio-accent/30 font-bold'
                          : 'border-studio-border bg-studio-card/40 text-studio-muted hover:text-studio-text')}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* PNG Transparent Background Option */}
            {format === 'png' && !activePaper && (
              <label className="flex items-center gap-2 text-xs text-studio-text cursor-pointer select-none pt-1">
                <input
                  type="checkbox"
                  checked={isTransparent}
                  onChange={(e) => setIsTransparent(e.target.checked)}
                  className="rounded border-studio-border accent-studio-accent w-4 h-4 cursor-pointer"
                />
                <span>透明背景导出 (适合独立拼贴 / 免抠图)</span>
              </label>
            )}

            {/* Mijia Printer Print Guide Tip */}
            <div className="p-3.5 rounded-xl border border-emerald-300/80 dark:border-emerald-700/50 bg-emerald-50/90 dark:bg-emerald-950/40 flex items-start gap-2.5 text-xs text-emerald-900 dark:text-emerald-200 shadow-sm">
              <Printer className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div className="leading-relaxed text-[11px]">
                <span className="font-bold text-emerald-950 dark:text-emerald-100 block mb-1 text-xs">
                  米家照片打印机冲印须知：
                </span>
                米家 6 寸相纸是{" "}
                <span className="font-mono font-bold">100 × 148 mm</span>（约 2:3 竖长），
                页面如果是 3:4，米家「无边框」会按相纸比例自动裁切掉约 {coverCropPercent}%，
                这就是打印出来被切边的原因。选{" "}
                <span className="font-bold">米家 6 寸竖版 + 完整不裁切</span>，
                导出的就是整张相纸尺寸，冲印不会被切。
                <span className="block mt-1 opacity-80">
                  JPG 由本站重编码成标准冲印 JPEG（8 位 / sRGB / 无色彩配置文件 / 基线编码 / 带 DPI 密度），
                  手机相册与米家 App 都能直接识别。
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-3 border-t border-studio-border space-y-2">
              {exportNote && (
                <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">{exportNote}</p>
              )}
              <Button
                id="export-download-btn"
                variant="accent"
                size="lg"
                onClick={handleDownload}
                disabled={isGenerating}
                className="w-full flex items-center justify-center gap-2 font-semibold"
              >
                {isGenerating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                <span>
                  立即下载 ({format.toUpperCase()} •{' '}
                  {activePaper && paperPixelSize
                    ? `${activePaper.label} ${paperPixelSize.width}×${paperPixelSize.height}`
                    : `${scale}x`}
                  )
                </span>
              </Button>

              <Button
                variant="secondary"
                size="md"
                onClick={handleCopyToClipboard}
                disabled={isGenerating}
                className="w-full flex items-center justify-center gap-2"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? '已复制高清画作到剪贴板！' : '复制到剪贴板'}</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
