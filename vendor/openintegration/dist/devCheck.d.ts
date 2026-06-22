export interface CheckMessage {
    level: "error" | "warning" | "info";
    message: string;
}
export interface CheckResult {
    configPath: string;
    valid: boolean;
    messages: CheckMessage[];
}
export declare function checkIntegration(configPathInput: string): Promise<CheckResult>;
//# sourceMappingURL=devCheck.d.ts.map