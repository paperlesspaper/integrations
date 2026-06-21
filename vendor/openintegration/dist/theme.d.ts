export declare const COLOR_THEMES: readonly ["dark", "light", "red-dark", "red-light", "blue-dark", "blue-light", "green-dark", "green-light"];
export type ColorThemeName = (typeof COLOR_THEMES)[number];
export interface ApplyColorThemeOptions {
    defaultTheme?: ColorThemeName;
    target?: HTMLElement;
}
export interface ApplyColorThemeFromQueryOptions extends ApplyColorThemeOptions {
    paramName?: string;
}
export declare function normalizeColorTheme(value: string | null | undefined, fallback?: ColorThemeName): ColorThemeName;
export declare function applyColorTheme(value: string | null | undefined, options?: ApplyColorThemeOptions): ColorThemeName;
export declare function applyColorThemeFromQuery(options?: ApplyColorThemeFromQueryOptions): ColorThemeName;
//# sourceMappingURL=theme.d.ts.map