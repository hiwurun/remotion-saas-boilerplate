import { z } from "zod";
import { zColor } from "@remotion/zod-types";

export const HeroTitleSceneSchema = z.object({
  type: z.literal("hero-title"),
  durationInFrames: z.number().int().positive(),
  eyebrow: z.string(),
  title: z.string(),
  subtitle: z.string(),
});

export const LoupeSchema = z
  .object({
    x: z.number().min(0).max(1).describe("放大镜焦点 X，归一化坐标 0–1（相对源图宽度）"),
    y: z.number().min(0).max(1).describe("放大镜焦点 Y，归一化坐标 0–1（相对源图高度）"),
    zoom: z.number().min(1).max(6),
    label: z.string(),
  })
  .describe("光学放大镜。x / y 为归一化坐标（0–1），不是像素");

export const MacroScreenshotSceneSchema = z.object({
  type: z.literal("macro-screenshot"),
  durationInFrames: z.number().int().positive(),
  src: z.string(),
  caption: z.string(),
  subCaption: z.string(),
  cameraMode: z.enum(["macro-angle", "center-float"]),
  loupe: LoupeSchema.optional(),
});

export const CinematicRecordSceneSchema = z.object({
  type: z.literal("cinematic-record"),
  durationInFrames: z.number().int().positive(),
  src: z.string(),
  playbackRate: z.number().positive().default(1.2),
  caption: z.string(),
  floatingBadge: z.string(),
});

export const BentoCardSchema = z.object({
  title: z.string(),
  metric: z.string(),
  description: z.string(),
  imgSrc: z.string().optional(),
});

export const BentoSummarySceneSchema = z.object({
  type: z.literal("bento-summary"),
  durationInFrames: z.number().int().positive(),
  heading: z.string(),
  cards: z.tuple([BentoCardSchema, BentoCardSchema, BentoCardSchema, BentoCardSchema]),
});

export const AppleSceneSchema = z.discriminatedUnion("type", [
  HeroTitleSceneSchema,
  MacroScreenshotSceneSchema,
  CinematicRecordSceneSchema,
  BentoSummarySceneSchema,
]);

export const AppleVideoSchema = z.object({
  accentColor: zColor().default("#6366F1"),
  bgmSrc: z.string().optional(),
  scenes: z.array(AppleSceneSchema),
  /** Filled automatically by calculateMetadata (HEAD check per asset). Do not edit. */
  assetAvailability: z.record(z.string(), z.boolean()).optional(),
});

export type AppleVideoProps = z.infer<typeof AppleVideoSchema>;
export type AppleScene = z.infer<typeof AppleSceneSchema>;
export type HeroTitleScene = z.infer<typeof HeroTitleSceneSchema>;
export type MacroScreenshotScene = z.infer<typeof MacroScreenshotSceneSchema>;
export type CinematicRecordScene = z.infer<typeof CinematicRecordSceneSchema>;
export type BentoSummaryScene = z.infer<typeof BentoSummarySceneSchema>;
export type BentoCard = z.infer<typeof BentoCardSchema>;
export type Loupe = z.infer<typeof LoupeSchema>;

export const APPLE_TRANSITION_FRAMES = 20;
