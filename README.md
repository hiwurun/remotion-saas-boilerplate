# Remotion SaaS 产品宣传视频模板

基于 **Remotion v4 + React + TypeScript + Tailwind v4** 的 SaaS 产品视频模板，同时输出横屏（1920×1080）和竖屏（1080×1920）两个版本，60fps，默认时长 15 秒（900 帧）。

## 安装与运行

```bash
npm i                      # 安装依赖
npx remotion studio        # 打开 Remotion Studio 预览 / 可视化修改参数
```

## 渲染

```bash
# 横屏
npx remotion render SaaS-Landscape out/saas-landscape.mp4
# 竖屏
npx remotion render SaaS-Portrait out/saas-portrait.mp4

# 单帧截图
npx remotion still SaaS-Landscape out/landscape.png --frame=300
# 低分辨率快速预览
npx remotion render SaaS-Portrait out/preview.mp4 --scale=0.25
```

也可用 `npm run render:landscape` / `npm run render:portrait`。

## 场景结构（src/Root.tsx 的 defaultProps）

| 场景 | 类型 | 时长 |
|---|---|---|
| 开场钩子 | `hook` | 0–3s |
| 截图 + 缩放 + 模拟光标 | `screenshot` | 3–7s |
| 录屏 + 浮动标注 | `screen-record` | 7–12s |
| 结尾 Logo + CTA | `outro` | 12–15s |

场景间使用 15 帧转场（`fade()` / `slide()`），总时长由 `calculateMetadata` 自动计算：`总帧数 = 各场景时长之和 − 15 × (场景数 − 1)`。

## 替换素材

所有素材放在 `public/` 下，代码里通过 `staticFile()` 引用（props 中只写相对 `public/` 的路径）：

- `public/demo/screenshot.png` — 产品截图（建议 1920×1080）
- `public/demo/recording.mp4` — 产品录屏（H.264 / yuv420p）
- `public/demo/logo.png` — Logo（建议正方形透明 PNG）
- `public/audio/bgm.mp3` — 背景音乐（不需要可把 `bgmSrc` 删掉）

直接覆盖同名文件即可；如改了文件名，修改 `src/Root.tsx` 中 `defaultProps` 的 `src` / `logoSrc` / `bgmSrc`。截图场景的 `zoomScale`、`focusX`/`focusY`（0–1）、`cursorTarget`（0–1 归一化坐标）以及品牌色 `themeColor` 也都可以在 Studio 右侧面板直接调节。

## 目录

```
src/
  index.ts / Root.tsx / index.css / schema.ts
  components/  Background · BrowserMockup · FloatingCallout · SimulatedCursor
  templates/   HybridSaaSVideo.tsx
public/        demo/ · audio/
```

## 规范

所有动画都由 `useCurrentFrame()` + `spring()` / `interpolate()` 驱动（插值均 clamp），不使用 CSS 动画；视频用 `<OffthreadVideo>`，图片用 `<Img>`；`isPortrait = height > width` 自动调整字号、间距和布局。

---

# 模板二：Apple / Linear 风格电影感 SaaS 视频

位于 `src/apple/`，与原有模板共存，`src/Root.tsx` 同时注册四个合成：

| 合成 ID | 尺寸 | 帧率 | 默认时长 |
|---|---|---|---|
| `Apple-SaaS-Landscape` | 1920×1080 | 60 | 1050 帧（17.5s） |
| `Apple-SaaS-Portrait` | 1080×1920 | 60 | 1050 帧（17.5s） |

```bash
npx remotion render Apple-SaaS-Landscape out/apple-landscape.mp4
npx remotion render Apple-SaaS-Portrait out/apple-portrait.mp4
npx remotion still Apple-SaaS-Landscape out/apple.png --frame=330
```

## 文件

```
src/apple/
  schema.ts                       AppleVideoSchema（zod）
  motion.tsx                      共享弹簧参数 APPLE_SPRING、文字显现 helper、1px 高光线、骨架占位
  components/AmbientBackdrop.tsx  #050507 底色 + 呼吸聚光灯 + 网格 + 暗角
  components/AppleStage3D.tsx     3D 摄影机舞台 + OpticalLoupe 光学放大镜
  components/AppleBentoGrid.tsx   Bento 便当格卡片
  templates/AppleMasterTemplate.tsx  主模板 + calculateAppleMetadata
  AppleCompositions.tsx           两个合成及 defaultProps
```

## 场景类型

- `hero-title`：eyebrow / title / subtitle
- `macro-screenshot`：src、caption、subCaption、`cameraMode`（`macro-angle` 斜角入场后放平 / `center-float` 正面上浮），可选 `loupe { x, y, zoom, label }`。**x、y 为 0–1 归一化坐标**（相对源图宽高），不是像素。
- `cinematic-record`：src、playbackRate（默认 1.2）、caption、floatingBadge（第 30 帧浮现）
- `bento-summary`：heading + **恰好 4 张**卡片 `{ title, metric, description, imgSrc? }`。横屏为不对称布局（1 大 3 小），竖屏为紧凑的 1–2 列布局。

场景间统一 20 帧 `fade()`，总时长 = 各场景时长之和 − 20 × (场景数 − 1)。

## 设计规范

- 所有 `spring()` 使用 `{ mass: 1.3, damping: 30, stiffness: 75 }`，无回弹
- 文字统一 opacity 0→1、translateY 24px→0、blur 14px→0 同步显现
- 截图 / 录屏 / 卡片容器统一 `#0B0B0E` 底、`border-white/[0.08]`、顶部 1px 渐变高光线
- 主标题使用 白→半透明白 的竖向渐变文字

## 素材缺失保护

`calculateAppleMetadata` 会对每个素材执行 `fetch(staticFile(src), { method: 'HEAD' })`，结果写入 `assetAvailability` 属性；缺失的截图 / 录屏 / 卡片图会显示深色骨架占位，而不会导致渲染失败。默认演示中第 4 张卡片故意引用不存在的 `demo/missing-card.png` 以演示该效果。替换素材的方法与模板一相同：把文件放进 `public/`，并在 `src/apple/AppleCompositions.tsx` 的 `appleDefaultProps` 中修改路径。

---

# 模板三：Lumina 玻璃折射轮播（WebGL）

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
