import { z } from "zod";
import { zColor } from "@remotion/zod-types";

export const LuminaSlideSchema = z.object({
  title: z.string(),
  description: z.string(),
  /** public/ 相对路径（走 staticFile）或 https:// 完整 URL */
  src: z.string().describe("public/ 相对路径（staticFile）或 https URL"),
});

export const LuminaVideoSchema = z.object({
  slides: z.array(LuminaSlideSchema).min(2),
  secondsPerSlide: z.number().positive().default(5),
  transitionSeconds: z.number().positive().default(2.5),
  accentColor: zColor().default("#d4af37"),
  bgmSrc: z.string().optional(),
  brandLabel: z.string().optional(),
});

export type LuminaSlide = z.infer<typeof LuminaSlideSchema>;
export type LuminaVideoProps = z.infer<typeof LuminaVideoSchema>;

export const resolveSrc = (src: string, staticFileFn: (s: string) => string) =>
  /^https?:\/\//.test(src) ? src : staticFileFn(src);
