import React, { useMemo } from "react";
import {
  BOARD_BOX,
  BOARD_T,
  FaceBox,
  PAGE_H,
  PAGE_TILT,
  PAGE_W,
  FaceSpec,
  Side,
  blockThickness,
} from "./bookModel";
import {
  FaceContent,
  FaceContext,
  faceBox,
  hingeStyle,
  COVER_THEMES,
  PaperFace,
} from "./BookFaces";

const OBLIQUE_X = 0.52;
const OBLIQUE_Y = 0.32;

// 精装相册硬壳固定向外微展尺寸 (px)，在整本书翻阅中保持绝对稳定，永不跳动
const FIXED_SHELL_SHIFT_X = 10;
const FIXED_SHELL_SHIFT_Z = 14;

/**
 * 真实精装硬壳底板 (HardShell)
 * 展开时作为最外层硬壳托底，合起时作为书籍背壳
 * 质感与封面风格 100% 呼应，且在翻页过程中保持绝对锚定，永不产生位置跳变
 */
const HardShell: React.FC<{
  side: Side;
  depth: number;
  theme: string;
  coverStyle?: string;
  fanShiftX?: number;
  fanShiftZ?: number;
}> = ({ side, depth, theme, coverStyle = "minimal", fanShiftX = 0, fanShiftZ = 0 }) => {
  const isLeft = side === "left";
  const dx = isLeft ? -OBLIQUE_X : OBLIQUE_X;
  const skin = COVER_THEMES[theme as keyof typeof COVER_THEMES] || COVER_THEMES.indigo;

  // 根据封面风格深度统一底板外观
  let shellBg = skin.bg;
  let shellBorder = skin.border;
  let headbandColor = "#A32020";

  if (coverStyle === "literary") {
    shellBg = "linear-gradient(140deg, #FAF7F2 0%, #F2EFE8 60%, #E8E4DA 100%)";
    shellBorder = "rgba(0,0,0,0.14)";
    headbandColor = "#A32020";
  } else if (coverStyle === "minimal") {
    shellBg = "linear-gradient(140deg, #F7F4EB 0%, #ECE7DB 60%, #DFD9CB 100%)";
    shellBorder = "rgba(0,0,0,0.10)";
    headbandColor = "#991B1B";
  } else if (coverStyle === "gallery") {
    shellBg = "linear-gradient(140deg, #1A1A1A 0%, #0F0F0F 60%, #050505 100%)";
    shellBorder = "rgba(226,186,110,0.30)";
    headbandColor = "#C5A059";
  } else if (coverStyle === "obi") {
    shellBg = "linear-gradient(140deg, #222226 0%, #17181C 60%, #0E0F12 100%)";
    shellBorder = "rgba(255,255,255,0.18)";
    headbandColor = "#C27D7D";
  }

  const totalX = dx * depth + fanShiftX;
  const totalZ = -(depth + fanShiftZ);

  return (
    <div
      className="absolute pointer-events-none"
      style={{
        ...hingeStyle(side, BOARD_BOX),
        background: shellBg,
        borderRadius: isLeft ? "14px 3px 3px 14px" : "3px 14px 14px 3px",
        boxShadow:
          "inset 0 0 0 1px " +
          shellBorder +
          (isLeft
            ? ", -10px 16px 36px rgba(0,0,0,0.45)"
            : ", 10px 16px 36px rgba(0,0,0,0.45)"),
        transform: `translate3d(${totalX}px, ${OBLIQUE_Y * depth}px, ${totalZ}px)`,
        transition: "transform 280ms cubic-bezier(0.16,1,0.3,1)",
      }}
    >
      {/* 堵头布由整体书脊中缝统一定位，底板专注作为硬壳托底 */}

      {/* 硬壳外缘立体反光 */}
      <div
        className="absolute inset-0"
        style={{
          borderRadius: "inherit",
          background: isLeft
            ? "linear-gradient(to right, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0) 24%, rgba(0,0,0,0.22) 100%)"
            : "linear-gradient(to left, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0) 24%, rgba(0,0,0,0.22) 100%)",
        }}
      />
    </div>
  );
};

/**
 * 纸芯侧边层叠 (Fore-edge Paper Block)
 * 模拟精装书书口的百张相纸侧切面纹理，随翻过张数真实增减厚度
 */
const PaperStackEdge: React.FC<{ side: Side; thickness: number }> = ({
  side,
  thickness,
}) => {
  if (thickness < 1.2) return null;
  const isLeft = side === "left";

  return (
    <div
      className="absolute pointer-events-none"
      style={{
        top: 1,
        bottom: 1,
        width: Math.max(3.5, thickness * 0.85),
        [isLeft ? "left" : "right"]: -Math.max(2, thickness * 0.55),
        transform: `translateZ(${-thickness * 0.45}px)`,
        background:
          "repeating-linear-gradient(to bottom, #FAF8F5 0px, #FAF8F5 1.5px, #E5E0D4 1.5px, #DBD4C5 2.5px)",
        boxShadow: isLeft
          ? "inset -1px 0 3px rgba(0,0,0,0.22), -2px 0 6px rgba(0,0,0,0.18)"
          : "inset 1px 0 3px rgba(0,0,0,0.22), 2px 0 6px rgba(0,0,0,0.18)",
        borderRadius: isLeft ? "2px 0 0 2px" : "0 2px 2px 0",
        opacity: 0.95,
      }}
    />
  );
};

/**
 * 紧邻下层的衬底页面 (Underlying Page Layer)
 * 紧贴在顶层活动页下方，提供平滑自然的纸张阴影衬底，永不发生突变位移
 */
