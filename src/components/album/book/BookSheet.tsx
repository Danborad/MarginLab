import React from 'react';
import {
  BOARD_BOX,
  FaceBox,
  FaceSpec,
  PAPER_BOX,
  PAGE_TILT,
  SHEET_SEGMENTS,
  curlWeights,
  segmentAngles,
} from './bookModel';
import { FaceContent, FaceContext, isBoardFace } from './BookFaces';

/* 环境光方向（左上前方），与硬壳高光、桌面投影共用同一套光照 */
const LIGHT_X = -0.42;
const LIGHT_Z = 0.9075;

/* 硬壳叶里的内页：以硬壳为衬底，尺寸取硬壳盒（飘口位置由 y 决定） */
const PAPER_INSIDE_BOARD: FaceBox = {
  w: BOARD_BOX.w,
  h: BOARD_BOX.h,
  x: 0,
  y: BOARD_BOX.y,
};

/**
 * 一片飞页上的一个面。整个翻页过程中页面内容本身是不变的，
 * 用 memo 挡住逐帧重渲染 —— 每帧只更新几何，页面 DOM 一次都不重建。
 */
const SheetFace = React.memo<{
  spec: FaceSpec;
  side: 'left' | 'right';
  ctx: FaceContext;
  box: FaceBox;
  backed: boolean;
}>(({ spec, side, ctx, box, backed }) => (
  <FaceContent spec={spec} side={side} ctx={ctx} box={box} backed={backed} />
));
SheetFace.displayName = 'SheetFace';

export interface BookSheetProps {
  /** 基础翻转角（绕书脊旋转，0 → -180） */
  angle: number;
  /** 外缘相对书脊「慢半拍」的累积弯曲角（度） */
  bend: number;
  /** 硬壳叶（封面 / 封底）几乎不弯 */
  stiff: boolean;
  recto: FaceSpec | null;
  verso: FaceSpec | null;
  ctx: FaceContext;
}

/**
 * 飞行中的那一张叶（真正的柔软纸张曲面）。
 *
 * 物理建模：
 *   · 沿页面宽度切成 SHEET_SEGMENTS 段，每段挂在上一段的外缘并多转一个角度，
 *     于是纸面是一条连续折线弧——像被指尖带动、外缘先走、纸身跟着卷起的真纸；
 *   · 正面（recto）与背面（verso）共用一个曲面：正面朝观众时给出右半页内容，
 *     越过 90° 之后由背面接棒给出左半页内容，因此落页不会闪、不会跳；
 *   · 受光由「该处纸面法线 · 光源方向」逐段求解，并在段内做渐变，
 *     因此明暗是连续的，不会出现一条一条的色带。
 */
