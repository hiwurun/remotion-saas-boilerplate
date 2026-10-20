import { z } from "zod";
import { zColor } from "@remotion/zod-types";

/** One raw market row exactly as delivered by the API (all strings). */
export const MarketRowSchema = z.record(z.string(), z.string());

/**
 * All copy + data for the OpenVLab promo.
 * Copy strings may contain {tokens} (see data.ts buildModel().tokens) – every number on screen
 * is filled from the market data, never typed by hand.
 */
export const OpenVLabSchema = z.object({
  brandName: z.string(),
  url: z.string(),
  tagline: z.string(),
  logoSrc: z.string(),
  accentColor: zColor(),
  bgmSrc: z.string().optional(),
  /** frames trimmed from the bgm start so its beats land on the 120 BPM grid */
  bgmOffsetFrames: z.number().optional(),
  bpm: z.number().min(60).max(200),
  /** public/ path of the market snapshot JSON ({code, result: [...], message}). */
  dataSrc: z.string(),
  /** Raw rows. Filled from dataSrc by calculateOpenVLabMetadata when empty. */
  marketRows: z.array(MarketRowSchema),
  /** public/ path of the 分时 preview payload ({code, result: PreviewSeriesItem[]}) – priceVolatilityPreview response. */
  intradaySrc: z.string(),
  /** PreviewSeriesItem[] ({symbol "prodUnd:exp", prices [[time, v]], volatilities [[time, v]], intervals [[start, end]]}). Filled from intradaySrc when empty. */
  intraday: z.array(z.object({ symbol: z.string().nullable().optional(), prices: z.array(z.tuple([z.string(), z.number()])).nullable().optional(), volatilities: z.array(z.tuple([z.string(), z.number()])).nullable().optional(), intervals: z.array(z.tuple([z.string(), z.string()])).nullable().optional() })),
  /** Sector the filter shot drills into (sector_alias or sector code). */
  focusSector: z.string(),
  /** 数值筛选 shot: quick filter toggled in the dialog and the range it writes (metric-filters.ts MARKET_METRIC_QUICK_FILTERS). */
  metricFilter: z.object({ quick: z.string(), field: z.string(), label: z.string(), unit: z.string(), min: z.string(), max: z.string() }),
  copy: z.object({
    /** label above the opening input box */
    openLabel: z.string(),
    /** typed into the input box (typewriter) */
    openPrompt: z.string(),
    titleCard: z.string(),
    window: z.string(),
    windowSub: z.string(),
    rank: z.string(),
    rankSub: z.string(),
    premium: z.string(),
    premiumSub: z.string(),
    premiumFormula: z.string(),
    premiumHighTag: z.string(),
    premiumLowTag: z.string(),
    table: z.string(),
    tableNotes: z.array(z.object({ column: z.string(), note: z.string() })).min(1),
    quadrant: z.string(),
    quadrantSub: z.string(),
    quadrantUpLabel: z.string(),
    quadrantDownLabel: z.string(),
    metric: z.string(),
    metricSub: z.string(),
    filter: z.string(),
    filterSub: z.string(),
    grid: z.string(),
    stats: z.array(z.string()).min(3),
  }),
});

export type OpenVLabProps = z.infer<typeof OpenVLabSchema>;

export const OPENVLAB_DEFAULTS: OpenVLabProps = {
  brandName: "OpenVlab",
  url: "openvlab.cn",
  tagline: "一个页面 发掘市场机会",
  logoSrc: "openvlab-market/logo.svg",
  accentColor: "#AFF33E",
  bgmSrc: "openvlab-market/audio/bgm.mp3",
  bgmOffsetFrames: 9,
  bpm: 120,
  dataSrc: "openvlab-market/market.json",
  marketRows: [],
  intradaySrc: "openvlab-market/intraday.json",
  intraday: [],
  focusSector: "能化",
  metricFilter: { quick: "隐波低位", field: "atmv_percentile", label: "隐波百分位", unit: "%", min: "", max: "20" },
  copy: {
    openLabel: "今天我们来讲",
    openPrompt: "如何分析今天的机会？",
    titleCard: "市场总览",
    window: "一个页面 发掘市场机会",
    windowSub: "{count} 个品种 · {sectorCount} 大板块 · 隐波 溢价 到期一屏看完",
    rank: "异动 第一眼就看到",
    rankSub: "{topUpName} 隐波 {topUpVal} 领涨 · {topDownName} {topDownVal} 领跌",
    premium: "贵的卖 便宜的买",
    premiumSub: "{premTopName} 溢价 {premTopVal} 偏贵 · {premBotName} {premBotVal} 偏便宜",
    premiumFormula: "溢价 = 隐波 − 实波",
    premiumHighTag: "期权偏贵 · 卖方占优",
    premiumLowTag: "期权便宜 · 买方占优",
    table: "每一列 都在帮你做判断",
    tableNotes: [
      { column: "expiry_date", note: "临期风险 提前知道" },
      { column: "atmv_1dchg", note: "情绪升温还是降温" },
      { column: "carry", note: "期权是贵还是便宜" },
      { column: "atmv_percentile", note: "现在处在历史哪个位置" },
    ],
    quadrant: "{count} 个品种 一张图看清方向",
    quadrantSub: "涨 {pxUp} · 跌 {pxDown}　|　隐波升 {ivUp} · 隐波降 {ivDown}",
    quadrantUpLabel: "隐波上升 {ivUp}",
    quadrantDownLabel: "隐波下降 {ivDown}",
    metric: "设个条件 机会自己跳出来",
    metricSub: "{metricLabel} · {metricCount} 个品种期权偏便宜",
    filter: "只看你关心的机会",
    filterSub: "{focusSector} · {focusCount} 个品种 一键加自选",
    grid: "每天都有新机会",
    stats: ["{count} 个品种 一页扫完", "隐波上升 {ivUp} 个", "溢价最高 {premTopName} {premTopVal}", "{nearExpiry} 个合约 7 天内到期", "{sectorCount} 大板块 随时切换"],
  },
};
