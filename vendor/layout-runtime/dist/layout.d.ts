import type { JsonRecord } from "./types";
export interface LayoutRegion {
    id: string;
    type: "image" | "integration";
    url: string;
    payload?: JsonRecord;
    processing?: "inherit" | "photo" | "readable" | "quantization";
    fit?: "cover" | "contain";
    focalX?: number;
    focalY?: number;
}
export interface LayoutPayload {
    renderId: string;
    layout: "columns" | "rows" | "grid" | "custom";
    regions: LayoutRegion[];
    ratio?: number;
    gap?: number;
    html?: string;
    css?: string;
    color?: string;
}
export declare function sanitizeLayoutHtml(html: string): string;
export declare function validateLayoutRects(rects: Array<{
    x: number;
    y: number;
    width: number;
    height: number;
}>, width: number, height: number): void;
/** One fresh iframe per slot and render generation prevents late results from previous INITs. */
export declare function renderLayout(target: HTMLElement, config: LayoutPayload, signal: AbortSignal): Promise<void>;
export declare function bootLayoutIntegration(target: HTMLElement): Promise<void>;
//# sourceMappingURL=layout.d.ts.map