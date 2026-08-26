ALTER TABLE `messages` ADD `attempt_count` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `messages` ADD `last_attempt_at` text;--> statement-breakpoint
ALTER TABLE `messages` ADD `last_error` text;