import type { FitHyphenatedTextOptions, HyphenateTextOptions, PrepareHyphenationOptions } from "./types";
export declare const SOFT_HYPHEN = "\u00AD";
export declare function stripSoftHyphens(value: string): string;
export declare function hyphenateWord(word: string, options?: HyphenateTextOptions): string;
export declare function hyphenateText(value: string, options?: HyphenateTextOptions): string;
export declare function addSoftHyphensToTextNodes(root: HTMLElement, options?: HyphenateTextOptions): void;
export declare function prepareHyphenation(element: HTMLElement, options?: PrepareHyphenationOptions): void;
export declare function fitHyphenatedText(element: HTMLElement, options?: FitHyphenatedTextOptions): void;
//# sourceMappingURL=hyphenation.d.ts.map