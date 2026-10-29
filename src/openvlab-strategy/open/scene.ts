import * as THREE from "three";
import { LineSegments2 } from "three/examples/jsm/lines/LineSegments2.js";
import { LineSegmentsGeometry } from "three/examples/jsm/lines/LineSegmentsGeometry.js";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js";
import { CX, DEPTH, Y_EXAG, HEIGHT, LAYER_J, LAYER_T, NCOLS, NROWS, NX, NZ, PROFIT, TS, UT, X_HALF, ZC, colorValue, heatTextureData, lineY, uniformT, xOf, zOf } from "./surface";

export type SceneState = {
  camPos: THREE.Vector3;
  camQuat: THREE.Quaternion;
  fov: number;
  /** screen-space shift of the whole image in px (keeps the flat plane exactly on the real table) */
  viewOffset: [number, number];
  /** 0..1 rows appear one after another (front -> back) */
  reveal: number;
  /** 0..1 flatten heights, warp dates to table columns, stretch to the table aspect */
  flat: number;
  /** stretch factor of the date axis (1 -> FLAT_SZ) */
  sz: number;
  /** 0..1 glass colours -> real table cell colours */
  heat: number;
  /** head of the price line (calendar fraction) and its overall intensity */
  headT: number;
  lineAlpha: number;
  glass: number;
  layerAlpha: number;
  gridAlpha: number;
  /** orb + trail (calendar fractions, newest first) */
  orbAlpha: number;
  trailT: number[];
  glow: number;
  fogNear: number;
  fogFar: number;
};

const YELLOW = new THREE.Color("#f4b400");
const WARM = new THREE.Color("#ffe7a3");
const GREEN = [22, 134, 98];
const RED = [178, 46, 58];
const GRAPHITE = [20, 23, 27];
export const TRAIL_N = 16;

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
  float diff = 0.46 + 0.54 * max(dot(N, L), 0.0);
  float spec = pow(max(dot(N, normalize(L + V)), 0.0), 38.0);
  vec3 glass = vCol * diff * 1.3 + vec3(0.05, 0.055, 0.06) * spec;
  vec3 heatC = texture2D(uTex, vec2(clamp(vUv2.x, 0.0, 1.0), clamp(vUv2.y, 0.0, 1.0))).rgb;
  vec3 col = mix(glass, heatC, uHeat);
  vec3 rim = vec3(0.50, 0.58, 0.60) * fres * (0.16 + 0.35 * uGlow) * (1.0 - uHeat);
  float a = mix(0.34 + 0.40 * fres + 0.14 * diff, 1.0, uHeat) * vA * mix(uGlass, 1.0, uHeat);
  float d = distance(cameraPosition, vWorld);
  float fog = smoothstep(uFog.x, uFog.y, d) * (1.0 - uHeat);
  // height shading: the high (early) part is bright, the low (late) part falls into shadow, so the collapse reads even head-on
  float hs = 1.0 + 0.5 * clamp(vWorld.y / 3.2, -1.0, 1.0) * (1.0 - uHeat);
  col = (col * hs + rim) * (1.0 - 0.7 * fog);
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
  vec3 c = vec3(0.957, 0.706, 0.0) * g * 0.34 + vec3(1.0, 0.9, 0.55) * core * 0.5;
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

const smooth01 = (x: number) => {
  const c = Math.min(1, Math.max(0, x));
  return c * c * (3 - 2 * c);
};
/** z of calendar fraction t: calendar spacing -> table-column spacing as `flat` goes 0 -> 1, stretched about the centre by sz */
export const zWorld = (t: number, flat: number, sz: number) => ZC + (zOf(t) + (uniformT(t) * DEPTH - zOf(t)) * flat - ZC) * sz;
const zIdx = (j: number, flat: number, sz: number) => ZC + (zOf(TS[j]) + (UT[j] * DEPTH - zOf(TS[j])) * flat - ZC) * sz;

export class SceneGL {
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
  private trail: THREE.Sprite[] = [];
  private rowR = new Float32Array(NZ);
  private prevCM: boolean;
  private stripWidthCols = 3.2;

