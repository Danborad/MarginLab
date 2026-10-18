import React, { useMemo, useRef, useState, useEffect } from "react";
import { TemplateDefinition } from "../../lib/templates";
import { CollageDocument, ImageElement, TextElement, ShapeElement, StickerElement } from "../../types/document";

interface TemplateThumbnailProps {
  template: TemplateDefinition;
  className?: string;
}

export const TemplateThumbnail: React.FC<TemplateThumbnailProps> = React.memo(({ template, className = "" }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState<number>(0.2);

  // 生成 600 x 800 标准 3:4 比例的轻量级模板文档
  const doc = useMemo<CollageDocument>(() => {
    try {
      return template.createDocument(600, 800);
    } catch (e) {
      console.warn("TemplateThumbnail error:", e);
      return {
        id: "doc-fallback",
        version: 1,
        name: template.name,
        canvas: {
          width: 600,
          height: 800,
          unit: "px",
          backgroundType: "color",
          backgroundColor: "#F8F6F0",
        },
        elements: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }
  }, [template]);

  // 根据当前卡片容器的实际像素宽度，动态计算 600x800 画布的缩放比例
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const updateScale = () => {
      const cw = el.clientWidth || 150;
      setScale(cw / 600);
    };

    updateScale();

    if (typeof ResizeObserver !== "undefined") {
      const ro = new ResizeObserver((entries) => {
        for (const entry of entries) {
          if (entry.contentRect.width > 0) {
            setScale(entry.contentRect.width / 600);
          }
        }
      });
      ro.observe(el);
      return () => ro.disconnect();
    }
  }, []);

  const canvasBg = doc.canvas?.backgroundColor || "#F8F6F0";

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full overflow-hidden select-none pointer-events-none bg-white ${className}`}
      style={{ backgroundColor: canvasBg }}
    >
      {/* 600 x 800 等比微缩视口 */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: "600px",
          height: "800px",
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}
      >
        {(doc.elements || []).map((el, idx) => {
          const key = el.id || `thumb_el_${idx}`;
          const transform = el.rotation ? `rotate(${el.rotation}deg)` : undefined;
          const opacity = el.opacity ?? 1;
          const zIndex = el.zIndex ?? idx + 1;

          // 1. 照片相框 (支持多图网格、拍立得、胶片与异形切片)
          if (el.type === "image") {
            const imgEl = el as ImageElement;
            let borderRadius = `${imgEl.borderRadius || 0}px`;
            if (imgEl.mask === "circle") borderRadius = "50%";
            if (imgEl.mask === "pill") borderRadius = "9999px";
            if (imgEl.mask === "arch") borderRadius = "9999px 9999px 0 0";

            const border =
              imgEl.borderWidth && imgEl.borderWidth > 0
                ? `${imgEl.borderWidth}px solid ${imgEl.borderColor || "#FFFFFF"}`
                : undefined;

            const boxShadow =
              imgEl.shadowBlur && imgEl.shadowBlur > 0
                ? `${imgEl.shadowOffsetX || 0}px ${imgEl.shadowOffsetY || 0}px ${imgEl.shadowBlur}px ${
                    imgEl.shadowColor || "rgba(0,0,0,0.18)"
                  }`
                : undefined;

            return (
              <div
                key={key}
                style={{
                  position: "absolute",
                  left: `${imgEl.x}px`,
                  top: `${imgEl.y}px`,
                  width: `${imgEl.width}px`,
                  height: `${imgEl.height}px`,
                  transform,
                  opacity,
                  zIndex,
                  borderRadius,
                  border,
                  boxShadow,
                  overflow: "hidden",
                  backgroundColor: "#E5E3DC",
                }}
              >
                <img
                  src={imgEl.src || template.preview}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: (imgEl.fit === "custom" ? "cover" : (imgEl.fit || "cover")) as React.CSSProperties["objectFit"],
                    display: "block",
                  }}
                />
              </div>
            );
          }

          // 2. 排版大字与文本
          if (el.type === "text") {
            const txtEl = el as TextElement;
            return (
              <div
                key={key}
                style={{
                  position: "absolute",
                  left: `${txtEl.x}px`,
                  top: `${txtEl.y}px`,
                  width: `${txtEl.width}px`,
                  height: `${txtEl.height}px`,
                  transform,
                  opacity,
                  zIndex,
                  fontFamily: txtEl.fontFamily || "Space Grotesk, sans-serif",
                  fontSize: `${txtEl.fontSize}px`,
                  fontWeight: txtEl.fontWeight || 400,
                  fontStyle: txtEl.fontStyle || "normal",
                  letterSpacing: txtEl.letterSpacing ? `${txtEl.letterSpacing}px` : undefined,
                  lineHeight: txtEl.lineHeight || 1.25,
                  textAlign: txtEl.textAlign || "left",
                  textTransform: txtEl.textTransform || "none",
                  color: txtEl.color || "#111111",
                  backgroundColor: txtEl.backgroundColor,
                  padding: txtEl.backgroundPadding ? `${txtEl.backgroundPadding}px` : undefined,
                  borderRadius: txtEl.backgroundRadius ? `${txtEl.backgroundRadius}px` : undefined,
                  whiteSpace: "pre-wrap",
                  overflow: "hidden",
                  wordBreak: "break-word",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                }}
              >
                {txtEl.text}
              </div>
            );
          }

          // 3. 几何色块、矩形底板与分割线
          if (el.type === "shape") {
            const shpEl = el as ShapeElement;
            let borderRadius = `${shpEl.borderRadius || 0}px`;
            if (shpEl.shapeType === "circle") borderRadius = "50%";
            if (shpEl.shapeType === "pill") borderRadius = "9999px";

            const border =
              shpEl.strokeWidth && shpEl.strokeWidth > 0
                ? `${shpEl.strokeWidth}px ${shpEl.strokeDash ? "dashed" : "solid"} ${shpEl.stroke || "transparent"}`
                : undefined;

            if (shpEl.shapeType === "line") {
              return (
                <div
                  key={key}
                  style={{
                    position: "absolute",
                    left: `${shpEl.x}px`,
                    top: `${shpEl.y}px`,
                    width: `${shpEl.width}px`,
                    height: `${Math.max(1, shpEl.height)}px`,
                    backgroundColor: shpEl.stroke || shpEl.fill || "#333",
                    transform,
                    opacity,
                    zIndex,
                  }}
                />
              );
            }

            return (
              <div
                key={key}
                style={{
                  position: "absolute",
                  left: `${shpEl.x}px`,
                  top: `${shpEl.y}px`,
                  width: `${shpEl.width}px`,
                  height: `${shpEl.height}px`,
                  transform,
                  opacity,
                  zIndex,
                  backgroundColor: shpEl.shapeType === "frame" ? "transparent" : shpEl.fill,
                  borderRadius,
                  border,
                  boxShadow:
                    shpEl.shadowBlur && shpEl.shadowBlur > 0
                      ? `${shpEl.shadowOffsetX || 0}px ${shpEl.shadowOffsetY || 0}px ${shpEl.shadowBlur}px ${
                          shpEl.shadowColor || "rgba(0,0,0,0.1)"
                        }`
                      : undefined,
                }}
              />
            );
          }

          // 4. 纸胶带、档案徽标与印签
          if (el.type === "sticker") {
            const stkEl = el as StickerElement;
            if (stkEl.stickerType === "washi-tape") {
              return (
                <div
                  key={key}
                  style={{
                    position: "absolute",
                    left: `${stkEl.x}px`,
                    top: `${stkEl.y}px`,
                    width: `${stkEl.width}px`,
                    height: `${stkEl.height}px`,
                    transform,
                    opacity: stkEl.opacity ?? 0.85,
                    zIndex,
                    backgroundColor: stkEl.color || "#E8DEC8",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.12)",
                    borderTop: "1px dashed rgba(255,255,255,0.6)",
                    borderBottom: "1px dashed rgba(0,0,0,0.1)",
                  }}
                />
              );
            }

            if (stkEl.stickerType === "archival-tag") {
              return (
                <div
                  key={key}
                  style={{
                    position: "absolute",
                    left: `${stkEl.x}px`,
                    top: `${stkEl.y}px`,
                    width: `${stkEl.width}px`,
                    height: `${stkEl.height}px`,
                    transform,
                    opacity,
                    zIndex,
                    backgroundColor: stkEl.color || "#1A1918",
                    border: `1px solid ${stkEl.accentColor || "#E5C49F"}`,
                    color: stkEl.accentColor || "#E5C49F",
                    fontFamily: "JetBrains Mono, monospace",
                    fontSize: `${Math.max(9, Math.min(13, stkEl.height * 0.35))}px`,
                    letterSpacing: "1.5px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "2px",
                    fontWeight: 700,
                  }}
                >
                  {stkEl.label || "ARCHIVE"}
                </div>
              );
            }

            if (stkEl.stickerType === "date-stamp") {
              return (
                <div
                  key={key}
                  style={{
                    position: "absolute",
                    left: `${stkEl.x}px`,
                    top: `${stkEl.y}px`,
                    width: `${stkEl.width}px`,
                    height: `${stkEl.height}px`,
                    transform,
                    opacity,
                    zIndex,
                    border: `1.5px dashed ${stkEl.color || "#B85444"}`,
                    color: stkEl.color || "#B85444",
                    fontFamily: "Space Grotesk, sans-serif",
                    fontSize: `${Math.max(10, Math.min(14, stkEl.height * 0.35))}px`,
                    fontWeight: 700,
                    letterSpacing: "1px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "4px",
                  }}
                >
                  {stkEl.label || "MARGINLAB"}
                </div>
              );
            }

            return null;
          }

          return null;
        })}
      </div>
    </div>
  );
});

TemplateThumbnail.displayName = "TemplateThumbnail";
