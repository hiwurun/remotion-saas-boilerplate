# Remotion 发布视频模板集

基于 **Remotion v4 + React + TypeScript + Tailwind v4**，包含两套模板，各有横屏 / 竖屏版本，均为 60fps：

| 合成 ID | 模板 | 尺寸 |
|---|---|---|
| `Lumina-Landscape` / `Lumina-Portrait` | WebGL 玻璃折射轮播 | 1920×1080 / 1080×1920 |
| `Launch-Landscape` / `Launch-Portrait` | 极简白色产品发布视频（生成式 UI 风格） | 1920×1080 / 1080×1920 |

## 安装与运行

```bash
npm i
npx remotion studio          # 预览，可在右侧面板改参数并“保存默认 props”
npx tsc --noEmit             # 类型检查
```

> `src/Root.tsx` 中每个 `<Composition>` 的 `defaultProps` 都是**内联对象字面量**，这是 Studio “保存默认 props” 功能所必需的，请不要改成变量。

## 模板一：Lumina 玻璃折射轮播（WebGL）

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

### WebGL 渲染设置（重要）

无头 Chrome 需要开启 WebGL。`remotion.config.ts` 中已设置：

```ts
Config.setChromiumOpenGlRenderer("swangle");
```

在本机（Linux 无 GPU）`--gl=angle` 拿不到 WebGL 上下文，`swangle`（SwiftShader + ANGLE 软件渲染）可正常工作。若你的机器有 GPU，可改为 `"angle"` 以提速；也可在命令行临时覆盖：`--gl=angle` / `--gl=swangle`。

### 文件

```
src/lumina/
  schema.ts                 LuminaVideoSchema（slides / secondsPerSlide / transitionSeconds / accentColor / bgmSrc / brandLabel）
  shader.ts                 顶点 + 片元着色器（glassEffect，与原组件一致）
  GlassTransitionCanvas.tsx 原生 WebGL 画布：delayRender 加载纹理，按帧同步绘制
  timing.ts                 帧 → 当前幻灯片 / 转场进度（interpolate + Easing.inOut(Easing.quad)）
  KineticTitle.tsx          六种逐字标题动画（上升 / 下落回弹 / 随机顺序模糊缩放 / 缩放 / X 轴翻转 / 右侧滑入）
  fonts.ts                  @remotion/google-fonts 字体加载
  LuminaSlider.tsx          主模板 + calculateLuminaMetadata
public/lumina/slide-01..06.jpg  演示图片（来自 21st.dev）
src/components/ui/lumina-interactive-list.tsx  网页版原组件（three.js + gsap，仅供网页使用，视频不使用）
src/components/ui/lumina-demo.tsx              网页版示例
```

时间轴：第 k 张（k ≥ 1）在 `k × secondsPerSlide` 秒开始转场，持续 `transitionSeconds` 秒；新标题在转场开始 0.6s 后进入，旧标题向上淡出。所有动画均由 `useCurrentFrame()` 驱动，确定性渲染，不使用 gsap / setTimeout / requestAnimationFrame / CSS 动画。

### 字体

- 标题衬线：**Cormorant Garamond**（与原组件一致）
- 正文无衬线：原组件用 PP Neue Montreal（商业字体），此处用免费的 **Inter** 代替
- 等宽：原组件用 PPSupplyMono（商业字体），此处用 **JetBrains Mono** 代替

如有正式授权，可把字体文件放进 `public/fonts/` 并用 `@remotion/fonts` 的 `loadFont()` 替换 `src/lumina/fonts.ts`。

### 替换图片


### shadcn 结构

项目已加入 `@/*` → `./src/*` 路径别名（tsconfig 与 remotion.config.ts 的 webpack 配置）、`components.json`（new-york 风格）、`src/lib/utils.ts` 中的 `cn()`，以及 `tw-animate-css`（仅供网页组件使用）。

---

## 模板二：Launch 极简产品发布视频

复刻“生成式 UI 产品发布片”的风格：纯白背景、纯黑文字与 UI 外壳、浅灰边框，唯一的科技蓝（`accentColor`）只用于选中态（选择框、徽标、骨架屏）。字体使用 **Geist / Geist Mono**（`@remotion/google-fonts`），大圆角 + 柔和阴影，全部为矢量 UI，无录屏。

```bash
npx remotion render Launch-Landscape out/launch-landscape.mp4
npx remotion render Launch-Portrait out/launch-portrait.mp4
npx remotion still Launch-Landscape out/launch.png --frame=1512    # 代码翻转中途
```

