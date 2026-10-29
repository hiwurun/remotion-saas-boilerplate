import * as THREE from "three";
import { LineSegments2 } from "three/examples/jsm/lines/LineSegments2.js";
import { LineSegmentsGeometry } from "three/examples/jsm/lines/LineSegmentsGeometry.js";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js";
import { HEAT_W, HEAT_H, UT, HEIGHT, LAYER_J, LAYER_T, NX, NZ, PROFIT, TS, X_HALF, ZC, CX, colorValue, heatTexture, xOf, zOf } from "./data";

export type HookState = {
  camPos: THREE.Vector3;
  camQuat: THREE.Quaternion;
  fov: number;
  /** 0..1 rows appear one after another (front -> back) */
  reveal: number;
  /** 0..1 hairline draws out from the centre */
  hairDraw: number;
  hairAlpha: number;
  /** 0..1 flatten heights + stretch to the table aspect */
  flat: number;
  /** 0..1 glass colours -> heat-table cells */
  heat: number;
  /** price = S0 line: brushed progress along time 0..1 and its intensity */
  lineDraw: number;
  lineAlpha: number;
  /** 0..1 global multiplier of surface opacity (side slice dims the glass) */
  glass: number;
  /** layer curves: base opacity, and for the slice view a scan front (calendar t) that lights curves up to it; <0 = off */
  layerAlpha: number;
  scan: number;
  /** price-direction faint grid opacity */
  gridAlpha: number;
  orbT: number;
  orbAlpha: number;
  /** extra rim glow (impact) */
  glow: number;
  fogNear: number;
  fogFar: number;
};

const YELLOW = new THREE.Color("#f4b400");
const WARM = new THREE.Color("#ffe7a3");
const GREEN = [22, 134, 98]; // #16c784, low brightness
const RED = [178, 46, 58]; // #ea3943, low brightness
const GRAPHITE = [20, 23, 27];