const UnderPage: React.FC<{
  side: Side;
  spread: any;
  spreadIndex: number;
  ctx: FaceContext;
}> = React.memo(({ side, spread, spreadIndex, ctx }) => {
  const isLeft = side === "left";
  const pageNumber = isLeft ? spreadIndex * 2 + 1 : spreadIndex * 2 + 2;

  return (
    <div
      className="absolute pointer-events-none overflow-hidden"
      style={{
        width: PAGE_W,
        height: PAGE_H,
        top: 0,
        [isLeft ? "right" : "left"]: 0,
        transform: `translate3d(${isLeft ? -1.5 : 1.5}px, 0px, -2px)`,
        borderRadius: isLeft ? "3px 0 0 3px" : "0 3px 3px 0",
        boxShadow: isLeft
          ? "-2px 0 5px rgba(0,0,0,0.15)"
          : "2px 0 5px rgba(0,0,0,0.15)",
      }}
    >
      <PaperFace
        spread={spread}
        side={side}
        spreadIndex={spreadIndex}
        pageNumber={pageNumber}
        onPlaceholderClick={() => {}}
        interactive={false}
      />
      {/* 遮蔽柔影 */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: isLeft
            ? "linear-gradient(to right, rgba(0,0,0,0.08) 0%, transparent 80%)"
            : "linear-gradient(to left, rgba(0,0,0,0.08) 0%, transparent 80%)",
        }}
      />
    </div>
  );
});
UnderPage.displayName = "UnderPage";

export interface BookSideProps {
  side: Side;
  top: FaceSpec | null;
  papers: number;
  board: boolean;
  ctx: FaceContext;
  spreadIndex: number;
  isOpen: boolean;
}

export const BookSide: React.FC<BookSideProps> = ({
  side,
  top,
  papers,
  board,
  ctx,
  spreadIndex,
  isOpen,
}) => {
  if (!top) return null;

  const isLeft = side === "left";
  const bThick = blockThickness(papers);
  const depth = BOARD_T + bThick;
  const tilt = isLeft ? PAGE_TILT : -PAGE_TILT;
  const box: FaceBox = faceBox(top);
  const isPaperTop = top.kind === "paper";

  /* 
   * 稳固的底层衬页：
   * 仅渲染紧挨着当前页下方的 1 张紧邻页，绝不搞 5 层跨步阶梯，彻底杜绝翻页过程中的页面跳动！
   */
  const underSpreadItem = useMemo(() => {
    if (!isOpen || !isPaperTop) return null;
    const allSpreads = ctx.album.spreads || [];
    if (isLeft) {
      const prevIdx = spreadIndex - 1;
      if (prevIdx >= 0 && allSpreads[prevIdx]) {
        return { spread: allSpreads[prevIdx], spreadIndex: prevIdx };
      }
    } else {
      const nextIdx = spreadIndex + 1;
      if (nextIdx < allSpreads.length && allSpreads[nextIdx]) {
        return { spread: allSpreads[nextIdx], spreadIndex: nextIdx };
      }
    }
    return null;
  }, [isOpen, isPaperTop, isLeft, spreadIndex, ctx.album.spreads]);

  // 硬壳底板展开时向外稳定微展，数值在展开状态下恒定，绝不随页码增减跳动！
  const fanShiftX =
    isPaperTop && isOpen ? (isLeft ? -FIXED_SHELL_SHIFT_X : FIXED_SHELL_SHIFT_X) : 0;
  const fanShiftZ = isPaperTop && isOpen ? FIXED_SHELL_SHIFT_Z : 0;

  const coverStyle = ctx.album.coverConfig?.style || "minimal";

  return (
    <div
      className="absolute"
      style={{
        left: side === "right" ? "50%" : "auto",
        right: side === "left" ? "50%" : "auto",
        top: 0,
        width: PAGE_W,
        height: PAGE_H,
        transformOrigin: isLeft ? "right center" : "left center",
        transform: `rotateY(${tilt}deg)`,
        transformStyle: "preserve-3d",
      }}
    >
      {/* 底部硬壳背板 (严格在 Z 轴最底层，位置稳定，质感与封面统一) */}
      {board && (
        <HardShell
          side={side}
          depth={depth}
          theme={ctx.album.theme || "indigo"}
          coverStyle={coverStyle}
          fanShiftX={fanShiftX}
          fanShiftZ={fanShiftZ}
        />
      )}

      {/* 书口叠纸厚度切面 (平滑随真实纸量厚度缩放) */}
      {papers > 0 && <PaperStackEdge side={side} thickness={bThick} />}

      {/* 紧邻下层衬底页 (静态平整支撑，绝不横向瞬移) */}
      {underSpreadItem && (
        <UnderPage
          side={side}
          spread={underSpreadItem.spread}
          spreadIndex={underSpreadItem.spreadIndex}
          ctx={ctx}
        />
      )}

      {/* 顶层正在阅读的页面 (绝对在最上方，Z=0) */}
      <div
        className="absolute"
        style={{
          ...hingeStyle(side, box),
          borderRadius: isPaperTop
            ? isLeft
              ? "3px 0 0 3px"
              : "0 3px 3px 0"
            : undefined,
          boxShadow:
            isPaperTop && isOpen
              ? isLeft
                ? "-3px 1px 8px rgba(0,0,0,0.16), inset 1px 0 0 rgba(255,255,255,0.85)"
                : "3px 1px 8px rgba(0,0,0,0.16), inset -1px 0 0 rgba(255,255,255,0.85)"
              : undefined,
        }}
      >
        <FaceContent spec={top} side={side} ctx={ctx} box={box} />
      </div>
    </div>
  );
};
