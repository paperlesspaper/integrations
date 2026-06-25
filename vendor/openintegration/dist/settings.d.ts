import type { JsonRecord } from "./types";
export interface PostSettingsMessageOptions {
    targetOrigin?: string;
    target?: Window;
    legacy?: boolean;
}
export interface SettingsHeightOptions extends PostSettingsMessageOptions {
    minHeight?: number;
    root?: HTMLElement;
}
export interface SetupSettingsPageOptions extends SettingsHeightOptions {
    onPayload?: (payload: JsonRecord, event: MessageEvent) => void;
}
export declare function mergeSettings<T extends JsonRecord>(...sources: Array<JsonRecord | Partial<T> | undefined>): T;
export declare function getSettings<T extends JsonRecord>(payload?: JsonRecord, defaults?: T): T;
export declare function getQuerySettings<T extends JsonRecord>(defaults?: T): T;
export declare function getSettingsFromMessage<T extends JsonRecord>(message: unknown, defaults?: T): T | undefined;
export declare function postSettingsUpdate(settingsPatch: JsonRecord, options?: PostSettingsMessageOptions): void;
export declare function postSettingsReady(options?: PostSettingsMessageOptions): void;
export declare function getSettingsPageHeight(root?: HTMLElement): number;
export declare function postSettingsHeight(height?: number, options?: SettingsHeightOptions): void;
export declare function observeSettingsHeight(options?: SettingsHeightOptions): () => void;
export declare function setupSettingsPage(options?: SetupSettingsPageOptions): () => void;
//# sourceMappingURL=settings.d.ts.map