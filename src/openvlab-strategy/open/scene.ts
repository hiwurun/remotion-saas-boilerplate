import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { BOX, DEPTH, HEIGHT, NCOLS, NROWS, NX, NZ, P_HI, P_LO, P_MID, PROFIT, STRIKE, TICKS, TS, UT, X_HALF, ZC, heatTextureData, surfY, tOfDays, uniformT, xOf, xOfPrice, yOfPnl, zOf } from "./surface";

/**
 * v9 (pt76u): the opening 3D section is the approved "front_axes" still, ported 1:1 (cyan additive sheet + sheet grid, glowing first-day U,
 * expiry V, 15/7/2 day lines, the 6550 spine, box grids, ACES + bloom), built from the REAL model (MODEL.profit). No fall, no orb:
 * the surface is in its final form from its first frame. Then it flattens straight into the real ProfitTable (heat texture).
 *
 * Orientation: everything is built in table coordinates (x = price low->high, z = calendar first day -> expiry, y = P&L).
 * The still looks at the box from the first-day side with price increasing left -> right; that view has the opposite handedness of the
 * top-down table (price up, time right). The chart group therefore carries M(turn) = Rz(pi (1 - turn)) * diag(1, -1, 1):
 *   turn = 0 -> diag(-1, 1, 1) (exactly the still's x convention), turn = 1 -> diag(1, -1, 1), which on the flattened (y = 0) sheet is the identity.
 * The turn runs together with the flatten, so the parity change happens through a rotation of a sheet whose height is going to 0 (no mirror pop).
 */
export type SceneState = {
  camPos: THREE.Vector3;
  camQuat: THREE.Quaternion;
  fov: number;
  /** screen-space shift of the whole image in px (keeps the flat plane exactly on the real table) */
  viewOffset: [number, number];
  /** 0..1 rows fade in, first day -> expiry */
  reveal: number;
  /** 0..1 flatten heights, warp dates to table columns, stretch to the table aspect */
  flat: number;
  /** stretch factor of the date axis (v11: kept at 1) */
  sz: number;
  /** v11: stretch of the price axis (1 -> table aspect), so the flat sheet seen from the opposite side fills the table rect */
  sx: number;
  /** 0..1 cyan glow sheet -> real table cell colours */
  heat: number;
  /** 0..1 chart turn (see header) */
  turn: number;
  /** 1 = the still's framing (price 6250-6850 fills the box, still's y-scale), 0 = the full table range */
  crop: number;
  /** box grids / axis edges / ticks */
  box: number;
  /** hero lines (U, V, 15/7/2, 6550 spine) */
  lines: number;
  /** bloom strength */
  bloom: number;
  /** background gradient intensity (1 = the still's navy radial gradient, 0 = black) */
  bg: number;
};

