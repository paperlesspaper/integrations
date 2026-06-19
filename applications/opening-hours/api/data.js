const DAY_KEYS = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

const DAY_LABELS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const DEFAULTS = {
  businessName: "Paperless Coffee",
  subtitle: "Cafe and workspace",
  placeId: "",
  googleMapsApiKey: "",
  languageCode: "en",
  regionCode: "",
  timezone: "Europe/Berlin",
  monday: "08:00-18:00",
  tuesday: "08:00-18:00",
  wednesday: "08:00-18:00",
  thursday: "08:00-18:00",
  friday: "08:00-18:00",
  saturday: "10:00-16:00",
  sunday: "closed",
  notes: "Special holiday hours may vary.",
  address: "Sample Street 12, Berlin",
  phone: "",
  website: "",
  showWeeklyHours: true,
  showContact: true,
  clockMode: "24h",
};

function stringSetting(query, key) {
  const value = query[key];
  const normalize = (item) => {
    if (item === undefined || item === null) {
      return DEFAULTS[key];
    }
    if (typeof item !== "string") {
      return DEFAULTS[key];
    }
    const trimmed = item.trim();
    return trimmed && !/^(null|undefined)$/i.test(trimmed)
      ? trimmed
      : DEFAULTS[key];
  };

  if (Array.isArray(value)) {
    return normalize(value[0]);
  }
  return normalize(value);
}

function booleanSetting(query, key) {
  const value = query[key];
  if (value === undefined || value === null || value === "") {
    return DEFAULTS[key];
  }
  return value === true || value === "true" || value === "1" || value === "on";
}

function getSettings(query) {
  return {
    ...DEFAULTS,
    businessName: stringSetting(query, "businessName"),
    subtitle: stringSetting(query, "subtitle"),
    placeId: stringSetting(query, "placeId"),
    googleMapsApiKey: stringSetting(query, "googleMapsApiKey"),
    languageCode: stringSetting(query, "languageCode"),
    regionCode: stringSetting(query, "regionCode"),
    timezone: stringSetting(query, "timezone"),
    monday: stringSetting(query, "monday"),
    tuesday: stringSetting(query, "tuesday"),
    wednesday: stringSetting(query, "wednesday"),
    thursday: stringSetting(query, "thursday"),
    friday: stringSetting(query, "friday"),
    saturday: stringSetting(query, "saturday"),
    sunday: stringSetting(query, "sunday"),
    notes: stringSetting(query, "notes"),
    address: stringSetting(query, "address"),
    phone: stringSetting(query, "phone"),
    website: stringSetting(query, "website"),
    showWeeklyHours: booleanSetting(query, "showWeeklyHours"),
    showContact: booleanSetting(query, "showContact"),
    clockMode: stringSetting(query, "clockMode") === "12h" ? "12h" : "24h",
  };
}

function parseTime(value) {
  const match = String(value).trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) {
    return null;
  }

  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) {
    return null;
  }

  return hour * 60 + minute;
}

