export type JsonRecord = Record<string, unknown>;
export interface OpenIntegrationConfigVariant extends JsonRecord {
    screenshots?: Record<string, string>;
}
export interface OpenIntegrationConfig {
    name: string;
    version: string;
    description?: string;
    renderPage: string;
    icon?: string;
    language?: string[];
    settingsPage?: string;
    nativeSettings?: JsonRecord;
    configVariants?: OpenIntegrationConfigVariant[];
    formSchema?: unknown;
}
export interface ValidationResult {
    valid: boolean;
    errors: string[];
    warnings: string[];
}
export type PayloadUpdateHandler = (payload: JsonRecord, event: MessageEvent) => void | Promise<void>;
export interface WaitForPayloadOptions {
    timeout?: number;
    timeoutMs?: number;
    fallback?: JsonRecord;
    allowedOrigins?: string[];
    onUpdate?: PayloadUpdateHandler;
}
export interface FitTextOptions {
    min?: number;
    max?: number;
    step?: number;
    tolerance?: number;
    lineBreak?: boolean | "balance";
    nowrap?: boolean;
    fitParent?: boolean | HTMLElement;
}
export interface HyphenateTextOptions {
    minWordLength?: number;
    minSegmentLength?: number;
    segmentLength?: number;
    wordPattern?: RegExp;
}
export interface PrepareHyphenationOptions extends HyphenateTextOptions {
    lang?: string;
    lineBreak?: boolean | "balance";
}
export interface FitHyphenatedTextOptions extends FitTextOptions, PrepareHyphenationOptions {
}
export interface FitToScreenOptions {
    padding?: number;
    maxScale?: number;
}
export interface OverflowReport {
    hasOverflow: boolean;
    elements: HTMLElement[];
}
//# sourceMappingURL=types.d.ts.map