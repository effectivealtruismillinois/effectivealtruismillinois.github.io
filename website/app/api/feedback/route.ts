import { saveFeedback } from "../../../db/feedback";

export async function POST(request: Request) {
  const reply = (body: object, status: number) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
  if (request.headers.get("origin") !== new URL(request.url).origin) return reply({ error: "Please send feedback from this website." }, 403);
  try {
    const raw = await request.text();
    if (raw.length > 16000) return reply({ error: "Please keep feedback under 2,000 characters." }, 400);
    let data;
    try { data = JSON.parse(raw); } catch { return reply({ error: "Please enter your feedback." }, 400); }
    if (!data || typeof data !== "object") return reply({ error: "Please enter your feedback." }, 400);
    if (data.website) return reply({ ok: true }, 200);
    const message = typeof data.message === "string" ? data.message.trim() : "";
    if (!message || message.length > 2000) return reply({ error: "Enter between 1 and 2,000 characters." }, 400);
    if (typeof data.id !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(data.id)) return reply({ error: "Please reopen the feedback box and try again." }, 400);
    await saveFeedback(data.id, message);
    return reply({ ok: true }, 201);
  } catch {
    return reply({ error: "We couldn’t save your feedback. Please try again." }, 503);
  }
}
