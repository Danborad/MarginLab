
/* ══════════════════════════════════════════════════════════════════
 * 画册几何模型
 *
 * 一本精装画册 = 若干张「叶」(leaf)。设对开页数量为 N：
 *   leaf 0        正面 = 画册封面        背面 = 第 1 个对开页的左页
 *   leaf 1..N-1   正面 = 第 k 对开页右页  背面 = 第 k+1 对开页的左页
 *   leaf N        正面 = 第 N 对开页右页  背面 = 画册封底
 *
 * 阅读位置 s：
 *   -1        封面闭合（全部叶在右侧）
 *   0..N-1    第 s 个对开页摊开（leaf 0..s 已翻到左侧）
 *   N         封底闭合（全部叶在左侧）
 *
 * 所有几何都由「阅读位置」推导，不再为封面/内页/封底写三套特例代码，
 * 这样翻页前后不会出现任何跳变或不可能的形态。
 * ══════════════════════════════════════════════════════════════════ */

/* ── 物理尺寸（设计坐标 px）────────────────────────────────────── */
export const PAGE_W = 360; // 单个半页宽度
export const PAGE_H = 490; // 半页高度
export const PAGE_TILT = 2.8; // 每页相对水平面的上翘角（形成自然浅 V 书槽）
export const PERSPECTIVE = 2400; // 3D 摄像机视距（偏长焦，避免翻页时近大远小过分夸张）
export const BOOK_PITCH = 2.0; // 正视视角：与参考视频一致，翻页时纸张顶底始终与书本保持平齐，绝不向上突刺超出版心
export const CLOSED_YAW = 11; // 合上时的微侧角，露出书口与硬壳
export const BOARD_OVH = 9; // 硬壳封面超出内页的包边
export const BOARD_T = 3; // 硬壳可视厚度
export const SHEET_T = 1.5; // 单张内页可视厚度
export const BLOCK_MAX = 11; // 页芯叠加后的可视厚度上限
export const BEND_MAX = 60; // 纸张最大弯曲角（度）

/* ── 叶片分段（曲面模拟）───────────────────────────────────────
 * 一张纸不是刚体：沿宽度切成若干段，每一段挂在上一段的外缘并多转一点，
 * 于是形成连续的弧面。段数越多越圆滑，但绘制成本越高；6 段在
 * 「弧面连续」与「合成成本」之间取得平衡。
 * ────────────────────────────────────────────────────────────── */
export const SHEET_SEGMENTS = 6;

/**
 * 内页（艺术相纸）：订口处被装订夹住，几乎不弯；越靠书口越自由，
 * 曲率与垂坠量越大——这正是纸被指尖带起时的真实形态。
 */
export const PAPER_CURL_WEIGHTS = [0.05, 0.09, 0.14, 0.19, 0.24, 0.29];

/** 硬壳（封面/封底）：几乎不弯，只在书脊关节处折一点 */
export const BOARD_CURL_WEIGHTS = [0.52, 0.24, 0.12, 0.06, 0.04, 0.02];

export const curlWeights = (stiff: boolean): number[] =>
  stiff ? BOARD_CURL_WEIGHTS : PAPER_CURL_WEIGHTS;

/** 每段左右边界的累积角（长度 = SHEET_SEGMENTS + 1） */
export const segmentAngles = (
  angle: number,
  bend: number,
  stiff: boolean
): number[] => {
  const w = curlWeights(stiff);
  const out: number[] = [angle];
  let acc = 0;
  for (let i = 0; i < w.length; i++) {
    acc += w[i];
    out.push(angle - bend * acc);
  }
  return out;
};

