import { type AutoProcessingIntent, type DitherImageOptions, type ImageKind } from "epdoptimize";
import { type EpdOptimizePaletteName } from "./epdOptimizeMeta";
export interface EpdOptimizeOptions {
    height: number;
    intent?: AutoProcessingIntent;
    options?: Partial<DitherImageOptions>;
    paletteName?: EpdOptimizePaletteName;
    width: number;
}
export interface EpdOptimizeResult {
    buffer: Buffer;
    height: number;
    imageKind: ImageKind;
    intent: AutoProcessingIntent;
    processingPreset?: string;
    reasons: string[];
    usedColors: string[];
    width: number;
}
export declare function optimizePngForSpectra6(sourcePng: Buffer, { height, intent, options, paletteName, width }: EpdOptimizeOptions): Promise<EpdOptimizeResult>;
//# sourceMappingURL=epdOptimize.d.ts.map