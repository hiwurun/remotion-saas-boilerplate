import React, { useLayoutEffect, useRef } from "react";
import { DATASET, PEAK, PROTECT } from "../data";
import { SceneState, SurfaceScene } from "../surface3d";

/** Owns the WebGL renderer; re-renders synchronously on every frame from the pure `state`. */
export const SurfaceCanvas: React.FC<{ state: SceneState; width: number; height: number }> = ({ state, width, height }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<SurfaceScene | null>(null);
  useLayoutEffect(() => {
    const scene = new SurfaceScene(canvasRef.current!, width, height, DATASET, {
      // term line = protection strike (PROTECT_STRIKE) across expiries, not ATM
      termPoints: PROTECT.map((t) => ({ days: t.days, strike: PEAK.strike, vol: t.vol })),
      peak: PEAK,
    });
    sceneRef.current = scene;
    return () => {
      scene.dispose();
      sceneRef.current = null;
    };
  }, [width, height]);
  useLayoutEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    scene.update(state);
    scene.render();
  });
  return <canvas ref={canvasRef} width={width} height={height} style={{ position: "absolute", inset: 0, width, height }} />;
};
