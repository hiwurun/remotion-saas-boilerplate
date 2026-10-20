import React from "react";
import { MONO, SANS } from "../../shared/fonts";
import { WIN, WIN_LEFT, WIN_TOP } from "../layout";
import { pressCurve } from "../components/Cursor";
import { MetricFilterDialog } from "../components/MetricFilterDialog";
import type { MarketTimeline } from "../timeline";

/** 数值筛选 shot: the real filter dialog over the app window. */
export const MetricFilterScene: React.FC<{ tl: MarketTimeline }> = ({ tl }) => {
  const { accent, f, ml, mlp, mc, dlgLeft, dlgTop, quickIdx, mOpen, mQuick, mDraft, mFocus } = tl;
  return (
    <>
    {mOpen > 0 ? (
      <div style={{ position: "absolute", left: WIN_LEFT, top: WIN_TOP, width: WIN.w, height: WIN.h, borderRadius: 22, overflow: "hidden" }}>
        <MetricFilterDialog
          open={mOpen}
          font={SANS}
          mono={MONO}
          accent={accent}
          quickLabel={mc.quick}
          quickActive={mQuick}
          draft={{ [mc.field]: { min: mc.min, max: mc.max } }}
          draftP={mDraft}
          focusField={mc.field}
          focusP={mFocus}
          hoverChip={f >= ml(2.8) && f < ml(3.4) ? quickIdx : -1}
          applyPress={pressCurve(f, ml(5.0))}
          applyHover={mlp(4.5, 4.7)}
          width={WIN.w}
          height={WIN.h}
          left={dlgLeft}
          top={dlgTop}
        />
      </div>
    ) : null}
    </>
  );
};
