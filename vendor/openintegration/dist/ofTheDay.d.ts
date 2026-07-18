export type OfTheDayTextSize = "small" | "middle" | "big";
export type OfTheDayLayoutMode = "default" | "facts-left-landscape";
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
    kicker?: unknown;
    title: unknown;
    subtitle?: unknown;
    signature?: unknown;
    image?: OfTheDayImageOptions;
    facts?: OfTheDayFact[];
    meta?: OfTheDayMetaItem[];
    emptyValue?: string;
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
    fitScreen?: boolean;
    screenPadding?: number;
}
export declare function renderOfTheDayLayout(options: RenderOfTheDayLayoutOptions): OfTheDayLayoutElements;
export declare function fitOfTheDayLayout(layout: OfTheDayLayoutElements | HTMLElement | string, options?: FitOfTheDayLayoutOptions): void;
export declare function waitForOfTheDayImage(layoutOrImage: OfTheDayLayoutElements | HTMLImageElement): Promise<void>;
//# sourceMappingURL=ofTheDay.d.ts.map