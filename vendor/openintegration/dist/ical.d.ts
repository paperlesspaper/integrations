import type { CalendarEvent } from "./calendar";
export type ICalendarRangeValue = Date | string | number;
export interface ParseICalendarOptions {
    /** Inclusive start of the requested range. Date-only strings are civil dates in `timeZone`. */
    rangeStart: ICalendarRangeValue;
    /** Exclusive end of the requested range. Date-only strings are civil dates in `timeZone`. */
    rangeEndExclusive: ICalendarRangeValue;
    /** IANA timezone used for civil range boundaries, floating values, and normalized output. */
    timeZone: string;
    /** Maximum number of source VEVENT components accepted from one calendar. */
    maxEvents?: number;
    /** Maximum number of recurrence candidates evaluated for one parse operation. */
    maxOccurrences?: number;
}
export declare const DEFAULT_ICAL_EVENT_LIMIT = 5000;
export declare const DEFAULT_ICAL_OCCURRENCE_LIMIT = 50000;
export declare const HARD_ICAL_EVENT_LIMIT = 20000;
export declare const HARD_ICAL_OCCURRENCE_LIMIT = 100000;
export type ICalendarLimitCode = "ICAL_EVENT_LIMIT" | "ICAL_OCCURRENCE_LIMIT";
export declare class ICalendarLimitError extends Error {
    readonly code: ICalendarLimitCode;
    readonly limit: number;
    constructor(code: ICalendarLimitCode, limit: number);
}
export declare class ICalendarParseError extends Error {
    readonly cause?: unknown;
    constructor(message: string, cause?: unknown);
}
/**
 * Parse and expand an RFC 5545 calendar into the presentation layer's canonical event model.
 *
 * Returned events overlap the half-open `[rangeStart, rangeEndExclusive)` range. Recurrence
 * expansion is deliberately bounded; exceeding a limit throws instead of silently truncating.
 */
export declare function parseICalendar(source: string, options: ParseICalendarOptions): CalendarEvent[];
/** Lower-camel alias for callers that prefer the feed-format spelling. */
export declare const parseIcalCalendar: typeof parseICalendar;
//# sourceMappingURL=ical.d.ts.map