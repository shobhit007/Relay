CREATE TABLE `messages` (
	`id` text,
	`client_id` text PRIMARY KEY NOT NULL,
	`conversation_id` text NOT NULL,
	`sender_id` text NOT NULL,
	`content` text NOT NULL,
	`content_type` text NOT NULL,
	`status` text NOT NULL,
	`client_created_at` text NOT NULL,
	`server_created_at` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `messages_id_unique` ON `messages` (`id`);--> statement-breakpoint
ALTER TABLE `conversations` ADD `server_id` text;