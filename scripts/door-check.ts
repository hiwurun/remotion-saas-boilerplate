import { O, doorE } from "../src/openvlab-strategy/open/timeline";
const a = O.split[0] - 3, b = O.split[1] + 3;
let prevV = 0, peakV = 0, peakF = 0, maxAcc = 0, maxAccF = 0, mono = true, signChanges = 0, lastSign = 0, spikes = 0;
const rows: string[] = [];
for (let f = a; f <= b; f++) {
  const e = doorE(f), e0 = doorE(f - 1);
  const v = (e - e0) * 990, acc = v - prevV;
  if (v < -1e-9) mono = false;
  if (v > peakV) { peakV = v; peakF = f; }
  const sg = Math.sign(Math.round(acc * 1e6)); if (sg !== 0 && lastSign !== 0 && sg !== lastSign && f > a + 1) signChanges++; if (sg !== 0) lastSign = sg;
  if (f > a + 1 && Math.abs(acc) > maxAcc) { maxAcc = Math.abs(acc); maxAccF = f; }
  prevV = v;
  if (f % 4 === 0 || f === O.split[0] || f === O.split[1]) rows.push(`f${f} E=${e.toFixed(4)} gap=${(e * 990).toFixed(1)}px v=${v.toFixed(2)}px/f acc=${acc.toFixed(2)}`);
}
console.log(rows.join("\n"));
const q = (t: number) => { for (let f = a; f <= b; f++) if (doorE(f) >= t) return f; return -1; };
console.log(`monotone=${mono}; peak v ${peakV.toFixed(2)} px/f @${peakF}; velocity-extremum count(acc sign changes)=${signChanges}; max|acc| ${maxAcc.toFixed(2)} @${maxAccF}; E=.25@${q(.25)} .5@${q(.5)} .75@${q(.75)} .99@${q(.99)}`);
