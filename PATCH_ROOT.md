# Patch Root.tsx — openvlab-strategy Stills

Target: `remotion-saas-boilerplate` (Mac: `/Users/zlx/Desktop/remotion-saas-boilerplate`).

## 1. Copy module

```bash
cp -R out-openvlab-strategy/src/openvlab-strategy \
  /path/to/remotion-saas-boilerplate/src/openvlab-strategy
```

Shared deps only needed if you also register the long video:
`src/shared/motion.ts`, `src/shared/components/Camera.tsx`.

Stills (`TableStill` / `CurveStill` / `CandlesStill`) only need the `openvlab-strategy/` folder itself.

## 2. Register Stills in Root.tsx

```tsx
import { Composition, Still } from "remotion";
import { TableStill } from "./openvlab-strategy/TableStill";
import { CurveStill } from "./openvlab-strategy/CurveStill";
import { CandlesStill } from "./openvlab-strategy/CandlesStill";

// inside RemotionRoot:
<Still id="openvlab-strategy-table" component={TableStill} width={1920} height={1080} />
<Still id="openvlab-strategy-curve" component={CurveStill} width={1920} height={1080} />
<Still id="openvlab-strategy-candles" component={CandlesStill} width={1920} height={1080} />
```

See also `src/openvlab-strategy/Root.register.tsx.txt`.

## 3. Studio / render

```bash
npx remotion studio
# sidebar → openvlab-strategy-table | openvlab-strategy-curve | openvlab-strategy-candles

npx remotion still openvlab-strategy-table out/openvlab-strategy-table.png
npx remotion still openvlab-strategy-curve out/openvlab-strategy-curve.png
npx remotion still openvlab-strategy-candles out/openvlab-strategy-candles.png
```

Do **not** git commit until reviewed.

## Deliverables

| Still id | Mode | Size |
|----------|------|------|
| `openvlab-strategy-table` | 表格 heatmap | 1920×1080 |
| `openvlab-strategy-curve` | 曲线 long-call | 1920×1080 |
| `openvlab-strategy-candles` | 行权价尺 + OI candles | 1920×1080 |

Light product page only — no dark stage, browser chrome, cursor, or captions.

### Candles data (IM2611)

- Strikes: DTO `result.context.i.c.IM2611.s` — 28 strikes 5900…8600
- Bar heights: raw OI (`o` → quote.oi), max = 18818 at 7000 Call
- Spot marker: underlying last **6604.8**
- Selected leg: **6600 C** with **x1** badge
