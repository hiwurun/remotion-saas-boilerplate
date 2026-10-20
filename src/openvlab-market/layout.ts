/** World-space layout of the OpenVLab market page (window = 1600×920, centred on a 1920×1080 stage). */
export type Rect = { x: number; y: number; w: number; h: number };

export const WIN = { w: 1600, h: 920, cx: 960, cy: 540 };
export const WIN_LEFT = WIN.cx - WIN.w / 2;
export const WIN_TOP = WIN.cy - WIN.h / 2;

/** Rows inside the window (window-relative y). */
export const NAV_H = 56;
export const FILTER = { y: 56, h: 60 };
export const CARDS = { y: 128, h: 316, pad: 20, gap: 16 };
export const CARD_W = (WIN.w - CARDS.pad * 2 - CARDS.gap * 3) / 4;
export const TOOLBAR = { y: 456, h: 48 };
export const TABLE = { y: 512, x: 20, w: WIN.w - 40, headerH: 42, rowH: 52, bottomPad: 12 };
export const TABLE_BODY_H = WIN.h - TABLE.y - TABLE.headerH - TABLE.bottomPad;

/** Card internals */
export const CARD_IN = { pad: 14, titleH: 48, headH: 30, rowH: 40, rowGap: 6 };

/** Card i rect in window coords. */
export const cardRect = (i: number): Rect => ({ x: CARDS.pad + i * (CARD_W + CARDS.gap), y: CARDS.y, w: CARD_W, h: CARDS.h });

/** Column spans (out of 12) – MarketHeaderDesktop.tsx: atmv cards 名称4/涨幅%3/隐波变化3/分时预览2, carry cards 4/3/3/2. */
export const RANK_SPANS = [4, 3, 3, 2];
export const PREMIUM_SPANS = [4, 3, 3, 2];

/** Column rect (window coords) inside card `i` covering header + rows. */
export const cardColumnRect = (i: number, spans: number[], col: number): Rect => {
  const c = cardRect(i);
  const inner = c.w - CARD_IN.pad * 2;
  const total = spans.reduce((a, b) => a + b, 0);
  const x0 = spans.slice(0, col).reduce((a, b) => a + b, 0) / total;
  const w = spans[col] / total;
  return { x: c.x + CARD_IN.pad + inner * x0, y: c.y + CARD_IN.titleH, w: inner * w, h: CARD_IN.headH + 5 * CARD_IN.rowH + 4 * CARD_IN.rowGap };
};

/** Desktop market table columns – MarketTableDesktop.tsx order incl. the trailing 走势预览 (id "chart", size 140,
 *  ChartPreviewCell → TrendPreviewCell → LineSvg 120×40, time labels on). Series = real 分时 data (data.ts buildPreviewSeriesMaps). */
export const TABLE_COLS = [
  { id: "watch", label: "", w: 40, align: "center" },
  { id: "product_alias", label: "主力合约", w: 186, align: "left" },
  { id: "price", label: "最新价", w: 104, align: "right" },
  { id: "ctn", label: "标的涨幅%", w: 112, align: "center" },
  { id: "expiry_date", label: "剩余时间", w: 92, align: "center" },
  { id: "atmv_current", label: "平值隐波", w: 106, align: "center" },
  { id: "atmv_1dchg", label: "隐波变化", w: 100, align: "center" },
  { id: "valphaT", label: "隐波涨速", w: 108, align: "center" },
  { id: "rv22", label: "实波", w: 80, align: "center" },
  { id: "carry", label: "溢价", w: 84, align: "center" },
  { id: "skew_current", label: "偏度", w: 80, align: "center" },
  { id: "atmv_percentile", label: "隐波百分位", w: 186, align: "center" },
  { id: "skew_percentile", label: "偏度百分位", w: 108, align: "center" },
  { id: "chart", label: "走势预览", w: 174, align: "center" },
] as const;

export const tableColRect = (id: string): Rect => {
  let x = TABLE.x;
  for (const c of TABLE_COLS) {
    if (c.id === id) return { x, y: TABLE.y, w: c.w, h: WIN.h - TABLE.y - TABLE.bottomPad };
    x += c.w;
  }
  return { x: TABLE.x, y: TABLE.y, w: 0, h: 0 };
};

/** window-relative → world */
export const toWorld = (r: Rect): Rect => ({ x: r.x + WIN_LEFT, y: r.y + WIN_TOP, w: r.w, h: r.h });
export const centerOf = (r: Rect) => ({ x: r.x + r.w / 2, y: r.y + r.h / 2 });
