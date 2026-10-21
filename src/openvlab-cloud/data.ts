import raw from "./data/surfacemap.json";

/** Ported from vlab-frontend surfacemap processing (parseSurfacemapArrayField: Number(item[1]) then reverse → 20P..20C). */
export type SectorKey = "EQ" | "MT" | "EN" | "BK" | "AG" | "OS";
export const SECTORS: { key: SectorKey; label: string; icon: string }[] = [
  { key: "EQ", label: "股指", icon: "openvlab-market/sector/stock-index.svg" },
  { key: "MT", label: "金属", icon: "openvlab-market/sector/noble-metal.svg" },
  { key: "EN", label: "能化", icon: "openvlab-market/sector/chemical.svg" },
  { key: "BK", label: "黑色", icon: "openvlab-market/sector/ferrous.svg" },
  { key: "AG", label: "农副", icon: "openvlab-market/sector/agricultural.svg" },
  { key: "OS", label: "油脂", icon: "openvlab-market/sector/oil.svg" },
];

/** code → [alias, sector]; order within a sector = display order. */
const ALIAS: [string, string, SectorKey][] = [
  ["MO", "中证1000期货", "EQ"], ["IO", "沪深300期货", "EQ"], ["HO", "上证50期货", "EQ"],
  ["50ETF", "上证50ETF", "EQ"], ["300ETF", "沪深300ETF", "EQ"], ["500ETF", "中证500ETF", "EQ"],
  ["919ETF", "沪深300ETF深", "EQ"], ["922ETF", "中证500ETF深", "EQ"], ["915ETF", "创业板ETF", "EQ"],
  ["901ETF", "深证100ETF", "EQ"], ["000ETF", "科创50ETF", "EQ"], ["080ETF", "科创板50ETF", "EQ"],
  ["HSI_O", "恒生指数", "EQ"], ["HTI_O", "恒生科技", "EQ"], ["HHI_O", "恒生国企", "EQ"],
  ["AU_O", "沪金", "MT"], ["AG_O", "沪银", "MT"], ["CU_O", "沪铜", "MT"], ["BC_O", "国际铜", "MT"],
  ["AL_O", "沪铝", "MT"], ["AO_O", "氧化铝", "MT"], ["AD_O", "铸造铝", "MT"], ["ZN_O", "沪锌", "MT"],
  ["PB_O", "沪铅", "MT"], ["NI_O", "沪镍", "MT"], ["SN_O", "沪锡", "MT"], ["LC_O", "碳酸锂", "MT"],
  ["SI_O", "工业硅", "MT"], ["PS_O", "多晶硅", "MT"], ["PT_O", "铂", "MT"], ["PD_O", "钯", "MT"],
  ["GC_O", "COMEX黄金", "MT"], ["SIL_O", "COMEX白银", "MT"], ["HG_O", "COMEX铜", "MT"],
  ["SC_O", "原油", "EN"], ["CL_O", "WTI原油", "EN"], ["FU_O", "燃料油", "EN"], ["LU_O", "低硫燃油", "EN"],
  ["BU_O", "沥青", "EN"], ["PG_O", "液化气", "EN"], ["TA_O", "PTA", "EN"], ["PX_O", "对二甲苯", "EN"],
  ["EG_O", "乙二醇", "EN"], ["EB_O", "苯乙烯", "EN"], ["BZ_O", "纯苯", "EN"], ["MA_O", "甲醇", "EN"],
  ["PP_O", "聚丙烯", "EN"], ["L_O", "塑料", "EN"], ["V_O", "PVC", "EN"], ["PF_O", "短纤", "EN"],
  ["RU_O", "橡胶", "EN"], ["NR_O", "20号胶", "EN"], ["BR_O", "丁二烯胶", "EN"], ["SA_O", "纯碱", "EN"],
  ["FG_O", "玻璃", "EN"], ["UR_O", "尿素", "EN"], ["SH_O", "烧碱", "EN"], ["SP_O", "纸浆", "EN"],
  ["OP_O", "胶版纸", "EN"], ["LG_O", "原木", "EN"],
  ["RB_O", "螺纹钢", "BK"], ["HC_O", "热卷", "BK"], ["I_O", "铁矿石", "BK"], ["J_O", "焦炭", "BK"],
  ["JM_O", "焦煤", "BK"], ["SF_O", "硅铁", "BK"], ["SM_O", "锰硅", "BK"], ["SS_O", "不锈钢", "BK"],
  ["M_O", "豆粕", "AG"], ["RM_O", "菜粕", "AG"], ["A_O", "豆一", "AG"], ["B_O", "豆二", "AG"],
  ["C_O", "玉米", "AG"], ["CS_O", "淀粉", "AG"], ["SR_O", "白糖", "AG"], ["CF_O", "棉花", "AG"],
  ["AP_O", "苹果", "AG"], ["CJ_O", "红枣", "AG"], ["PK_O", "花生", "AG"], ["JD_O", "鸡蛋", "AG"],
  ["LH_O", "生猪", "AG"],
  ["Y_O", "豆油", "OS"], ["P_O", "棕榈油", "OS"], ["OI_O", "菜油", "OS"],
];

