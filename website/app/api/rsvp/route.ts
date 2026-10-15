import { eventDateKey } from "../../calendar-links";
import { publicCalendar } from "../../../lib/public-calendar";
import { saveRsvp } from "../../../db/rsvps";
export async function POST(request: Request) {
  const reply = (body: object, status: number) => Response.json(body, {status, headers:{"Cache-Control":"no-store"}});
  if (request.headers.get("origin") !== new URL(request.url).origin) return reply({error:"Please RSVP from this website."}, 403);
  try {
    const raw = await request.text();
    if (raw.length > 4096) return reply({error:"Please keep your name under 100 characters."}, 400);
    let data;
    try { data = JSON.parse(raw); } catch { return reply({error:"Please check your RSVP and try again."}, 400); }
    if (!data || typeof data !== "object") return reply({error:"Please check your RSVP and try again."}, 400);
    if (data.website) return reply({ok:true}, 200);
    const name = typeof data.name === "string" ? data.name.normalize("NFKC").trim().replace(/\s+/g, " ") : "";
    if (!name || name.length > 100 || /[\p{Cc}\p{Cf}]/u.test(name)) return reply({error:"Please enter a name between 1 and 100 characters."}, 400);
    if (data.notOnDiscord !== true) return reply({error:"Please confirm you haven’t already RSVPd on Discord."}, 400);
    if (typeof data.id !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(data.id)) return reply({error:"Please reopen the RSVP box and try again."}, 400);
    if (typeof data.eventDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(data.eventDate)) return reply({error:"Please choose an upcoming event."}, 400);
    const calendar = await publicCalendar();
    if (!calendar.calendarId) return reply({error:"RSVPs are temporarily unavailable. Please try again later."}, 503);
    // The Illinois event date is the stable key, independent of calendar UID/title.
    const candidates = calendar.events.filter(event => eventDateKey(event) === data.eventDate);
    const event = candidates.find(event => event.start === data.eventStart) ?? (candidates.length === 1 ? candidates[0] : undefined);
    if (!event) return reply({error:"This date is no longer listed. Refresh the events and try again."}, 409);
    const result = await saveRsvp({id:data.id, eventDate:data.eventDate, eventTitle:event.title, eventStart:event.start, name, nameKey:name.toLowerCase()});
    if (result === "duplicate_name") return reply({error:"That name is already on this date’s list. If that’s someone else, add a last name or initial."}, 409);
    if (result === "request_conflict") return reply({error:"Please reopen the RSVP box and try again."}, 409);
    return reply({ok:true, eventDate:data.eventDate}, 201);
  } catch {
    return reply({error:"We couldn’t save your RSVP. Please try again. If this keeps happening, RSVP on Discord instead."}, 503);
  }
}
