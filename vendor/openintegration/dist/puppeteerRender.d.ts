import { type EpdOptimizeResult } from "./epdOptimize";
import type { JsonRecord } from "./types";
export { parseEpdOptimizeMetaContent } from "./epdOptimizeMeta";
export interface PuppeteerRenderOptions {
    chromePath?: string;
    height: number;
    optimize?: boolean;
    payload?: JsonRecord;
    readyTimeoutMs?: number;
    url: string;
    width: number;
}
export interface PuppeteerRenderResult {
    buffer: Buffer;
    epd?: EpdOptimizeResult;
    height: number;
    optimized: boolean;
    ready: boolean;
    width: number;
}
export declare function renderUrlWithPuppeteer({ chromePath, height, optimize, payload, readyTimeoutMs, url, width }: PuppeteerRenderOptions): Promise<PuppeteerRenderResult>;
//# sourceMappingURL=puppeteerRender.d.ts.map