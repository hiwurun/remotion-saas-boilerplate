# OpenVLab Strategy Builder — Remotion Stills

**Static** Remotion Stills of the 中证1000期货 IM2611 long-call strategy builder
(MO2611-C-6600). No timeline, cursor, captions, or camera.

| Still id | Mode | Size |
|----------|------|------|
| `openvlab-strategy-table` | 表格 (heatmap) | 1920×1080 |
| `openvlab-strategy-curve` | 曲线 (PnL chart) | 1920×1080 |
| `openvlab-strategy-candles` | 行权价尺 + OI candles | 1920×1080 |

## Snapshot (as-of 2026-10-26)

- Underlying: IM2611 last **6604.8** (−1.54%), spot **6605**
- Leg: **MO2611-C-6600** last **220**, IV **30.35%**, mult **100**
- Expiry: **2026-11-20** (25 DTE), breakeven **6820**
- Heatmap: Black-76, weekdays 10/27→11/20, ±6.1%
- Candles: 28 strikes 5900–8600, OI from DTO `o` (max 18818 @ 7000C)

## Structure

```
openvlab-strategy/
  TableStill.tsx
  CurveStill.tsx
  CandlesStill.tsx                     # strike ruler / OI candles only
  components/StrategyBuilderStatic.tsx # mode: 'table' | 'curve'
  components/StrikeRuler.tsx           # 1:1 product StrikeSelector strip
  components/HeatmapTable.tsx
  components/PnLChart.tsx
  data.ts / im2611-heatmap.json / theme.ts / profitLossTableColor.ts
```

`OpenVlabStrategyVideo.tsx` (long promo) is left in place but unused by the Stills.

## UI scope (stills)

- Clean light frame (1920×1080)
- **table**: `HeatmapTable` alone
- **curve**: `PnLChart` alone
- **candles**: `StrikeRuler` alone (行权价 + call/put OI bars + 最新价 + 6600 C x1)
- Removed from table/curve: header, strike ruler, metrics bar, bottom sliders, toolbar tabs

## Studio

```bash
npx remotion studio
# → openvlab-strategy-table | openvlab-strategy-curve | openvlab-strategy-candles
```
