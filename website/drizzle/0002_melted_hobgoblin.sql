CREATE TABLE `site_feedback` (
	`id` text PRIMARY KEY NOT NULL,
	`message` text NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL
);
--> statement-breakpoint
ALTER TABLE `donation_clicks` ADD `country` text DEFAULT 'Unknown' NOT NULL;--> statement-breakpoint
ALTER TABLE `donation_clicks` ADD `browser` text DEFAULT 'Other' NOT NULL;--> statement-breakpoint
ALTER TABLE `donation_clicks` ADD `device` text DEFAULT 'Other' NOT NULL;