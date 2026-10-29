import { Easing } from "remotion";

/**
 * v6 beat table — story-first cut (global frames @60fps, TOTAL 2250 = 37.5 s, f2249 == f0).
 * The opening (title → Play → door → 3D → flatten into the table) is timed in open/timeline.ts (O) and ends at HOOK = 684.
 * Every morph / camera move glides 48 f (0.8 s) on MORPH = cubic-bezier(.45,0,.15,1); the iris and the final shrink are eased by AREA.
 */
export const HOOK = 684;

/** frame at which the table walk's focus arrives on date column k (k = 0..17) */
export const HOPS: number[] = [
  724, // 10/29
  744, 762, 780, 798, 816, // first week (10/30 .. 11/05)
  876, 883, 890, 897, 904, 911, 918, 925, // middle (11/06 .. 11/17), a quicker glance
  942, 958, 974, 990, // last three days (11/18, 11/19, 11/20 09:30, 到期)
];

export const B = {
  /* ---- table (HOOK..) */
  camIn: [684, 732], // 1:1 -> 1.2 on the 6550 row
  dim: [690, 730], // other rows dim, diff strip appears
  br1: [822, 870], // bracket 10/29 -> 11/05 「第一周：少了 7,617 元」
  br2: [994, 1042], // bracket 11/17 -> 到期 「最后三天：少了 11,027 元」
  capTable: [930, 1070], // 「损耗在临近到期时会不断加速。」
  conc: [1050, 1098], // the two numbers glide out of the brackets to the centre; table dims
  concLine: [1080, 1116], // 「最后 3 天，比第一周亏得还多。」 rises
  concOut: [1166, 1190],
  camOut: [1166, 1214], // back to 1:1
  /* ---- 表格 -> 曲线 */
  curIn: [1160, 1206],
  click: 1208,
  morph: [1210, 1258], // the 6550 row bends into today's curve (no stagger)
  sweep: [1272, 1512], // date slider 10/29 -> 到期: the curve is pressed into the V
  capSweep: [1280, 1516], // 「每过一天往下压一截，越往后压得越深。」
  /* ---- seller */
  flip: [1530, 1578], // mirror about the zero axis
  capSeller: [1540, 1676], // 「反过来看：这些钱进了卖方口袋。最后一天就有 4,542 元。」
  back1d: [1590, 1638], // slider 到期 -> 还有 1 天
  gap: [1634, 1660], // +4,542 marker between the 1-day curve and the expiry line
  push: [1682, 1730], // band 6485–6615 + camera push-in on the same curve
  drop: [1708, 1736], // 6550 -> 6485 drop marker 「−3,568」
  capBand: [1690, 1822], // 「只剩 1 天：价格跌 1%（约 65 点），卖方就要赔 3,568 元。」
  /* ---- question */
  pull: [1822, 1870], // camera back to 1:1, chart dims
  q: [1840, 1876], // 「每天多收的那几千块，够不够赔一次 1% 的波动？」
  qOut: [2000, 2024],
  undim: [2000, 2040],
  /* ---- ending */
  unflip: [2010, 2058], // the curve flips back and settles on the expiry V
  lift: [2058, 2106], // the V lifts off the chart to the logo position; chart fades
  logo: [2094, 2134], // straight V -> logo centerline, disc grows, glyph swaps in
  iris: [2098, 2146], // light world closes (by area) onto the disc
  theme: [2126, 2162], // 「一秒之后，不只是少了一秒。」
  out: [2201, 2249], // theme sinks, disc shrinks (by area) to 0 -> f2249 == f0
  end: 2250,
} as const;

export const MORPH = Easing.bezier(0.45, 0, 0.15, 1);
const c01 = (x: number) => Math.min(1, Math.max(0, x));
/** 0..1 eased progress through a beat window */
export const mo = (f: number, w: readonly [number, number], e: (t: number) => number = MORPH) => e(c01((f - w[0]) / (w[1] - w[0])));
/** radius of an iris whose AREA eases from r0 to r1 */
export const irisR = (r0: number, r1: number, t: number) => Math.sqrt(Math.max(0, r0 * r0 + (r1 * r1 - r0 * r0) * t));