export type Month = { exp: string; lastTime: string; ready: boolean; skew: number | null; diff: number[]; tday: number[]; alpha: number[] };
export type Product = {
  code: string; name: string; sector: SectorKey; ctn: number; ffmom: number; exp: string; overseas: boolean; months: Month[];
};

const parseArr = (s: unknown): number[] => {
  if (typeof s !== "string" || !s) return [];
  try {
    const a = JSON.parse(s) as unknown[][];
    return a.map((it) => Number(it[1])).reverse();
  } catch {
    return [];
  }
};
const num = (v: unknown): number => (v === null || v === undefined || v === "" ? NaN : Number(v));

type RawProduct = { ctn?: unknown; frontfwd_mom?: unknown; exp?: unknown; is_overseas?: unknown; exps?: Record<string, Record<string, unknown>> };
/** parse a /api/surfacemap-shaped JSON ({result:{[code]:{exps:{...}}}}) into products (same rules for every snapshot) */
export const parseProducts = (src: unknown): Product[] => {
  const result = (src as { result: Record<string, RawProduct> }).result;
  return ALIAS.filter(([c]) => result[c]).map(([code, name, sector]) => {
  const p = result[code];
  const exps = p.exps ?? {};
  const months = Object.keys(exps).sort().map((k) => {
    const e = exps[k];
    const sk = num(e.skew);
    return {
      exp: k, lastTime: String(e.last_time ?? ""), ready: e.is_ready !== false && e.is_ready !== 0,
      skew: Number.isFinite(sk) ? sk : null,
      diff: parseArr(e.theovol_diff), tday: parseArr(e.theovol_tday), alpha: parseArr(e.svalphaT),
    };
  });
  return {
    code, name, sector, ctn: num(p.ctn), ffmom: num(p.frontfwd_mom), exp: String(p.exp ?? ""),
    overseas: Number(p.is_overseas) === 1, months,
  };
  });
};
export const PRODUCTS: Product[] = parseProducts(raw);

const allT = PRODUCTS.flatMap((p) => p.months.flatMap((m) => m.tday)).filter(Number.isFinite);
export const TDAY_AVG = allT.reduce((a, b) => a + b, 0) / Math.max(1, allT.length);

/* ---------- layout (desktop sizes from surfacemap-layout.ts) ---------- */
export const L = { label: 38, col: 40, header: 22, row: 19, pad: 5, head: 32, gap: 4 };
export const CARD_H = L.pad + L.head + 5 + L.header + 8 * L.row + L.pad;
const headW = (p: Product) => 12 + 16 + 6 + p.name.length * 14 + 8 + 50 + (p.overseas ? 26 : 0) + 6 + 54;
export const cardW = (p: Product) => Math.max(L.label + p.months.length * L.col, headW(p)) + 2 * L.pad;

/** Extra row gap before each sector, room for the sector label (video-only). */
export const SECTOR_GAP = 46;
export type Placed = { p: Product; x: number; y: number; w: number; idx: number };
const pack = (maxW: number) => {
  const out: Placed[] = [];
  let x = 0, y = 0, W = 0;
  PRODUCTS.forEach((p, idx) => {
    const w = cardW(p);
    if (x > 0 && x + w > maxW) { x = 0; y += CARD_H + L.gap; }
    out.push({ p, x, y, w, idx });
    x += w + L.gap;
    W = Math.max(W, x - L.gap);
  });
  return { out, W, H: y + CARD_H };
};
const best = (() => {
  let b = pack(2000);
  for (let mw = 1400; mw <= 5000; mw += 20) {
    const c = pack(mw);
    if (Math.abs(c.W / c.H - 16 / 9) < Math.abs(b.W / b.H - 16 / 9)) b = c;
  }
  return b;
})();
export const GRID = best.out;
export const GRID_W = best.W;
export const GRID_H = best.H;

/** World coords of a cell centre; row 0 = 偏度, rows 1..7 = 20P..20C. */
export const cellCenter = (pl: Placed, mi: number, row: number) => ({
  x: pl.x + L.pad + L.label + mi * L.col + L.col / 2,
  y: pl.y + L.pad + L.head + 5 + L.header + row * L.row + L.row / 2,
});
