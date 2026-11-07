import { type EpdOptimizeMetaSettings } from "./epdOptimizeMeta";
export interface RenderRegion {
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    settings?: EpdOptimizeMetaSettings;
}
/** Treat layout metadata as untrusted: exact pixels, bounded count, no overlaps. */
export declare function parseRenderRegions(content: string | null, size: {
    width: number;
    height: number;
}): RenderRegion[] | undefined;
//# sourceMappingURL=renderRegions.d.ts.map