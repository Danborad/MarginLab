import React, { useMemo } from 'react';
import { Album } from '../../../types/album';
import { BookSide } from './BookSide';
import { BookSheet } from './BookSheet';
import { FaceContext } from './BookFaces';
import {
  BOOK_PITCH,
  CLOSED_YAW,
  PAGE_H,
  PAGE_W,
  PERSPECTIVE,
  TurnState,
  leftTopFace,
  isStiffLeaf,
  paperCount,
  rightTopFace,
  sheetAngle,
  sheetBend,
  sheetFaces,
  turnLeaf,
  foreEdgeRatio,
} from './bookModel';

export interface Photobook3DProps {
  album: Album;
  index: number;
  turn: TurnState | null;
  ctx: FaceContext;
}

/**
 * 3D 实体书舞台 (高保真物理装帧与平滑翻阅)。
 */
export const Photobook3D: React.FC<Photobook3DProps> = ({ album, index, turn, ctx }) => {
  const n = album.spreads.length;
  const min = turn ? Math.min(turn.from, turn.to) : index;
  const max = turn ? Math.max(turn.from, turn.to) : index;

  // 判断是否正在翻开/合上封面
  const isOpeningCover = !!(turn && turn.from === -1 && turn.to === 0);
  const isClosingCover = !!(turn && turn.from === 0 && turn.to === -1);

  /* 静止层：翻页过程中这两层不随帧变化，保持 memo 命中 */
  const leftFace = useMemo(() => leftTopFace(min, n), [min, n]);
  const rightFace = useMemo(() => rightTopFace(max, n), [max, n]);
  const leftPapers = useMemo(() => paperCount(min, n, 'left'), [min, n]);
  const rightPapers = useMemo(() => paperCount(max, n, 'right'), [max, n]);

  // 展开第一页时平滑就位，杜绝落页瞬间从无到有的突变跳闪
  const leftBoard = min >= 0 || (isOpeningCover && (turn?.progress ?? 0) > 0.3);
  const rightBoard = max <= n - 1 || (isClosingCover && (turn?.progress ?? 0) < 0.7);

  /* 飞行叶 */
  const flying = useMemo(() => {
    if (!turn) return null;
    const leaf = turnLeaf(turn.from, turn.to);
    return {
      stiff: isStiffLeaf(leaf, n),
      faces: sheetFaces(turn.from, turn.to, n),
    };
  }, [turn?.from, turn?.to, n]);

  const angle = turn ? sheetAngle(turn.progress, turn.kind) : 0;
  const bend = turn && flying ? sheetBend(turn.progress, turn.kind, flying.stiff) : 0;

  /* 整本书的姿态：封面/封底开合时整体位移与偏转，内页翻动时保持不动 */
  const posture = useMemo(() => {
    if (!turn) {
      if (index === -1) return { yaw: -CLOSED_YAW, shift: -PAGE_W / 2, open: 0 };
      if (index >= n) return { yaw: CLOSED_YAW, shift: PAGE_W / 2, open: 0 };
      return { yaw: 0, shift: 0, open: 1 };
    }
    const isCover = turn.from === -1 || turn.to === -1;
    const isBack = turn.from === n || turn.to === n;
    if (isCover || isBack) {
      const startedClosed = turn.from === -1 || turn.from === n;
      const closed = startedClosed ? 1 - turn.progress : turn.progress;
      return {
        yaw: (isCover ? -CLOSED_YAW : CLOSED_YAW) * closed,
        shift: (isCover ? -PAGE_W / 2 : PAGE_W / 2) * closed,
        open: 1 - closed,
      };
    }
    return { yaw: 0, shift: 0, open: 1 };
  }, [turn, index, n]);

  /* 桌面接触阴影 */
  const shadowW = (PAGE_W * (1 + posture.open) + 2 * 26 + 24) * 1.1;

  /* 飞行叶投在下方页面上的柔和掠影：采用自然抛物线衰减，彻底避免突变跳动 */
  const cast = turn
    ? (() => {
        const ratio = foreEdgeRatio(angle, bend, flying?.stiff ?? false);
        const xf = PAGE_W * ratio;
        const progressSin = Math.sin(Math.PI * turn.progress);
        const op = Math.pow(progressSin, 1.4) * 0.45;
        return { xf, op };
      })()
    : null;

  // 书脊堵头布颜色 (根据封面风格自适应)
  const coverStyle = ctx.album.coverConfig?.style || 'minimal';
  const headbandColor = coverStyle === 'minimal' ? '#991B1B' : coverStyle === 'gallery' ? '#C5A059' : '#A32020';

  return (
    <div
      className="relative"
      style={{
        width: PAGE_W * 2,
        height: PAGE_H,
        transform: 'translateY(-12px)',
        transformOrigin: 'center center',
      }}
    >
      {/* ── 3D 画册悬空立体阴影体系 ── */}
      {/* 1. 大范围柔和漫反射环境光阴影 */}
      <div
        className="absolute pointer-events-none"
        style={{
          left: '50%',
          bottom: -54,
          width: shadowW * 1.2,
          height: 80,
          marginLeft: (-shadowW * 1.2) / 2 + posture.shift,
          borderRadius: '50%',
          background:
            'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(4,6,12,0.48) 0%, rgba(4,6,12,0.18) 45%, rgba(4,6,12,0.05) 70%, transparent 84%)',
          filter: 'blur(16px)',
          opacity: 0.95,
          transition: 'width 360ms cubic-bezier(.22,.75,.25,1), margin-left 360ms cubic-bezier(.22,.75,.25,1)',
        }}
      />

      {/* 2. 悬空主体真实投射下沉阴影 */}
      <div
        className="absolute pointer-events-none"
        style={{
          left: '50%',
          bottom: -36,
          width: shadowW * 0.92,
          height: 44,
          marginLeft: (-shadowW * 0.92) / 2 + posture.shift,
          borderRadius: '50%',
          background:
            'radial-gradient(ellipse 50% 50% at 50% 50%, rgba(6,8,16,0.65) 0%, rgba(6,8,16,0.28) 48%, transparent 78%)',
          filter: 'blur(7px)',
          opacity: 0.94,
          transition: 'width 360ms cubic-bezier(.22,.75,.25,1), margin-left 360ms cubic-bezier(.22,.75,.25,1)',
        }}
      />

      {/* 3. 翻开时书脊中缝平滑落影 */}
      {posture.open > 0.08 && (
        <div
          className="absolute pointer-events-none"
          style={{
            left: '50%',
            bottom: -26,
            width: 90,
            height: 20,
            marginLeft: -45 + posture.shift,
            borderRadius: '50%',
            background:
              'radial-gradient(ellipse 50% 50% at 50% 50%, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.18) 55%, transparent 75%)',
            filter: 'blur(4px)',
            opacity: posture.open,
            transition: 'opacity 250ms ease-out',
          }}
        />
      )}

      <div
        className="absolute inset-0"
        style={{ perspective: `${PERSPECTIVE}px`, perspectiveOrigin: '50% 50%' }}
      >
        <div
          className="absolute inset-0"
          style={{
            transformStyle: 'preserve-3d',
            transform: `translateX(${posture.shift}px) rotateX(${BOOK_PITCH}deg) rotateY(${posture.yaw}deg)`,
            transition: turn ? 'none' : 'transform 440ms cubic-bezier(.22,.75,.25,1)',
          }}
        >
          <BookSide
            side="left"
            top={leftFace}
            papers={leftPapers}
            board={leftBoard}
            ctx={ctx}
            spreadIndex={min}
            isOpen={posture.open > 0.05}
          />
          <BookSide
            side="right"
            top={rightFace}
            papers={rightPapers}
            board={rightBoard}
            ctx={ctx}
            spreadIndex={max}
            isOpen={posture.open > 0.05}
          />

          {/* ══════════════════════════════════════════════════════════════════
           * 统一书脊堵头布 (仅此一组，居中对齐，杜绝 4 个方块并排冲突)
           * ══════════════════════════════════════════════════════════════════ */}
          {posture.open > 0.08 && (
            <>
              {/* 顶部中缝堵头布 */}
              <div
                className="absolute pointer-events-none z-30 shadow-xs"
                style={{
                  left: '50%',
                  top: -2.5,
                  width: 18,
                  height: 3.5,
                  marginLeft: -9,
                  borderRadius: '1px 1px 2px 2px',
                  opacity: posture.open,
                  transform: 'translateZ(1px)',
                  background: `repeating-linear-gradient(90deg, ${headbandColor} 0px, ${headbandColor} 2px, #FFFFFF 2px, #FFFFFF 3.5px)`,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                }}
              />
              {/* 底部中缝堵头布 */}
              <div
                className="absolute pointer-events-none z-30 shadow-xs"
                style={{
                  left: '50%',
                  bottom: -2.5,
                  width: 18,
                  height: 3.5,
                  marginLeft: -9,
                  borderRadius: '2px 2px 1px 1px',
                  opacity: posture.open,
                  transform: 'translateZ(1px)',
                  background: `repeating-linear-gradient(90deg, ${headbandColor} 0px, ${headbandColor} 2px, #FFFFFF 2px, #FFFFFF 3.5px)`,
                  boxShadow: '0 -1px 3px rgba(0,0,0,0.3)',
                }}
              />
            </>
          )}

          {/* ══════════════════════════════════════════════════════════════════
           * 书槽：订口柔和内折阴影 (细密自然，消除宽大黑沟导致的翻页闪动)
           * ══════════════════════════════════════════════════════════════════ */}
          {posture.open > 0.02 && (
            <div
              className="absolute pointer-events-none"
              style={{
                left: '50%',
                top: 0,
                width: 22,
                height: PAGE_H,
                marginLeft: -11,
                transform: 'translateZ(0.5px)',
                opacity: posture.open * 0.85,
                background:
                  'linear-gradient(to right, rgba(0,0,0,0) 0%, rgba(0,0,0,0.08) 30%, rgba(0,0,0,0.22) 50%, rgba(0,0,0,0.08) 70%, rgba(0,0,0,0) 100%)',
                maskImage:
                  'linear-gradient(to bottom, transparent 0%, black 8%, black 92%, transparent 100%)',
                WebkitMaskImage:
                  'linear-gradient(to bottom, transparent 0%, black 8%, black 92%, transparent 100%)',
              }}
            />
          )}

          {/* ══════════════════════════════════════════════════════════════════
           * 翻页掠影：叶片划过下层页面时的柔焦投影 (平滑无跳闪)
           * ══════════════════════════════════════════════════════════════════ */}
          {cast && cast.op > 0.01 && (
            <div
              className="absolute pointer-events-none"
              style={{
                left: '50%',
                top: 0,
                width: 0,
                height: PAGE_H,
                transform: 'translateZ(1px)',
                zIndex: 20,
              }}
            >
              {/* 平滑掠过的主投影 */}
              <div
                style={{
                  position: 'absolute',
                  left: cast.xf * 0.5 - PAGE_W * 0.5,
                  top: 0,
                  width: PAGE_W,
                  height: PAGE_H,
                  opacity: cast.op,
                  background:
                    'radial-gradient(ellipse 42% 50% at 50% 50%, rgba(4,6,12,0.25) 0%, rgba(4,6,12,0.08) 45%, transparent 75%)',
                }}
              />
              {/* 贴脊轻微接触影 */}
              <div
                style={{
                  position: 'absolute',
                  left: cast.xf * 0.12 - 30,
                  top: 0,
                  width: 60,
                  height: PAGE_H,
                  opacity: cast.op * 0.7,
                  background:
                    'radial-gradient(ellipse 35% 50% at 50% 50%, rgba(0,0,0,0.28) 0%, transparent 80%)',
                }}
              />
            </div>
          )}

          {turn && flying && (
            <BookSheet
              angle={angle}
              bend={bend}
              stiff={flying.stiff}
              recto={flying.faces.recto}
              verso={flying.faces.verso}
              ctx={ctx}
            />
          )}
        </div>
      </div>
    </div>
  );
};
