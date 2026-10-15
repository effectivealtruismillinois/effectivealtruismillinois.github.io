CREATE TABLE `event_rsvps` (
	`id` text PRIMARY KEY NOT NULL,
	`event_date` text NOT NULL,
	`event_title` text NOT NULL,
	`event_start` text NOT NULL,
	`name` text NOT NULL,
	`name_key` text NOT NULL,
	`not_on_discord` integer NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `event_rsvps_date_name_unique` ON `event_rsvps` (`event_date`,`name_key`);