function formatTime(minutes, clockMode = "24h") {
  const normalized = ((minutes % 1440) + 1440) % 1440;
  const hour = Math.floor(normalized / 60);
  const minute = normalized % 60;
  if (clockMode === "12h") {
    const suffix = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${hour12}:${String(minute).padStart(2, "0")} ${suffix}`;
  }

  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function parseDaySchedule(value) {
  const raw = String(value || "").trim();
  if (!raw || /^closed$/i.test(raw) || /^off$/i.test(raw)) {
    return [];
  }
  if (/^(24h|24\/7|open)$/i.test(raw)) {
    return [{ start: 0, end: 1440, allDay: true }];
  }

  return raw
    .split(",")
    .map((part) => part.trim())
    .map((part) => {
      const [startRaw, endRaw] = part.split("-").map((item) => item?.trim());
      const start = parseTime(startRaw);
      const end = parseTime(endRaw);
      if (start === null || end === null) {
        return null;
      }
      return { start, end: end <= start ? end + 1440 : end, allDay: false };
    })
    .filter(Boolean);
}

function getZonedParts(date, timezone) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  const parts = Object.fromEntries(
    formatter.formatToParts(date).map((part) => [part.type, part.value]),
  );
  const weekdayIndex = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(
    parts.weekday,
  );

  return {
    weekdayIndex: weekdayIndex >= 0 ? weekdayIndex : date.getDay(),
    minuteOfDay: Number(parts.hour) * 60 + Number(parts.minute),
  };
}

function describeRanges(ranges, clockMode) {
  if (!ranges.length) {
    return "Closed";
  }
  if (ranges.some((range) => range.allDay)) {
    return "Open 24 hours";
  }
  return ranges
    .map((range) => `${formatTime(range.start, clockMode)}-${formatTime(range.end, clockMode)}`)
    .join(", ");
}

function buildManualHours(settings) {
  const now = new Date();
  const { weekdayIndex, minuteOfDay } = getZonedParts(now, settings.timezone);
  const currentMinute = weekdayIndex * 1440 + minuteOfDay;
  const parsedDays = DAY_KEYS.map((key) => parseDaySchedule(settings[key]));
  const allRanges = [];

  parsedDays.forEach((ranges, dayIndex) => {
    ranges.forEach((range) => {
      const start = dayIndex * 1440 + range.start;
      const end = dayIndex * 1440 + range.end;
      [-10080, 0, 10080].forEach((offset) => {
        allRanges.push({
          start: start + offset,
          end: end + offset,
          dayIndex,
          range,
        });
      });
    });
  });

  const activeRange = allRanges.find(
    (range) => currentMinute >= range.start && currentMinute < range.end,
  );
  const futureRange = allRanges
    .filter((range) => range.start > currentMinute)
    .sort((a, b) => a.start - b.start)[0];

  const status = activeRange ? "open" : "closed";
  const nextMinute = activeRange ? activeRange.end : futureRange?.start;
  const nextDayIndex =
    typeof nextMinute === "number"
      ? Math.floor((((nextMinute % 10080) + 10080) % 10080) / 1440)
      : null;
  const nextTime =
    typeof nextMinute === "number" ? formatTime(nextMinute, settings.clockMode) : "";
  const nextPrefix = activeRange ? "Closes" : "Opens";
  const nextWhen =
    nextDayIndex === weekdayIndex
      ? "today"
      : nextDayIndex === (weekdayIndex + 1) % 7
        ? "tomorrow"
        : nextDayIndex !== null
          ? DAY_LABELS[nextDayIndex]
          : "";

  const weeklyHours = DAY_KEYS.map((key, index) => {
    const hours = describeRanges(parsedDays[index], settings.clockMode);
    return {
      day: DAY_LABELS[index],
      hours,
      isToday: index === weekdayIndex,
    };
  });

  return {
    source: "manual",
    businessName: settings.businessName,
    subtitle: settings.subtitle,
    address: settings.address,
    phone: settings.phone,
    website: settings.website,
    googleMapsUri: "",
    status,
    statusLabel: status === "open" ? "Open now" : "Closed now",
    nextChangeLabel: nextTime ? `${nextPrefix} ${nextWhen} at ${nextTime}` : "",
    todayLabel: weeklyHours[weekdayIndex]?.hours || "Closed",
    weeklyHours,
    notes: settings.notes,
    showWeeklyHours: settings.showWeeklyHours,
    showContact: settings.showContact,
    timezone: settings.timezone,
    updatedAt: now.toISOString(),
  };
}

function googleStatus(place, hours) {
  if (place.businessStatus === "CLOSED_PERMANENTLY") {
    return {
      status: "permanently-closed",
      statusLabel: "Permanently closed",
    };
  }
  if (place.businessStatus === "CLOSED_TEMPORARILY") {
    return {
      status: "temporarily-closed",
      statusLabel: "Temporarily closed",
    };
  }
  if (typeof hours?.openNow === "boolean") {
    return {
      status: hours.openNow ? "open" : "closed",
      statusLabel: hours.openNow ? "Open now" : "Closed now",
    };
  }
  return {
    status: "unknown",
    statusLabel: "Hours unavailable",
  };
}

function googleWeeklyHours(hours, weekdayIndex) {
  const descriptions = hours?.weekdayDescriptions || [];
  if (!descriptions.length) {
    return [];
  }

  return descriptions.map((description, index) => {
    const [day, ...rest] = String(description).split(":");
    const googleDayIndex = (index + 1) % 7;
    return {
      day: day || DAY_LABELS[googleDayIndex],
      hours: rest.join(":").trim() || description,
      isToday: googleDayIndex === weekdayIndex,
    };
  });
}

function formatGoogleNextChange(hours, timezone, clockMode) {
  const timestamp = hours?.openNow ? hours?.nextCloseTime : hours?.nextOpenTime;
  if (!timestamp) {
    return "";
  }

  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const day = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    weekday: "short",
  }).format(date);
  const time = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour: "numeric",
    minute: "2-digit",
    hour12: clockMode === "12h",
  }).format(date);
  return `${hours.openNow ? "Closes" : "Opens"} ${day} at ${time}`;
}

async function fetchGooglePlace(settings) {
  const apiKey = settings.googleMapsApiKey || process.env.GOOGLE_MAPS_API_KEY || "";
  if (!settings.placeId || !apiKey) {
    return null;
  }

  const placeId = settings.placeId.replace(/^places\//, "");
  const url = new URL(`https://places.googleapis.com/v1/places/${placeId}`);
  if (settings.languageCode) {
    url.searchParams.set("languageCode", settings.languageCode);
  }
  if (settings.regionCode) {
    url.searchParams.set("regionCode", settings.regionCode);
  }

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": [
        "id",
        "displayName",
        "formattedAddress",
        "internationalPhoneNumber",
        "nationalPhoneNumber",
        "websiteUri",
        "googleMapsUri",
        "regularOpeningHours",
        "currentOpeningHours",
        "utcOffsetMinutes",
        "timeZone",
        "businessStatus",
      ].join(","),
      "User-Agent": "paperlesspaper-openintegrations/0.1.0",
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Google Places request failed with ${response.status}`);
  }

  const place = await response.json();
  const hours = place.currentOpeningHours || place.regularOpeningHours || {};
  const timezone = place.timeZone?.id || settings.timezone;
  const { weekdayIndex } = getZonedParts(new Date(), timezone);
  const weeklyHours = googleWeeklyHours(hours, weekdayIndex);
  const status = googleStatus(place, hours);
  const todayHours = weeklyHours.find((day) => day.isToday)?.hours || "";

  return {
    source: "google",
    businessName: place.displayName?.text || settings.businessName,
    subtitle: settings.subtitle,
    address: place.formattedAddress || settings.address,
    phone:
      place.internationalPhoneNumber ||
      place.nationalPhoneNumber ||
      settings.phone,
    website: place.websiteUri || settings.website,
    googleMapsUri: place.googleMapsUri || "",
    ...status,
    nextChangeLabel: formatGoogleNextChange(hours, timezone, settings.clockMode),
    todayLabel: todayHours || "Hours unavailable",
    weeklyHours,
    notes: settings.notes,
    showWeeklyHours: settings.showWeeklyHours,
    showContact: settings.showContact,
    timezone,
    updatedAt: new Date().toISOString(),
  };
}

export default async function handler({ query }) {
  const settings = getSettings(query);
  const googlePlace = await fetchGooglePlace(settings);
  return googlePlace || buildManualHours(settings);
}
