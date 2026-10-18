import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  PAGE_W,
  TurnKind,
  TurnState,
  clampIndex,
  isStiffLeaf,
  solveProgressForPoint,
} from './bookModel';

/** 翻页进度曲线：起步抬页、中段掠过、落页收住，全程单调无过冲 */
const easeTurn = (t: number): number => {
  const smooth = t * t * t * (t * (t * 6 - 15) + 10);
  const decel = 1 - Math.pow(1 - t, 2.2);
  return smooth * 0.6 + decel * 0.4;
};

/* 点击/翻页键触发的自动翻页：真书一次翻页大约 0.5~0.7 秒 */
const AUTO_DURATION = 580;
const TAP_SLOP = 7;
/* 拖拽起点离书脊太近会过灵敏，太远则行程过长：夹在 0.18~1 个半页宽之间 */
const GRAB_MIN = 0.18;
const GRAB_MAX = 1.0;
/* 拖拽增益：纸面比指尖多走两成，手感轻快些，但被按住的那一点始终跟着手走 */
const GRAB_GAIN = 1.2;

export interface PageTurnApi {
  turn: TurnState | null;
  dragging: boolean;
  canNext: boolean;
  canPrev: boolean;
  goNext: () => void;
  goPrev: () => void;
  jump: (index: number) => void;
  pointerHandlers: {
    onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => void;
    onPointerMove: (e: React.PointerEvent<HTMLDivElement>) => void;
    onPointerUp: (e: React.PointerEvent<HTMLDivElement>) => void;
    onPointerCancel: (e: React.PointerEvent<HTMLDivElement>) => void;
  };
}

export interface UsePageTurnOptions {
  index: number;
  totalSpreads: number;
  scale: number;
  onCommit: (next: number) => void;
  /** 未发生拖动的轻点：由舞台决定是向前还是向后 */
  onTap: (clientX: number, clientY: number) => void;
}

interface DragInfo {
  pointerId: number;
  startX: number;
  startY: number;
  lastX: number;
  lastTime: number;
  velocity: number; // px/ms
  kind: TurnKind;
  /** 手指按住的点离书脊的归一化距离（0~1 个半页宽） */
  grab: number;
  spineX: number;
  moved: boolean;
  active: boolean;
}

