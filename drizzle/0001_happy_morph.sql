CREATE TABLE `conversation_participants` (
	`conversation_id` text NOT NULL,
	`user_id` text NOT NULL,
	`unread_count` integer DEFAULT 0 NOT NULL,
	`last_read_message_id` text,
	`joined_at` text NOT NULL,
	PRIMARY KEY(`conversation_id`, `user_id`)
);
--> statement-breakpoint
CREATE TABLE `conversations` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`last_message_id` text,
	`last_message_preview` text,
	`last_message_at` text,
	`updated_at` text NOT NULL
);
