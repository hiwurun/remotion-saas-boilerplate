# Lumina 玻璃折射轮播视频模板（Remotion）

## 安装与运行

```bash
pnpm install
npx remotion studio
```

## 渲染

```bash
# 横屏
npx remotion render Lumina-Landscape out/lumina-landscape.mp4
# 竖屏
npx remotion render Lumina-Portrait out/lumina-portrait.mp4
```


基于 21st.dev 组件 `lumina-interactive-list` 改写的视频版：全屏图片自动轮播，每次切换时从画面中心生长出一个“玻璃气泡”，带色散、折射边缘与液态流动（着色器与原组件一致），配合每张幻灯片不同的逐字标题动画、简短描述、`01 / 06` 计数器以及底部带进度线的导航。

| 合成 ID | 尺寸 | 帧率 | 时长 |
|---|---|---|---|
| `Lumina-Landscape` | 1920×1080 | 60 | 幻灯片数 × secondsPerSlide（默认 6 × 5s = 1800 帧） |
| `Lumina-Portrait` | 1080×1920 | 60 | 同上 |

```bash
npx remotion render Lumina-Landscape out/lumina-landscape.mp4
npx remotion render Lumina-Portrait out/lumina-portrait.mp4
npx remotion still Lumina-Landscape out/lumina.png --frame=360   # 第一次转场进行中
```

## WebGL 渲染设置（重要）

无头 Chrome 需要开启 WebGL。`remotion.config.ts` 中已设置：

```ts
Config.setChromiumOpenGlRenderer("swangle");
```

在本机（Linux 无 GPU）`--gl=angle` 拿不到 WebGL 上下文，`swangle`（SwiftShader + ANGLE 软件渲染）可正常工作。若你的机器有 GPU，可改为 `"angle"` 以提速；也可在命令行临时覆盖：`--gl=angle` / `--gl=swangle`。

## 文件

```
src/lumina/
  schema.ts                 LuminaVideoSchema（slides / secondsPerSlide / transitionSeconds / accentColor / bgmSrc / brandLabel）
  shader.ts                 顶点 + 片元着色器（glassEffect，与原组件一致）
  GlassTransitionCanvas.tsx 原生 WebGL 画布：delayRender 加载纹理，按帧同步绘制
  timing.ts                 帧 → 当前幻灯片 / 转场进度（interpolate + Easing.inOut(Easing.quad)）
  KineticTitle.tsx          六种逐字标题动画（上升 / 下落回弹 / 随机顺序模糊缩放 / 缩放 / X 轴翻转 / 右侧滑入）
  fonts.ts                  @remotion/google-fonts 字体加载
  LuminaSlider.tsx          主模板 + calculateLuminaMetadata
  LuminaCompositions.tsx    两个合成与默认 props
public/lumina/slide-01..06.jpg  演示图片（来自 21st.dev）
src/components/ui/lumina-interactive-list.tsx  网页版原组件（three.js + gsap，仅供网页使用，视频不使用）
src/components/ui/lumina-demo.tsx              网页版示例
```

时间轴：第 k 张（k ≥ 1）在 `k × secondsPerSlide` 秒开始转场，持续 `transitionSeconds` 秒；新标题在转场开始 0.6s 后进入，旧标题向上淡出。所有动画均由 `useCurrentFrame()` 驱动，确定性渲染，不使用 gsap / setTimeout / requestAnimationFrame / CSS 动画。

## 字体

- 标题衬线：**Cormorant Garamond**（与原组件一致）
- 正文无衬线：原组件用 PP Neue Montreal（商业字体），此处用免费的 **Inter** 代替
- 等宽：原组件用 PPSupplyMono（商业字体），此处用 **JetBrains Mono** 代替

如有正式授权，可把字体文件放进 `public/fonts/` 并用 `@remotion/fonts` 的 `loadFont()` 替换 `src/lumina/fonts.ts`。

## 替换图片

把图片放到 `public/lumina/`，在 `src/lumina/LuminaCompositions.tsx` 中修改 `slides` 的 `src`（`public/` 相对路径或 `https://` 完整 URL 均可），标题与描述同理。幻灯片数量可增减，总时长会自动计算；建议使用竖幅或横幅高清图片，着色器会按 cover 方式裁切。

## shadcn 结构

项目已加入 `@/*` → `./src/*` 路径别名（tsconfig 与 remotion.config.ts 的 webpack 配置）、`components.json`（new-york 风格）、`src/lib/utils.ts` 中的 `cn()`，以及 `tw-animate-css`（仅供网页组件使用）。

