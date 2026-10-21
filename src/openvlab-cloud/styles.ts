/** Ported from vlab-frontend surfacemap styles.ts (dark mode). */
export const D = {
  bg: "#000000", card: "#0d0d0d", fg: "#f1f2f5", muted: "#2b2b2b", mutedFg: "#a4a6ab", border: "#2e2f33",
  notReadyBg: "#1f2023", notReadyFg: "#7d7f85",
};
const hexA = (hex: string, a: number) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a.toFixed(3)})`;
};
export const withA = hexA;
export const diffBg = (v: number) => {
  if (!Number.isFinite(v) || v === 0) return hexA(D.muted, 1);
  const a = 0.18 + 0.37 * Math.pow(Math.min(Math.abs(v) / 5, 1), 0.7);
  return hexA(v > 0 ? "#ff5964" : "#2ee59d", a);
};
export const diffBase = (v: number) => (v > 0 ? "#ff5964" : v < 0 ? "#2ee59d" : D.mutedFg);
export const tdayBg = (v: number, avg: number) => {
  const n = Math.max(-1, Math.min(1, (v - avg) / 5));
  return `hsl(${60 - 60 * n}, 85%, ${38 + 14 * (1 - Math.abs(n))}%)`;
};
export const cellOutline = (s: number): { w: number; color: string } | null => {
  if (!Number.isFinite(s) || Math.abs(s) < 0.1) return null;
  const w = Math.min(4, Math.abs(s) / 0.1);
  return { w, color: hexA(s > 0 ? "#3b82f6" : "#ef4444", 0.25 + 0.4 * (w / 4)) };
};
export const pillColor = (ctn: number) => (ctn > 0 ? "#ea3943" : ctn < 0 ? "#16c784" : D.fg);
export const pillOutline = (ff: number) => ({
  w: Number.isFinite(ff) ? Math.min(4, Math.abs(ff * 10)) : 0,
  color: ff > 0 ? "#ef4444cc" : "#3b82f6cc",
});
export const skewColor = (v: number | null) => (v === null ? D.mutedFg : v > 0 ? "#ea3943" : v < 0 ? "#16c784" : D.fg);
