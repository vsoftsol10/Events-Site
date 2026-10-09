const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;
const LOCAL_DATE_TIME = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/;
const EXPLICIT_DATE_TIME = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.\d{1,3})?)?(Z|[+-]\d{2}:?\d{2})$/i;
const warnedDeadlines = new Set();

function isValidParts(year, month, day, hour = 0, minute = 0, second = 0) {
  const date = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day && hour <= 23 && minute <= 59 && second <= 59;
}

export function getDeadlineInstant(value) {
  if (typeof value !== "string" || !value.trim()) return null;
  const deadline = value.trim();
  const dateMatch = DATE_ONLY.exec(deadline);
  if (dateMatch) {
    const [, y, m, d] = dateMatch;
    if (!isValidParts(+y, +m, +d)) return null;
    return Date.UTC(+y, +m - 1, +d + 1) - 1000 - 5.5 * 60 * 60 * 1000;
  }

  const localMatch = LOCAL_DATE_TIME.exec(deadline);
  if (localMatch) {
    const [, y, m, d, hh, mm, ss = "00"] = localMatch;
    if (!isValidParts(+y, +m, +d, +hh, +mm, +ss)) return null;
    return Date.UTC(+y, +m - 1, +d, +hh, +mm, +ss) - 5.5 * 60 * 60 * 1000;
  }

  const explicitMatch = EXPLICIT_DATE_TIME.exec(deadline);
  if (!explicitMatch) return null;
  const [, y, m, d, hh, mm, ss = "00", zone] = explicitMatch;
  if (!isValidParts(+y, +m, +d, +hh, +mm, +ss)) return null;
  if (zone.toUpperCase() !== "Z") {
    const [zoneHours, zoneMinutes] = zone.slice(1).replace(":", "").match(/.{2}/g).map(Number);
    if (zoneHours > 23 || zoneMinutes > 59) return null;
  }
  const parsed = Date.parse(deadline);
  return Number.isFinite(parsed) ? parsed : null;
}

export function isRegistrationOpen(event, now = Date.now()) {
  if (!event || String(event.status || "").toLowerCase() === "closed") return false;
  const closesAt = getDeadlineInstant(event.deadline);
  if (closesAt == null) {
    const warningKey = event.deadline || "<missing>";
    if (!warnedDeadlines.has(warningKey)) {
      console.warn("Registration is closed because the event deadline is missing or invalid.");
      warnedDeadlines.add(warningKey);
    }
    return false;
  }
  return now < closesAt;
}

export function deadlineInputValue(value) {
  if (typeof value !== "string" || !value.trim()) return "";
  const deadline = value.trim();
  const dateMatch = DATE_ONLY.exec(deadline);
  if (dateMatch) return `${deadline}T23:59`;
  const localMatch = LOCAL_DATE_TIME.exec(deadline);
  if (localMatch) return `${localMatch[1]}-${localMatch[2]}-${localMatch[3]}T${localMatch[4]}:${localMatch[5]}`;
  if (EXPLICIT_DATE_TIME.test(deadline)) {
    const instant = Date.parse(deadline);
    if (Number.isFinite(instant)) {
      const ist = new Date(instant + 5.5 * 60 * 60 * 1000);
      return `${ist.getUTCFullYear()}-${String(ist.getUTCMonth() + 1).padStart(2, "0")}-${String(ist.getUTCDate()).padStart(2, "0")}T${String(ist.getUTCHours()).padStart(2, "0")}:${String(ist.getUTCMinutes()).padStart(2, "0")}`;
    }
  }
  return "";
}

export function deadlineStorageValue(value, time = "") {
  if (DATE_ONLY.test(value || "")) {
    if (!time) return value;
    const timeMatch = /^(\d{2}):(\d{2})$/.exec(time);
    if (!timeMatch) return "";
    return `${value}T${time}:00+05:30`;
  }
  const match = LOCAL_DATE_TIME.exec(value || "");
  if (!match) return "";
  const [, y, m, d, hh, mm] = match;
  if (!isValidParts(+y, +m, +d, +hh, +mm)) return "";
  return `${y}-${m}-${d}T${hh}:${mm}:00+05:30`;
}