export const BookSheet: React.FC<BookSheetProps> = ({
  angle,
  bend,
  stiff,
  recto,
  verso,
  ctx,
}) => {
  const leafBox: FaceBox = stiff ? BOARD_BOX : PAPER_BOX;
  const W = leafBox.w;
  const H = leafBox.h;

  /* 面向纸张的那一面：硬壳叶上的内页需要以硬壳为衬底（飘口位置由 box.y 决定） */
  const boxFor = (spec: FaceSpec): FaceBox =>
    stiff ? (isBoardFace(spec) ? BOARD_BOX : PAPER_INSIDE_BOARD) : PAPER_BOX;

  /* ══════════════════════════════════════════════════════════════════
   * 1. 硬壳（封面 / 封底）：
   * 刚性整板，不分段、无接缝，绕书脊铰链整面旋转。
   * 彻底根除封面被切成 6 段导致的 5 道纵向细线裂缝。
   * ══════════════════════════════════════════════════════════════════ */
  if (stiff) {
    const aNorm = ((angle % 360) + 360) % 360;
    // aNorm 在 0~90 或 270~360 时正面朝向观众
    const showRecto = aNorm < 92 || aNorm > 268;
    const showVerso = aNorm > 88 && aNorm < 272;

    return (
      <div
        className="absolute pointer-events-none"
        style={{
          left: '50%',
          top: leafBox.y,
          width: W,
          height: H,
          transformOrigin: 'left center',
          transform: `translateZ(2.5px) rotateY(${angle}deg)`,
          transformStyle: 'preserve-3d',
          zIndex: 45,
        }}
      >
        {showRecto && recto && (
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: W,
              height: H,
              overflow: 'hidden',
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              borderRadius: isBoardFace(recto) ? '3px 14px 14px 3px' : undefined,
            }}
          >
            <SheetFace
              spec={recto}
              side="right"
              ctx={ctx}
              box={boxFor(recto)}
              backed={!isBoardFace(recto)}
            />
          </div>
        )}
        {showVerso && verso && (
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: W,
              height: H,
              overflow: 'hidden',
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
              transformOrigin: 'center center',
              borderRadius: isBoardFace(verso) ? '14px 3px 3px 14px' : undefined,
            }}
          >
            <SheetFace
              spec={verso}
              side="left"
              ctx={ctx}
              box={boxFor(verso)}
              backed={!isBoardFace(verso)}
            />
          </div>
        )}
      </div>
    );
  }

  /* ══════════════════════════════════════════════════════════════════
   * 2. 内页（艺术相纸）：
   * 柔性曲面分段模拟，段间微重叠 1.2px 配合相纸底色承托，
   * 消除 Chrome 3D 次像素光栅化缝隙与纵向细线。
   * ══════════════════════════════════════════════════════════════════ */
  const segW = W / SHEET_SEGMENTS;
  // 段间重叠量：在 3D 旋转下遮盖次像素缝隙，防止底色或背景穿透
  const OVERLAP = 1.2;

  /* 每段边界处的累积角：segAngles[k] → segAngles[k+1] 为第 k 段的左/右缘 */
  const segAngles = segmentAngles(angle, bend, stiff);
  const weights = curlWeights(stiff);

  /* 翻页进度（用于让受光脊线随纸张流动） */
  const span = 180 - PAGE_TILT * 2;
  const p = Math.max(0, Math.min(1, (Math.abs(angle) - PAGE_TILT) / span));

  /* 逐点受光：法线 (sinθ, 0, cosθ) 与光线方向点乘 */
  const shadeAt = (deg: number, face: 'recto' | 'verso'): number => {
    const r = (deg * Math.PI) / 180;
    const dot = Math.sin(r) * LIGHT_X + Math.cos(r) * LIGHT_Z;
    const facing = face === 'recto' ? dot : -dot;
    const k = face === 'recto' ? 0.22 : 0.27;
    return Math.min(0.30, Math.max(0, 1 - Math.max(0, facing)) * k);
  };

  /* 纸面受光脊线：翻到中段最亮，两端自动收敛为零 */
  const sheenAmp = stiff ? 0 : Math.sin(Math.PI * p) * 0.085;
  const sheenAt = (uNorm: number): number => {
    if (sheenAmp <= 0.001) return 0;
    const d = (uNorm - 0.56) / 0.22;
    return sheenAmp * Math.exp(-0.5 * d * d);
  };

  /** 单个叶片分段（含正反两面） */
  const renderSegment = (k: number): React.ReactNode => {
    const x0 = k * segW;
    const aL = segAngles[k];
    const aR = segAngles[k + 1];
    /* 相对上一段多转的角度：外缘「先走」，纸身依次跟上（第 0 段由父级 rotateY(angle) 决定） */
    const dTheta = k === 0 ? 0 : -bend * weights[k - 1];
    const uL = x0 / W;
    const uR = (x0 + segW) / W;

    /*
     * 只画朝向镜头的那一面：
     * 段法线与视线同向（cos<90°）时看到正面，否则看到背面。
     * 这样每帧的 DOM / 光栅量直接减半，翻页不会因为纸面是「双份」而掉帧；
     * 贴近 90° 的临界段两面都画，交给 backfaceVisibility 决定，杜绝空洞。
     */
    const aMid = (aL + aR) / 2;
    const nearEdgeOn = Math.abs(Math.abs(aMid) - 90) < 2;
    const showRecto = !!recto && (nearEdgeOn || Math.abs(aMid) < 90);
    const showVerso = !!verso && (nearEdgeOn || Math.abs(aMid) >= 90);

    const faceWindow = (
      spec: FaceSpec,
      side: 'left' | 'right',
      mirrored: boolean
    ) => {
      /* 窗口尺寸增加 OVERLAP 避免段缝，镜像面用 rotateY(180) 让背面朝外 */
      const winW = k === SHEET_SEGMENTS - 1 ? segW : segW + OVERLAP;
      const shift = mirrored ? x0 + winW - W : -x0;
      const dark0 = shadeAt(aL, mirrored ? 'verso' : 'recto');
      const dark1 = shadeAt(aR, mirrored ? 'verso' : 'recto');
      const s0 = sheenAt(uL);
      const s1 = sheenAt(uR);
      /* 镜像后局部 x 轴翻转，渐变端点需要互换才能对应真实的平铺位置 */
      const stops = mirrored ? [dark1, dark0] : [dark0, dark1];
      const sheens = mirrored ? [s1, s0] : [s0, s1];

      return (
        <div
          key={(mirrored ? 'v' : 'r') + k}
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: winW,
            height: H,
            overflow: 'hidden',
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            backgroundColor: '#FAF8F5',
            ...(mirrored
              ? {
                  transform: 'rotateY(180deg)',
                  transformOrigin: 'center center',
                }
              : null),
          }}
        >
          {/* 该段的页面切片：整页内容平移到正确位置后由窗口裁切 */}
          <div
            style={{
              position: 'absolute',
              left: shift,
              top: 0,
              width: W,
              height: H,
              pointerEvents: 'none',
            }}
          >
            <SheetFace
              spec={spec}
              side={side}
              ctx={ctx}
              box={boxFor(spec)}
              backed={stiff && !isBoardFace(spec)}
            />
          </div>

          {/* 连续明暗：段内做渐变，跨段即无缝 */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `linear-gradient(to right, rgba(8,10,16,${stops[0].toFixed(
                4
              )}) 0%, rgba(8,10,16,${stops[1].toFixed(4)}) 100%)`,
            }}
          />

          {/* 纸面受光脊线（柔光流动，两端归零） */}
          {(sheens[0] > 0.001 || sheens[1] > 0.001) && (
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: `linear-gradient(to right, rgba(255,255,255,${sheens[0].toFixed(
                  4
                )}) 0%, rgba(255,255,255,${sheens[1].toFixed(4)}) 100%)`,
              }}
            />
          )}

          {/* 书口切边：最外一段露出的纸厚受光 */}
          {k === SHEET_SEGMENTS - 1 && (
            <div
              className="absolute inset-y-0 pointer-events-none"
              style={{
                [mirrored ? 'left' : 'right']: 0,
                width: 1.5,
                background: mirrored
                  ? 'linear-gradient(to right, rgba(255,255,255,0.30), rgba(255,255,255,0))'
                  : 'linear-gradient(to left, rgba(255,255,255,0.30), rgba(255,255,255,0))',
              }}
            />
          )}
        </div>
      );
    };

    return (
      <div
        key={'seg' + k}
        style={{
          position: 'absolute',
          left: k === 0 ? 0 : segW,
          top: 0,
          width: segW,
          height: H,
          transformOrigin: 'left center',
          transform: k === 0 ? undefined : `rotateY(${dTheta}deg)`,
          transformStyle: 'preserve-3d',
        }}
      >
        {showRecto && faceWindow(recto!, 'right', false)}
        {showVerso && faceWindow(verso!, 'left', true)}
        {k + 1 < SHEET_SEGMENTS && renderSegment(k + 1)}
      </div>
    );
  };

  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: '50%',
        top: leafBox.y,
        width: W,
        height: H,
        transformOrigin: 'left center',
        transform: `translateZ(2.5px) rotateY(${angle}deg)`,
        transformStyle: 'preserve-3d',
        zIndex: 45,
      }}
    >
      {renderSegment(0)}
    </div>
  );
};
