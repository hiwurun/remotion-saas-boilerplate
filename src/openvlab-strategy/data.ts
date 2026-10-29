import chainJson from "./data/chain.json";
import { Chain, createModel } from "./model/model";

/** Data file lives beside the video (data/chain.json: IM2611 K=6600 straddle legs). Everything else is computed by model/model.ts. */
export const CHAIN = chainJson as unknown as Chain;
export const MODEL = createModel(CHAIN);
export const ATM_ROW = MODEL.rows.findIndex((r) => r.showLine);
