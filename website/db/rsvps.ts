import { env } from "cloudflare:workers";
export type RsvpRecord = { id: string; eventDate: string; eventTitle: string; eventStart: string; name: string; nameKey: string };
export async function saveRsvp(record: RsvpRecord): Promise<"saved" | "replayed" | "duplicate_name" | "request_conflict"> {
  if (!env.DB) throw new Error("RSVP database unavailable");
  const { id, eventDate, eventTitle, eventStart, name, nameKey } = record;
  const result = await env.DB.prepare("INSERT INTO event_rsvps (id, event_date, event_title, event_start, name, name_key, not_on_discord) VALUES (?, ?, ?, ?, ?, ?, 1) ON CONFLICT DO NOTHING")
    .bind(id, eventDate, eventTitle, eventStart, name, nameKey).run();
  if (result.meta.changes) return "saved";
  const existing = await env.DB.prepare("SELECT event_date, name_key FROM event_rsvps WHERE id = ?").bind(id).first<{event_date:string;name_key:string}>();
  return existing ? (existing.event_date === eventDate && existing.name_key === nameKey ? "replayed" : "request_conflict") : "duplicate_name";
}
