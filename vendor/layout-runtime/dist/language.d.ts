import type { JsonRecord } from "./types";
export interface ResolveLanguageOptions {
    requested?: string;
    supported?: string[];
    defaultLanguage?: string;
}
export interface LoadLanguageJsonOptions extends ResolveLanguageOptions {
    basePath?: string;
    fetch?: (input: string, init?: RequestInit) => Promise<Response>;
}
export interface LanguageJsonResult<TMessages extends JsonRecord = JsonRecord> {
    language: string;
    messages: TMessages;
}
export declare function getPayloadLanguage(payload?: JsonRecord): string | undefined;
export declare function resolveLanguage({ requested, supported, defaultLanguage }: ResolveLanguageOptions): string;
export declare function loadLanguageJson<TMessages extends JsonRecord = JsonRecord>(payload?: JsonRecord, options?: LoadLanguageJsonOptions): Promise<LanguageJsonResult<TMessages>>;
//# sourceMappingURL=language.d.ts.map