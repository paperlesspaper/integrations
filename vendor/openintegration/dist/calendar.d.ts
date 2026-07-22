export type CalendarView = "agenda" | "day" | "three-days" | "week" | "year";
export interface CalendarDateValue {
    date?: string;
    dateTime?: string;
    timeZone?: string;
}
export interface CalendarEventDetail {
    label?: unknown;
    value: unknown;
    visible?: boolean;
}
export interface CalendarEvent {
    id?: unknown;
    title?: unknown;
    start: CalendarDateValue;
    end?: CalendarDateValue;
    location?: unknown;
    iconName?: string;
    imageUrl?: string;
    details?: CalendarEventDetail[];
}
export interface CalendarMessages {
    allDay: string;
    empty: string;
    moreEvents: string;
    today: string;
    untitled: string;
}
export interface CalendarDisplaySettings {
    view: CalendarView;
    locale: string;
    timeZone?: string;
    dayRange: number;
    maxEvents: number;
    highlightToday: boolean;
    highlightScale: number;
    showLocation: boolean;
    showEventIcons: boolean;
    showEventImages: boolean;
}
export type CalendarSettingsInput = Partial<CalendarDisplaySettings> | Record<string, unknown>;
export interface CalendarHeaderOptions {
    kicker?: unknown;
    title?: unknown;
    subtitle?: unknown;
    source?: unknown;
}
export interface CalendarRange {
    view: CalendarView;
    startDate: Date;
    endDate: Date;
    startKey: string;
    endKey: string;
    dateKeys: string[];
}
export interface PreparedCalendarEvent {
    event: CalendarEvent;
    dateKey: string;
    startDate: Date | null;
    sortTime: number;
}
export interface RenderCalendarLayoutOptions {
    target?: HTMLElement | string;
    events?: CalendarEvent[];
    settings?: CalendarSettingsInput;
    messages?: Partial<CalendarMessages>;
    now?: Date | string | number;
    header?: CalendarHeaderOptions;
    iconAliases?: Record<string, string>;
    className?: string;
}
export interface CalendarLayoutElements {
    target: HTMLElement;
    shell: HTMLElement;
    body: HTMLElement;
    settings: CalendarDisplaySettings;
    events: PreparedCalendarEvent[];
    range: CalendarRange;
}
export interface FitCalendarLayoutOptions {
    min?: number;
    max?: number;
    step?: number;
    tolerance?: number;
    fitScreen?: boolean;
    screenPadding?: number;
}
export declare const DEFAULT_CALENDAR_SETTINGS: CalendarDisplaySettings;
export declare const DEFAULT_CALENDAR_MESSAGES: CalendarMessages;
export declare function normalizeCalendarSettings(input: CalendarSettingsInput | undefined, defaults?: Partial<CalendarDisplaySettings>): CalendarDisplaySettings;
export declare function buildCalendarRange(settingsInput?: CalendarSettingsInput, now?: Date | string | number): CalendarRange;
export declare function prepareCalendarEvents(events: CalendarEvent[], settingsInput?: CalendarSettingsInput, now?: Date | string | number): PreparedCalendarEvent[];
export declare function renderCalendarLayout(options: RenderCalendarLayoutOptions): CalendarLayoutElements;
export declare function fitCalendarLayout(layoutOrTarget: CalendarLayoutElements | HTMLElement | string, options?: FitCalendarLayoutOptions): void;
export declare function waitForCalendarImages(layoutOrRoot: CalendarLayoutElements | HTMLElement | string, timeoutMs?: number): Promise<void>;
//# sourceMappingURL=calendar.d.ts.map