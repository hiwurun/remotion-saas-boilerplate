import "./index.css";
import React from "react";
import { Composition } from "remotion";
import { LuminaSlider, calculateLuminaMetadata } from "./lumina/LuminaSlider";
import { LuminaVideoSchema } from "./lumina/schema";
import { LaunchVideo, calculateLaunchMetadata } from "./launch/LaunchVideo";
import { LaunchVideoSchema } from "./launch/schema";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="Lumina-Landscape"
        component={LuminaSlider}
        width={1920}
        height={1080}
        fps={60}
        durationInFrames={1800}
        schema={LuminaVideoSchema}
        calculateMetadata={calculateLuminaMetadata}
        defaultProps={{
          secondsPerSlide: 5,
          transitionSeconds: 2.5,
          accentColor: "#d4af37",
          bgmSrc: "audio/bgm.mp3",
          brandLabel: "Lumina — Collection",
          slides: [
            { title: "Ethereal Glow", description: "A soft luminescence that dissolves the boundary between light and form.", src: "lumina/slide-01.jpg" },
            { title: "Rose Mirage", description: "Petal tones drifting through a haze of warm, refracted colour.", src: "lumina/slide-02.jpg" },
            { title: "Velvet Mystique", description: "Deep, tactile shadows wrapped in a quiet, velvet darkness.", src: "lumina/slide-03.jpg" },
            { title: "Golden Hour", description: "The fleeting moment when everything turns to amber and gold.", src: "lumina/slide-04.jpg" },
            { title: "Midnight Dreams", description: "Nocturnal blues and silent reflections beneath a sleeping sky.", src: "lumina/slide-05.jpg" },
            { title: "Silver Light", description: "Cool metallic highlights tracing the edges of the unseen.", src: "lumina/slide-06.jpg" },
          ],
        }}
      />
      <Composition
        id="Lumina-Portrait"
        component={LuminaSlider}
        width={1080}
        height={1920}
        fps={60}
        durationInFrames={1800}
        schema={LuminaVideoSchema}
        calculateMetadata={calculateLuminaMetadata}
        defaultProps={{
          secondsPerSlide: 5,
          transitionSeconds: 2.5,
          accentColor: "#d4af37",
          bgmSrc: "audio/bgm.mp3",
          brandLabel: "Lumina — Collection",
          slides: [
            { title: "Ethereal Glow", description: "A soft luminescence that dissolves the boundary between light and form.", src: "lumina/slide-01.jpg" },
            { title: "Rose Mirage", description: "Petal tones drifting through a haze of warm, refracted colour.", src: "lumina/slide-02.jpg" },
            { title: "Velvet Mystique", description: "Deep, tactile shadows wrapped in a quiet, velvet darkness.", src: "lumina/slide-03.jpg" },
            { title: "Golden Hour", description: "The fleeting moment when everything turns to amber and gold.", src: "lumina/slide-04.jpg" },
            { title: "Midnight Dreams", description: "Nocturnal blues and silent reflections beneath a sleeping sky.", src: "lumina/slide-05.jpg" },
            { title: "Silver Light", description: "Cool metallic highlights tracing the edges of the unseen.", src: "lumina/slide-06.jpg" },
          ],
        }}
      />
      <Composition
        id="Launch-Landscape"
        component={LaunchVideo}
        width={1920}
        height={1080}
        fps={60}
        durationInFrames={2760}
        schema={LaunchVideoSchema}
        calculateMetadata={calculateLaunchMetadata}
        defaultProps={{
            "brandName": "灵构 AI",
            "url": "lingou.ai",
            "logo": {
              "kind": "builtin"
            },
            "accentColor": "#0070F3",
            "bgmSrc": "audio/bgm.mp3",
            "bpm": 120,
            "heroQuestion": "今天想做点什么？",
            "suggestions": [
              "做一个带定价表的 SaaS 落地页",
              "生成一个可拖拽的看板应用",
              "设计一个极简风格的登录页",
              "为咖啡店做一个销售数据看板",
              "做一个支持年付切换的定价页",
              "设计一个 AI 聊天界面"
            ],
            "typedPrompts": [
              "给我的创业公司做个官网",
              "为灵构科技生成销售看板：侧边栏、统计卡片、图表和订单表"
            ],
            "followUpPrompt": "把标题和数字调大、加粗",
            "editPrompt": "把公司标志改成蓝色",
            "editTargetLabel": "SVG",
            "appName": "灵构科技",
            "codeSnippet": "import { Card } from \"@/components/ui/card\"\nimport { Chart } from \"@/components/chart\"\n\n// 由灵构 AI 生成\nexport default function Dashboard() {\n  const stats = useStats()\n  return (\n    <main className=\"grid gap-6 p-8\">\n      <Header logo=\"lingou\" title=\"数据看板\" />\n      <div className=\"grid grid-cols-4 gap-4\">\n        {stats.map((s) => (\n          <Card key={s.id} label={s.label} value={s.value} />\n        ))}\n      </div>\n      {/* 营收趋势 */}\n      <Chart data={revenue} title=\"营收趋势\" height={320} />\n      <OrdersTable title=\"最近订单\" limit={5} />\n    </main>\n  )\n}",
            "dropdownOptions": [
              "私密",
              "团队可见",
              "公开"
            ],
            "gridPrompts": [
              "复刻一个音乐播放器界面",
              "生成电商商品详情页",
              "做一个毛玻璃风格的天气应用",
              "带暗色模式的后台管理",
              "做一个个人作品集网站",
              "三步式新手引导流程",
              "支持话题的实时聊天",
              "设计一个日程管理看板"
            ]
          }}
      />
      <Composition
        id="Launch-Portrait"
        component={LaunchVideo}
        width={1080}
        height={1920}
        fps={60}
        durationInFrames={2760}
        schema={LaunchVideoSchema}
        calculateMetadata={calculateLaunchMetadata}
        defaultProps={{
            "brandName": "灵构 AI",
            "url": "lingou.ai",
            "logo": {
              "kind": "builtin"
            },
            "accentColor": "#0070F3",
            "bgmSrc": "audio/bgm.mp3",
            "bpm": 120,
            "heroQuestion": "今天想做点什么？",
            "suggestions": [
              "做一个带定价表的 SaaS 落地页",
              "生成一个可拖拽的看板应用",
              "设计一个极简风格的登录页",
              "为咖啡店做一个销售数据看板",
              "做一个支持年付切换的定价页",
              "设计一个 AI 聊天界面"
            ],
            "typedPrompts": [
              "给我的创业公司做个官网",
              "为灵构科技生成销售看板：侧边栏、统计卡片、图表和订单表"
            ],
            "followUpPrompt": "把标题和数字调大、加粗",
            "editPrompt": "把公司标志改成蓝色",
            "editTargetLabel": "SVG",
            "appName": "灵构科技",
            "codeSnippet": "import { Card } from \"@/components/ui/card\"\nimport { Chart } from \"@/components/chart\"\n\n// 由灵构 AI 生成\nexport default function Dashboard() {\n  const stats = useStats()\n  return (\n    <main className=\"grid gap-6 p-8\">\n      <Header logo=\"lingou\" title=\"数据看板\" />\n      <div className=\"grid grid-cols-4 gap-4\">\n        {stats.map((s) => (\n          <Card key={s.id} label={s.label} value={s.value} />\n        ))}\n      </div>\n      {/* 营收趋势 */}\n      <Chart data={revenue} title=\"营收趋势\" height={320} />\n      <OrdersTable title=\"最近订单\" limit={5} />\n    </main>\n  )\n}",
            "dropdownOptions": [
              "私密",
              "团队可见",
              "公开"
            ],
            "gridPrompts": [
              "复刻一个音乐播放器界面",
              "生成电商商品详情页",
              "做一个毛玻璃风格的天气应用",
              "带暗色模式的后台管理",
              "做一个个人作品集网站",
              "三步式新手引导流程",
              "支持话题的实时聊天",
              "设计一个日程管理看板"
            ]
          }}
      />
    </>
  );
};