  constructor(canvas: HTMLCanvasElement, readonly width: number, readonly height: number) {
    this.prevCM = THREE.ColorManagement.enabled;
    THREE.ColorManagement.enabled = false; // colours are authored as final sRGB values
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
    this.renderer.setPixelRatio(1);
    this.renderer.setSize(width, height, false);
    this.renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
    this.renderer.setClearColor(0x000000, 0);
    this.camera = new THREE.PerspectiveCamera(30, width / height, 0.1, 160);
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
    // 25 (price) x 18 (date) real table cells, nearest-filtered so every cell edge is crisp and lands on the DOM cell edge
    this.tex = new THREE.DataTexture(heatTextureData(), NROWS, NCOLS, THREE.RGBAFormat);
    this.tex.magFilter = THREE.NearestFilter;
    this.tex.minFilter = THREE.NearestFilter;
    this.tex.generateMipmaps = false;
    this.tex.needsUpdate = true;
    const uniforms = {
      uTex: { value: this.tex },
      uHeat: { value: 0 },
      uGlass: { value: 1 },
      uGlow: { value: 0 },
      uFog: { value: new THREE.Vector2(20, 60) },
    };
    const mk = (side: THREE.Side) => new THREE.ShaderMaterial({ vertexShader: SURF_VERT, fragmentShader: SURF_FRAG, uniforms, transparent: true, depthWrite: false, side });
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
    /* ---- faint price-direction grid; the two outer ones are the cool-white glass edges ---- */
    for (let i = 0; i < NX; i += 20) {
      if (i === CX) continue;
      const fl = new FatLine(NZ, YELLOW, 0.8, res);
      this.grids.push({ fl, i });
      this.scene.add(fl.line);
    }
    /* ---- the price line: crisp core + soft strip glow lying on the glass ---- */
    this.centerLine = new FatLine(NZ, WARM, 1.4, res);
    this.scene.add(this.centerLine.line);
    this.stripPos = new Float32Array(NZ * 2 * 3);
    this.stripAlpha = new Float32Array(NZ * 2);
    const suv = new Float32Array(NZ * 2 * 2);
    const sidx: number[] = [];
    for (let j = 0; j < NZ; j++) {
      suv[j * 2 * 2] = 0;
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
    this.stripMat = new THREE.ShaderMaterial({ vertexShader: STRIP_VERT, fragmentShader: STRIP_FRAG, uniforms: { uI: { value: 1 } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
    this.strip = new THREE.Mesh(this.stripGeo, this.stripMat);
    this.strip.frustumCulled = false;
    this.strip.renderOrder = 4;
    this.scene.add(this.strip);

    /* ---- orb + trail (sprites sampled along the path) ---- */
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const g = c.getContext("2d")!;
    const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    /* small, restrained solid bright-yellow dot (no white-hot core) with a faint tight halo */
    grad.addColorStop(0, "rgba(255,206,40,1)");
    grad.addColorStop(0.1, "rgba(255,200,30,1)");
    grad.addColorStop(0.15, "rgba(250,184,10,0.5)");
    grad.addColorStop(0.4, "rgba(244,168,0,0.1)");
    grad.addColorStop(1, "rgba(244,168,0,0)");
    g.fillStyle = grad;
    g.fillRect(0, 0, 128, 128);
    const ot = new THREE.CanvasTexture(c);
    const mkSprite = () => {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: ot, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
      s.renderOrder = 6;
      this.scene.add(s);
      return s;
    };
    for (let i = 0; i < TRAIL_N; i++) this.trail.push(mkSprite());
    this.orb = mkSprite();
    this.orb.renderOrder = 7;
  }

  private pointAt(t: number, flat: number, sz: number, lift: number) {
    return new THREE.Vector3(0, lineY(t) * (1 - flat) * Y_EXAG + lift, zWorld(t, flat, sz));
  }

  update(st: SceneState) {
    const fl = st.flat;
    const sz = st.sz;
    const sy = (1 - fl) * Y_EXAG;
    const L = 0.2;
    for (let j = 0; j < NZ; j++) this.rowR[j] = smooth01((st.reveal * (1 + L) - j / (NZ - 1)) / L);
    const P = this.pos;
    for (let j = 0; j < NZ; j++) {
      const r = this.rowR[j];
      const z = zIdx(j, fl, sz);
      for (let i = 0; i < NX; i++) {
        const k = j * NX + i;
        P[k * 3] = xOf(i);
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
    this.layers.forEach((l, k) => {
      const j = LAYER_J[k];
      const r = this.rowR[j];
      const z = zIdx(j, fl, sz);
      for (let i = 0; i < NX; i++) l.set(i, xOf(i), HEIGHT(j, i) * r * sy + 0.004, z);
      l.commit();
      const a = st.layerAlpha * (1 - st.heat) * r * (k === 0 ? 2.2 : 1);
      l.line.visible = a > 0.01;
      l.mat.opacity = Math.min(1, a);
    });
    this.grids.forEach(({ fl: g, i }) => {
      let last = 0;
      for (let j = 0; j < NZ; j++) if (this.rowR[j] > 0.02) last = j;
      for (let j = 0; j < NZ; j++) {
        const jj = Math.min(j, last);
        g.set(j, xOf(i), HEIGHT(jj, i) * this.rowR[jj] * sy + 0.003, zIdx(jj, fl, sz));
      }
      g.commit();
      const edge = i === 0 || i === NX - 1;
      const a = st.gridAlpha * (1 - st.heat) * (edge ? 3 : 1);
      g.line.visible = a > 0.01;
      g.mat.opacity = a;
      if (edge) g.mat.color.set("#b9c4c8");
    });

    /* price line + strip glow: analytic head, so the head moves continuously (no snapping to sample rows) */
    const SW = this.stripWidthCols;
    const head = Math.min(1, Math.max(0, st.headT));
    const cl = this.centerLine;
    for (let j = 0; j < NZ; j++) {
      const tj = Math.min(TS[j], head);
      const r = this.rowR[j];
      cl.set(j, 0, lineY(tj) * r * sy + 0.012, zWorld(tj, fl, sz));
      const zz = zIdx(j, fl, sz);
      const a = Math.min(1, Math.max(0, (head - TS[j]) / 0.035)) * r * (0.3 + 0.7 * Math.exp(-Math.max(0, head - TS[j]) / 0.09));
      for (let s = 0; s < 2; s++) {
        const colF = CX + (s === 0 ? -SW : SW);
        const c0 = Math.floor(colF);
        const cf = colF - c0;
        const o = (j * 2 + s) * 3;
        this.stripPos[o] = xOf(colF);
        this.stripPos[o + 1] = (HEIGHT(j, c0) * (1 - cf) + HEIGHT(j, Math.min(NX - 1, c0 + 1)) * cf) * r * sy + 0.02;
        this.stripPos[o + 2] = zz;
        this.stripAlpha[j * 2 + s] = a;
      }
    }
    cl.commit();
    cl.line.visible = st.lineAlpha > 0.01 && head > 0.0005;
    cl.mat.opacity = Math.min(1, st.lineAlpha) * 0.7;
    this.stripGeo.attributes.position.needsUpdate = true;
    this.stripGeo.attributes.aAlpha.needsUpdate = true;
    this.stripMat.uniforms.uI.value = st.lineAlpha * 0.5;
    this.strip.visible = st.lineAlpha > 0.01;

    /* orb: analytic position at head; trail = the same path sampled at earlier moments (a real time-domain motion blur) */
    this.orb.position.copy(this.pointAt(head, fl, sz, 0.05));
    this.orb.scale.setScalar(0.5 + st.glow * 0.3);
    (this.orb.material as THREE.SpriteMaterial).opacity = st.orbAlpha;
    this.orb.visible = st.orbAlpha > 0.01;
    this.trail.forEach((s, i) => {
      const tt = st.trailT[i] ?? head;
      s.position.copy(this.pointAt(tt, fl, sz, 0.05));
      const k = 1 - i / TRAIL_N;
      s.scale.setScalar((0.5 + st.glow * 0.3) * (0.3 + 0.4 * k));
      (s.material as THREE.SpriteMaterial).opacity = st.orbAlpha * 0.28 * k * k;
      s.visible = st.orbAlpha > 0.01 && Math.abs(tt - head) > 1e-5;
    });

    this.camera.position.copy(st.camPos);
    this.camera.quaternion.copy(st.camQuat);
    this.camera.fov = st.fov;
    if (st.viewOffset[0] !== 0 || st.viewOffset[1] !== 0) this.camera.setViewOffset(this.width, this.height, -st.viewOffset[0], -st.viewOffset[1], this.width, this.height);
    else this.camera.clearViewOffset();
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
    [this.orb, ...this.trail].forEach((s) => s.material.dispose());
    (this.orb.material as THREE.SpriteMaterial).map?.dispose();
    this.renderer.dispose();
    THREE.ColorManagement.enabled = this.prevCM;
  }
}
export { X_HALF, LAYER_T, NCOLS };
