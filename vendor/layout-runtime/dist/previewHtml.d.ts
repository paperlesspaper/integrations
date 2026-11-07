import type { JsonRecord, OpenIntegrationConfig } from "./types";
export interface PreviewHtmlOptions {
    config: OpenIntegrationConfig;
    configUrl: string;
    payload: JsonRecord;
    renderPath: string;
    settingsPath?: string;
}
export declare function createPreviewHtml({ config, configUrl, payload, renderPath, settingsPath, }: PreviewHtmlOptions): string;
//# sourceMappingURL=previewHtml.d.ts.map