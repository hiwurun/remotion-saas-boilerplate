import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { cancelRender, continueRender, delayRender, staticFile } from "remotion";
import { FRAGMENT_SHADER, VERTEX_SHADER } from "./shader";
import { resolveSrc } from "./schema";

type GLState = {
  gl: WebGLRenderingContext;
  program: WebGLProgram;
  textures: { tex: WebGLTexture; w: number; h: number }[];
  u: Record<string, WebGLUniformLocation | null>;
};

const compile = (gl: WebGLRenderingContext, type: number, src: string) => {
  const s = gl.createShader(type)!;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? "shader error");
  return s;
};

const loadImage = (url: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    if (/^https?:\/\//.test(url)) img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load ${url}`));
    img.src = url;
  });

/** Frame-driven WebGL glass-refraction slider. Draws synchronously for every frame. */
export const GlassTransitionCanvas: React.FC<{
  width: number;
  height: number;
  sources: string[];
  from: number;
  to: number;
  progress: number;
}> = ({ width, height, sources, from, to, progress }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<GLState | null>(null);
  const [ready, setReady] = useState(false);
  const [handle] = useState(() => delayRender("Loading Lumina textures"));
  const continued = useRef(false);
  const key = sources.join("|");

  useEffect(() => {
    let cancelled = false;
    const canvas = canvasRef.current!;
    const gl = canvas.getContext("webgl", { preserveDrawingBuffer: true, antialias: false, premultipliedAlpha: false });
    if (!gl) {
      cancelRender(new Error("WebGL not available – try --gl=angle or --gl=swangle"));
      return;
    }
    Promise.all(sources.map((s) => loadImage(resolveSrc(s, staticFile))))
      .then((imgs) => {
        if (cancelled) return;
        const program = gl.createProgram()!;
        gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERTEX_SHADER));
        gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER));
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program) ?? "link error");
        gl.useProgram(program);
        const buf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
        const loc = gl.getAttribLocation(program, "position");
        gl.enableVertexAttribArray(loc);
        gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        const textures = imgs.map((img) => {
          const tex = gl.createTexture()!;
          gl.bindTexture(gl.TEXTURE_2D, tex);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
          return { tex, w: img.naturalWidth, h: img.naturalHeight };
        });
        const u: GLState["u"] = {};
        ["uTexture1", "uTexture2", "uProgress", "uResolution", "uTexture1Size", "uTexture2Size"].forEach(
          (n) => (u[n] = gl.getUniformLocation(program, n)),
        );
        stateRef.current = { gl, program, textures, u };
        setReady(true);
      })
      .catch((err) => cancelRender(err));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useLayoutEffect(() => {
    const st = stateRef.current;
    if (!ready || !st) return;
    const { gl, textures, u } = st;
    const a = textures[from];
    const b = textures[to];
    gl.viewport(0, 0, width, height);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, a.tex);
    gl.uniform1i(u.uTexture1, 0);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, b.tex);
    gl.uniform1i(u.uTexture2, 1);
    gl.uniform1f(u.uProgress, progress);
    gl.uniform2f(u.uResolution, width, height);
    gl.uniform2f(u.uTexture1Size, a.w, a.h);
    gl.uniform2f(u.uTexture2Size, b.w, b.h);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.finish();
    if (!continued.current) {
      continued.current = true;
      continueRender(handle);
    }
  }, [ready, from, to, progress, width, height, handle]);

  return <canvas ref={canvasRef} width={width} height={height} style={{ position: "absolute", inset: 0, width, height }} />;
};
