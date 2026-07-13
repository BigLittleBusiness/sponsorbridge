CREATE TABLE `events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenant_id` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`event_type` varchar(50) DEFAULT 'general',
	`start_date` timestamp NOT NULL,
	`end_date` timestamp,
	`location` varchar(255),
	`is_virtual` boolean DEFAULT false,
	`meeting_url` varchar(500),
	`max_attendees` int,
	`status` varchar(30) DEFAULT 'upcoming',
	`created_by` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `custom_accounts` ADD `isSystemAdmin` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `custom_accounts` ADD `passwordResetToken` varchar(255);--> statement-breakpoint
ALTER TABLE `custom_accounts` ADD `passwordResetExpiresAt` timestamp;--> statement-breakpoint
ALTER TABLE `events` ADD CONSTRAINT `events_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `events` ADD CONSTRAINT `events_created_by_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;