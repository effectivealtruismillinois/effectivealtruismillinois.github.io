import { env } from "cloudflare:workers";
import { upcomingEvents, type CalendarEvent } from "../app/calendar-events";
let cached: { id: string; until: number; events: CalendarEvent[] } | null = null;
export function configuredCalendarId() {
  const value = env.EVENTS_CALENDAR_ID;
  return typeof value === "string" && value.length < 300 && /^[\w.@#-]+$/.test(value) ? value : null;
}
export async function publicCalendar(): Promise<{ calendarId: string | null; events: CalendarEvent[] }> {
  const calendarId = configuredCalendarId();
  if (!calendarId) return { calendarId: null, events: [] };
  if (!cached || cached.id !== calendarId || cached.until < Date.now()) {
    const response = await fetch(`https://calendar.google.com/calendar/ical/${encodeURIComponent(calendarId)}/public/basic.ics`, { signal: AbortSignal.timeout(8000) });
    if (!response.ok) throw new Error("Calendar unavailable");
    const source = await response.text();
    if (source.length > 2000000 || !source.includes("BEGIN:VCALENDAR")) throw new Error("Invalid calendar feed");
    cached = { id: calendarId, until: Date.now() + 60000, events: upcomingEvents(source) };
  }
  return { calendarId, events: cached.events };
}
