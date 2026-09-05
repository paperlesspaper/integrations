const { bootCalendarApiIntegration } = window.PaperlessOpenIntegration;
const defaults = {
  color: "blue-light",
  title: "",
  sampleData: true,
  schedule: "",
  schoolName: "",
  view: "week",
  timeZone: "Europe/Berlin",
  dayRange: 7,
  maxEvents: 30,
  showLocation: true,
  highlightToday: true,
  now: "",
};
window.__paperlessRenderDone = bootCalendarApiIntegration({
  defaults,
  buildRequest({ mergedSettings, settings, range, payload }) {
    settings.locale = payload?.meta?.language || "de-DE";
    if (settings.view === "agenda")
      settings.maxEvents = Math.min(
        settings.maxEvents,
        innerHeight <= 500 ? 4 : innerWidth < 700 ? 8 : 20,
      );
    return {
      ...mergedSettings,
      ...settings,
      language: payload?.meta?.language || "de",
      rangeStart: range.startKey,
      rangeEndExclusive: range.endKey,
    };
  },
  resolveHeader({ data, mergedSettings, messages }) {
    return {
      kicker: messages.kicker,
      title: mergedSettings.title || messages.title,
      subtitle: data.calendarName || "",
      source: data.sample ? messages.sampleSource : messages.source,
    };
  },
});
