import * as THREE from "three";
import type { SurfaceDataset } from "./model/types";
import { interpolateVolByStrike } from "./model/surface-model";
import { SURFACE_PALETTE_DARK as PAL, SURFACE_RENDER_STYLE_DARK as RS, VOLATILITY_STOPS } from "./constants";

/**
 * Deterministic port of vlab-frontend surface-3d (surface-scene.ts + surface-layers.ts + surface-runtime.ts):
 * same geometry, colour ramp, lights, OI instancing, axis/grid layers and camera defaults – minus OrbitControls,
 * the RAF loop and hover. Every visual parameter is pushed in through `update(state)` once per Remotion frame.
 */

export type CameraPose = { pos: THREE.Vector3; target: THREE.Vector3; fov: number };

export type SceneState = {
  camera: CameraPose;
  /** 0 → every row collapsed onto `hookDays` (one flat smile), 1 → real surface */
  fan: number;
  hookDays: number;
  surfaceOpacity: number;
  wireOpacity: number;
  /** colour ramp sweep 0..1 (vertices above the sweep front are rendered as neutral graphite) */
  colorSweep: number;
  axisStrike: number;
  axisDays: number;
  axisVol: number;
  axisOi: number;
  grid: number;
  /** highlighted smile slice (row) draw progress + opacity */
  smileDraw: number;
  smileAlpha: number;
  smileDays: number;
  /** ATM term slice draw progress + opacity */
  termDraw: number;
  termAlpha: number;
  /** hook line: the single-expiry smile drawn as a tube before the fan-out */
  hookAlpha: number;
  /** fraction of the edge (hook) line drawn, along strike */
  edgeDraw: number;
  /** 0..1 everything except the shot's one bright element is desaturated + dimmed */
  dim: number;
  /** ending: 0..1 the surface's own vertices travel onto the logo's V (screen-space ribbon, unprojected per frame) */
  vMorph: number;
  /** ending: 0..1 vertex colour eases from the IV ramp to the logo's V colour */
  vColor: number;
  /** V ribbon in screen px: two edges, each sampled at one point per strike column (left → right) */
  vShape: { lo: { x: number; y: number }[]; hi: { x: number; y: number }[]; w: number; h: number } | null;
  /** peak marker 0..1 */
  peak: number;
  /** OI bars growth 0..1 (staggered per bar) */
  oiGrow: number;
  /** surface emissive lift (premium glow on reveals) */
  glow: number;
};

const STOP_COLORS = VOLATILITY_STOPS.map((s) => new THREE.Color(s));
const NEUTRAL = new THREE.Color("#2a3038");
/** logo.svg #vFill (#2B2422 → #120F0E), its mid tone */
const V_COLOR = new THREE.Color("#1E1917");

const paletteColor = (value: number, out: THREE.Color) => {
  const c = THREE.MathUtils.clamp(value, 0, 1) * (STOP_COLORS.length - 1);
  const i = Math.floor(c);
  const j = Math.min(i + 1, STOP_COLORS.length - 1);
  return out.copy(STOP_COLORS[i]!).lerp(STOP_COLORS[j]!, c - i);
};

const buildSampleIndexes = (length: number, maxCount: number): number[] => {
  if (length <= 0) return [];
  if (length <= maxCount) return Array.from({ length }, (_, i) => i);
  const set = new Set<number>();
  for (let i = 0; i < maxCount; i++) set.add(Math.round((i * (length - 1)) / (maxCount - 1)));
  return Array.from(set).sort((a, b) => a - b);
};

type TextSprite = { sprite: THREE.Sprite; material: THREE.SpriteMaterial; base: number };

const FONT = '"PingFang SC", "Noto Sans SC", "Microsoft YaHei", sans-serif';

