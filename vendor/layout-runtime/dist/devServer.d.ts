import type { JsonRecord, OpenIntegrationConfig } from "./types";
export interface DevServerOptions {
    configPath: string;
    host?: string;
    port?: number;
    settings?: JsonRecord;
    language?: string;
    orientation?: string;
    frameKind?: string;
    color?: string;
    watch?: boolean;
}
export interface DevServerHandle {
    url: string;
    liveReload: boolean;
    close(): Promise<void>;
}
export declare function readConfig(configPath: string): Promise<OpenIntegrationConfig>;
export declare function buildPayload(config: OpenIntegrationConfig, configUrl: string, options: DevServerOptions): JsonRecord;
export declare function toPreviewPagePath(page: string): string;
export declare function startDevServer(options: DevServerOptions): Promise<DevServerHandle>;
//# sourceMappingURL=devServer.d.ts.map