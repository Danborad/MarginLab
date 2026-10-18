/**
 * 站内图片 → 缩略图地址。
 *
 * 原图可能是 2~9MB 的 PNG/JPG（AI 出图、上传原图），列表/历史栏里直接用它
 * 会一次拉上百 MB，打开很慢。这里统一改走服务端按需生成并缓存的缩略图。
 */
export function thumbOf(src?: string | null, size = 480): string {
  if (!src) return "";
  if (typeof src !== "string") return "";
  if (!src.startsWith("/api/")) return src;
  if (src.startsWith("/api/thumb")) return src;
  if (!/^\/api\/(ai\/history-assets|user-media)\//.test(src)) return src;
  return `/api/thumb?w=${size}&src=${encodeURIComponent(src)}`;
}
