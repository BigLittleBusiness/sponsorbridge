CREATE TABLE `custom_accounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int,
	`orgName` varchar(255) NOT NULL,
	`orgCountry` varchar(100) NOT NULL,
	`orgWebsite` varchar(255),
	`orgSize` varchar(50),
	`firstName` varchar(100) NOT NULL,
	`lastName` varchar(100) NOT NULL,
	`jobTitle` varchar(150),
	`email` varchar(320) NOT NULL,
	`phone` varchar(30),
	`passwordHash` varchar(255) NOT NULL,
	`isVerified` boolean NOT NULL DEFAULT false,
	`otpCode` varchar(6),
	`otpExpiresAt` timestamp,
	`otpAttempts` int DEFAULT 0,
	`planTier` enum('starter','growth','professional','enterprise') DEFAULT 'starter',
	`onboardingCompletedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp,
	CONSTRAINT `custom_accounts_id` PRIMARY KEY(`id`),
	CONSTRAINT `custom_accounts_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `onboarding_progress` (
	`id` int AUTO_INCREMENT NOT NULL,
	`accountId` int NOT NULL,
	`stepKey` varchar(100) NOT NULL,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `onboarding_progress_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `custom_accounts` ADD CONSTRAINT `custom_accounts_tenantId_tenants_id_fk` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `onboarding_progress` ADD CONSTRAINT `onboarding_progress_accountId_custom_accounts_id_fk` FOREIGN KEY (`accountId`) REFERENCES `custom_accounts`(`id`) ON DELETE no action ON UPDATE no action;