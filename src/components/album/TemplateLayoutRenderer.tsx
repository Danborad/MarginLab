import React, { useMemo, useRef, useState, useEffect } from "react";
import { AlbumPageSide } from "../../types/album";
import { TEMPLATES } from "../../lib/templates";
import { CollageElement, ImageElement, TextElement, ShapeElement, StickerElement } from "../../types/document";

interface TemplateLayoutRendererProps {
  page: AlbumPageSide;
  isLeft: boolean;
  pageNumber?: number;
}

export const TemplateLayoutRenderer: React.FC<TemplateLayoutRendererProps> = ({
  page,
  isLeft,
  pageNumber,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState<{ w: number; h: number }>({
    w: 360,
    h: 490,
  });

  const matchedTpl = useMemo(() => {
    return TEMPLATES.find((t) => t.id === page.templateId) || TEMPLATES[0];
  }, [page.templateId]);

  // 生成模板高定画卷文档 (1200 x 1600 标准印刷比例)
  const doc = useMemo(() => {
    try {
      return matchedTpl.createDocument(1200, 1600);
    } catch (e) {
      console.warn("Failed to create template document:", e);
      return TEMPLATES[0].createDocument(1200, 1600);
    }
  }, [matchedTpl]);

  // 监听容器实际尺寸，计算高保真矢量缩放比
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const updateSize = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setContainerSize({ w: rect.width, h: rect.height });
      }
    };

    updateSize();

    if (typeof ResizeObserver !== "undefined") {
      const ro = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const { width, height } = entry.contentRect;
          if (width > 0 && height > 0) {
            setContainerSize({ w: width, h: height });
          }
        }
      });
      ro.observe(el);
      return () => ro.disconnect();
    }
  }, []);

  const docW = doc.canvas?.width || 1200;
  const docH = doc.canvas?.height || 1600;
  const scaleX = containerSize.w / docW;
  const scaleY = containerSize.h / docH;

  // 整理图片槽位覆盖与标题替换
  const imageElements = useMemo(() => {
    return (doc.elements || []).filter((el) => el.type === "image");
  }, [doc]);

  // 渲染单个元素
  const renderElement = (el: CollageElement, idx: number) => {
    const key = el.id || `el_${idx}`;
    const transform = el.rotation ? `rotate(${el.rotation}deg)` : undefined;
    const opacity = el.opacity ?? 1;
    const zIndex = el.zIndex ?? idx + 1;

    // 1. 摄影画格 (Image Element)
    if (el.type === "image") {
      const imgEl = el as ImageElement;
      // 找到在所有图片元素中的槽位索引
      const slotIndex = imageElements.findIndex((img) => img.id === el.id);

      // 用户自定义照片优先：photos 数组 > 单图覆盖 > 模板默认精选素材
      let displaySrc = imgEl.src;
      if (page.photos && page.photos[slotIndex] && page.photos[slotIndex].trim()) {
        displaySrc = page.photos[slotIndex];
      } else if (
        slotIndex === 0 &&
        page.image &&
        page.image.trim() &&
        page.image !== matchedTpl.preview
      ) {
        displaySrc = page.image;
      }

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
            backgroundColor: "#F0EEE9",
          }}
        >
          <img
            src={displaySrc}
            alt={imgEl.name || ""}
            loading="eager"
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

    // 2. 杂志字号与手札 (Text Element)
    if (el.type === "text") {
      const txtEl = el as TextElement;
      let displayText = txtEl.text;

      // 如果用户在单页配置中输入了专属标题/副标/手札，智能替换模板中的对应位置
      const elName = (txtEl.name || "").toLowerCase();
      if (page.title && (elName.includes("title") || txtEl.fontSize >= 36)) {
        displayText = page.title;
      } else if (page.subtitle && (elName.includes("subtitle") || elName.includes("category"))) {
        displayText = page.subtitle;
      } else if (page.caption && elName.includes("caption")) {
        displayText = page.caption;
      } else if (page.bodyText && (elName.includes("body") || elName.includes("note") || elName.includes("curatorial"))) {
        displayText = page.bodyText;
      }

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
          {displayText}
        </div>
      );
    }

    // 3. 装饰构件与几何色块 (Shape Element)
    if (el.type === "shape") {
      const shpEl = el as ShapeElement;
      let borderRadius = `${shpEl.borderRadius || 0}px`;
      if (shpEl.shapeType === "circle") borderRadius = "50%";
      if (shpEl.shapeType === "pill") borderRadius = "9999px";

      const border =
        shpEl.strokeWidth && shpEl.strokeWidth > 0
          ? `${shpEl.strokeWidth}px ${shpEl.strokeDash ? "dashed" : "solid"} ${shpEl.stroke || "transparent"}`
          : undefined;

      // 线条特殊处理
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

    // 4. 纸胶带、档案标、印签 (Sticker Element)
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
              boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
            }}
          >
            {stkEl.label || "ARCHIVE № 2026"}
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
            {stkEl.label || "2026.08 • MARGINLAB"}
          </div>
        );
      }

      // 默认通透徽章
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
            backgroundColor: stkEl.color || "rgba(0,0,0,0.7)",
            color: stkEl.accentColor || "#FFFFFF",
            fontFamily: "Space Grotesk, sans-serif",
            fontSize: "10px",
            fontWeight: 700,
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
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden select-none"
      style={{
        backgroundColor: doc.canvas?.backgroundColor || "#FAF9F5",
      }}
    >
      {/* 1200 x 1600 画布等比矢量缩放容器 */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: `${docW}px`,
          height: `${docH}px`,
          transform: `scale(${scaleX}, ${scaleY})`,
          transformOrigin: "top left",
          pointerEvents: "none",
        }}
      >
        {doc.elements?.map(renderElement)}
      </div>

      {/* 底部微晶页码标 */}
      {pageNumber !== undefined && (
        <span
          className={`absolute bottom-2.5 ${
            isLeft ? "left-3" : "right-3"
          } text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded bg-black/40 backdrop-blur-md text-white/90 shadow-sm z-30 pointer-events-none`}
        >
          {pageNumber}
        </span>
      )}
    </div>
  );
};
