import { sql } from "drizzle-orm";
import { integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
export const subscribers = sqliteTable("subscribers", {
 email: text("email").primaryKey(),
 createdAt: text("created_at").notNull().default(sql`(CURRENT_TIMESTAMP)`)
});
export const donationClicks = sqliteTable("donation_clicks", {
 id: text("id").primaryKey(),
 createdAt: text("created_at").notNull().default(sql`(CURRENT_TIMESTAMP)`),
 country: text("country").notNull().default("Unknown"),
 browser: text("browser").notNull().default("Other"),
 device: text("device").notNull().default("Other"),
});
export const siteFeedback = sqliteTable("site_feedback", {
 id: text("id").primaryKey(),
 message: text("message").notNull(),
 createdAt: text("created_at").notNull().default(sql`(CURRENT_TIMESTAMP)`)
});
export const eventRsvps = sqliteTable("event_rsvps", {
 id: text("id").primaryKey(),
 eventDate: text("event_date").notNull(),
 eventTitle: text("event_title").notNull(),
 eventStart: text("event_start").notNull(),
 name: text("name").notNull(),
 nameKey: text("name_key").notNull(),
 notOnDiscord: integer("not_on_discord", {mode:"boolean"}).notNull(),
 createdAt: text("created_at").notNull().default(sql`(CURRENT_TIMESTAMP)`)
}, table => [uniqueIndex("event_rsvps_date_name_unique").on(table.eventDate, table.nameKey)]);
