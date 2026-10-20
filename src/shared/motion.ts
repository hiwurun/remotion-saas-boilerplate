import { Easing } from "remotion";

/** Shared by launch + openvlab-market (were byte-identical in both theme.ts files). */
export const CLAMP = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
export const EASE = Easing.bezier(0.7, 0, 0.12, 1);
export const EASE_OUT = Easing.bezier(0.16, 1, 0.3, 1);
