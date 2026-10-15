import { env } from "cloudflare:workers";
import type { DonationMetadata } from "../lib/donation-analytics";

export async function saveDonationClick(id:string, metadata: DonationMetadata) {
  if(!env.DB)throw new Error("Click database unavailable");
  await env.DB.batch([
    env.DB.prepare("DELETE FROM donation_clicks WHERE created_at < datetime('now', '-90 days')"),
    env.DB.prepare("INSERT INTO donation_clicks (id, created_at, country, browser, device) VALUES (?, strftime('%Y-%m-%d %H:00:00', 'now'), ?, ?, ?) ON CONFLICT(id) DO NOTHING")
      .bind(id, metadata.country, metadata.browser, metadata.device),
  ]);
}
