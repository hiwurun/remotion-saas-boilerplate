"use client";
/**
 * lumina-interactive-list (21st.dev) — web component.
 * NOTE: reconstructed from the shader + behaviour spec provided (the full original
 * file was not available on this machine). Uses three.js + gsap, runtime-animated.
 * Not used by the Remotion video (see src/lumina for the frame-driven port).
 */
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { gsap } from "gsap";

export interface LuminaSlide {
  title: string;
  description: string;
  media: string;
}

export const defaultSlides: LuminaSlide[] = [
  { title: "Ethereal Glow", description: "A soft luminescence that dissolves the boundary between light and form.", media: "https://cdn.21st.dev/assets/mirror/b2/b26ed9367c41626c7e61d837f0ea11cdaa3148a499e6bee171176886c8959950.jpg" },
  { title: "Rose Mirage", description: "Petal tones drifting through a haze of warm, refracted colour.", media: "https://cdn.21st.dev/assets/mirror/40/4028a63d1229ffb5d2eccc4c4f7640858afb1bbf639fc41b9a86a376a1202555.jpg" },
  { title: "Velvet Mystique", description: "Deep, tactile shadows wrapped in a quiet, velvet darkness.", media: "https://cdn.21st.dev/assets/mirror/e6/e65a4e822aa4606715518071f6d85d2066b721b8e7e952e8ab6c051e87bc7a36.jpg" },
  { title: "Golden Hour", description: "The fleeting moment when everything turns to amber and gold.", media: "https://cdn.21st.dev/assets/mirror/87/87882922b01fff1934486f69e7ee39a5a5e05bf2b935bb03a916234be898ee0e.jpg" },
  { title: "Midnight Dreams", description: "Nocturnal blues and silent reflections beneath a sleeping sky.", media: "https://cdn.21st.dev/assets/mirror/99/99ee55fd55281f879bd8cf899e4cb967a99a142d6b571765e46a88ad619ee9de.jpg" },
  { title: "Silver Light", description: "Cool metallic highlights tracing the edges of the unseen.", media: "https://cdn.21st.dev/assets/mirror/24/24ae667023524d2b6621597f09bf7062c9eadf03fe98d0f2c741637ede1131fc.jpg" },
];

export const vertexShader = `varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`;

export const fragmentShader = `
precision highp float;
uniform sampler2D uTexture1;
uniform sampler2D uTexture2;
uniform float uProgress;
uniform vec2 uResolution;
uniform vec2 uTexture1Size;
uniform vec2 uTexture2Size;
varying vec2 vUv;

vec2 getCoverUV(vec2 uv, vec2 textureSize) {
  vec2 s = uResolution / textureSize;
  float scale = max(s.x, s.y);
  vec2 scaledSize = textureSize * scale;
  vec2 offset = (uResolution - scaledSize) * 0.5;
  return (uv * uResolution - offset) / scaledSize;
}

vec4 glassEffect(vec2 uv, float progress) {
  float time = progress * 5.0;
  vec2 uv1 = getCoverUV(uv, uTexture1Size);
  vec2 uv2 = getCoverUV(uv, uTexture2Size);
  float maxRadius = length(uResolution) * 0.85;
  float bubbleRadius = progress * maxRadius;
  vec2 p = uv * uResolution;
  vec2 center = uResolution * 0.5;
  float dist = length(p - center);
  float normDist = dist / max(bubbleRadius, 0.001);
  float param = smoothstep(bubbleRadius + 3.0, bubbleRadius - 3.0, dist);
  vec4 img;
  if (param > 0.0) {
    float ro = 0.08 * pow(smoothstep(0.3, 1.0, normDist), 1.5);
    vec2 dir = (p - center) / max(dist, 0.001);
    vec2 distUV = uv2 - dir * ro;
    distUV += vec2(sin(time + normDist * 10.0), cos(time * 0.8 + normDist * 8.0)) * 0.015 * normDist * param;
    float ca = 0.02 * pow(smoothstep(0.3, 1.0, normDist), 1.2);
    img = vec4(
      texture2D(uTexture2, distUV + dir * ca * 1.2).r,
      texture2D(uTexture2, distUV + dir * ca * 0.2).g,
      texture2D(uTexture2, distUV - dir * ca * 0.8).b,
      1.0);
    float rim = smoothstep(0.95, 1.0, normDist) * (1.0 - smoothstep(1.0, 1.01, normDist));
    img.rgb += rim * 0.08;
  } else {
    img = texture2D(uTexture2, uv2);
  }
  if (progress > 0.95) {
    img = mix(img, texture2D(uTexture2, uv2), (progress - 0.95) / 0.05);
  }
  return mix(texture2D(uTexture1, uv1), img, param);
}

void main() { gl_FragColor = glassEffect(vUv, uProgress); }
`;

const SLIDE_DURATION = 5000;
const TRANSITION_DURATION = 2.5;

function splitChars(el: HTMLElement, text: string): HTMLSpanElement[] {
  el.innerHTML = "";
  return Array.from(text).map((ch) => {
    const s = document.createElement("span");
    s.textContent = ch === " " ? "\u00a0" : ch;
    s.style.display = "inline-block";
    el.appendChild(s);
    return s;
  });
}

