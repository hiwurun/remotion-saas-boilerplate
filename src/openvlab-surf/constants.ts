/**
 * Ported from vlab-frontend packages/components/src/volatility/surface/surface-3d/constants.ts.
 * getSurfacePalette() read CSS vars at runtime; here the dark-theme values are resolved statically
 * from packages/ui/src/globals.css (.dark) so the render is deterministic.
 */

//色阶思路： 蓝 → 青 → 绿 → 黄 → 橙 → 红
export const VOLATILITY_STOPS = ["#3B82F6", "#38BDF8", "#22D3EE", "#2DD4BF", "#7DDC6F", "#FDE047", "#FB923C", "#F87171"];

export interface SurfaceRenderStyle {
  axisLineOpacity: number;
  gridMainOpacity: number;
  wireOpacity: number;
  ambientLightIntensity: number;
  hemisphereLightSkyIntensity: number;
  directionalLightIntensity: number;
  fillLightIntensity: number;
  rimLightIntensity: number;
  surfaceRoughness: number;
  surfaceMetalness: number;
}

export const SURFACE_RENDER_STYLE_DARK: SurfaceRenderStyle = {
  axisLineOpacity: 1,
  gridMainOpacity: 0.46,
  wireOpacity: 0.2,
  ambientLightIntensity: 0.7,
  hemisphereLightSkyIntensity: 0.8,
  directionalLightIntensity: 0.1,
  fillLightIntensity: 0.8,
  rimLightIntensity: 0.8,
  surfaceRoughness: 0,
  surfaceMetalness: 0.4,
};

/** .dark tokens: --foreground, --muted-foreground (= --vlab-chart-axis), --border, --input, --vlab-iv, --vlab-open-interest. */
export const SURFACE_PALETTE_DARK = {
  background: "#000000",
  axisLabel: "#eff2f6",
  tickLabel: "#eff2f6",
  axisLine: "#a0a5ac",
  volAxisLabel: "#b071e8",
  volAxisLine: "#b071e8",
  gridMain: "#2a2e34",
  gridSub: "#2b2b2b",
  wireframe: "#a0a5ac",
  oiAxis: "#01c6d1",
  /** --vlab-red / --vlab-green */
  oiCall: "#ea3943",
  oiPut: "#16c784",
};

export const createLegendGradient = (stops: string[], dir = "to top") => `linear-gradient(${dir}, ${stops.join(", ")})`;

/** BASE_COLORS.purple used by the 2D chart's「今日波动率」line. */
export const IV_PURPLE = "#a21caf";
export const IV_GRAY = "#9e9e9e";