/** 书口（外缘）在水平方向的投影比例（相对于半页宽度，-1 ~ 1） */
export const foreEdgeRatio = (
  angle: number,
  bend: number,
  stiff: boolean
): number => {
  const a = segmentAngles(angle, bend, stiff);
  const seg = 1 / SHEET_SEGMENTS;
  let x = 0;
  for (let i = 0; i < SHEET_SEGMENTS; i++) {
    const mid = ((a[i] + a[i + 1]) / 2) * (Math.PI / 180);
    x += seg * Math.cos(mid);
  }
  return x;
};

/**
 * 页面上「从书脊量起 sNorm（0~1 的归一化弧长）」那一点落在水平方向的哪里
 * （单位：半页宽，右正左负）。逐段累加，因此弯曲造成的收卷也计入投影。
 */
export const projectedX = (
  sNorm: number,
  angle: number,
  bend: number,
  stiff: boolean
): number => {
  const a = segmentAngles(angle, bend, stiff);
  const seg = 1 / SHEET_SEGMENTS;
  const s = Math.max(0, Math.min(1, sNorm));
  let x = 0;
  for (let i = 0; i < SHEET_SEGMENTS; i++) {
    const frac = Math.max(0, Math.min(1, (s - i * seg) / seg));
    if (frac <= 0) break;
    const mid = ((a[i] + a[i + 1]) / 2) * (Math.PI / 180);
    x += seg * frac * Math.cos(mid);
  }
  return x;
};

export type Side = 'left' | 'right';

/* ── 面容器尺寸 ────────────────────────────────────────────────
 * x 一律从书脊（订口）往外量；硬壳板比内页大出包边 BOARD_OVH。
 * ────────────────────────────────────────────────────────────── */
export interface FaceBox {
  w: number;
  h: number;
  x: number;
  y: number;
}

export const PAPER_BOX: FaceBox = { w: PAGE_W, h: PAGE_H, x: 0, y: 0 };
export const BOARD_BOX: FaceBox = {
  w: PAGE_W + BOARD_OVH,
  h: PAGE_H + 2 * BOARD_OVH,
  x: 0,
  y: -BOARD_OVH,
};

/* ── 面（face）：某一侧最上面那一层到底是什么 ──────────────────── */

export type FaceSpec =
  | { kind: 'cover' }
  | { kind: 'backCover' }
  | { kind: 'paper'; spread: number; side: Side };

/** 左侧（已翻过的那叠）最上面一层的正面朝向观众的内容 */
export const leftTopFace = (s: number, n: number): FaceSpec | null => {
  if (s < 0) return null; // 还没翻过任何叶
  if (s >= n) return { kind: 'backCover' }; // 全部翻完 → 封底朝上
  return { kind: 'paper', spread: s, side: 'left' };
};

/** 右侧（尚未翻动的那叠）最上面一层的正面朝向观众的内容 */
export const rightTopFace = (s: number, n: number): FaceSpec | null => {
  if (s > n - 1) return null; // 全部翻完，右侧已空
  if (s < 0) return { kind: 'cover' }; // 合上状态 → 封面朝上
  return { kind: 'paper', spread: s, side: 'right' };
};

/** 某一侧压在下面的内页张数（不含封面/封底硬壳） */
export const paperCount = (s: number, n: number, side: Side): number => {
  const total = Math.max(0, n - 1);
  if (total === 0) return 0;
  if (side === 'left') {
    if (s <= 0) return 0;
    return Math.min(s, total);
  }
  const first = Math.max(1, s + 1);
  return Math.max(0, Math.min(total, total - first + 1));
};

/** 一侧最底部是否存在硬壳（封面 / 封底） */
export const boardPresent = (s: number, n: number, side: Side): boolean =>
  side === 'left' ? s >= 0 : s <= n - 1;

/** 内页叠的可视厚度：随着张数增加逐渐收窄，避免无限增厚 */
export const blockThickness = (count: number): number => {
  if (count <= 0) return 0;
  const linear = count * SHEET_T;
  return BLOCK_MAX * (1 - Math.exp(-linear / BLOCK_MAX));
};

/* ── 翻页过程 ──────────────────────────────────────────────────── */

