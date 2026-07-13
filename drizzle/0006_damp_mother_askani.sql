CREATE TABLE `child_updates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`childId` int NOT NULL,
	`sponsorshipId` int,
	`postedById` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`content` text NOT NULL,
	`updateType` enum('general','education','health','milestone','photo','letter','video') NOT NULL DEFAULT 'general',
	`mediaUrl` text,
	`mediaKey` varchar(500),
	`isPublished` boolean DEFAULT true,
	`publishedAt` timestamp DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `child_updates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sponsor_portal_accounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sponsorId` int NOT NULL,
	`tenantId` int NOT NULL,
	`email` varchar(320) NOT NULL,
	`passwordHash` varchar(255),
	`otpCode` varchar(10),
	`otpExpiresAt` timestamp,
	`otpAttempts` int DEFAULT 0,
	`isVerified` boolean DEFAULT false,
	`isActive` boolean DEFAULT true,
	`lastLoginAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `sponsor_portal_accounts_id` PRIMARY KEY(`id`),
	CONSTRAINT `sponsor_portal_accounts_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
ALTER TABLE `child_updates` ADD CONSTRAINT `child_updates_tenantId_tenants_id_fk` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `child_updates` ADD CONSTRAINT `child_updates_childId_children_id_fk` FOREIGN KEY (`childId`) REFERENCES `children`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `child_updates` ADD CONSTRAINT `child_updates_sponsorshipId_sponsorships_id_fk` FOREIGN KEY (`sponsorshipId`) REFERENCES `sponsorships`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `child_updates` ADD CONSTRAINT `child_updates_postedById_users_id_fk` FOREIGN KEY (`postedById`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sponsor_portal_accounts` ADD CONSTRAINT `sponsor_portal_accounts_sponsorId_sponsors_id_fk` FOREIGN KEY (`sponsorId`) REFERENCES `sponsors`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sponsor_portal_accounts` ADD CONSTRAINT `sponsor_portal_accounts_tenantId_tenants_id_fk` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;