export const usePageTurn = ({
  index,
  totalSpreads,
  scale,
  onCommit,
  onTap,
}: UsePageTurnOptions): PageTurnApi => {
  const [turn, setTurn] = useState<TurnState | null>(null);
  const turnRef = useRef<TurnState | null>(null);
  turnRef.current = turn;

  const rafRef = useRef<number | null>(null);
  const dragRef = useRef<DragInfo | null>(null);

  const indexRef = useRef(index);
  indexRef.current = index;
  const nRef = useRef(totalSpreads);
  nRef.current = totalSpreads;

  const stopAnim = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  useEffect(() => stopAnim, [stopAnim]);

  const animate = useCallback(
    (from: number, to: number, duration: number, done?: () => void) => {
      stopAnim();
      const start = performance.now();
      const span = to - from;
      const ms = Math.max(120, duration);
      const step = (now: number) => {
        const raw = Math.min(1, (now - start) / ms);
        const p = from + span * easeTurn(raw);
        setTurn((prev) => (prev ? { ...prev, progress: p, dragging: false } : prev));
        if (raw < 1) {
          rafRef.current = requestAnimationFrame(step);
        } else {
          rafRef.current = null;
          done?.();
        }
      };
      rafRef.current = requestAnimationFrame(step);
    },
    [stopAnim]
  );

  /** 由当前阅读位置推导目标位置（含封面/封底） */
  const target = useCallback(
    (dir: 1 | -1): { to: number; kind: TurnKind } | null => {
      const cur = indexRef.current;
      const n = nRef.current;
      if (n <= 0) return null; // 空画册只有封面，没有可翻的内页
      const next = clampIndex(cur + dir, n);
      if (next === cur) return null;
      return { to: next, kind: dir === 1 ? 'forward' : 'backward' };
    },
    []
  );

  const run = useCallback(
    (dir: 1 | -1, duration = AUTO_DURATION) => {
      if (turnRef.current) return;
      const t = target(dir);
      if (!t) return;
      const from = indexRef.current;
      const state: TurnState = {
        kind: t.kind,
        from,
        to: t.to,
        progress: 0,
        dragging: false,
      };
      setTurn(state);
      animate(0, 1, duration, () => {
        setTurn(null);
        onCommit(t.to);
      });
    },
    [animate, onCommit, target]
  );

  const goNext = useCallback(() => run(1), [run]);
  const goPrev = useCallback(() => run(-1), [run]);

  const jump = useCallback(
    (next: number) => {
      if (turnRef.current) return;
      const clamped = clampIndex(next, nRef.current);
      if (clamped === indexRef.current) return;
      onCommit(clamped);
    },
    [onCommit]
  );

  const resolveDrag = useCallback(
    (dx: number): TurnKind | null => {
      const dir: 1 | -1 = dx < 0 ? 1 : -1;
      const t = target(dir);
      return t ? t.kind : null;
    },
    [target]
  );

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.button !== undefined && e.button !== 0) return;
      if (turnRef.current && !turnRef.current.dragging) return; // 自动翻页中不打断
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        /* noop */
      }
      /* 书脊位置 = 舞台横向正中；按住点离书脊的水平距离就是这一页的「半径」 */
      const rect = e.currentTarget.getBoundingClientRect();
      const W = (PAGE_W * Math.max(0.5, scale)) || 1;
      const spineX = rect.left + rect.width / 2;
      const grab = Math.max(
        GRAB_MIN,
        Math.min(GRAB_MAX, Math.abs(e.clientX - spineX) / W)
      );
      dragRef.current = {
        pointerId: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        lastX: e.clientX,
        lastTime: performance.now(),
        velocity: 0,
        kind: 'forward',
        grab,
        spineX,
        moved: false,
        active: false,
      };
    },
    [scale]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const d = dragRef.current;
      if (!d || d.pointerId !== e.pointerId) return;

      const now = performance.now();
      const dt = Math.max(1, now - d.lastTime);
      d.velocity = (e.clientX - d.lastX) / dt;
      d.lastX = e.clientX;
      d.lastTime = now;

      const dx = e.clientX - d.startX;

      if (!d.active) {
        if (Math.abs(dx) < TAP_SLOP) return;
        const kind = resolveDrag(dx);
        if (!kind) {
          dragRef.current = null;
          return;
        }
        const t = target(dx < 0 ? 1 : -1);
        if (!t) {
          dragRef.current = null;
          return;
        }
        d.active = true;
        d.moved = true;
        d.kind = t.kind;
        setTurn({
          kind: t.kind,
          from: indexRef.current,
          to: t.to,
          progress: 0,
          dragging: true,
        });
      }

      /*
       * 拖拽映射：指尖按住纸面哪一点，那一点就跟着指尖走。
       *
       * 按住点在归一化弧长 s 处、离书脊 s 个半页宽；把它拖到
       *   x = s + dx / W
       * 就是纸转过的真实角度 —— 同时算进了纸张弯曲带来的收卷
       * （书口比书脊超前，所以纸口不会「跟不上手」）。
       * 捏书口要划过大半本书，捏页面中间只要一小段，跟真书完全一致。
       */
      const W = PAGE_W * Math.max(0.5, scale);
      const cur = turnRef.current;
      const kind: TurnKind = cur ? cur.kind : d.kind;
      const stiff = isStiffLeaf(
        Math.min(indexRef.current, cur ? cur.to : indexRef.current) + 1,
        nRef.current
      );
      const startXNorm = kind === 'forward' ? d.grab : -d.grab;
      const targetX = startXNorm + (dx * GRAB_GAIN) / W;
      const progress = solveProgressForPoint(d.grab, targetX, kind, stiff);
      setTurn((prev) => (prev ? { ...prev, progress, dragging: true } : prev));
    },
    [resolveDrag, scale, target]
  );

  const finishDrag = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const d = dragRef.current;
      if (!d || d.pointerId !== e.pointerId) return;
      dragRef.current = null;

      if (!d.moved) {
        const el = e.target as HTMLElement | null;
        if (!el?.closest('button, a, [data-no-turn]')) onTap(e.clientX, e.clientY);
        return;
      }

      const cur = turnRef.current;
      if (!cur || !cur.dragging) return;

      const p = cur.progress;
      const forward = cur.kind === 'forward';
      const flick = forward ? d.velocity < -0.32 : d.velocity > 0.32;
      const committed = p >= 0.34 || flick;

      const speed = Math.max(
        0.0011,
        Math.abs(d.velocity) / Math.max(160, PAGE_W * scale * 1.35)
      );
      if (committed) {
        const remain = Math.max(0.02, 1 - p);
        const ms = Math.min(720, Math.max(200, remain / speed));
        setTurn({ ...cur, dragging: false });
        animate(p, 1, ms, () => {
          setTurn(null);
          onCommit(cur.to);
        });
      } else {
        const ms = Math.min(560, Math.max(160, p / speed));
        setTurn({ ...cur, dragging: false });
        animate(p, 0, ms, () => setTurn(null));
      }
    },
    [animate, onCommit, onTap, scale]
  );

  const canNext = !turn && totalSpreads > 0 && index < totalSpreads;
  const canPrev = !turn && totalSpreads > 0 && index > -1;

  return useMemo(
    () => ({
      turn,
      dragging: !!turn?.dragging,
      canNext,
      canPrev,
      goNext,
      goPrev,
      jump,
      pointerHandlers: {
        onPointerDown,
        onPointerMove,
        onPointerUp: finishDrag,
        onPointerCancel: finishDrag,
      },
    }),
    [turn, canNext, canPrev, goNext, goPrev, jump, onPointerDown, onPointerMove, finishDrag]
  );
};