export type TurnKind = 'forward' | 'backward';

export interface TurnState {
  kind: TurnKind;
  from: number;
  to: number;
  progress: number; // 0 → 1
  dragging: boolean;
}

/** 正在翻转的那张叶的序号 */
export const turnLeaf = (from: number, to: number): number =>
  Math.min(from, to) + 1;

/** 封面与封底是硬壳，弯曲量远小于内页 */
export const isStiffLeaf = (leaf: number, n: number): boolean =>
  leaf <= 0 || leaf >= n;

/* 叶片从 -PAGE_TILT 转到 -(180 - PAGE_TILT)：两端都与静止页面的角度严格重合，
   所以起手与落页时不会出现「咔」的一下突跳。 */
export const sheetAngle = (p: number, kind: TurnKind): number => {
  const span = 180 - PAGE_TILT * 2;
  return kind === 'forward'
    ? -(PAGE_TILT + p * span)
    : -(180 - PAGE_TILT) + p * span;
};

/* 纸张不是刚体：指尖带动书口，纸身顺着弧面跟上。
   弯曲量两端为 0（完全贴平），中段最大；用 0.75 次幂让「起手抬页」时
   弧面来得比纯正弦更早一点 —— 真纸一被捏起就会弓起来。 */
export const sheetBend = (p: number, kind: TurnKind, stiff: boolean): number => {
  const amp = stiff ? BEND_MAX * 0.14 : BEND_MAX;
  const dir = kind === 'forward' ? 1 : -1;
  return dir * amp * Math.pow(Math.sin(Math.PI * Math.max(0, Math.min(1, p))), 0.75);
};

/**
 * 反过来解：手指按住叶片上「离书脊 sNorm 处」那一点，并把它拖到 targetX 位置时，
 * 翻页进度应该是多少。
 *
 * 这正是真书的手感来源 —— 被指尖按住的那一点始终跟着指尖走：
 * 捏书口翻页要划过大半本书，捏中间只要一小段；无论捏哪里，纸都不会「跟不上手」。
 */
export const solveProgressForPoint = (
  sNorm: number,
  targetX: number,
  kind: TurnKind,
  stiff: boolean
): number => {
  const s = Math.max(0, Math.min(1, sNorm));
  const X = (p: number) =>
    projectedX(s, sheetAngle(p, kind), sheetBend(p, kind, stiff), stiff);

  const x0 = X(0);
  const x1 = X(1);
  const dir = x1 - x0;
  if (dir === 0) return 0;
  if (Math.abs((targetX - x0) / dir) >= 1) return (targetX - x0) / dir > 0 ? 1 : 0;

  /* X(p) 在 0~1 上单调（已逐点验证），二分 16 次足够到 1e-5 精度 */
  let lo = 0;
  let hi = 1;
  const sign = Math.sign(dir);
  for (let i = 0; i < 16; i++) {
    const mid = (lo + hi) / 2;
    if ((X(mid) - targetX) * sign > 0) hi = mid;
    else lo = mid;
  }
  return (lo + hi) / 2;
};


/** 翻页时两侧静态书身应显示的面 */
export const staticFaces = (
  from: number,
  to: number,
  n: number
): { left: FaceSpec | null; right: FaceSpec | null } => ({
  left: leftTopFace(Math.min(from, to), n),
  right: rightTopFace(Math.max(from, to), n),
});

/** 翻页时正在飞行的叶片两面各显示什么 */
export const sheetFaces = (
  from: number,
  to: number,
  n: number
): { recto: FaceSpec | null; verso: FaceSpec | null } => ({
  recto: rightTopFace(Math.min(from, to), n),
  verso: leftTopFace(Math.max(from, to), n),
});

/* ── 取内容 ────────────────────────────────────────────────────── */

export const clampIndex = (s: number, n: number): number =>
  Math.max(-1, Math.min(n, Math.round(s)));
