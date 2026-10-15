import { env } from "cloudflare:workers";
export async function saveSubscriber(email: string) {
 if(!env.DB) throw new Error("Subscriber database unavailable");
 await env.DB.prepare("INSERT INTO subscribers (email) VALUES (?) ON CONFLICT(email) DO NOTHING").bind(email).run();
}
