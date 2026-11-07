export interface ScaffoldOptions {
    targetDir: string;
    name?: string;
    force?: boolean;
    api?: boolean;
}
export interface ScaffoldResult {
    targetDir: string;
    files: string[];
}
interface ScaffoldFile {
    path: string;
    body: string;
}
export declare function buildScaffoldFiles(options: ScaffoldOptions): ScaffoldFile[];
export declare function scaffoldIntegration(options: ScaffoldOptions): Promise<ScaffoldResult>;
export {};
//# sourceMappingURL=scaffold.d.ts.map