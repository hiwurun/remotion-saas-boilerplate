// 本地文字宽度测量（替代 @remotion/layout-utils），基于 Canvas 2D measureText，结果带缓存。
let ctx: CanvasRenderingContext2D | null = null;
const cache = new Map<string, number>();

export const measureText = ({
  text,
  fontFamily,
  fontSize,
  fontWeight = "400",
  letterSpacing = "0",
}: {
  text: string;
  fontFamily: string;
  fontSize: number;
  fontWeight?: string | number;
  letterSpacing?: string;
}): { width: number } => {
  const key = `${text}|${fontFamily}|${fontSize}|${fontWeight}|${letterSpacing}`;
  const hit = cache.get(key);
  if (hit !== undefined) return { width: hit };
  if (!ctx && typeof document !== "undefined") {
    ctx = document.createElement("canvas").getContext("2d");
  }
  let width = text.length * fontSize * 0.55;
  if (ctx) {
    ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
    width = ctx.measureText(text).width;
  }
  const ls = letterSpacing.trim();
  const lsPx = ls.endsWith("em") ? parseFloat(ls) * fontSize : parseFloat(ls) || 0;
  width += lsPx * text.length;
  cache.set(key, width);
  return { width };
};
