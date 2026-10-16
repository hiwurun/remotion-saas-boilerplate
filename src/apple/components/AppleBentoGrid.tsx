import React from "react";
import { Img, staticFile, useVideoConfig, interpolate } from "remotion";
import { CLAMP, GLASS_CLASS, TopHighlight, revealStyle, useAppleSpring, SkeletonPlaceholder } from "../motion";
import type { BentoCard } from "../schema";

const Card: React.FC<{
  card: BentoCard;
  index: number;
  big: boolean;
  isPortrait: boolean;
  available: (src: string) => boolean;
  accentColor: string;
  style: React.CSSProperties;
}> = ({ card, index, big, isPortrait, available, accentColor, style }) => {
  const p = useAppleSpring(10 + index * 8);
  const metricSize = big ? (isPortrait ? 110 : 128) : isPortrait ? 64 : 68;
  const titleSize = big ? (isPortrait ? 34 : 34) : isPortrait ? 26 : 26;
  const descSize = big ? (isPortrait ? 26 : 26) : isPortrait ? 20 : 20;
  const lit = interpolate(p, [0, 1], [0, 1], CLAMP);

  return (
    <div
      className={`${GLASS_CLASS} rounded-[28px] flex flex-col`}
      style={{
        ...style,
        ...revealStyle(p),
        padding: big ? 44 : 30,
        boxShadow: `0 40px 80px -30px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,${0.04 * lit})`,
      }}
    >
      <TopHighlight />
      <div
        className="pointer-events-none absolute -top-1/2 left-1/4 h-full w-1/2 rounded-full blur-[80px]"
        style={{ background: accentColor, opacity: 0.18 * lit }}
      />
      <div className="text-white/55 font-medium" style={{ fontSize: titleSize }}>{card.title}</div>
      <div
        className="font-bold tracking-tight bg-gradient-to-b from-white via-zinc-200 to-zinc-500 bg-clip-text text-transparent leading-none"
        style={{ fontSize: metricSize, marginTop: big ? 20 : 12 }}
      >
        {card.metric}
      </div>
      <div className="text-white/45 leading-snug" style={{ fontSize: descSize, marginTop: big ? 18 : 10 }}>{card.description}</div>
      {card.imgSrc ? (
        <div className="relative mt-auto overflow-hidden rounded-t-2xl border border-b-0 border-white/[0.08]" style={{ height: big ? "48%" : "34%", marginTop: 20, marginBottom: big ? -44 : -30 }}>
          {available(card.imgSrc) ? (
            <Img src={staticFile(card.imgSrc)} className="absolute inset-0 h-full w-full" style={{ objectFit: "cover", objectPosition: "top left" }} />
          ) : (
            <SkeletonPlaceholder label="" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B0B0E] via-transparent to-transparent" />
        </div>
      ) : null}
    </div>
  );
};

export const AppleBentoGrid: React.FC<{
  cards: BentoCard[];
  width: number;
  height: number;
  accentColor: string;
  available: (src: string) => boolean;
}> = ({ cards, width, height, accentColor, available }) => {
  const { width: vw, height: vh } = useVideoConfig();
  const isPortrait = vh > vw;
  const gap = isPortrait ? 22 : 26;

  // Landscape: big card spans 2 rows on the left; 3 small on the right (1 wide top, 2 bottom).
  // Portrait: big card full width on top, then 2 cols, then 1 full-width.
  const areas = isPortrait
    ? { cols: "1fr 1fr", rows: "1.4fr 0.8fr 0.9fr", place: ["1 / 1 / 2 / 3", "2 / 1 / 3 / 2", "2 / 2 / 3 / 3", "3 / 1 / 4 / 3"] }
    : { cols: "1.25fr 1fr 1fr", rows: "1fr 1fr", place: ["1 / 1 / 3 / 2", "1 / 2 / 2 / 4", "2 / 2 / 3 / 3", "2 / 3 / 3 / 4"] };

  return (
    <div style={{ width, height, display: "grid", gridTemplateColumns: areas.cols, gridTemplateRows: areas.rows, gap }}>
      {cards.slice(0, 4).map((c, i) => (
        <Card
          key={i}
          card={c}
          index={i}
          big={i === 0}
          isPortrait={isPortrait}
          available={available}
          accentColor={accentColor}
          style={{ gridArea: areas.place[i], minHeight: 0, minWidth: 0 }}
        />
      ))}
    </div>
  );
};
