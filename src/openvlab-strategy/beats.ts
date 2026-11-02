import { Easing } from "remotion";

/**
 * v8.1 beat table — tightened cut of the v8 story (global frames @60fps).
 * TOTAL 4745 ≈ 79.1 s (was v8 7701 ≈ 128.4 s). Ending holds the settled lockup through B.out (no shrink-out).
 *
 * Keeps v8 structure: one curve drag with time-value overlaid, then the unanswered seller-entry question.
 * Opening (open/timeline.ts) ends at HOOK; dolly / flatten / handoff keep the same internal offsets as v7,
 * with shorter caption holds than v8.
 *
 * Reading rule (tightened): captions aim for roughly max(1s, 字数/6 秒) fully on after appear, then fade.
 * Glides are 54f (~0.9s).
 */
export const HOOK = 986;

/** frame at which the table walk's focus arrives on date column k (k = 0..17) */
export const HOPS: number[] = [
  1034, // 10/29
  1062, 1090, 1118, 1146, 1174, // first week, ~0.47s apart
  1270, 1286, 1302, 1318, 1334, 1350, 1366, 1382, // middle, a quicker glance (~0.27s)
  1406, 1438, 1470, 1502, // last three days, ~0.53s apart
];

export const B = {
  /* ---- table (HOOK..) */
  camIn: [986, 1040], // 1:1 -> 1.2 on the 6550 row
  dim: [996, 1034], // other rows dim, diff strip appears
  br1: [1188, 1242], // bracket 10/29 -> 11/05 「第一周：少了 7,617 元」
  br2: [1514, 1568], // bracket 11/17 -> 到期 「最后三天：少了 11,027 元」
  capTable: [1370, 1562], // 「损耗在临近到期时会不断加速。」
  conc: [1584, 1638], // the two numbers glide out of the brackets to the centre
  concLine: [1644, 1684], // 「最后 3 天，比第一周亏得还多。」 rises; holds until concOut
  concOut: [1804, 1858],
  camOut: [1804, 1858], // back to 1:1
  /* ---- 表格 -> 曲线 (auto morph; no toggle / cursor click) */
  morph: [1872, 1998], // 6550 row bends into today's curve (covers old curIn+click window)
  /* ---- the only full curve drag: name the gap, then press today → expiry once */
  tv: [2016, 2070], // bracket grows on the still curve: the 6550 distance is time value
  formula: [2080, 2134], // ledger: 现在值 = 内在价值 + 时间价值
  capName: [2086, 2286], // 「价格不动，少掉的这一截，叫时间价值。」
  formulaOut: [2276, 2330],
  sweep: [2344, 2704], // slider 10/29 -> 到期, linear in days; the gap counts down to 0
  capSweep: [2354, 2544], // 「每过一天往下压一截，越往后压得越深。」
  capDrain: [2558, 2690], // 「越近到期，掉得越快。到期那一刻，它是零。」
  /* ---- seller: a one-day nudge, not a second pass through the month */
  flip: [2722, 2776], // mirror about the zero axis
  capSeller: [2730, 3000], // 「反过来看：这些钱进了卖方口袋。最后一天就有 4,542 元。」
  back1d: [2790, 2844], // slider 到期 -> 还有 1 天
  gap: [2834, 2866], // +4,542 marker; it then holds until the push
  push: [3012, 3066], // band 6419–6681 (+-2%) + camera push-in
  drop: [3048, 3088], // 6550 -> 6419 drop marker 「−8,960」
  capBand: [3018, 3288], // 「只剩 1 天：价格跌 2%（约 131 点），卖方就要赔 8,960 元。」
  /* ---- comparison (no quiz): last-day TV vs 2% shock -> 不够赔 */
  pull: [3296, 3350], // camera back to 1:1, chart dims
  // q/qOut kept as aliases of the ans window so older notes stay readable; unused in UI
  q: [3320, 3374],
  qOut: [3868, 3922],
  ans: [3320, 3374], // 4,542 vs 8,960 glide to centre (replaces the old exam question)
  ansLine: [3480, 3520], // 「一天收的，盖不住一次 2% 的波动。」
  ansOut: [3868, 3922], // holds the 不够赔 line until just before unflip
  unflip: [3934, 3988], // seller → buyer, and dte 1 → 0, so the curve is the expiry V again
  /* ---- open question, unanswered, then the same ending */
  ask: [4006, 4074], // the seller-entry question rises; holds until askOut
  askOut: [4324, 4378],
  /* ---- ending: SoftBg wash → logo drop → short left hop → copy right-slides early under lockup */
  lift: [4390, 4470], // SoftBg washes over the fading chart (AppStage panel/line fade with this)
  logo: [4415, 4500], // final logo.svg drops from high center (spring from [0]; no fade-in)
  hop: [4475, 4535], // short left settle (higher damping in End.tsx — 1–2 soft overshoots)
  iris: [4390, 4470], // alias of lift for older notes
  word: [4505, 4545], // «OpenVlab» right-slides early, beside the mark
  theme: [4525, 4565], // 「让每笔盈亏都可见」 right-slides snug under OpenVlab
  out: [4580, 4744], // reserved hold window; lockup stays settled (no shrink-out)
  end: 4745,
} as const;

export const MORPH = Easing.bezier(0.45, 0, 0.15, 1);
const c01 = (x: number) => Math.min(1, Math.max(0, x));
/** 0..1 eased progress through a beat window */
export const mo = (f: number, w: readonly [number, number], e: (t: number) => number = MORPH) => e(c01((f - w[0]) / (w[1] - w[0])));
/** radius of an iris whose AREA eases from r0 to r1 */
export const irisR = (r0: number, r1: number, t: number) => Math.sqrt(Math.max(0, r0 * r0 + (r1 * r1 - r0 * r0) * t));
