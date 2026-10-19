import { z } from "zod";
import { zColor } from "@remotion/zod-types";

export const LaunchVideoSchema = z.object({
  brandName: z.string(),
  url: z.string(),
  /** Built-in vector mark is used unless logoSrc (public/ path or https URL) is set. */
  logo: z.object({
    kind: z.enum(["builtin", "image"]).default("builtin"),
    logoSrc: z.string().optional(),
  }),
  accentColor: zColor().default("#0070F3"),
  bgmSrc: z.string().optional(),
  bpm: z.number().min(60).max(200).default(120),
  heroQuestion: z.string(),
  suggestions: z.array(z.string()).min(3),
  typedPrompts: z.tuple([z.string(), z.string()]),
  followUpPrompt: z.string(),
  editPrompt: z.string(),
  editTargetLabel: z.string(),
  appName: z.string(),
  codeSnippet: z.string(),
  dropdownOptions: z.array(z.string()).min(2),
  gridPrompts: z.array(z.string()).min(3),
  /** Optional images (public/ path or https URL) used as tiles in the infinite grid. */
  screenshots: z.array(z.string()).optional(),
});

export type LaunchVideoProps = z.infer<typeof LaunchVideoSchema>;
