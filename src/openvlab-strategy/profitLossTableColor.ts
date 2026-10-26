/**
 * Exact port of ProfitLossTableHelper.calculateBackgroundColor /
 * getBackgroundColor from vlab-frontend:
 * packages/strategy-core/src/presentation/profit-loss-table-helper.ts
 */
export function getBackgroundColor(
  value: number,
  maxRange: number,
  minRange: number,
): string {
  let transparency: number;

  const percent = (value / Math.max(Math.abs(maxRange), Math.abs(minRange))) * 100;

  const absolutePercent = Math.abs(percent || 0);
  const colorRatio = Math.min(1, absolutePercent / 100);
  const transparencyAdjust = Math.min(1, (absolutePercent - 100) / 500);

  if (Math.round(absolutePercent) >= 100) {
    transparency = 0.6 + 0.3 * (1 - transparencyAdjust);
  } else {
    transparency = 1;
  }

  return percent >= 0
    ? `rgba(${220 * transparency}, ${45 * transparency}, ${45 * transparency}, ${colorRatio})`
    : `rgba(${40 * transparency}, ${180 * transparency}, ${90 * transparency}, ${colorRatio})`;
}

/** Format PnL like product ProfitLoss output (rounded, no currency symbol). */
export function formatProfitLoss(value: number): string {
  return Math.round(value).toLocaleString("en-US");
}

/** Mirrors ProfitLossTableHelper.formatPercentage(value, addSign=false). */
export function formatPercentLabel(pct: number, addSign = false): string {
  if (Number.isNaN(pct)) return "—";
  const abs = Math.abs(pct);
  const isDecimal = abs < 10 && (Math.round(pct * 10) / 10) % 1 !== 0;
  let body = (isDecimal ? pct.toFixed(1) : pct.toFixed(0)) + "%";
  if (addSign && pct > 0) body = `+${body}`;
  return body;
}
