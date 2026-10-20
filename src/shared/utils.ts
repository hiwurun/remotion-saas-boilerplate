/** Shared by launch + openvlab-market (were byte-identical in both theme.ts files). */
export const isUrl = (s: string) => /^https?:\/\//.test(s);

export const withAlpha = (hex: string, a: number) => {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h.slice(0, 6);
  const n = parseInt(full, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
};