### 分镜（默认 bpm 120，1 拍 = 0.5 秒，共 92 拍 = 46 秒）

| 拍 | 镜头 |
|---|---|
| 0–4 | 线框 Logo 缩小并填充为实心，灰色放射线“超空间”向外流动 |
| 4–8 | “What will you ship?” 淡入，黑色胶囊输入框从中心向两侧展开把它包住 |
| 8–24 | 头像 + 老虎机式滚动的灰色建议词（上下渐隐遮罩）→ 输入 Prompt A → 快速退格 → 输入 Prompt B → 光标沿贝塞尔曲线滑入并点击发送（第 22 拍） |
| 24–30 | 镜头拉远，输入框缩小停靠到底部，应用窗口从中心放大，组件从蓝色线框骨架逐个“解析”成真实 UI |
| 30–34 | 推近底部输入框，输入追问并点击，标题与数字变大变粗 |
| 34–46 | 平移放大到左上角 Logo，蓝色虚线选择框 + “SVG” 徽标，弹出编辑框输入指令，点击 Update，Logo 变蓝 |
| 46–64 | 拉远，点击 “Code </>”，整个窗口沿 X 轴 3D 翻转 180° 露出深色代码编辑器（内置语法高亮），停留后翻回 |
| 64–70 | 推近头部，点击 “Private” 徽标，下拉菜单缩放出现，悬停并选择选项后收起 |
| 70–78 | 持续加速拉远，窗口被几十个 UI 缩略图包围形成密集网格，底部输入框快速轮换 Prompt |
| 78–92 | 白场 → 网址淡入 → 切到 Logo → Logo 变形为品牌图标 → 文字标从右侧滑出 → 淡出到白色 |

### 音乐与节拍

所有镜头边界和关键动作（点击、翻转、选择）都用 `beatToFrame(beat, bpm)` 对齐到节拍上。默认使用 `public/audio/bgm.mp3`（只是一个占位的合成音）。**请换成一首真正的四四拍电子乐**（例如 120 BPM 的 four-on-the-floor），放到 `public/audio/` 后在 props 中设置 `bgmSrc` 和对应的 `bpm`，视频总时长（92 拍）和所有动作会自动按新的 BPM 重新对齐。

### 可配置参数（`src/launch/schema.ts`）

| 参数 | 说明 |
|---|---|
| `brandName` / `url` | 结尾的品牌文字标与网址 |
| `logo` | `{ kind: "builtin" }` 使用内置矢量图标；`{ kind: "image", logoSrc: "brand/logo.svg" }` 使用图片（public/ 路径或 https URL） |
| `accentColor` | 唯一强调色，默认 `#0070F3` |
| `bgmSrc` / `bpm` | 背景音乐与节拍（默认 120） |
| `heroQuestion` | 开场问题 |
| `suggestions` | 老虎机滚动的建议词 |
| `typedPrompts` | `[第一次输入（会被删掉）, 最终输入]` |
| `followUpPrompt` | 追问内容 |
| `editPrompt` / `editTargetLabel` | Logo 编辑指令 / 选择框徽标文字 |
| `appName` | 生成的应用名称（窗口左上角） |
| `codeSnippet` | 翻转后代码编辑器中的代码 |
| `dropdownOptions` | 下拉菜单选项（第 1 项为初始值） |
| `gridPrompts` | 网格镜头中快速轮换的 Prompt |
| `screenshots` | 可选：网格中的图片缩略图（public/ 路径或 URL）；不填则使用矢量 UI 模拟图 |

### 组件（`src/launch/components/`）

`Camera`（关键帧驱动的 2.5D 平移缩放）、`PromptBar`（居中 / 停靠两种状态、打字脚本、老虎机）、`SlotReel`、`Cursor`（贝塞尔路径 + 点击脉冲）、`AppWindow`（由简单区块构成的仪表盘，带骨架 → 完成进度）、`SelectionBox` + `EditPopover`、`FlipCard`（X 轴 3D 翻转）、`CodeEditor`（内置小型 TSX 分词器）、`Dropdown`、`InfiniteGrid`（含 `MockTile`）、`LogoOutro`、`HyperspaceLines`、`BrandMark`。

竖屏下窗口更窄更高、仪表盘纵向堆叠（统计卡片 2×2）、网格列数更少。所有动画均由 `useCurrentFrame()` + `interpolate()`（两侧 clamp）/ `Easing` 驱动，不使用 CSS 动画、setTimeout 或 setInterval。
