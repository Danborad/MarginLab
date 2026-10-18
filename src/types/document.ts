export type ElementType = "image" | "text" | "shape" | "sticker";

export type BlendMode = "normal" | "multiply" | "screen" | "overlay" | "darken" | "lighten";

export interface BaseElement {
  id: string;
  type: ElementType;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number; // degrees 0-360
  opacity: number; // 0 to 1
  zIndex: number;
  locked: boolean;
  visible: boolean;
  groupId?: string;
  blendMode?: BlendMode;
}

export interface ImageCropData {
  x: number; // offset X in natural pixel space
  y: number; // offset Y in natural pixel space
  width: number; // crop width in natural pixel space
  height: number; // crop height in natural pixel space
  scale: number; // zoom inside frame
  flipX?: boolean;
  flipY?: boolean;
}

export interface ImageFilterData {
  grayscale?: number; // 0-1
  sepia?: number; // 0-1
  brightness?: number; // -1 to 1 (0 default)
  contrast?: number; // -100 to 100 (0 default)
  blur?: number; // 0 to 40
  warmth?: number; // -50 to 50
  grain?: number; // 0 to 1
  invert?: boolean;
}

export type MaskShape = "none" | "circle" | "arch" | "pill" | "oval" | "star" | "diamond" | "scallop";

export interface ImageElement extends BaseElement {
  type: "image";
  src: string;
  originalWidth: number;
  originalHeight: number;
  fit: "cover" | "contain" | "fill" | "custom";
  crop?: ImageCropData;
  borderRadius?: number; // px
  borderWidth?: number;
  borderColor?: string;
  borderStyle?: "solid" | "dashed" | "dotted";
  shadowBlur?: number;
  shadowColor?: string;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
  shadowOpacity?: number;
  filters?: ImageFilterData;
  mask?: MaskShape;
}

export interface TextElement extends BaseElement {
  type: "text";
  text: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: number | string;
  fontStyle: "normal" | "italic";
  letterSpacing: number; // em or px
  lineHeight: number; // ratio e.g. 1.2
  textAlign: "left" | "center" | "right" | "justify";
  textTransform?: "none" | "uppercase" | "lowercase" | "capitalize";
  color: string;
  backgroundColor?: string;
  backgroundPadding?: number;
  backgroundRadius?: number;
  strokeColor?: string;
  strokeWidth?: number;
  shadowBlur?: number;
  shadowColor?: string;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
  shadowOpacity?: number;
}

export type ShapeType = "rect" | "circle" | "line" | "arch" | "pill" | "star" | "triangle" | "frame";

export interface ShapeElement extends BaseElement {
  type: "shape";
  shapeType: ShapeType;
  fill: string;
  stroke: string;
  strokeWidth: number;
  strokeDash?: number[];
  borderRadius?: number;
  shadowBlur?: number;
  shadowColor?: string;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
  shadowOpacity?: number;
}

export type WatermarkStyle = "leica" | "hasselblad" | "zeiss" | "iphone" | "fuji" | "film-date";

export interface StickerElement extends BaseElement {
  type: "sticker";
  stickerType?: "camera-watermark" | "washi-tape" | "date-stamp" | "barcode" | "archival-tag" | "film-strip" | "grid-cross" | "seal" | string;
  watermarkStyle?: WatermarkStyle;
  device?: string;
  dateTime?: string;
  params?: string;
  location?: string;
  bgTheme?: "white" | "dark" | "transparent";
  label?: string;
  color?: string;
  accentColor?: string;
  styleVariant?: number;
}

export type CollageElement = ImageElement | TextElement | ShapeElement | StickerElement;

export type NewElementData =
  | (Omit<ImageElement, "id" | "zIndex" | "locked" | "visible"> & { locked?: boolean; visible?: boolean })
  | (Omit<TextElement, "id" | "zIndex" | "locked" | "visible"> & { locked?: boolean; visible?: boolean })
  | (Omit<ShapeElement, "id" | "zIndex" | "locked" | "visible"> & { locked?: boolean; visible?: boolean })
  | (Omit<StickerElement, "id" | "zIndex" | "locked" | "visible"> & { locked?: boolean; visible?: boolean });

export interface CanvasSettings {
  width: number;
  height: number;
  unit: "px" | "mm" | "in";
  backgroundType: "color" | "gradient" | "texture" | "transparent";
  backgroundColor: string;
  backgroundGradient?: {
    type: "linear" | "radial";
    colors: [string, string];
    angle: number;
  };
  backgroundTexture?: "none" | "paper-grain" | "linen" | "dot-grid" | "film-grain" | "kraft-paper";
  presetName?: string;
}

export interface CollageDocument {
  id: string;
  version: number;
  name: string;
  canvas: CanvasSettings;
  elements: CollageElement[];
  createdAt?: string;
  updatedAt?: string;
}

export interface SavedProject {
  id: string;
  name: string;
  preview?: string;
  canvasWidth: number;
  canvasHeight: number;
  presetName?: string;
  document: CollageDocument;
  createdAt: string;
  updatedAt: string;
}

export interface CustomTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  preview?: string;
  document: CollageDocument;
  createdAt: string;
}

export interface CanvasPreset {
  id: string;
  name: string;
  category: "social" | "print" | "screen" | "editorial";
  width: number;
  height: number;
  description: string;
  icon?: string;
}

export interface AlignmentGuide {
  type: "horizontal" | "vertical";
  position: number; // canvas pixel coord
  start: number;
  end: number;
}

export interface UserMediaAsset {
  id: string;
  userId: string;
  name: string;
  src: string; // Base64 or Blob data URL
  thumb?: string;
  width: number;
  height: number;
  aspectRatio: number;
  sizeBytes?: number;
  category?: "upload" | "generated";
  createdAt: string;
}

 export interface UserAccount {
   id: string;
   username: string; // Login account username (e.g. "atelier", "lin", "designer")
   passwordHash: string; // Login password (e.g. "123456")
   name: string; // Display nickname (e.g. "Atelier Pro 主理人")
   avatar: string; // Avatar emoji or icon e.g. "🎨", "📷", "✨", "🌿"
   role: string; // Role / bio tag
   isAdmin?: boolean; // Administrator flag (Has access to user management & global AI model settings)
   status?: "active" | "banned"; // Account status
   bio?: string;
   email?: string;
   themeColor?: string;
   createdAt: string;
   lastLoginAt?: string;
   savedProjectsCount?: number;
   mediaAssetsCount?: number;
   aiHistoryCount?: number;
 }
