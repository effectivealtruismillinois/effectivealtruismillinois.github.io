declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    EVENTS_CALENDAR_ID?: string;
    BUCKET?: R2Bucket;
  }
}
