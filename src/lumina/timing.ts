import { Easing, interpolate } from "remotion";

export const CLAMP = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/**
 * Slide k (k ≥ 1) starts its glass transition at k*S and finishes at k*S+T.
 * Total duration = N*S.
 */
export const getSlideState = (frame: number, fps: number, n: number, seconds: number, transitionSeconds: number) => {
  const S = Math.round(seconds * fps);
  const T = Math.min(S, Math.round(transitionSeconds * fps));
  const index = Math.min(n - 1, Math.max(0, Math.floor(frame / S)));
  const local = frame - index * S;
  const progress =
    index === 0
      ? 1
      : interpolate(local, [0, T], [0, 1], { ...CLAMP, easing: Easing.inOut(Easing.quad) });
  return { S, T, index, local, progress, from: Math.max(0, index - 1), to: index };
};
