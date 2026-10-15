import { env } from "cloudflare:workers";

export async function saveFeedback(id: string, message: string) {
  if (!env.DB) throw new Error("Feedback database unavailable");
  await env.DB.prepare("INSERT INTO site_feedback (id, message) VALUES (?, ?) ON CONFLICT(id) DO NOTHING")
    .bind(id, message).run();
}
