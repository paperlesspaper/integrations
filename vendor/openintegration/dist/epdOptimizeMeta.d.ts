import { type AutoProcessingIntent, type DitherImageOptions, type PaletteColorEntry } from "epdoptimize";
export declare const EPD_OPTIMIZE_META_NAME = "paperless:epd-optimize";
export declare const DEFAULT_EPD_OPTIMIZE_PALETTE_NAME = "aitjcizeSpectra6Palette";
declare const EPD_OPTIMIZE_PALETTES: {
    acepPalette: PaletteColorEntry[];
    aitjcizeSpectra6Palette: PaletteColorEntry[];
    defaultPalette: PaletteColorEntry[];
    gameboyPalette: PaletteColorEntry[];
    genericFourGrayscalePalette: PaletteColorEntry[];
    genericTwoColorEinkPalette: PaletteColorEntry[];
    spectra6BoeberPalette: PaletteColorEntry[];
    spectra6legacyPalette: PaletteColorEntry[];
    spectra6OriginalPalette: PaletteColorEntry[];
    spectra6OriginalPreviewPalette: PaletteColorEntry[];
    spectra6Palette: PaletteColorEntry[];
    trmnlSeeed16GrayscalePalette: PaletteColorEntry[];
};
export type EpdOptimizePaletteName = keyof typeof EPD_OPTIMIZE_PALETTES;
export interface EpdOptimizeMetaSettings {
    enabled?: boolean;
    intent?: AutoProcessingIntent;
    options?: Partial<DitherImageOptions>;
    paletteName?: EpdOptimizePaletteName;
}
export declare function parseEpdOptimizeMetaContent(content: string | null | undefined): EpdOptimizeMetaSettings | undefined;
export declare function resolveEpdOptimizePalette(name?: EpdOptimizePaletteName): PaletteColorEntry[];
export {};
//# sourceMappingURL=epdOptimizeMeta.d.ts.map