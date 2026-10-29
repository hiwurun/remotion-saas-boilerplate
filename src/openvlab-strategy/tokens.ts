/** Frontend dark-theme tokens (vlab-frontend packages/ui/src/globals.css), converted from oklch. */
export const C = {
  bg: "#000000",
  card: "#0d0d0d",
  fg: "#eff2f6",
  mutedFg: "#a0a5ac",
  muted: "#2b2b2b",
  border: "#2a2e34",
  primary: "#aff33e",
  accent: "#14532d",
  red: "#ea3943", // profit (vlab-red)
  green: "#16c784", // loss (vlab-green)
  brand: "#0078ff", // break-even lines
  yellow: "#f4b400",
  chartUp: "#dc0000",
  chartDown: "#00ff00",
  logoYellow: "#fed600",
  magenta: "#d4237a",
  delta: "#ea3943",
  gamma: "#ffa500",
  vega: "#16c784",
  theta: "#3861fb",
} as const;

/** The app UI is authored at native CSS px and scaled up by this factor on screen. */
export const UI_SCALE = 1.5;

/** Thin CJK stack (PingFang SC has real 200/300 weights) for titles and captions. */
export const THIN = '"PingFang SC", "Hiragino Sans GB", "Noto Sans SC", "Noto Sans CJK SC", "Microsoft YaHei", sans-serif';