const SURF_VERT = /* glsl */ `
attribute float aAlpha;
attribute vec3 aColor;
varying vec3 vWorld;
varying vec3 vNormalW;
varying vec3 vCol;
varying float vA;
varying vec2 vUv2;
void main() {
  vWorld = position;
  vNormalW = normal;
  vCol = aColor;
  vA = aAlpha;
  vUv2 = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;
const SURF_FRAG = /* glsl */ `
uniform sampler2D uTex;
uniform float uHeat;
uniform float uGlass;
uniform float uGlow;
uniform vec2 uFog;
varying vec3 vWorld;
varying vec3 vNormalW;
varying vec3 vCol;
varying float vA;
varying vec2 vUv2;
void main() {
  vec3 N = normalize(vNormalW);
  if (!gl_FrontFacing) N = -N;
  vec3 V = normalize(cameraPosition - vWorld);
  float ndv = clamp(dot(N, V), 0.0, 1.0);
  float fres = pow(1.0 - ndv, 2.4);
  vec3 L = normalize(vec3(-0.45, 0.85, -0.35));
  float diff = 0.42 + 0.58 * max(dot(N, L), 0.0);
  float spec = pow(max(dot(N, normalize(L + V)), 0.0), 38.0);
  vec3 glass = vCol * diff + vec3(0.05, 0.055, 0.06) * spec;
  vec3 heatC = texture2D(uTex, vUv2).rgb;
  vec3 col = mix(glass, heatC, uHeat);
  vec3 rim = vec3(0.50, 0.58, 0.60) * fres * (0.16 + 0.35 * uGlow) * (1.0 - 0.9 * uHeat);
  float a = mix(0.2 + 0.42 * fres + 0.12 * diff, 0.96, uHeat) * vA * mix(uGlass, 1.0, uHeat);
  float d = distance(cameraPosition, vWorld);
  float fog = smoothstep(uFog.x, uFog.y, d);
  col = (col + rim) * (1.0 - 0.7 * fog);
  a *= 1.0 - 0.85 * fog;
  gl_FragColor = vec4(col, a);
}`;
const STRIP_VERT = /* glsl */ `
attribute float aAlpha;
varying float vA;
varying float vU;
void main() {
  vA = aAlpha;
  vU = uv.x;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;
const STRIP_FRAG = /* glsl */ `
uniform float uI;
varying float vA;
varying float vU;
void main() {
  float u = vU * 2.0 - 1.0;
  float g = exp(-u * u * 7.0);
  float core = exp(-u * u * 110.0);
  vec3 c = vec3(0.957, 0.706, 0.0) * g * 0.38 + vec3(1.0, 0.9, 0.55) * core * 0.6;
  gl_FragColor = vec4(c * uI * vA, (g * 0.3 + core * 0.6) * vA * uI);
}`;

class FatLine {
  readonly line: LineSegments2;
  readonly mat: LineMaterial;
  readonly arr: Float32Array;
  private geo: LineSegmentsGeometry;
  constructor(readonly n: number, color: THREE.Color, width: number, resolution: THREE.Vector2) {
    this.arr = new Float32Array((n - 1) * 6);
    this.geo = new LineSegmentsGeometry();
    this.geo.setPositions(this.arr);
    this.mat = new LineMaterial({ color: color.getHex(), linewidth: width, transparent: true, depthWrite: false, opacity: 1 });
    this.mat.resolution.copy(resolution);
    this.line = new LineSegments2(this.geo, this.mat);
    this.line.frustumCulled = false;
    this.line.renderOrder = 5;
  }
  set(i: number, x: number, y: number, z: number) {
    // point i is the end of segment i-1 and the start of segment i
    if (i > 0) {
      const o = (i - 1) * 6 + 3;
      this.arr[o] = x;
      this.arr[o + 1] = y;
      this.arr[o + 2] = z;
    }
    if (i < this.n - 1) {
      const o = i * 6;
      this.arr[o] = x;
      this.arr[o + 1] = y;
      this.arr[o + 2] = z;
    }
  }
  commit() {
    (this.geo.attributes.instanceStart as THREE.InterleavedBufferAttribute).data.needsUpdate = true;
  }
  dispose() {
    this.geo.dispose();
    this.mat.dispose();
  }
}

const zW = (j: number, flat: number) => zOf(TS[j]) + (zOf(UT[j]) - zOf(TS[j])) * flat;
const smooth01 = (x: number) => {
  const c = Math.min(1, Math.max(0, x));
  return c * c * (3 - 2 * c);
};

export class HookScene {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly camera: THREE.PerspectiveCamera;
  private geo = new THREE.BufferGeometry();
  private pos: Float32Array;
  private alpha: Float32Array;
  private matBack: THREE.ShaderMaterial;
  private matFront: THREE.ShaderMaterial;
  private tex: THREE.DataTexture;
  private layers: FatLine[] = [];
  private grids: { fl: FatLine; i: number }[] = [];
  private centerLine: FatLine;
  private strip: THREE.Mesh;
  private stripGeo = new THREE.BufferGeometry();
  private stripPos: Float32Array;
  private stripAlpha: Float32Array;
  private stripMat: THREE.ShaderMaterial;
  private orb: THREE.Sprite;
  private rowR = new Float32Array(NZ);
  private prevCM: boolean;

  constructor(canvas: HTMLCanvasElement, readonly width: number, readonly height: number) {
    this.prevCM = THREE.ColorManagement.enabled;
    THREE.ColorManagement.enabled = false; // all colours below are authored as final sRGB values
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
    this.renderer.setPixelRatio(1);
    this.renderer.setSize(width, height, false);
    this.renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
    this.renderer.setClearColor(0x000000, 0);
    this.camera = new THREE.PerspectiveCamera(30, width / height, 0.1, 120);
    const res = new THREE.Vector2(width, height);

    /* ---- surface mesh ---- */
    const nv = NX * NZ;
    this.pos = new Float32Array(nv * 3);
    this.alpha = new Float32Array(nv);
    const col = new Float32Array(nv * 3);
    const uv = new Float32Array(nv * 2);
    for (let j = 0; j < NZ; j++) {
      for (let i = 0; i < NX; i++) {
        const k = j * NX + i;
        const v = colorValue(PROFIT[k]);
        const m = Math.pow(Math.abs(v), 0.72);
        const tgt = v >= 0 ? RED : GREEN;
        for (let c = 0; c < 3; c++) col[k * 3 + c] = (GRAPHITE[c] + (tgt[c] - GRAPHITE[c]) * m) / 255;
        uv[k * 2] = i / (NX - 1);
        uv[k * 2 + 1] = UT[j];
      }
    }
    const idx: number[] = [];
    for (let j = 0; j < NZ - 1; j++)
      for (let i = 0; i < NX - 1; i++) {
        const a = j * NX + i;
        const b = a + 1;
        const c = a + NX;
        const d = c + 1;
        idx.push(a, c, b, b, c, d);
      }
    this.geo.setAttribute("position", new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage));
    this.geo.setAttribute("normal", new THREE.BufferAttribute(new Float32Array(nv * 3), 3).setUsage(THREE.DynamicDrawUsage));
    this.geo.setAttribute("aAlpha", new THREE.BufferAttribute(this.alpha, 1).setUsage(THREE.DynamicDrawUsage));
    this.geo.setAttribute("aColor", new THREE.BufferAttribute(col, 3));
    this.geo.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
    this.geo.setIndex(idx);
    this.tex = new THREE.DataTexture(heatTexture(), HEAT_W, HEAT_H, THREE.RGBAFormat);
    this.tex.magFilter = THREE.LinearFilter;
    this.tex.minFilter = THREE.LinearMipmapLinearFilter;
    this.tex.generateMipmaps = true;
    this.tex.anisotropy = 8;
    this.tex.needsUpdate = true;
    const uniforms = {
      uTex: { value: this.tex },
      uHeat: { value: 0 },
      uGlass: { value: 1 },
      uGlow: { value: 0 },
      uFog: { value: new THREE.Vector2(14, 34) },
    };
    const mk = (side: THREE.Side) =>
      new THREE.ShaderMaterial({ vertexShader: SURF_VERT, fragmentShader: SURF_FRAG, uniforms, transparent: true, depthWrite: false, side });
    this.matBack = mk(THREE.BackSide);
    this.matFront = mk(THREE.FrontSide);
    const back = new THREE.Mesh(this.geo, this.matBack);
    const front = new THREE.Mesh(this.geo, this.matFront);
    back.renderOrder = 1;
    front.renderOrder = 2;
    back.frustumCulled = front.frustumCulled = false;
    this.scene.add(back, front);

    /* ---- layer curves (one per timeline date) ---- */
    LAYER_J.forEach((_, k) => {
      const fl = new FatLine(NX, k === 0 ? WARM : YELLOW, k === 0 ? 1.6 : 1.1, res);
      this.layers.push(fl);
      this.scene.add(fl.line);
    });
    /* ---- faint price-direction grid ---- */
    for (let i = 0; i < NX; i += 20) {
      if (i === CX) continue;
      const fl = new FatLine(NZ, YELLOW, 0.8, res);
      this.grids.push({ fl, i });
      this.scene.add(fl.line);
    }
    /* ---- the price = S0 line: crisp core + soft strip glow lying on the glass ---- */
    this.centerLine = new FatLine(NZ, WARM, 2.2, res);
    this.scene.add(this.centerLine.line);
    const SW = 3.2; // strip half width in columns
    this.stripPos = new Float32Array(NZ * 2 * 3);
    this.stripAlpha = new Float32Array(NZ * 2);
    const suv = new Float32Array(NZ * 2 * 2);
    const sidx: number[] = [];
    for (let j = 0; j < NZ; j++) {
      suv[(j * 2) * 2] = 0;
      suv[(j * 2 + 1) * 2] = 1;
      if (j < NZ - 1) {
        const a = j * 2;
        sidx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
      }
    }
    this.stripGeo.setAttribute("position", new THREE.BufferAttribute(this.stripPos, 3).setUsage(THREE.DynamicDrawUsage));
    this.stripGeo.setAttribute("aAlpha", new THREE.BufferAttribute(this.stripAlpha, 1).setUsage(THREE.DynamicDrawUsage));
    this.stripGeo.setAttribute("uv", new THREE.BufferAttribute(suv, 2));
    this.stripGeo.setIndex(sidx);
    this.stripMat = new THREE.ShaderMaterial({
      vertexShader: STRIP_VERT,
      fragmentShader: STRIP_FRAG,
      uniforms: { uI: { value: 1 } },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });
    this.strip = new THREE.Mesh(this.stripGeo, this.stripMat);
    this.strip.frustumCulled = false;
    this.strip.renderOrder = 4;
    this.scene.add(this.strip);
    this.stripWidthCols = SW;

    /* ---- orb ---- */
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const g = c.getContext("2d")!;
    const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, "rgba(255,244,205,1)");
    grad.addColorStop(0.12, "rgba(255,226,140,0.95)");
    grad.addColorStop(0.35, "rgba(244,180,0,0.28)");
    grad.addColorStop(1, "rgba(244,180,0,0)");
    g.fillStyle = grad;
    g.fillRect(0, 0, 128, 128);
    const ot = new THREE.CanvasTexture(c);
    this.orb = new THREE.Sprite(new THREE.SpriteMaterial({ map: ot, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    this.orb.renderOrder = 6;
    this.scene.add(this.orb);
  }
  private stripWidthCols = 5;

  update(st: HookState) {
    const fl = st.flat;
    const sx = 1 - 0.3 * fl;
    const sz = 1 + 0.45 * fl;
    const sy = 1 - fl;
    const L = 0.2;
    for (let j = 0; j < NZ; j++) this.rowR[j] = smooth01((st.reveal * (1 + L) - j / (NZ - 1)) / L);
    const P = this.pos;
    for (let j = 0; j < NZ; j++) {
      const r = this.rowR[j];
      const z = ZC + (zW(j, fl) - ZC) * sz;
      for (let i = 0; i < NX; i++) {
        const k = j * NX + i;
        P[k * 3] = xOf(i) * sx;
        P[k * 3 + 1] = HEIGHT(j, i) * r * sy;
        P[k * 3 + 2] = z;
        this.alpha[k] = r;
      }
    }
    this.geo.attributes.position.needsUpdate = true;
    this.geo.attributes.aAlpha.needsUpdate = true;
    this.geo.computeVertexNormals();
    const u = this.matFront.uniforms;
    u.uHeat.value = st.heat;
    u.uGlass.value = st.glass;
    u.uGlow.value = st.glow;
    (u.uFog.value as THREE.Vector2).set(st.fogNear, st.fogFar);

    /* layer curves */
    this.layers.forEach((fl2, k) => {
      const j = LAYER_J[k];
      const r = this.rowR[j];
      const z = ZC + (zW(j, fl) - ZC) * sz;
      const hd = k === 0 ? st.hairDraw * X_HALF * sx : 1e9;
      for (let i = 0; i < NX; i++) {
        const x = Math.max(-hd, Math.min(hd, xOf(i) * sx));
        fl2.set(i, x, HEIGHT(j, i) * r * sy + 0.004, z);
      }
      fl2.commit();
      let a: number;
      if (k === 0) a = Math.max(st.hairAlpha, 0) * (0.55 + 0.45 * (1 - st.heat));
      else if (st.scan >= 0) a = LAYER_T[k] <= st.scan + 1e-4 ? 0.85 : 0.1;
      else a = st.layerAlpha * (1 - 0.7 * st.heat);
      if (k > 0) a *= r;
      fl2.line.visible = a > 0.01;
      fl2.mat.opacity = Math.min(1, a);
      if (k > 0) fl2.mat.linewidth = st.scan >= 0 && LAYER_T[k] <= st.scan + 1e-4 ? 1.8 : 1.1;
      if (st.scan >= 0 && k > 0) {
        // the curve at the scan front is the bright one
        const near = Math.abs(LAYER_T[k] - st.scan) < 0.05 ? 1 : 0;
        fl2.mat.color.set(near ? WARM : YELLOW);
      } else if (k > 0) fl2.mat.color.copy(YELLOW);
    });
    this.grids.forEach(({ fl: g, i }) => {
      let last = 0;
      for (let j = 0; j < NZ; j++) if (this.rowR[j] > 0.02) last = j;
      for (let j = 0; j < NZ; j++) {
        const jj = Math.min(j, last);
        const z = ZC + (zW(jj, fl) - ZC) * sz;
        g.set(j, xOf(i) * sx, HEIGHT(jj, i) * this.rowR[jj] * sy + 0.003, z);
      }
      g.commit();
      const edge = i === 0 || i === NX - 1;
      g.line.visible = st.gridAlpha * (1 - st.heat) > 0.01;
      g.mat.opacity = st.gridAlpha * (1 - st.heat) * (edge ? 3 : 1);
      if (edge) g.mat.color.set('#b9c4c8');
    });

    /* centre line + strip */
    const SW = this.stripWidthCols;
    const orbHead = Math.min(1, Math.max(0, st.orbT));
    let jd = 0;
    for (let j = 0; j < NZ; j++) if (TS[j] <= st.lineDraw) jd = j;
    const headT = st.lineDraw;
    const cl = this.centerLine;
    for (let j = 0; j < NZ; j++) {
      const jj = Math.min(j, jd);
      const z = ZC + (zW(jj, fl) - ZC) * sz;
      cl.set(j, 0, HEIGHT(jj, CX) * this.rowR[jj] * sy + 0.012, z);
      const zz = ZC + (zW(j, fl) - ZC) * sz;
      const trail = TS[j] <= orbHead ? 0.28 + 0.72 * Math.exp(-(orbHead - TS[j]) / 0.09) : 0.28;
      const a = Math.min(1, Math.max(0, (headT - TS[j]) / 0.035)) * this.rowR[j] * trail;
      for (let s = 0; s < 2; s++) {
        const colF = CX + (s === 0 ? -SW : SW);
        const c0 = Math.floor(colF);
        const cf = colF - c0;
        const o = (j * 2 + s) * 3;
        this.stripPos[o] = xOf(colF) * sx;
        this.stripPos[o + 1] = (HEIGHT(j, c0) * (1 - cf) + HEIGHT(j, Math.min(NX - 1, c0 + 1)) * cf) * this.rowR[j] * sy + 0.02;
        this.stripPos[o + 2] = zz;
        this.stripAlpha[j * 2 + s] = a;
      }
    }
    cl.commit();
    cl.line.visible = st.lineAlpha > 0.01 && st.lineDraw > 0.001;
    cl.mat.opacity = Math.min(1, st.lineAlpha);
    this.stripGeo.attributes.position.needsUpdate = true;
    this.stripGeo.attributes.aAlpha.needsUpdate = true;
    this.stripMat.uniforms.uI.value = st.lineAlpha;
    this.strip.visible = st.lineAlpha > 0.01;

    /* orb: sits on the line at orbT */
    const ot = Math.min(1, Math.max(0, st.orbT));
    let oj = 0;
    for (let j = 0; j < NZ; j++) if (TS[j] <= ot) oj = j;
    this.orb.position.set(0, HEIGHT(oj, CX) * this.rowR[oj] * sy + 0.05, ZC + (zW(oj, fl) - ZC) * sz);
    this.orb.scale.setScalar(0.9 + st.glow * 1.5);
    (this.orb.material as THREE.SpriteMaterial).opacity = st.orbAlpha;
    this.orb.visible = st.orbAlpha > 0.01;

    this.camera.position.copy(st.camPos);
    this.camera.quaternion.copy(st.camQuat);
    this.camera.fov = st.fov;
    this.camera.updateProjectionMatrix();
    this.camera.updateMatrixWorld();
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    this.geo.dispose();
    this.stripGeo.dispose();
    this.tex.dispose();
    this.matBack.dispose();
    this.matFront.dispose();
    this.stripMat.dispose();
    this.layers.forEach((l) => l.dispose());
    this.grids.forEach((g) => g.fl.dispose());
    this.centerLine.dispose();
    (this.orb.material as THREE.SpriteMaterial).map?.dispose();
    this.orb.material.dispose();
    this.renderer.dispose();
    THREE.ColorManagement.enabled = this.prevCM;
  }
}