function textSprite(text: string, pos: THREE.Vector3, scale: [number, number], opts: { color: string; weight?: number; px?: number; w?: number; h?: number; stroke?: number }): TextSprite {
  const w = opts.w ?? 256;
  const h = opts.h ?? 64;
  const ratio = 3;
  const canvas = document.createElement("canvas");
  canvas.width = w * ratio;
  canvas.height = h * ratio;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(ratio, ratio);
  ctx.font = `${opts.weight ?? 700} ${opts.px ?? 28}px ${FONT}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  if (opts.stroke) {
    ctx.lineJoin = "round";
    ctx.lineWidth = opts.stroke;
    ctx.strokeStyle = PAL.background;
    ctx.strokeText(text, w / 2, h / 2);
  }
  ctx.fillStyle = opts.color;
  ctx.fillText(text, w / 2, h / 2);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false, toneMapped: false, opacity: 0 });
  const sprite = new THREE.Sprite(material);
  sprite.position.copy(pos);
  sprite.scale.set(scale[0], scale[1], 1);
  sprite.renderOrder = 10;
  return { sprite, material, base: 1 };
}

export class SurfaceScene {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly camera: THREE.PerspectiveCamera;
  private ds: SurfaceDataset;
  private surfaceGeo = new THREE.BufferGeometry();
  private surfaceMat: THREE.MeshStandardMaterial;
  private wireMat: THREE.LineBasicMaterial;
  private wire: THREE.LineSegments;
  private wireGeo: THREE.BufferGeometry;
  private basePos: Float32Array;
  private baseVol: Float32Array;
  private colors: Float32Array;
  private colCount: number;
  private oiMeshes: { mesh: THREE.InstancedMesh; mat: THREE.MeshStandardMaterial; points: SurfaceDataset["oiPoints"]; xs: number[]; zs: number[]; hs: number[] }[] = [];
  private axisGroups: Record<"strike" | "days" | "vol" | "oi", { lines: THREE.LineBasicMaterial[]; sprites: TextSprite[] }>;
  private gridMat: THREE.LineBasicMaterial[];
  private smile: { core: THREE.Mesh; halo: THREE.Mesh; days: number } | null = null;
  private term: { core: THREE.Mesh; halo: THREE.Mesh; dots: THREE.Mesh[] };
  private hook: { core: THREE.Mesh; halo: THREE.Mesh } | null = null;
  private peakGroup = new THREE.Group();
  private peakMats: THREE.Material[] = [];
  private lastFan = -1;
  private lastHook = NaN;
  private lastDim = -1;
  private lastMorph = 0;
  private lastVColor = -1;

  constructor(canvas: HTMLCanvasElement, width: number, height: number, ds: SurfaceDataset, opts: { termPoints: { days: number; strike: number; vol: number }[]; peak: { strike: number; daysToExpiry: number; vol: number } }) {
    this.ds = ds;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
    this.renderer.setPixelRatio(1);
    this.renderer.setSize(width, height, false);
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1;
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.01, 100);

    // lights – surface-scene.ts addSurfaceLights (dark)
    this.scene.add(new THREE.AmbientLight(0xffffff, RS.ambientLightIntensity));
    this.scene.add(new THREE.HemisphereLight(0xbfdcff, 0x182133, RS.hemisphereLightSkyIntensity));
    const dir = new THREE.DirectionalLight(0xffffff, RS.directionalLightIntensity);
    dir.position.set(3, 5, 3);
    const fill = new THREE.DirectionalLight(0xffffff, RS.fillLightIntensity);
    fill.position.set(-2.5, 2.2, -3);
    const rim = new THREE.DirectionalLight(0x9eb6ff, RS.rimLightIntensity);
    rim.position.set(-4.5, 3.2, 3.8);
    this.scene.add(dir, fill, rim);

    // ---- surface (surface-layers.ts buildSurfaceGeometry) ----
    const strikes = ds.strikes;
    this.colCount = strikes.length;
    const n = ds.rows.length * strikes.length;
    this.basePos = new Float32Array(n * 3);
    this.baseVol = new Float32Array(n);
    let k = 0;
    for (const row of ds.rows) {
      const z = ds.mappings.daysToZ(row.days);
      for (const strike of strikes) {
        const vol = interpolateVolByStrike(row, strike, { extrapolate: true }) ?? ds.domain.minVol;
        this.basePos.set([ds.mappings.strikeToX(strike), ds.mappings.volToY(vol), z], k * 3);
        this.baseVol[k] = vol;
        k++;
      }
    }
    const indices: number[] = [];
    for (let r = 0; r < ds.rows.length - 1; r++) {
      for (let c = 0; c < this.colCount - 1; c++) {
        const tl = r * this.colCount + c;
        const tr = tl + 1;
        const bl = (r + 1) * this.colCount + c;
        const br = bl + 1;
        indices.push(tl, tr, bl, tr, br, bl);
      }
    }
    this.colors = new Float32Array(n * 3);
    this.surfaceGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(this.basePos), 3));
    this.surfaceGeo.setAttribute("color", new THREE.BufferAttribute(this.colors, 3));
    this.surfaceGeo.setIndex(indices);
    this.surfaceMat = new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide, roughness: RS.surfaceRoughness, metalness: RS.surfaceMetalness, emissive: new THREE.Color(0xffffff), emissiveIntensity: 0, transparent: true, opacity: 1 });
    const surfaceMesh = new THREE.Mesh(this.surfaceGeo, this.surfaceMat);
    // wireframe = the triangles' unique edges (same set WireframeGeometry builds), indexed into the surface's own
    // position attribute so per-frame vertex updates need no geometry rebuild / GPU realloc
    const edges = new Set<number>();
    const edgeIdx: number[] = [];
    for (let i = 0; i < indices.length; i += 3) {
      for (const [a, b] of [[indices[i]!, indices[i + 1]!], [indices[i + 1]!, indices[i + 2]!], [indices[i + 2]!, indices[i]!]] as const) {
        const key = Math.min(a, b) * n + Math.max(a, b);
        if (edges.has(key)) continue;
        edges.add(key);
        edgeIdx.push(a, b);
      }
    }
    this.wireGeo = new THREE.BufferGeometry();
    this.wireGeo.setAttribute("position", this.surfaceGeo.getAttribute("position"));
    this.wireGeo.setIndex(edgeIdx);
    this.wireMat = new THREE.LineBasicMaterial({ color: new THREE.Color(PAL.wireframe), transparent: true, opacity: RS.wireOpacity });
    this.wire = new THREE.LineSegments(this.wireGeo, this.wireMat);
    this.scene.add(surfaceMesh, this.wire);

    // ---- OI bars (createOpenInterestLayer / resolveOpenInterestBarLayout) ----
    this.buildOi();

    // ---- axes + grid ----
    this.axisGroups = this.buildAxes();
    const grid = new THREE.GridHelper(2, 10, new THREE.Color(PAL.gridMain), new THREE.Color(PAL.gridSub));
    const gm = (Array.isArray(grid.material) ? grid.material : [grid.material]) as THREE.LineBasicMaterial[];
    gm.forEach((m) => {
      m.transparent = true;
      m.opacity = 0;
    });
    this.gridMat = gm;
    this.scene.add(grid);

    // ---- highlight tubes ----
    this.term = this.buildTerm(opts.termPoints);
    this.buildPeak(opts.peak);
  }

  private tube(points: THREE.Vector3[], radius: number, color: string, opacity: number, additive = false) {
    const curve = new THREE.CatmullRomCurve3(points, false, "centripetal");
    const geo = new THREE.TubeGeometry(curve, Math.max(64, points.length * 12), radius, 10, false);
    const mat = new THREE.MeshBasicMaterial({ color: new THREE.Color(color), transparent: true, opacity, depthWrite: false, toneMapped: false, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.renderOrder = 5;
    this.scene.add(mesh);
    return mesh;
  }

  private rowPoints(days: number, lift = 0.006) {
    const row = this.ds.rows.find((r) => r.days === days)!;
    const z = this.ds.mappings.daysToZ(days);
    // only the strikes this expiry actually quotes – no flat extrapolated tail
    const lo = row.strikes[0]!;
    const hi = row.strikes[row.strikes.length - 1]!;
    return this.ds.strikes.filter((s) => s >= lo && s <= hi).map((s) => {
      const v = interpolateVolByStrike(row, s, { extrapolate: true }) ?? this.ds.domain.minVol;
      return new THREE.Vector3(this.ds.mappings.strikeToX(s), this.ds.mappings.volToY(v) + lift, z);
    });
  }

  private setSmile(days: number) {
    if (this.smile?.days === days) return;
    if (this.smile) {
      this.scene.remove(this.smile.core, this.smile.halo);
      this.smile.core.geometry.dispose();
      this.smile.halo.geometry.dispose();
    }
    const pts = this.rowPoints(days, 0.008);
    this.smile = { core: this.tube(pts, 0.0075, "#ffffff", 1), halo: this.tube(pts, 0.022, "#c084fc", 0.35, true), days };
  }

  private setHook(days: number) {
    if (this.lastHook === days && this.hook) return;
    this.lastHook = days;
    if (this.hook) {
      this.scene.remove(this.hook.core, this.hook.halo);
      this.hook.core.geometry.dispose();
      this.hook.halo.geometry.dispose();
    }
    // the chart's「今日波动率」line itself, landed on this row: same purple, chart line width (~3px on screen)
    const pts = this.rowPoints(days, 0.002);
    this.hook = { core: this.tube(pts, 0.0029, "#a21caf", 1), halo: this.tube(pts, 0.0029, "#a21caf", 0) };
  }

  private buildTerm(points: { days: number; strike: number; vol: number }[]) {
    const m = this.ds.mappings;
    const pts = points.map((p) => new THREE.Vector3(m.strikeToX(p.strike), m.volToY(p.vol) + 0.012, m.daysToZ(p.days)));
    const core = this.tube(pts, 0.0032, "#ffffff", 1);
    const halo = this.tube(pts, 0.0032, "#ffffff", 0);
    const dotGeo = new THREE.SphereGeometry(0.011, 16, 16);
    const dots = pts.map((p) => {
      const d = new THREE.Mesh(dotGeo, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, toneMapped: false, depthTest: false }));
      d.position.copy(p);
      d.renderOrder = 6;
      this.scene.add(d);
      return d;
    });
    return { core, halo, dots };
  }

  private buildPeak(peak: { strike: number; daysToExpiry: number; vol: number }) {
    const m = this.ds.mappings;
    const p = new THREE.Vector3(m.strikeToX(peak.strike), m.volToY(peak.vol), m.daysToZ(peak.daysToExpiry));
    const dot = new THREE.Mesh(new THREE.SphereGeometry(0.012, 24, 24), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, toneMapped: false, depthTest: false }));
    dot.position.copy(p);
    const glow = new THREE.Mesh(new THREE.SphereGeometry(0.03, 24, 24), new THREE.MeshBasicMaterial({ color: new THREE.Color("#F87171"), transparent: true, toneMapped: false, depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending }));
    glow.position.copy(p);
    this.peakGroup.add(glow, dot);
    this.peakGroup.renderOrder = 8;
    this.peakMats = [dot.material, glow.material];
    this.scene.add(this.peakGroup);
  }

  private buildOi() {
    const ds = this.ds;
    if (ds.domain.maxOi <= 0) return;
    const gap = (vals: number[], f: (v: number) => number) => {
      let g = Infinity;
      for (let i = 0; i < vals.length - 1; i++) {
        const d = Math.abs(f(vals[i + 1]!) - f(vals[i]!));
        if (d > 0) g = Math.min(g, d);
      }
      return Number.isFinite(g) ? g : null;
    };
    const defW = ds.strikes.length > 1 ? Math.max(0.014, Math.min(0.042, 1.9 / ds.strikes.length)) : 0.034;
    const defD = ds.days.length > 1 ? Math.max(0.014, Math.min(0.042, 1.9 / ds.days.length)) : 0.034;
    const sg = gap(ds.strikes, ds.mappings.strikeToX);
    const dg = gap(ds.days, ds.mappings.daysToZ);
    const pairGap = sg == null ? defW * 0.16 : sg * 0.06;
    const maxW = sg == null ? defW : Math.max((sg * 0.84 - pairGap) / 2, 0.012);
    const barWidth = Math.min(defW, maxW);
    const barDepth = Math.min(Math.max(barWidth * 0.94, 0.012), dg == null ? defD : Math.min(defD, dg * 0.28));
    const xOffset = barWidth / 2 + pairGap / 2;
    for (const side of ["put", "call"] as const) {
      const points = ds.oiPoints.filter((p) => p.side === side);
      if (!points.length) continue;
      const color = new THREE.Color(side === "put" ? PAL.oiPut : PAL.oiCall);
      const mat = new THREE.MeshStandardMaterial({ color, emissive: color, toneMapped: false, transparent: true, opacity: 1, depthWrite: true });
      const mesh = new THREE.InstancedMesh(new THREE.BoxGeometry(barWidth, 1, barDepth), mat, points.length);
      const xs = points.map((p) => ds.mappings.strikeToX(p.strike) + (side === "put" ? -xOffset : xOffset));
      const zs = points.map((p) => ds.mappings.daysToZ(p.daysToExpiry));
      const hs = points.map((p) => Math.max(0.006, (p.value / ds.domain.maxOi) * ds.layout.oiAxisMaxHeight));
      this.oiMeshes.push({ mesh, mat, points, xs, zs, hs });
      this.scene.add(mesh);
    }
  }

  private buildAxes() {
    const ds = this.ds;
    const top = ds.layout.volAxisBaseHeight + ds.layout.volAxisHeight;
    const line = (a: THREE.Vector3, b: THREE.Vector3, color: string) => {
      const mat = new THREE.LineBasicMaterial({ color: new THREE.Color(color), transparent: true, opacity: 0 });
      this.scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([a, b]), mat));
      return mat;
    };
    const add = (s: TextSprite) => {
      this.scene.add(s.sprite);
      return s;
    };
    const titleColor = `#${new THREE.Color(PAL.axisLabel).lerp(new THREE.Color(PAL.background), 0.26).getHexString()}`;
    const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
    const baseY = -0.1;
    const strike = {
      lines: [line(V(-1, 0, -1), V(1, 0, -1), PAL.axisLine)],
      sprites: [add(textSprite("行权价", V(0, baseY, -1.45), [0.5, 0.13], { color: titleColor, stroke: 1.2 }))],
    };
    for (const i of buildSampleIndexes(ds.strikes.length, 5)) {
      const s = ds.strikes[i]!;
      strike.sprites.push(add(textSprite(String(s), V(ds.mappings.strikeToX(s), baseY, -1.22), [0.4, 0.1], { color: titleColor, weight: 600, px: 22, w: 192, h: 48, stroke: 1.2 })));
    }
    const days = {
      lines: [line(V(-1, 0, -1), V(-1, 0, 1), PAL.axisLine)],
      sprites: [add(textSprite("期限", V(-1.45, baseY, 0), [0.6, 0.15], { color: titleColor, stroke: 1.2 }))],
    };
    for (const i of buildSampleIndexes(ds.days.length, 4)) {
      const d = ds.days[i]!;
      days.sprites.push(add(textSprite(`${d}天`, V(-1.22, baseY, ds.mappings.daysToZ(d)), [0.4, 0.1], { color: titleColor, weight: 600, px: 22, w: 192, h: 48, stroke: 1.2 })));
    }
    const vol = {
      lines: [line(V(-1, 0, -1), V(-1, top, -1), PAL.volAxisLine)],
      sprites: [add(textSprite("隐波", V(-1.28, ds.layout.volAxisBaseHeight + ds.layout.volAxisHeight * 0.56, -1.2), [0.6, 0.15], { color: PAL.volAxisLabel, stroke: 2.5 }))],
    };
    for (let i = 0; i <= 4; i++) {
      const v = ds.domain.minVol + (i / 4) * (ds.domain.maxVol - ds.domain.minVol);
      vol.sprites.push(add(textSprite(`${v.toFixed(0)}%`, V(-1.38, ds.mappings.volToY(v), -1.13), [0.4, 0.1], { color: PAL.volAxisLabel, weight: 600, px: 22, w: 192, h: 48, stroke: 2.5 })));
    }
    const oi = {
      lines: [line(V(1, 0, -1), V(1, ds.layout.oiAxisMaxHeight, -1), PAL.oiAxis)],
      sprites: [add(textSprite("持仓量", V(1.32, ds.layout.oiAxisMaxHeight * 0.65, -1.2), [0.6, 0.15], { color: PAL.oiAxis }))],
    };
    return { strike, days, vol, oi };
  }

  /** row reveal 0..1 for the weave: the hook row is there from the start, every other row grows in turn, outward in depth */
  private rowT(fan: number, r: number, hookRow: number) {
    // one continuous wave: every row starts a little after its neighbour and they overlap heavily
    const order = Math.abs(r - hookRow);
    if (order === 0) return 1;
    const steps = Math.max(1, this.ds.rows.length - 1);
    const d = steps === 1 ? 0 : (order - 1) / (steps - 1);
    const t = THREE.MathUtils.clamp((fan - d * 0.55) / 0.45, 0, 1);
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  private applyGeometry(fan: number, hookDays: number, dim: number, s?: SceneState) {
    const morph = s?.vShape ? s.vMorph : 0;
    const vColor = s?.vShape ? s.vColor : 0;
    const fanChanged = fan !== this.lastFan || hookDays !== this.lastHook || morph > 0 || this.lastMorph > 0;
    const hookRow = Math.max(0, this.ds.rows.findIndex((r) => r.days === hookDays));
    const n = this.ds.rows.length;
    const ts = Array.from({ length: n }, (_, r) => this.rowT(fan, r, hookRow));
    if (fanChanged) {
      const pos = this.surfaceGeo.getAttribute("position") as THREE.BufferAttribute;
      const arr = pos.array as Float32Array;
      // weave: row r grows out of its already-placed neighbour (towards the hook row) into its own depth + shape
      const order = Array.from({ length: n }, (_, r) => r).sort((x, y) => Math.abs(x - hookRow) - Math.abs(y - hookRow));
      for (const r of order) {
        const prev = r === hookRow ? r : r > hookRow ? r - 1 : r + 1;
        const t = ts[r]!;
        for (let c = 0; c < this.colCount; c++) {
          const i = r * this.colCount + c;
          const j = prev * this.colCount + c;
          for (const k of [1, 2]) arr[i * 3 + k] = r === hookRow ? this.basePos[i * 3 + k]! : arr[j * 3 + k]! + (this.basePos[i * 3 + k]! - arr[j * 3 + k]!) * t;
        }
      }
      if (morph > 0 && s?.vShape) {
        // every vertex lands on the V: column → position along the ribbon, row → across its width.
        // targets are unprojected onto the plane through the look-at point, facing the camera, so the V sits exactly on its screen pixels
        const { lo, hi, w, h } = s.vShape;
        const cam = this.camera;
        cam.updateMatrixWorld();
        const normal = s.camera.target.clone().sub(cam.position);
        const dist = normal.length();
        normal.normalize();
        const v = new THREE.Vector3();
        const cnt = n * this.colCount;
        const src = new Float32Array(cnt * 3);
        const dst = new Float32Array(cnt * 3);
        for (let r = 0; r < n; r++) {
          const t = n === 1 ? 0 : r / (n - 1);
          for (let c = 0; c < this.colCount; c++) {
            const a = lo[c]!;
            const b = hi[c]!;
            const sx = a.x + (b.x - a.x) * t;
            const sy = a.y + (b.y - a.y) * t;
            v.set((sx / w) * 2 - 1, 1 - (sy / h) * 2, 0.5).unproject(cam).sub(cam.position).normalize();
            v.multiplyScalar(dist / v.dot(normal)).add(cam.position).project(cam);
            const i = (r * this.colCount + c) * 3;
            dst.set([v.x, v.y, v.z], i);
            v.set(this.basePos[i]!, this.basePos[i + 1]!, this.basePos[i + 2]!).project(cam);
            src.set([v.x, v.y, v.z], i);
          }
        }
        // screen-space blend split into centre (eased linearly) + size (eased geometrically) + shape,
        // so the shrink from full-frame surface to logo-size V reads as one even zoom instead of collapsing early
        const frame = (a: Float32Array) => {
          let cx = 0;
          let cy = 0;
          for (let i = 0; i < cnt; i++) {
            cx += a[i * 3]!;
            cy += a[i * 3 + 1]!;
          }
          cx /= cnt;
          cy /= cnt;
          let rr = 0;
          for (let i = 0; i < cnt; i++) rr += (a[i * 3]! - cx) ** 2 + ((a[i * 3 + 1]! - cy) * (h / w)) ** 2;
          return { cx, cy, sc: Math.sqrt(rr / cnt) || 1e-6 };
        };
        const fa = frame(src);
        const fb = frame(dst);
        const cx = fa.cx + (fb.cx - fa.cx) * morph;
        const cy = fa.cy + (fb.cy - fa.cy) * morph;
        const sc = fa.sc * Math.pow(fb.sc / fa.sc, morph);
        for (let i = 0; i < cnt; i++) {
          const lx = (src[i * 3]! - fa.cx) / fa.sc + ((dst[i * 3]! - fb.cx) / fb.sc - (src[i * 3]! - fa.cx) / fa.sc) * morph;
          const ly = (src[i * 3 + 1]! - fa.cy) / fa.sc + ((dst[i * 3 + 1]! - fb.cy) / fb.sc - (src[i * 3 + 1]! - fa.cy) / fa.sc) * morph;
          const z = src[i * 3 + 2]! + (dst[i * 3 + 2]! - src[i * 3 + 2]!) * morph;
          v.set(cx + lx * sc, cy + ly * sc, z).unproject(cam);
          arr[i * 3] = v.x;
          arr[i * 3 + 1] = v.y;
          arr[i * 3 + 2] = v.z;
        }
      } else if (this.lastMorph > 0) {
        for (let i = 0; i < arr.length; i += 3) arr[i] = this.basePos[i]!;
      }
      this.lastMorph = morph;
      pos.needsUpdate = true;
      this.surfaceGeo.computeVertexNormals();
      this.surfaceGeo.computeBoundingSphere();
      this.wireGeo.computeBoundingSphere();
      this.lastFan = fan;
    }
    if (fanChanged || dim !== this.lastDim || vColor !== this.lastVColor) {
      const { colorMinVol, colorMaxVol } = this.ds.colorDomain;
      const tmp = new THREE.Color();
      const grey = new THREE.Color();
      for (let i = 0; i < this.baseVol.length; i++) {
        const ratio = colorMaxVol === colorMinVol ? 0 : (this.baseVol[i]! - colorMinVol) / (colorMaxVol - colorMinVol);
        paletteColor(ratio, tmp);
        // colour fills in with the row as it weaves in
        tmp.lerp(NEUTRAL, 1 - ts[Math.floor(i / this.colCount)]!);
        if (dim > 0) {
          const l = tmp.r * 0.3 + tmp.g * 0.59 + tmp.b * 0.11;
          tmp.lerp(grey.setRGB(l, l, l), 0.85 * dim).multiplyScalar(1 - 0.55 * dim);
        }
        // ramp → black albedo; the V colour itself comes in as emissive (unlit), so the end colour is exact
        if (vColor > 0) tmp.multiplyScalar(1 - vColor);
        this.colors.set([tmp.r, tmp.g, tmp.b], i * 3);
      }
      this.lastVColor = vColor;
      this.surfaceMat.emissive.set(V_COLOR);
      (this.surfaceGeo.getAttribute("color") as THREE.BufferAttribute).needsUpdate = true;
      this.lastDim = dim;
    }
  }

  update(s: SceneState) {
    this.camera.fov = s.camera.fov;
    this.camera.position.copy(s.camera.pos);
    this.camera.lookAt(s.camera.target);
    this.camera.updateProjectionMatrix();

    this.applyGeometry(s.fan, s.hookDays, s.dim, s);
    this.surfaceMat.opacity = s.surfaceOpacity;
    // always write depth: toggling it at an opacity threshold re-sorts the far rows and pops for one frame
    this.surfaceMat.depthWrite = true;
    this.surfaceMat.emissiveIntensity = s.vShape ? s.vColor : s.glow * 0.12;
    this.wireMat.opacity = RS.wireOpacity * s.wireOpacity;

    const axis = (g: { lines: THREE.LineBasicMaterial[]; sprites: TextSprite[] }, v: number) => {
      g.lines.forEach((m) => (m.opacity = RS.axisLineOpacity * v));
      g.sprites.forEach((sp) => {
        sp.material.opacity = v;
        sp.sprite.visible = v > 0.001;
      });
    };
    axis(this.axisGroups.strike, s.axisStrike);
    axis(this.axisGroups.days, s.axisDays);
    axis(this.axisGroups.vol, s.axisVol);
    axis(this.axisGroups.oi, s.axisOi);
    this.gridMat.forEach((m) => (m.opacity = RS.gridMainOpacity * s.grid));

    const drawTube = (mesh: THREE.Mesh, p: number, alpha: number, base: number) => {
      const idx = mesh.geometry.getIndex()!;
      const count = Math.floor((idx.count / 6) * THREE.MathUtils.clamp(p, 0, 1)) * 6;
      mesh.geometry.setDrawRange(0, count);
      (mesh.material as THREE.MeshBasicMaterial).opacity = base * alpha;
      mesh.visible = alpha > 0.001 && count > 0;
    };

    this.setHook(s.hookDays);
    if (this.hook) {
      drawTube(this.hook.core, s.edgeDraw, s.hookAlpha, 1);
      this.hook.halo.visible = false;
    }
    this.setSmile(s.smileDays);
    if (this.smile) {
      drawTube(this.smile.core, s.smileDraw, s.smileAlpha, 1);
      this.smile.halo.visible = false;
    }
    drawTube(this.term.core, s.termDraw, s.termAlpha, 1);
    this.term.halo.visible = false;
    const nd = this.term.dots.length;
    this.term.dots.forEach((d, i) => {
      const on = THREE.MathUtils.clamp((s.termDraw * (nd - 1) - i) * 3 + 1, 0, 1);
      (d.material as THREE.MeshBasicMaterial).opacity = on * s.termAlpha;
      d.visible = on * s.termAlpha > 0.001;
    });

    this.peakGroup.visible = s.peak > 0.001;
    this.peakMats.forEach((m, i) => (m.opacity = s.peak * (i === 0 ? 1 : 0.35)));

    const matrix = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    for (const o of this.oiMeshes) {
      const n = o.points.length;
      o.mesh.visible = s.oiGrow > 0.001;
      for (let i = 0; i < n; i++) {
        // stagger by strike position (left→right sweep) so bars "grow from the floor" in a wave
        const order = (o.xs[i]! + 1) / 2;
        const t = THREE.MathUtils.smoothstep(s.oiGrow, order * 0.5, order * 0.5 + 0.5);
        const h = Math.max(1e-4, o.hs[i]! * t);
        matrix.compose(new THREE.Vector3(o.xs[i]!, h / 2, o.zs[i]!), q, new THREE.Vector3(1, h, 1));
        o.mesh.setMatrixAt(i, matrix);
      }
      o.mesh.instanceMatrix.needsUpdate = true;
    }
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }

  /** world → screen pixels for the HTML overlays */
  project(p: THREE.Vector3, width: number, height: number) {
    const v = p.clone().project(this.camera);
    return { x: ((v.x + 1) / 2) * width, y: ((1 - v.y) / 2) * height, behind: v.z > 1 };
  }

  dispose() {
    this.scene.traverse((o) => {
      const r = o as THREE.Mesh;
      r.geometry?.dispose?.();
      const mats = Array.isArray(r.material) ? r.material : r.material ? [r.material] : [];
      mats.forEach((m) => {
        (m as THREE.SpriteMaterial).map?.dispose();
        m.dispose();
      });
    });
    this.renderer.dispose();
  }
}

/** Pure camera projection (no renderer) for overlays computed during React render. */
export const projectWith = (pose: CameraPose, p: THREE.Vector3, width: number, height: number) => {
  const cam = new THREE.PerspectiveCamera(pose.fov, width / height, 0.01, 100);
  cam.position.copy(pose.pos);
  cam.lookAt(pose.target);
  cam.updateMatrixWorld();
  cam.updateProjectionMatrix();
  const v = p.clone().project(cam);
  return { x: ((v.x + 1) / 2) * width, y: ((1 - v.y) / 2) * height };
};