/** M(turn), see header. Shared with the DOM labels. */
export const chartMatrix = (turn: number, m = new THREE.Matrix4()) => {
  const th = Math.PI * (1 - turn);
  const c = Math.cos(th);
  const s = Math.sin(th);
  return m.set(c, s, 0, 0, s, -c, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
};
/** the still's framing: price 6250..6850 spans the box width (main.js P_LO/P_HI), y-scale 3.7/37260 */
export const CROP_KX = (2 * X_HALF) / (xOfPrice(6850) - xOfPrice(6250));
export const CROP_KY = 42260 / 37260;
const _S = new THREE.Matrix4();
export const chartWorld = (turn: number, crop: number, m = new THREE.Matrix4(), sx = 1) => {
  chartMatrix(turn, m);
  _S.makeScale((1 + (CROP_KX - 1) * crop) * sx, 1 + (CROP_KY - 1) * crop, 1);
  return m.multiply(_S);
};


/** still colours are sRGB hex -> linear (the still ran with colour management; this renderer works in linear and grades at the end) */
const lin = (hex: number) => new THREE.Color(hex).convertSRGBToLinear();

const SURF_VERT = /* glsl */ `
attribute float aAlpha;
attribute float aP;
varying vec3 vW;
varying vec3 vN;
varying float vA;
varying float vP;
varying vec2 vUv2;
void main() {
  vec4 w = modelMatrix * vec4(position, 1.0);
  vW = w.xyz;
  vN = mat3(modelMatrix) * normal;
  vA = aAlpha;
  vP = aP;
  vUv2 = uv;
  gl_Position = projectionMatrix * viewMatrix * w;
}`;
/** front_axes sheet shader (main.js) verbatim, + the real-table heat colours for the flatten (premultiplied: alpha 0 = additive glow, alpha 1 = opaque cell) */
const SURF_FRAG = /* glsl */ `
uniform sampler2D uTex;
uniform float uHeat;
uniform float uPLo;
uniform float uPW;
uniform float uCrop;
varying vec3 vW;
varying vec3 vN;
varying float vA;
varying float vP;
varying vec2 vUv2;
float line(float x, float w) { float f = fwidth(x); return 1.0 - smoothstep(0.0, w * f, abs(fract(x - 0.5) - 0.5)); }
void main() {
  float keep = 1.0 - step(30000.0, vP);
  float loss = clamp(-vP / 37260.0, 0.0, 1.0);
  float edge = 0.30 + 0.70 * smoothstep(16000.0, -2000.0, vP);
  vec3 n = normalize(vN);
  vec3 V = normalize(cameraPosition - vW);
  if (dot(n, V) < 0.0) n = -n;
  vec3 L = normalize(vec3(-0.5, 0.9, -0.6));
  float diff = 0.35 + 0.65 * max(dot(n, L), 0.0);
  float fres = pow(1.0 - abs(dot(n, V)), 2.2);
  float steep = 1.0 - abs(normalize(vN).y);
  vec3 deep = vec3(0.02, 0.16, 0.30), mid = vec3(0.05, 0.55, 0.80), top = vec3(0.20, 0.75, 0.95);
  vec3 col = mix(top, mid, smoothstep(0.0, 0.35, loss));
  col = mix(col, deep, smoothstep(0.35, 1.0, loss));
  col *= diff;
  float price = uPLo + vUv2.x * uPW;
  float gx = line((price - 6250.0) / 25.0, 1.0) * 0.18;
  float gz = line(vW.z * 1.6, 1.0) * 0.16;
  float zero = 1.0 - smoothstep(0.0, 900.0, abs(vP));
  float a = (0.14 + 0.30 * steep + 0.40 * fres) * edge;
  vec3 c = col * a + vec3(0.25, 0.85, 1.0) * (gx + gz) * edge * (0.6 + loss) + vec3(0.3, 0.9, 1.0) * zero * 0.15 * edge;
  float far = smoothstep(10.0, 24.0, length(cameraPosition - vW));
  c *= 1.0 - 0.45 * far;
  float inside = step(6249.5, price) * step(price, 6850.5);
  float ck = mix(1.0, inside, uCrop);
  c *= keep * vA * ck;
  // v11: the flat sheet is seen top-down from the OPPOSITE (expiry) side: screen-right = 1 - u (mirrored chart), screen-down = v (first day at the top).
  // The table has time on screen-x and price on screen-y, so the cell at that screen spot is column 1 - u, price fraction 1 - v (transposed layout, no rotation).
  vec3 heatC = texture2D(uTex, vec2(clamp(1.0 - vUv2.y, 0.0, 1.0), clamp(1.0 - vUv2.x, 0.0, 1.0))).rgb;
  float h = uHeat * vA * ck;
  gl_FragColor = vec4(c * (1.0 - uHeat) + heatC * h, h);
}`;

/** full-screen background: the still's radial gradient (#0f1f36 -> #08111f -> #03060c), screen-fixed */
const BG_VERT = /* glsl */ `void main() { gl_Position = vec4(position.xy, 0.999, 1.0); }`;
const BG_FRAG = /* glsl */ `
uniform vec2 uRes;
uniform float uGrade;
uniform float uK;
vec3 s2l(vec3 c) { return mix(c / 12.92, pow((c + 0.055) / 1.055, vec3(2.4)), step(0.04045, c)); }
void main() {
  vec2 p = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y);
  float t = clamp((distance(p, vec2(0.5 * uRes.x, 0.46 * uRes.y)) - 50.0) / (0.75 * uRes.x - 50.0), 0.0, 1.0);
  vec3 c0 = vec3(15.0, 31.0, 54.0) / 255.0, c1 = vec3(8.0, 17.0, 31.0) / 255.0, c2 = vec3(3.0, 6.0, 12.0) / 255.0;
  vec3 c = t < 0.55 ? mix(c0, c1, t / 0.55) : mix(c1, c2, (t - 0.55) / 0.45);
  c *= uK;
  gl_FragColor = vec4(mix(c, s2l(c), uGrade), 1.0);
}`;
/** final grade = the still's OutputPass (ACES filmic, exposure 1, sRGB encode); uGrade -> 0 passes the exact table colours through */
const GradeShader = {
  uniforms: { tDiffuse: { value: null as THREE.Texture | null }, uGrade: { value: 1 } },
  vertexShader: /* glsl */ `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: /* glsl */ `
uniform sampler2D tDiffuse;
uniform float uGrade;
varying vec2 vUv;
vec3 RRTAndODTFit(vec3 v) { vec3 a = v * (v + 0.0245786) - 0.000090537; vec3 b = v * (0.983729 * v + 0.4329510) + 0.238081; return a / b; }
vec3 aces(vec3 color) {
  const mat3 ACESInputMat = mat3(vec3(0.59719, 0.07600, 0.02840), vec3(0.35458, 0.90834, 0.13383), vec3(0.04823, 0.01566, 0.83777));
  const mat3 ACESOutputMat = mat3(vec3(1.60475, -0.10208, -0.00327), vec3(-0.53108, 1.10813, -0.07276), vec3(-0.07367, -0.00605, 1.07602));
  color *= 1.0 / 0.6;
  color = ACESInputMat * color;
  color = RRTAndODTFit(color);
  color = ACESOutputMat * color;
  return clamp(color, 0.0, 1.0);
}
vec3 l2s(vec3 c) { return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c)); }
void main() {
  vec3 c = max(texture2D(tDiffuse, vUv).rgb, 0.0);
  gl_FragColor = vec4(mix(c, l2s(aces(c)), uGrade), 1.0);
}`,
};

/** a batch of 1px segments (main.js LineBasicMaterial) */
class Segs {
  readonly line: THREE.LineSegments;
  readonly mat: THREE.LineBasicMaterial;
  private geo = new THREE.BufferGeometry();
  constructor(pts: number[], color: THREE.Color, readonly base: number) {
    this.geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(pts), 3));
    this.mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: base, depthWrite: false, depthTest: false });
    this.line = new THREE.LineSegments(this.geo, this.mat);
    this.line.frustumCulled = false;
    this.line.renderOrder = 0;
  }
  show(a: number) {
    this.line.visible = a > 0.005;
    this.mat.opacity = Math.min(1, a) * this.base;
  }
  dispose() {
    this.geo.dispose();
    this.mat.dispose();
  }
}

/** main.js glowing edge: an additive TubeGeometry along a Catmull-Rom curve (rebuilt when its points change) */
class Tube {
  readonly line: THREE.Mesh;
  readonly mat: THREE.MeshBasicMaterial;
  private geo: THREE.BufferGeometry = new THREE.BufferGeometry();
  private key = "";
  constructor(hex: number, readonly r: number, readonly base: number) {
    this.mat = new THREE.MeshBasicMaterial({ color: lin(hex), transparent: true, opacity: base, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false });
    this.line = new THREE.Mesh(this.geo, this.mat);
    this.line.frustumCulled = false;
    this.line.renderOrder = 5;
  }
  build(key: string, pts: () => THREE.Vector3[]) {
    if (key === this.key) return;
    this.key = key;
    const p = pts();
    this.geo.dispose();
    this.geo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(p), p.length * 2, this.r, 10, false);
    this.line.geometry = this.geo;
  }
  show(a: number) {
    this.line.visible = a > 0.005;
    this.mat.opacity = this.base * Math.min(1, a);
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

const DAY_LINES = [15, 7, 2];
const PRICE_T = TICKS.price as readonly number[];
const DAY_T = TICKS.days as readonly number[];
const PNL_T = TICKS.pnl as readonly number[];
const TK = 0.18;

/** main.js axes block, in table coordinates (x0 = low-price wall, on screen-left in the still's view; z0 = first day, nearest; z1 = expiry) */
const axesGeometry = () => {
  const { z0, z1, y0, y1 } = BOX;
  const x0 = xOfPrice(6250);
  const x1 = xOfPrice(6850);
  const sg = Math.sign(x0); // outward from the low-price wall
  const zD = (d: number) => zOf(tOfDays(d));
  const Y = yOfPnl;
  const grid: number[] = [];
  const axis: number[] = [];
  const tick: number[] = [];
  const s = (arr: number[], a: number[], b: number[]) => arr.push(...a, ...b);
  for (const p of PRICE_T) s(grid, [xOfPrice(p), y0, z0], [xOfPrice(p), y0, z1]);
  for (const d of DAY_T) s(grid, [x0, y0, zD(d)], [x1, y0, zD(d)]);
  for (const v of PNL_T) {
    s(grid, [x0, Y(v), z1], [x1, Y(v), z1]);
    s(grid, [x0, Y(v), z0], [x0, Y(v), z1]);
  }
  for (const p of PRICE_T) s(grid, [xOfPrice(p), y0, z1], [xOfPrice(p), y1, z1]);
  for (const d of DAY_T) s(grid, [x0, y0, zD(d)], [x0, y1, zD(d)]);
  s(axis, [x0, y0, z0], [x1, y0, z0]);
  s(axis, [x0, y0, z0], [x0, y0, z1]);
  s(axis, [x0, y1, z1], [x0, y0, z1]);
  s(axis, [x0, y0, z1], [x1, y0, z1]);
  s(axis, [x1, y0, z1], [x1, y1, z1]);
  s(axis, [x0, y1, z1], [x1, y1, z1]);
  s(axis, [x0, y1, z0], [x0, y1, z1]);
  for (const p of PRICE_T) s(tick, [xOfPrice(p), y0, z0], [xOfPrice(p), y0, z0 - TK]);
  for (const d of DAY_T) s(tick, [x0, y0, zD(d)], [x0 + sg * TK, y0, zD(d)]);
  for (const v of PNL_T) s(tick, [x1, Y(v), z1], [x1 - sg * TK, Y(v), z1]);
  return { grid, axis, tick };
};

export class SceneGL {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly camera: THREE.PerspectiveCamera;
  private chart = new THREE.Group();
  private composer: EffectComposer;
  private bloom: UnrealBloomPass;
  private grade: ShaderPass;
  private bgMat: THREE.ShaderMaterial;
  private geo = new THREE.BufferGeometry();
  private pos: Float32Array;
  private alpha: Float32Array;
  private mat: THREE.ShaderMaterial;
  private tex: THREE.DataTexture;
  private grid: Segs;
  private axis: Segs;
  private ticks: Segs;
  private uCore: Tube;
  private uHalo: Tube;
  private vLine: Tube;
  private days: Tube[];
  private spine: Tube;
  private prevCM: boolean;

  constructor(canvas: HTMLCanvasElement, readonly width: number, readonly height: number) {
    this.prevCM = THREE.ColorManagement.enabled;
    THREE.ColorManagement.enabled = false; // colours are authored explicitly (linear in the scene, graded once at the end)
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
    this.renderer.setPixelRatio(1);
    this.renderer.setSize(width, height, false);
    this.renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
    this.renderer.toneMapping = THREE.NoToneMapping;
    this.renderer.setClearColor(0x000000, 0);
    this.camera = new THREE.PerspectiveCamera(37, width / height, 0.1, 200);
    const res = new THREE.Vector2(width, height);

    /* ---- background ---- */
    this.bgMat = new THREE.ShaderMaterial({ vertexShader: BG_VERT, fragmentShader: BG_FRAG, uniforms: { uRes: { value: res.clone() }, uGrade: { value: 1 }, uK: { value: 1 } }, depthTest: false, depthWrite: false });
    const bg = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.bgMat);
    bg.frustumCulled = false;
    bg.renderOrder = -100;
    this.scene.add(bg);

    /* ---- the sheet: price (x) x calendar (z), real MODEL.profit ---- */
    const nv = NX * NZ;
    this.pos = new Float32Array(nv * 3);
    this.alpha = new Float32Array(nv);
    const uv = new Float32Array(nv * 2);
    const idx: number[] = [];
    for (let j = 0; j < NZ; j++)
      for (let i = 0; i < NX; i++) {
        const k = j * NX + i;
        uv[k * 2] = i / (NX - 1); // price low -> high (= table texture u)
        uv[k * 2 + 1] = UT[j]; // table column
        if (i < NX - 1 && j < NZ - 1) idx.push(k, k + NX, k + 1, k + 1, k + NX, k + NX + 1);
      }
    this.geo.setAttribute("position", new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage));
    this.geo.setAttribute("normal", new THREE.BufferAttribute(new Float32Array(nv * 3), 3).setUsage(THREE.DynamicDrawUsage));
    this.geo.setAttribute("aAlpha", new THREE.BufferAttribute(this.alpha, 1).setUsage(THREE.DynamicDrawUsage));
    this.geo.setAttribute("aP", new THREE.BufferAttribute(PROFIT, 1));
    this.geo.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
    this.geo.setIndex(idx);
    this.tex = new THREE.DataTexture(heatTextureData(), NROWS, NCOLS, THREE.RGBAFormat);
    this.tex.magFilter = THREE.NearestFilter;
    this.tex.minFilter = THREE.NearestFilter;
    this.tex.generateMipmaps = false;
    this.tex.needsUpdate = true;
    this.mat = new THREE.ShaderMaterial({
      vertexShader: SURF_VERT,
      fragmentShader: SURF_FRAG,
      uniforms: { uTex: { value: this.tex }, uHeat: { value: 0 }, uPLo: { value: P_LO }, uPW: { value: P_HI - P_LO }, uCrop: { value: 1 } },
      transparent: true,
      depthWrite: false,
      depthTest: false,
      side: THREE.DoubleSide,
      blending: THREE.CustomBlending,
      blendEquation: THREE.AddEquation,
      blendSrc: THREE.OneFactor,
      blendDst: THREE.OneMinusSrcAlphaFactor,
      blendSrcAlpha: THREE.OneFactor,
      blendDstAlpha: THREE.OneMinusSrcAlphaFactor,
    });
    const sheet = new THREE.Mesh(this.geo, this.mat);
    sheet.frustumCulled = false;
    sheet.renderOrder = 2;

    /* ---- axes (main.js) ---- */
    const a = axesGeometry();
    this.grid = new Segs(a.grid, lin(0x6f8fb0), 0.13);
    this.axis = new Segs(a.axis, lin(0x9fb8d0), 0.38);
    this.ticks = new Segs(a.tick, lin(0xc0d4e8), 0.6);

    /* ---- glowing edges (main.js tubes: radius -> diameter in world units) ---- */
    this.uCore = new Tube(0x6fe8ff, 0.035, 0.95);
    this.uHalo = new Tube(0x1aa8ff, 0.11, 0.18);
    this.uHalo.line.renderOrder = 4;
    this.vLine = new Tube(0x52cfff, 0.02, 0.6);
    this.days = DAY_LINES.map(() => new Tube(0x5fd8ff, 0.011, 0.32));
    this.spine = new Tube(0xbff6ff, 0.022, 0.75);
    this.spine.line.renderOrder = 6;

    this.chart.matrixAutoUpdate = false;
    this.chart.add(this.grid.line, this.axis.line, this.ticks.line, sheet, this.uHalo.line, this.uCore.line, this.vLine.line, ...this.days.map((d) => d.line), this.spine.line);
    this.scene.add(this.chart);

    /* ---- post: RenderPass -> UnrealBloom (0.35, 0.6, 0.15 as front_axes) -> grade (ACES + sRGB) ---- */
    const rt = new THREE.WebGLRenderTarget(width, height, { type: THREE.HalfFloatType, samples: 4 });
    this.composer = new EffectComposer(this.renderer, rt);
    this.composer.setPixelRatio(1);
    this.composer.setSize(width, height);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.bloom = new UnrealBloomPass(res.clone(), 0.35, 0.6, 0.15);
    this.composer.addPass(this.bloom);
    this.grade = new ShaderPass(GradeShader);
    this.composer.addPass(this.grade);
  }

  update(st: SceneState) {
    const fl = st.flat;
    const sz = st.sz;
    const sy = 1 - fl;
    const L = 0.25;
    const P = this.pos;
    for (let j = 0; j < NZ; j++) {
      const r = smooth01((st.reveal * (1 + L) - TS[j]) / L);
      const z = zIdx(j, fl, sz);
      for (let i = 0; i < NX; i++) {
        const k = j * NX + i;
        P[k * 3] = xOf(i);
        P[k * 3 + 1] = HEIGHT(j, i) * sy;
        P[k * 3 + 2] = z;
        this.alpha[k] = r;
      }
    }
    this.geo.attributes.position.needsUpdate = true;
    this.geo.attributes.aAlpha.needsUpdate = true;
    this.geo.computeVertexNormals();
    this.mat.uniforms.uHeat.value = st.heat;

    chartWorld(st.turn, st.crop, this.chart.matrix, st.sx);
    this.chart.matrixWorldNeedsUpdate = true;
    this.mat.uniforms.uCrop.value = st.crop;

    this.grid.show(st.box);
    this.axis.show(st.box);
    this.ticks.show(st.box);

    /* hero lines (exact model), sampled over the visible price range like main.js (481 samples + the strike kink) */
    const ls = [this.uCore, this.uHalo, this.vLine, this.spine, ...this.days];
    if (st.lines > 0.005) {
      const lo = 6250 + (P_LO - 6250) * (1 - st.crop);
      const hi = 6850 + (P_HI - 6850) * (1 - st.crop);
      const ps: number[] = [];
      for (let i = 0; i <= 480; i++) ps.push(lo + ((hi - lo) * i) / 480);
      if (STRIKE > lo && STRIKE < hi) ps.push(STRIKE);
      ps.sort((x, y) => x - y);
      const key = `${fl.toFixed(5)}|${sz.toFixed(5)}|${st.crop.toFixed(5)}`;
      const z0 = zWorld(0, fl, sz);
      const z1 = zWorld(1, fl, sz);
      const U = () => ps.map((p) => new THREE.Vector3(xOfPrice(p), surfY(p, 0) * sy, z0));
      this.uCore.build(key, U);
      this.uHalo.build(key, U);
      this.vLine.build(key, () => ps.map((p) => new THREE.Vector3(xOfPrice(p), surfY(p, 1) * sy, z1)));
      DAY_LINES.forEach((d, k) => {
        const td = tOfDays(d);
        const zd = zWorld(td, fl, sz);
        this.days[k].build(key, () => ps.map((p) => new THREE.Vector3(xOfPrice(p), surfY(p, td) * sy + 0.004, zd)));
      });
      this.spine.build(key, () => TS.map((t, j) => new THREE.Vector3(xOfPrice(P_MID), surfY(P_MID, t) * sy + 0.005, zIdx(j, fl, sz))));
    }
    ls.forEach((t) => t.show(st.lines));

    this.bloom.strength = st.bloom;
    this.bloom.enabled = st.bloom > 0.001;
    const g = 1 - st.heat;
    this.grade.uniforms.uGrade.value = g;
    this.bgMat.uniforms.uGrade.value = g;
    this.bgMat.uniforms.uK.value = st.bg;

    this.camera.position.copy(st.camPos);
    this.camera.quaternion.copy(st.camQuat);
    this.camera.fov = st.fov;
    if (st.viewOffset[0] !== 0 || st.viewOffset[1] !== 0) this.camera.setViewOffset(this.width, this.height, -st.viewOffset[0], -st.viewOffset[1], this.width, this.height);
    else this.camera.clearViewOffset();
    this.camera.updateProjectionMatrix();
    this.camera.updateMatrixWorld();
  }

  render() {
    this.composer.render();
  }

  dispose() {
    this.geo.dispose();
    this.tex.dispose();
    this.mat.dispose();
    this.bgMat.dispose();
    [this.grid, this.axis, this.ticks, this.uCore, this.uHalo, this.vLine, this.spine, ...this.days].forEach((s) => s.dispose());
    this.composer.dispose();
    this.renderer.dispose();
    THREE.ColorManagement.enabled = this.prevCM;
  }
}
export { X_HALF, NCOLS, P_MID };
