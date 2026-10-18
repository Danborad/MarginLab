import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateId(prefix = 'elem'): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;
}

export function clamp(val: number, min: number, max: number): number {
  return Math.min(Math.max(val, min), max);
}

export function round(val: number, decimals = 1): number {
  const factor = Math.pow(10, decimals);
  return Math.round(val * factor) / factor;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export function getImageDimensions(src: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = (err) => reject(err);
    img.src = src;
  });
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
}


import { CollageDocument } from "../types/document";

export async function generateCanvasThumbnail(doc: CollageDocument, maxDimension = 320): Promise<string> {
  if (typeof window === "undefined") return "";
  try {
    const { width, height } = doc.canvas;
    const ratio = Math.min(maxDimension / Math.max(width, 1), maxDimension / Math.max(height, 1));
    const canvasW = Math.max(40, Math.round(width * ratio));
    const canvasH = Math.max(40, Math.round(height * ratio));

    const offscreen = window.document.createElement("canvas");
    offscreen.width = canvasW;
    offscreen.height = canvasH;
    const ctx = offscreen.getContext("2d");
    if (!ctx) return "";

    ctx.fillStyle = doc.canvas.backgroundColor || "#FFFFFF";
    ctx.fillRect(0, 0, canvasW, canvasH);

    const scale = ratio;
    const sorted = [...doc.elements].sort((a, b) => a.zIndex - b.zIndex);

    for (const el of sorted) {
      if (!el.visible) continue;
      ctx.save();
      ctx.globalAlpha = el.opacity ?? 1;

      const renderX = el.x * scale;
      const renderY = el.y * scale;
      const renderW = el.width * scale;
      const renderH = el.height * scale;

      if (el.type === "image") {
        try {
          const img = new window.Image();
          img.crossOrigin = "anonymous";
          await new Promise<void>((res) => {
            img.onload = () => res();
            img.onerror = () => res();
            img.src = el.src;
          });

          if (img.complete && img.naturalWidth > 0) {
            const nw = img.naturalWidth || el.originalWidth || el.width;
            const nh = img.naturalHeight || el.originalHeight || el.height;
            let sx = 0, sy = 0, sw = nw, sh = nh;

            if (el.crop) {
              sx = Math.max(0, el.crop.x);
              sy = Math.max(0, el.crop.y);
              sw = Math.min(nw - sx, el.crop.width);
              sh = Math.min(nh - sy, el.crop.height);
            } else if (el.fit !== "contain") {
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

            ctx.drawImage(img, sx, sy, sw, sh, renderX, renderY, renderW, renderH);
          }
        } catch (e) {}
      } else if (el.type === "shape") {
        ctx.fillStyle = el.fill || "#333";
        ctx.fillRect(renderX, renderY, renderW, renderH);
      } else if (el.type === "text") {
        ctx.fillStyle = el.color || "#111";
        const fontSize = Math.max(6, Math.round(el.fontSize * scale));
        ctx.font = `${el.fontWeight || 600} ${fontSize}px sans-serif`;
        ctx.fillText((el.text || "").slice(0, 30), renderX, renderY + fontSize);
      }
      ctx.restore();
    }

    return offscreen.toDataURL("image/jpeg", 0.85);
  } catch (err) {
    return "";
  }
}

/**
 * 按来源推断图片真实后缀。
 * 下载文件名必须跟真实编码一致：PNG 数据被命名成 .jpg（或反过来）时，
 * 手机相册 / 米家 App 会直接报「不支持的格式」。
 */
export function imageExtFromUrl(src: string): 'jpg' | 'png' | 'webp' {
  const s = (src || '').trim();
  const dataMatch = s.match(/^data:image\/(png|jpe?g|webp)/i);
  const urlMatch = dataMatch ? null : s.match(/\.(png|jpe?g|webp)(?:[?#]|$)/i);
  const raw = (dataMatch?.[1] || urlMatch?.[1] || 'png').toLowerCase();
  if (raw === 'jpeg' || raw === 'jpg') return 'jpg';
  if (raw === 'webp') return 'webp';
  return 'png';
}
