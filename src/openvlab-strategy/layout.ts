import { UI_SCALE } from "./tokens";

/** The app window is authored at native CSS px (1000x620) and scaled by UI_SCALE on the 1920x1080 canvas. */
export const PANEL = { x: 210, y: 16, w: 1000, h: 620, scale: UI_SCALE };
export const nativeToWorld = (nx: number, ny: number) => ({ x: PANEL.x + nx * PANEL.scale, y: PANEL.y + ny * PANEL.scale });

export const HEADER_TITLE = { x: 14, y: 12 };
export const METRICS = { x: 12, y: 48, w: 976, h: 52 };
export const CONTENT = { x: 12, y: 104, w: 976 };

/** Profit table geometry (native px, relative to CONTENT). */
export const TABLE = { labelW: 40, dateCols: 18, weekdayH: 20, headH: 28, rowH: 18 };
export const TABLE_HEAD_H = TABLE.weekdayH + TABLE.headH;
export const dateColW = (CONTENT.w - TABLE.labelW * 2) / TABLE.dateCols;
export const colX = (c: number) => (c < 2 ? c * TABLE.labelW : TABLE.labelW * 2 + (c - 2) * dateColW);
export const colW = (c: number) => (c < 2 ? TABLE.labelW : dateColW);
export const rowY = (r: number) => TABLE_HEAD_H + r * TABLE.rowH;

/** Chart geometry (native px, relative to CONTENT). */
export const CHART = { w: CONTENT.w, h: 440, top: 34, bottom: 26, right: 24, left: 46 };
export const PLOT = { x: CHART.left, y: CHART.top, w: CHART.w - CHART.left - CHART.right, h: CHART.h - CHART.top - CHART.bottom };
export const SLIDER = { y: 448, h: 56 };

/** Toggle button centres (native, panel coordinates). */
export const TOGGLE = { y: 30, tableX: 904, chartX: 954, w: 46, h: 24 };