function animateTitleIn(chars: HTMLSpanElement[], index: number) {
  const v = index % 6;
  switch (v) {
    case 0: gsap.fromTo(chars, { y: 80, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.03, duration: 0.9, ease: "power3.out" }); break;
    case 1: gsap.fromTo(chars, { y: -80, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.03, duration: 0.9, ease: "back.out(1.4)" }); break;
    case 2: gsap.fromTo(chars, { filter: "blur(12px)", scale: 1.5, opacity: 0 }, { filter: "blur(0px)", scale: 1, opacity: 1, duration: 1, stagger: { each: 0.04, from: "random" }, ease: "power2.out" }); break;
    case 3: gsap.fromTo(chars, { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, stagger: 0.03, duration: 0.8, ease: "power3.out" }); break;
    case 4: gsap.fromTo(chars, { rotationX: 90, opacity: 0, transformOrigin: "50% 50% -20px" }, { rotationX: 0, opacity: 1, stagger: 0.04, duration: 0.9, ease: "power3.out" }); break;
    default: gsap.fromTo(chars, { x: 120, opacity: 0 }, { x: 0, opacity: 1, stagger: 0.03, duration: 0.9, ease: "power3.out" });
  }
}

export function LuminaInteractiveList({ slides = defaultSlides }: { slides?: LuminaSlide[] }) {
  const mountRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const descRef = useRef<HTMLParagraphElement>(null);
  const [current, setCurrent] = useState(0);
  const [progress, setProgress] = useState(0);
  const goToRef = useRef<(i: number) => void>(() => undefined);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin("anonymous");
    const textures = slides.map((s) => loader.load(s.media, (t) => {
      const img = t.image as HTMLImageElement;
      t.userData.size = new THREE.Vector2(img.width, img.height);
    }));
    const uniforms = {
      uTexture1: { value: textures[0] },
      uTexture2: { value: textures[1 % textures.length] },
      uProgress: { value: 0 },
      uResolution: { value: new THREE.Vector2(1, 1) },
      uTexture1Size: { value: new THREE.Vector2(1, 1) },
      uTexture2Size: { value: new THREE.Vector2(1, 1) },
    };
    const material = new THREE.ShaderMaterial({ uniforms, vertexShader, fragmentShader });
    scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material));

    const resize = () => {
      const w = mount.clientWidth, h = mount.clientHeight;
      renderer.setSize(w, h);
      uniforms.uResolution.value.set(w, h);
    };
    resize();
    window.addEventListener("resize", resize);

    let idx = 0;
    let busy = false;
    let slideStart = performance.now();
    const showText = (i: number) => {
      if (titleRef.current) animateTitleIn(splitChars(titleRef.current, slides[i].title), i);
      if (descRef.current) {
        descRef.current.textContent = slides[i].description;
        gsap.fromTo(descRef.current, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, delay: 0.3 });
      }
    };
    const goTo = (next: number) => {
      if (busy || next === idx) return;
      busy = true;
      const size = (t: THREE.Texture) => (t.userData.size as THREE.Vector2) ?? new THREE.Vector2(1, 1);
      uniforms.uTexture1.value = textures[idx];
      uniforms.uTexture2.value = textures[next];
      uniforms.uTexture1Size.value = size(textures[idx]);
      uniforms.uTexture2Size.value = size(textures[next]);
      if (titleRef.current) gsap.to(titleRef.current.children, { y: -40, opacity: 0, duration: 0.5, stagger: 0.01 });
      gsap.fromTo(uniforms.uProgress, { value: 0 }, {
        value: 1, duration: TRANSITION_DURATION, ease: "power2.inOut",
        onComplete: () => {
          uniforms.uTexture1.value = textures[next];
          uniforms.uTexture1Size.value = size(textures[next]);
          uniforms.uProgress.value = 0;
          busy = false;
        },
      });
      gsap.delayedCall(0.6, () => showText(next));
      idx = next;
      slideStart = performance.now();
      setCurrent(next);
    };
    goToRef.current = goTo;
    showText(0);

    let raf = 0;
    const loop = () => {
      const p = (performance.now() - slideStart) / SLIDE_DURATION;
      setProgress(Math.min(1, p));
      if (p >= 1) goTo((idx + 1) % slides.length);
      renderer.render(scene, camera);
      raf = requestAnimationFrame(loop);
    };
    loop();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      renderer.dispose();
      material.dispose();
      textures.forEach((t) => t.dispose());
      mount.removeChild(renderer.domElement);
    };
  }, [slides]);

  return (
    <section className="relative h-screen w-full overflow-hidden bg-[#0a0a0a] text-white">
      <div ref={mountRef} className="absolute inset-0" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
      <div className="absolute left-10 top-8 font-mono text-xs tracking-[0.3em] text-white/70">
        {String(current + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}
      </div>
      <div className="absolute bottom-32 left-10 max-w-3xl">
        <h1 ref={titleRef} className="font-serif text-7xl md:text-9xl leading-none" style={{ perspective: 600 }} />
        <p ref={descRef} className="mt-6 max-w-md text-sm text-white/70" />
      </div>
      <nav className="absolute bottom-8 left-10 right-10 grid gap-6" style={{ gridTemplateColumns: `repeat(${slides.length}, minmax(0,1fr))` }}>
        {slides.map((s, i) => (
          <button key={s.title} onClick={() => goToRef.current(i)} className="text-left">
            <div className="h-px w-full bg-white/20">
              <div className="h-px bg-[#d4af37]" style={{ width: i === current ? `${progress * 100}%` : i < current ? "100%" : "0%" }} />
            </div>
            <span className={`mt-3 block font-mono text-[11px] uppercase tracking-widest ${i === current ? "text-white" : "text-white/40"}`}>{s.title}</span>
          </button>
        ))}
      </nav>
    </section>
  );
}

export default LuminaInteractiveList;
