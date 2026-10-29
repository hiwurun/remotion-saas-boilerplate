// Validates the straddle model against the frontend screenshot numbers.
// Run: node scripts/validate-strategy.mjs   (node >= 22.18, uses built-in TS type stripping)
import fs from "node:fs";
import { createModel } from "../src/openvlab-strategy/model/model.ts";

const chain = JSON.parse(fs.readFileSync(new URL("../src/openvlab-strategy/data/chain.json", import.meta.url), "utf8"));
const m = createModel(chain);
const atm = m.rows.findIndex((r) => r.showLine);
const be0 = m.breakevens(m.timeline[0].dte);
const beX = m.breakevens(0);
const rows = [
  ["净支出", 42260, m.basis],
  ["到期盈亏平衡 低", 6177.4, beX[0]],
  ["到期盈亏平衡 高", 7022.6, beX[1]],
  ["当前日曲线盈亏平衡 低", 6476.9, be0[0]],
  ["当前日曲线盈亏平衡 高", 6682.5, be0[1]],
  ["ATM(6550) 10/29", -739, m.table[atm][0]],
  ["ATM(6550) 到期", -37260, m.table[atm][m.timeline.length - 1]],
  ["胜率 %", 43, m.winRate * 100],
  ["Delta", -275.8, m.metrics.greeks.delta],
  ["Vega", 1353.4, m.metrics.greeks.vega],
  ["Gamma", 642.7, m.metrics.greeks.gamma],
  ["Theta", -1242.2, m.metrics.greeks.theta],
];
const out = rows.map(([name, shot, calc]) => ({ name, screenshot: shot, computed: +calc.toFixed(2), diff: +(calc - shot).toFixed(2) }));
console.table(out);
console.log({ dte0: m.timeline[0].dte, impliedBackendDte: m.impliedDte, calibratedVol: m.vol, atmRowFrom: atm, rows: m.rows.length, cols: m.timeline.length });
console.log("ATM row:", m.table[atm].map((v) => Math.round(v)).join(" "));
fs.writeFileSync(new URL("../src/openvlab-strategy/data/validation.json", import.meta.url), JSON.stringify({ rows: out, dte0: m.timeline[0].dte, impliedBackendDte: m.impliedDte, calibratedVol: m.vol, fileVol: chain.call.iv / 100 }, null, 2));
