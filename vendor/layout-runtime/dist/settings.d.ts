import type { JsonRecord } from "./types";
export declare function mergeSettings<T extends JsonRecord>(...sources: Array<JsonRecord | Partial<T> | undefined>): T;
export declare function getSettings<T extends JsonRecord>(payload?: JsonRecord, defaults?: T): T;
export declare function getQuerySettings<T extends JsonRecord>(defaults?: T): T;
//# sourceMappingURL=settings.d.ts.map