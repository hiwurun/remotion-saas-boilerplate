import { loadFont as loadGeist } from "@remotion/google-fonts/Geist";
import { loadFont as loadGeistMono } from "@remotion/google-fonts/GeistMono";

const geist = loadGeist("normal", { weights: ["400", "500", "600", "700"], subsets: ["latin"] }).fontFamily;
const geistMono = loadGeistMono("normal", { weights: ["400", "500"], subsets: ["latin"] }).fontFamily;

export const SANS = `${geist}, "PingFang SC", "Noto Sans SC", "Noto Sans CJK SC", "Microsoft YaHei", sans-serif`;
export const MONO = `${geistMono}, "PingFang SC", "Noto Sans SC", "Noto Sans CJK SC", "Microsoft YaHei", ui-monospace, monospace`;
