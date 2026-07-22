import type { CalendarDisplaySettings, CalendarEvent, CalendarHeaderOptions, CalendarMessages, CalendarRange } from "./calendar";
import type { JsonRecord } from "./types";
export interface CalendarApiData extends JsonRecord {
    calendarName?: unknown;
    events?: unknown;
    sample?: unknown;
    source?: unknown;
}
export interface CalendarApiIntegrationContext {
    data: CalendarApiData;
    mergedSettings: JsonRecord;
    messages: JsonRecord;
    payload: JsonRecord;
    range: CalendarRange;
    settings: CalendarDisplaySettings;
}
export interface CalendarApiRequestContext extends Omit<CalendarApiIntegrationContext, "data"> {
}
export interface BootCalendarApiIntegrationOptions {
    /** Settings shared by the direct fallback and the host-provided payload. */
    defaults: JsonRecord;
    /** Same-origin API route. Settings are sent as a JSON POST body, never in the URL. */
    apiPath?: string;
    /** Heading used when neither settings nor the adapter response provide one. */
    fallbackTitle?: string;
    target?: HTMLElement | string;
    timeoutMs?: number;
    fetch?: typeof fetch;
    buildRequest?: (context: CalendarApiRequestContext) => JsonRecord;
    mapEvents?: (context: CalendarApiIntegrationContext) => CalendarEvent[];
    resolveHeader?: (context: CalendarApiIntegrationContext) => CalendarHeaderOptions | undefined;
    resolveMessages?: (context: CalendarApiIntegrationContext) => Partial<CalendarMessages>;
}
/**
 * Boot a canonical API-backed calendar integration.
 *
 * Providers only need to return `{ events, calendarName?, source?, sample? }`. The helper owns
 * payload updates, localization, settings normalization, same-origin POST transport, rendering,
 * image/font settling, fitting, and ready/error markers.
 */
export declare function bootCalendarApiIntegration(options: BootCalendarApiIntegrationOptions): Promise<void>;
//# sourceMappingURL=calendarIntegration.d.ts.map