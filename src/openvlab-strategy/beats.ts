import { Easing } from "remotion";

/**
 * v9 beat table — table entry retimed: ATM highlight + fast day-over-day strip,
 * then brackets (no slow column hop). Second half still「IV 升降如何改写时间价值」(@60fps).
 * TOTAL 4065 ≈ 67.8 s.
 *
 * Lead-in: dim other rows → cascade all「较前一格」diffs → br1 / br2 → conclusion →
 * auto morph → TV drain → restore → IV up / crush → takeaway → brand lockup.
 *
 * Reading rule: captions aim for roughly max(1s, 字数/6 秒) fully on after appear, then fade.
 * Glides are 54f (~0.9s).
 */
export const HOOK = 986;

/** day-over-day diff strip: all cells cascade L→R after dim settles (k = 1..17) */
export const DIFF_START = 1038;
export const DIFF_STAGGER = 5; // frames between adjacent cells
export const DIFF_IN = 8; // appear duration per cell
/** last diff cell fully on */
export const DIFF_DONE = DIFF_START + 16 * DIFF_STAGGER + DIFF_IN; // 1126

/** IV scene vol scales (multipliers on calibrated MODEL.vol). */
export const IV_UP = 1.3;
export const IV_CRUSH = 0.7;

export const B = {
  /* ---- table (HOOK..) */
  camIn: [986, 1040], // 1:1 -> 1.2 on the 6550 row
  dim: [996, 1034], // other rows dim; strip chrome appears
  /* diffs cascade 1038→1126 (see DIFF_*), then brackets */
  br1: [1150, 1204], // bracket 10/29 -> 11/05 「第一周：少了 7,617 元」
  br2: [1232, 1286], // bracket 11/17 -> 到期 「最后三天：少了 11,027 元」
  capTable: [1238, 1420], // 「损耗在临近到期时会不断加速。」
  conc: [1304, 1358], // the two numbers glide out of the brackets to the centre
  concLine: [1364, 1404], // 「最后 3 天，比第一周亏得还多。」 rises; holds until concOut
  concOut: [1524, 1578],
  camOut: [1524, 1578], // back to 1:1
  /* ---- 表格 -> 曲线 (auto morph; no toggle / cursor click) */
  morph: [1592, 1718], // 6550 row bends into today's curve
  /* ---- the only full curve drag: name the gap, then press today → expiry once */
  tv: [1736, 1790], // bracket grows on the still curve: the 6550 distance is time value
  formula: [1800, 1854], // ledger: 现在值 = 内在价值 + 时间价值
  capName: [1806, 2006], // 「价格不动，少掉的这一截，叫时间价值。」
  formulaOut: [1996, 2050],
  sweep: [2064, 2424], // slider 10/29 -> 到期, linear in days; the gap counts down to 0
  capSweep: [2074, 2264], // 「每过一天往下压一截，越往后压得越深。」
  capDrain: [2278, 2410], // 「越近到期，掉得越快。到期那一刻，它是零。」
  /* ---- restore today so IV can rewrite the same TV gap ---- */
  restore: [2440, 2530], // dte 0 → today
  /* ---- IV rewrite (spot fixed at 6550) */
  ivHook: [2540, 2594], // vega highlight / setup
  capIvHook: [2546, 2760], // 「但时间价值不只听日历。隐含波动率一变，它也会变。」
  ivUp: [2770, 2920], // volScale 1 → 1.3; curve lifts, TV thickens
  capIvUp: [2780, 3000], // 「IV 抬升，时间价值跟着变厚。」
  ivCrush: [3020, 3200], // volScale 1.3 → 0.7; crush while spot stays put
  capIvCrush: [3030, 3280], // 「IV crush：标的不动，时间价值也被抽走。」
  /* ---- takeaway card */
  dimIv: [3290, 3344], // chart dims for the comparison card
  ans: [3310, 3364], // TV at IV↑ vs TV after crush glide to centre
  ansLine: [3420, 3460], // 「标的价格不动，时间价值也会被改写。」
  ansOut: [3640, 3694],
  /* ---- ending: SoftBg wash → logo drop → short left hop → copy right-slides */
  lift: [3710, 3790],
  logo: [3735, 3820],
  hop: [3795, 3855],
  iris: [3710, 3790], // alias of lift for older notes
  word: [3825, 3865],
  theme: [3845, 3885],
  out: [3900, 4064], // reserved hold; lockup stays settled
  end: 4065,
} as const;

export const MORPH = Easing.bezier(0.45, 0, 0.15, 1);
const c01 = (x: number) => Math.min(1, Math.max(0, x));
/** 0..1 eased progress through a beat window */
export const mo = (f: number, w: readonly [number, number], e: (t: number) => number = MORPH) => e(c01((f - w[0]) / (w[1] - w[0])));
/** radius of an iris whose AREA eases from r0 to r1 */
export const irisR = (r0: number, r1: number, t: number) => Math.sqrt(Math.max(0, r0 * r0 + (r1 * r1 - r0 * r0) * t));
