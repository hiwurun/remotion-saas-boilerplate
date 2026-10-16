import { z } from "zod";
import { zColor } from "@remotion/zod-types";

export const HookSceneSchema = z.object({
  type: z.literal("hook"),
  durationInFrames: z.number().int().positive(),
  badge: z.string(),
  title: z.string(),
  highlightWord: z.string(),
});

export const ScreenshotSceneSchema = z.object({
  type: z.literal("screenshot"),
  durationInFrames: z.number().int().positive(),
  src: z.string(),
  zoomScale: z.number().min(1).max(4).default(1.35),
  /** 0..1, horizontal focus point of the zoom */
  focusX: z.number().min(0).max(1),
  /** 0..1, vertical focus point of the zoom */
  focusY: z.number().min(0).max(1),
  /** 0..1 normalized [x, y] target inside the screenshot */
  cursorTarget: z.tuple([z.number(), z.number()]).optional(),
  caption: z.string(),
});

export const ScreenRecordSceneSchema = z.object({
  type: z.literal("screen-record"),
  durationInFrames: z.number().int().positive(),
  src: z.string(),
  playbackRate: z.number().positive().default(1.25),
  calloutText: z.string(),
});

export const OutroSceneSchema = z.object({
  type: z.literal("outro"),
  durationInFrames: z.number().int().positive(),
  logoSrc: z.string(),
  title: z.string(),
  ctaText: z.string(),
  url: z.string(),
});

export const SceneSchema = z.discriminatedUnion("type", [
  HookSceneSchema,
  ScreenshotSceneSchema,
  ScreenRecordSceneSchema,
  OutroSceneSchema,
]);

export const VideoInputSchema = z.object({
  themeColor: zColor(),
  bgmSrc: z.string().optional(),
  scenes: z.array(SceneSchema),
});

export type HookScene = z.infer<typeof HookSceneSchema>;
export type ScreenshotScene = z.infer<typeof ScreenshotSceneSchema>;
export type ScreenRecordScene = z.infer<typeof ScreenRecordSceneSchema>;
export type OutroScene = z.infer<typeof OutroSceneSchema>;
export type Scene = z.infer<typeof SceneSchema>;
export type VideoInput = z.infer<typeof VideoInputSchema>;

export const TRANSITION_FRAMES = 15;
