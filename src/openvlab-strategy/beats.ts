import { Easing } from "remotion";

/**
 * v8 beat table — one curve drag, then room to read (global frames @60fps).
 * TOTAL 7701 ≈ 128.4 s. Last frame 7700 finishes B.out, so the disc is gone and f7700 == f0.
 *
 * The opening (open/timeline.ts) ends at HOOK. Its dolly / flatten / handoff keep the same
 * internal offsets as v7; only the holds around the captions moved.
 *
 * Reading rule: a caption is fully on screen for at least max(1s, 字数/4 秒) after it has
 * finished appearing, then fades. 字 counts CJK and punctuation; a whole number counts as one.
 * Glides are 72f (1.2s). The old rewind (dte 1 → today) and the second walk (today → expiry)
 * are gone — that story now rides the single sweep below.
 */
export const HOOK = 1163;

/** frame at which the table walk's focus arrives on date column k (k = 0..17) */
export const HOPS: number[] = [
  1253, // 10/29
  1301, 1349, 1397, 1445, 1493, // first week, 0.8s apart so each diff can be read
  1739, 1775, 1811, 1847, 1883, 1919, 1955, 1991, // middle, a slower glance (0.6s)
  2057, 2117, 2177, 2237, // last three days, 1.0s apart
];

export const B = {
  /* ---- table (HOOK..) */
  camIn: [1163, 1235], // 1:1 -> 1.2 on the 6550 row
  dim: [1175, 1227], // other rows dim, diff strip appears
  br1: [1517, 1589], // bracket 10/29 -> 11/05 「第一周：少了 7,617 元」
  br2: [2261, 2333], // bracket 11/17 -> 到期 「最后三天：少了 11,027 元」
  capTable: [2049, 2322], // 「损耗在临近到期时会不断加速。」
  conc: [2361, 2433], // the two numbers glide out of the brackets to the centre
  concLine: [2449, 2497], // 「最后 3 天，比第一周亏得还多。」 rises; holds until concOut
  concOut: [2707, 2755],
  camOut: [2707, 2779], // back to 1:1
  /* ---- 表格 -> 曲线 */
  curIn: [2803, 2875],
  click: 2893,
  morph: [2907, 2979], // the 6550 row bends into today's curve
  /* ---- the only full curve drag: name the gap, then press today → expiry once */
  tv: [3015, 3087], // bracket grows on the still curve: the 6550 distance is time value
  formula: [3103, 3175], // ledger: 现在值 = 内在价值 + 时间价值
  capName: [3113, 3431], // 「价格不动，少掉的这一截，叫时间价值。」
  formulaOut: [3413, 3461],
  sweep: [3485, 4254], // slider 10/29 -> 到期, linear in days; the gap counts down to 0
  capSweep: [3501, 3834], // 「每过一天往下压一截，越往后压得越深。」
  capDrain: [3864, 4212], // 「越近到期，掉得越快。到期那一刻，它是零。」
  /* ---- seller: a one-day nudge, not a second pass through the month */
  flip: [4290, 4362], // mirror about the zero axis
  capSeller: [4302, 4710], // 「反过来看：这些钱进了卖方口袋。最后一天就有 4,542 元。」
  back1d: [4390, 4462], // slider 到期 -> 还有 1 天
  gap: [4454, 4490], // +4,542 marker; it then holds until the push
  push: [4734, 4806], // band 6485–6615 + camera push-in
  drop: [4790, 4838], // 6550 -> 6485 drop marker 「−3,568」
  capBand: [4742, 5135], // 「只剩 1 天：价格跌 1%（约 65 点），卖方就要赔 3,568 元。」
  /* ---- question */
  pull: [5159, 5231], // camera back to 1:1, chart dims
  q: [5195, 5267], // 「每天多收的那几千块，够不够赔一次 1% 的波动？」 rises; holds until qOut
  qOut: [5597, 5639],
  /* ---- answer, then back to the buyer expiry V in the same gesture as the unflip */
  ans: [5667, 5739], // 4,542 and 3,568 glide out to the centre
  ansLine: [5755, 5803], // 「最后一天收的，够赔一次 1% 的波动。」
  ansOut: [6043, 6091],
  unflip: [6115, 6187], // seller → buyer, and dte 1 → 0, so the curve is the expiry V again
  /* ---- open question, unanswered, then the same ending */
  ask: [6223, 6307], // the seller-entry question rises; holds until askOut
  askOut: [7087, 7135],
  lift: [7159, 7231], // the V lifts off the chart; chart fades
  logo: [7249, 7305], // straight V -> logo centerline
  iris: [7255, 7327], // light world closes (by area) onto the disc
  theme: [7343, 7403], // 「一秒之后，不只是少了一秒。」 rises; holds until out
  out: [7628, 7700], // theme sinks, disc shrinks (by area) to 0 -> f7700 == f0
  end: 7701,
} as const;

export const MORPH = Easing.bezier(0.45, 0, 0.15, 1);
const c01 = (x: number) => Math.min(1, Math.max(0, x));
/** 0..1 eased progress through a beat window */
export const mo = (f: number, w: readonly [number, number], e: (t: number) => number = MORPH) => e(c01((f - w[0]) / (w[1] - w[0])));
/** radius of an iris whose AREA eases from r0 to r1 */
export const irisR = (r0: number, r1: number, t: number) => Math.sqrt(Math.max(0, r0 * r0 + (r1 * r1 - r0 * r0) * t));
