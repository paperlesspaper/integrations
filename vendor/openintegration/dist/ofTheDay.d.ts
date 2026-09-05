export type OfTheDayTextSize = "small" | "middle" | "big";
export type OfTheDayLayoutMode = "auto" | "default" | "facts-left-landscape";
export interface OfTheDayFact {
    label: unknown;
    value?: unknown;
    visible?: boolean;
    className?: string;
}
export interface OfTheDayMetaItem {
    label?: unknown;
    value?: unknown;
    visible?: boolean;
    key?: string;
    className?: string;
}
export interface OfTheDayImageOptions {
    src?: string;
    alt?: string;
    fit?: "contain" | "cover";
    position?: string;
    blendMode?: string;
    className?: string;
}
export interface RenderOfTheDayLayoutOptions {
    target?: HTMLElement | string;
    className?: string;
    layout?: OfTheDayLayoutMode;
    textSize?: OfTheDayTextSize | string;
    showHeader?: boolean;
    /** Opt in to the count when selected facts do not all fit. Defaults to false. */
    showFactCount?: boolean;
    kicker?: unknown;
    title: unknown;
    subtitle?: unknown;
    signature?: unknown;
    image?: OfTheDayImageOptions;
    facts?: OfTheDayFact[];
    meta?: OfTheDayMetaItem[];
    emptyValue?: string;
    /** Localized template. Requires showFactCount and an incomplete fact selection. */
    factsShown?: string;
    customProperties?: Record<string, string | number | undefined>;
}
export interface OfTheDayLayoutElements {
    target: HTMLElement;
    shell: HTMLElement;
    header: HTMLElement | null;
    title: HTMLElement | null;
    signature: HTMLElement | null;
    subtitle: HTMLElement | null;
    imageStage: HTMLElement;
    image: HTMLImageElement;
    factGrid: HTMLElement;
    facts: HTMLElement[];
    meta: HTMLElement[];
}
export interface FitOfTheDayLayoutOptions {
    textSize?: OfTheDayTextSize | string;
    titleMin?: number;
    titleMax?: number;
    signatureMin?: number;
    signatureMax?: number;
    /** Kept for compatibility; this layout no longer scales the whole screen. */
    fitScreen?: boolean;
    screenPadding?: number;
}
export interface OfTheDayFitReport {
    selectedFacts: number;
    visibleFacts: number;
    layout: "side" | "stack";
    hasOverflow: boolean;
}
export declare function renderOfTheDayLayout(options: RenderOfTheDayLayoutOptions): OfTheDayLayoutElements;
export declare function fitOfTheDayLayout(layout: OfTheDayLayoutElements | HTMLElement | string, options?: FitOfTheDayLayoutOptions): OfTheDayFitReport;
export declare function waitForOfTheDayImage(layoutOrImage: OfTheDayLayoutElements | HTMLImageElement): Promise<void>;
//# sourceMappingURL=ofTheDay.d.ts.map