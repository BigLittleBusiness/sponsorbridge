CREATE TABLE `project_contributions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`projectId` int NOT NULL,
	`sponsorId` int,
	`guestName` varchar(255),
	`guestEmail` varchar(320),
	`amountCents` int NOT NULL,
	`currency` varchar(3) NOT NULL DEFAULT 'AUD',
	`isRecurring` boolean DEFAULT false,
	`isAnonymous` boolean DEFAULT false,
	`message` text,
	`status` enum('pending','succeeded','failed','refunded') NOT NULL DEFAULT 'pending',
	`stripePaymentIntentId` varchar(255),
	`stripeSubscriptionId` varchar(255),
	`stripeCustomerId` varchar(255),
	`paidAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `project_contributions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `project_updates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`projectId` int NOT NULL,
	`postedById` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`content` text NOT NULL,
	`mediaUrl` text,
	`isPublished` boolean DEFAULT true,
	`publishedAt` timestamp DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `project_updates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`createdById` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`slug` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`shortDescription` varchar(500),
	`category` enum('infrastructure','education','equipment','event','emergency','health','other') NOT NULL DEFAULT 'other',
	`goalAmountCents` int NOT NULL,
	`raisedAmountCents` int NOT NULL DEFAULT 0,
	`currency` varchar(3) NOT NULL DEFAULT 'AUD',
	`coverImageUrl` text,
	`coverImageKey` varchar(500),
	`status` enum('draft','active','funded','completed','cancelled') NOT NULL DEFAULT 'draft',
	`isPublic` boolean DEFAULT false,
	`allowRecurring` boolean DEFAULT true,
	`showDonorWall` boolean DEFAULT true,
	`deadlineAt` timestamp,
	`completedAt` timestamp,
	`stripeProductId` varchar(255),
	`stripePriceId` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `projects_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `project_contributions` ADD CONSTRAINT `project_contributions_tenantId_tenants_id_fk` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `project_contributions` ADD CONSTRAINT `project_contributions_projectId_projects_id_fk` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `project_contributions` ADD CONSTRAINT `project_contributions_sponsorId_sponsors_id_fk` FOREIGN KEY (`sponsorId`) REFERENCES `sponsors`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `project_updates` ADD CONSTRAINT `project_updates_tenantId_tenants_id_fk` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `project_updates` ADD CONSTRAINT `project_updates_projectId_projects_id_fk` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `project_updates` ADD CONSTRAINT `project_updates_postedById_users_id_fk` FOREIGN KEY (`postedById`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `projects` ADD CONSTRAINT `projects_tenantId_tenants_id_fk` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `projects` ADD CONSTRAINT `projects_createdById_users_id_fk` FOREIGN KEY (`createdById`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;