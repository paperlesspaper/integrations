export interface EmbeddedContext {
    renderId: string;
    regionId: string;
    parentOrigin: string;
}
export declare function embeddedContext(): EmbeddedContext | undefined;
export declare function postEmbeddedStatus(status: "loading" | "ready" | "error", error?: string): void;
export declare function announceEmbeddedListener(): void;
export declare function acceptsEmbeddedInit(event: MessageEvent): boolean;
//# sourceMappingURL=embedded.d.ts.map