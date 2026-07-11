CREATE TABLE `audit_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int,
	`userId` int,
	`userEmail` varchar(320),
	`action` varchar(100) NOT NULL,
	`entityType` varchar(100),
	`entityId` varchar(100),
	`beforeValue` json,
	`afterValue` json,
	`ipAddress` varchar(45),
	`userAgent` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `audit_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `background_checks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`userId` int NOT NULL,
	`status` enum('pending','under_review','verified','expired','failed') NOT NULL DEFAULT 'pending',
	`documentUrl` text,
	`documentKey` varchar(500),
	`verifiedById` int,
	`verifiedAt` timestamp,
	`expiresAt` timestamp,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `background_checks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `children` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`firstName` varchar(100) NOT NULL,
	`lastName` varchar(100) NOT NULL,
	`dateOfBirth` timestamp,
	`gender` enum('male','female','other'),
	`country` varchar(100),
	`region` varchar(100),
	`bio` text,
	`interests` text,
	`photoUrl` text,
	`photoKey` varchar(500),
	`status` enum('AVAILABLE','SPONSORED','GRADUATED','WAITLISTED') NOT NULL DEFAULT 'AVAILABLE',
	`educationLevel` varchar(100),
	`schoolName` varchar(255),
	`healthStatus` text,
	`programType` varchar(100),
	`hasSpecialNeeds` boolean DEFAULT false,
	`specialNeedsDetails` text,
	`parentalConsentGranted` boolean DEFAULT false,
	`parentalConsentDate` timestamp,
	`parentalConsentExpiry` timestamp,
	`photoConsentGranted` boolean DEFAULT false,
	`videoConsentGranted` boolean DEFAULT false,
	`assignedFieldWorkerId` int,
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `children_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `consent_records` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`childId` int,
	`sponsorId` int,
	`consentType` enum('parental','sponsor_data','marketing','photo_video','gdpr') NOT NULL,
	`granted` boolean NOT NULL,
	`grantedAt` timestamp,
	`expiresAt` timestamp,
	`revokedAt` timestamp,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `consent_records_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`sponsorshipId` int NOT NULL,
	`senderId` int NOT NULL,
	`direction` enum('sponsor_to_child','child_to_sponsor') NOT NULL,
	`originalText` text NOT NULL,
	`translatedText` text,
	`originalLanguage` varchar(10),
	`translatedLanguage` varchar(10),
	`status` enum('pending_approval','approved','rejected','flagged','quarantined') NOT NULL DEFAULT 'pending_approval',
	`moderatedById` int,
	`moderatedAt` timestamp,
	`moderationNotes` text,
	`isSafeguardingConcern` boolean DEFAULT false,
	`deliveredAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int,
	`userId` int NOT NULL,
	`type` varchar(100) NOT NULL,
	`title` varchar(255) NOT NULL,
	`body` text,
	`isRead` boolean DEFAULT false,
	`link` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `payments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`sponsorshipId` int NOT NULL,
	`sponsorId` int NOT NULL,
	`stripePaymentIntentId` varchar(255),
	`stripeInvoiceId` varchar(255),
	`amount` int NOT NULL,
	`currency` varchar(3) DEFAULT 'USD',
	`status` enum('pending','succeeded','failed','refunded','disputed') NOT NULL DEFAULT 'pending',
	`failureReason` text,
	`paidAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `payments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `policy_acknowledgments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`policyVersion` varchar(20) NOT NULL,
	`acknowledgedAt` timestamp NOT NULL DEFAULT (now()),
	`ipAddress` varchar(45),
	CONSTRAINT `policy_acknowledgments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `safeguarding_incidents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`reportedById` int,
	`assignedToId` int,
	`childId` int,
	`relatedMessageId` int,
	`relatedVlogId` int,
	`title` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`isAnonymous` boolean DEFAULT false,
	`priority` enum('low','medium','high','urgent') DEFAULT 'medium',
	`status` enum('open','triaged','under_investigation','referred','closed') NOT NULL DEFAULT 'open',
	`isEmergency` boolean DEFAULT false,
	`referredToAuthorities` boolean DEFAULT false,
	`referralDetails` text,
	`outcome` text,
	`closedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `safeguarding_incidents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sponsors` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`userId` int NOT NULL,
	`firstName` varchar(100) NOT NULL,
	`lastName` varchar(100) NOT NULL,
	`email` varchar(320) NOT NULL,
	`phone` varchar(50),
	`country` varchar(100),
	`preferredChildAgeMin` int,
	`preferredChildAgeMax` int,
	`preferredGender` enum('male','female','no_preference') DEFAULT 'no_preference',
	`preferredCountry` varchar(100),
	`communicationStyle` enum('frequent','occasional','minimal') DEFAULT 'occasional',
	`stripeCustomerId` varchar(255),
	`emailNotifications` boolean DEFAULT true,
	`smsNotifications` boolean DEFAULT false,
	`marketingConsent` boolean DEFAULT false,
	`dataConsent` boolean DEFAULT true,
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `sponsors_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sponsorships` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`sponsorId` int NOT NULL,
	`childId` int NOT NULL,
	`status` enum('pending_approval','active','paused','cancelled','completed') NOT NULL DEFAULT 'pending_approval',
	`matchedBy` enum('sponsor_choice','child_choice','algorithm','staff') DEFAULT 'sponsor_choice',
	`approvedById` int,
	`approvedAt` timestamp,
	`startDate` timestamp,
	`endDate` timestamp,
	`monthlyAmount` int DEFAULT 4000,
	`stripeSubscriptionId` varchar(255),
	`notes` text,
	`onboardingDay1SentAt` timestamp,
	`onboardingDay3SentAt` timestamp,
	`onboardingDay7SentAt` timestamp,
	`onboardingDay14SentAt` timestamp,
	`onboardingDay30SentAt` timestamp,
	`onboardingDay90SentAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `sponsorships_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `surveys` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`sponsorId` int NOT NULL,
	`sponsorshipId` int,
	`type` enum('nps','csat') NOT NULL,
	`trigger` varchar(100),
	`npsScore` int,
	`csatScore` int,
	`feedback` text,
	`status` enum('sent','completed','skipped') DEFAULT 'sent',
	`sentAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	CONSTRAINT `surveys_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tenants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`subdomain` varchar(100) NOT NULL,
	`customDomain` varchar(255),
	`logoUrl` text,
	`primaryColor` varchar(7) DEFAULT '#D14A2E',
	`secondaryColor` varchar(7) DEFAULT '#F4A261',
	`featureVlogs` boolean DEFAULT true,
	`featurePooling` boolean DEFAULT false,
	`featureTranslation` boolean DEFAULT true,
	`featureSocialSharing` boolean DEFAULT true,
	`featureBequest` boolean DEFAULT false,
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tenants_id` PRIMARY KEY(`id`),
	CONSTRAINT `tenants_subdomain_unique` UNIQUE(`subdomain`)
);
--> statement-breakpoint
CREATE TABLE `vlogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`sponsorshipId` int,
	`childId` int,
	`uploadedById` int NOT NULL,
	`title` varchar(255),
	`description` text,
	`videoUrl` text,
	`videoKey` varchar(500),
	`thumbnailUrl` text,
	`durationSeconds` int,
	`fileSize` int,
	`direction` enum('child_to_sponsor','sponsor_to_child') DEFAULT 'child_to_sponsor',
	`status` enum('pending_review','approved','rejected','flagged') NOT NULL DEFAULT 'pending_review',
	`moderatedById` int,
	`moderatedAt` timestamp,
	`moderationNotes` text,
	`isSafeguardingConcern` boolean DEFAULT false,
	`metadataStripped` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `vlogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('system_admin','program_manager','safeguarding_officer','field_worker','finance_officer','sponsor_relations','volunteer','sponsor','admin','user') NOT NULL DEFAULT 'user';--> statement-breakpoint
ALTER TABLE `users` ADD `tenantId` int;--> statement-breakpoint
ALTER TABLE `users` ADD `isActive` boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE `users` ADD `policyAcknowledgedAt` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `policyVersion` varchar(20);--> statement-breakpoint
ALTER TABLE `users` ADD `backgroundCheckStatus` enum('not_required','pending','under_review','verified','expired') DEFAULT 'not_required';--> statement-breakpoint
ALTER TABLE `users` ADD `backgroundCheckExpiry` timestamp;--> statement-breakpoint
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_tenantId_tenants_id_fk` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `background_checks` ADD CONSTRAINT `background_checks_tenantId_tenants_id_fk` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `background_checks` ADD CONSTRAINT `background_checks_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `background_checks` ADD CONSTRAINT `background_checks_verifiedById_users_id_fk` FOREIGN KEY (`verifiedById`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `children` ADD CONSTRAINT `children_tenantId_tenants_id_fk` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `children` ADD CONSTRAINT `children_assignedFieldWorkerId_users_id_fk` FOREIGN KEY (`assignedFieldWorkerId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `consent_records` ADD CONSTRAINT `consent_records_tenantId_tenants_id_fk` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `consent_records` ADD CONSTRAINT `consent_records_childId_children_id_fk` FOREIGN KEY (`childId`) REFERENCES `children`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `consent_records` ADD CONSTRAINT `consent_records_sponsorId_sponsors_id_fk` FOREIGN KEY (`sponsorId`) REFERENCES `sponsors`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `messages` ADD CONSTRAINT `messages_tenantId_tenants_id_fk` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `messages` ADD CONSTRAINT `messages_sponsorshipId_sponsorships_id_fk` FOREIGN KEY (`sponsorshipId`) REFERENCES `sponsorships`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `messages` ADD CONSTRAINT `messages_senderId_users_id_fk` FOREIGN KEY (`senderId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `messages` ADD CONSTRAINT `messages_moderatedById_users_id_fk` FOREIGN KEY (`moderatedById`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_tenantId_tenants_id_fk` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `payments` ADD CONSTRAINT `payments_tenantId_tenants_id_fk` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `payments` ADD CONSTRAINT `payments_sponsorshipId_sponsorships_id_fk` FOREIGN KEY (`sponsorshipId`) REFERENCES `sponsorships`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `payments` ADD CONSTRAINT `payments_sponsorId_sponsors_id_fk` FOREIGN KEY (`sponsorId`) REFERENCES `sponsors`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `policy_acknowledgments` ADD CONSTRAINT `policy_acknowledgments_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `safeguarding_incidents` ADD CONSTRAINT `safeguarding_incidents_tenantId_tenants_id_fk` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `safeguarding_incidents` ADD CONSTRAINT `safeguarding_incidents_reportedById_users_id_fk` FOREIGN KEY (`reportedById`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `safeguarding_incidents` ADD CONSTRAINT `safeguarding_incidents_assignedToId_users_id_fk` FOREIGN KEY (`assignedToId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `safeguarding_incidents` ADD CONSTRAINT `safeguarding_incidents_childId_children_id_fk` FOREIGN KEY (`childId`) REFERENCES `children`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `safeguarding_incidents` ADD CONSTRAINT `safeguarding_incidents_relatedMessageId_messages_id_fk` FOREIGN KEY (`relatedMessageId`) REFERENCES `messages`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `safeguarding_incidents` ADD CONSTRAINT `safeguarding_incidents_relatedVlogId_vlogs_id_fk` FOREIGN KEY (`relatedVlogId`) REFERENCES `vlogs`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sponsors` ADD CONSTRAINT `sponsors_tenantId_tenants_id_fk` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sponsors` ADD CONSTRAINT `sponsors_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sponsorships` ADD CONSTRAINT `sponsorships_tenantId_tenants_id_fk` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sponsorships` ADD CONSTRAINT `sponsorships_sponsorId_sponsors_id_fk` FOREIGN KEY (`sponsorId`) REFERENCES `sponsors`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sponsorships` ADD CONSTRAINT `sponsorships_childId_children_id_fk` FOREIGN KEY (`childId`) REFERENCES `children`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sponsorships` ADD CONSTRAINT `sponsorships_approvedById_users_id_fk` FOREIGN KEY (`approvedById`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `surveys` ADD CONSTRAINT `surveys_tenantId_tenants_id_fk` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `surveys` ADD CONSTRAINT `surveys_sponsorId_sponsors_id_fk` FOREIGN KEY (`sponsorId`) REFERENCES `sponsors`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `surveys` ADD CONSTRAINT `surveys_sponsorshipId_sponsorships_id_fk` FOREIGN KEY (`sponsorshipId`) REFERENCES `sponsorships`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `vlogs` ADD CONSTRAINT `vlogs_tenantId_tenants_id_fk` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `vlogs` ADD CONSTRAINT `vlogs_sponsorshipId_sponsorships_id_fk` FOREIGN KEY (`sponsorshipId`) REFERENCES `sponsorships`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `vlogs` ADD CONSTRAINT `vlogs_childId_children_id_fk` FOREIGN KEY (`childId`) REFERENCES `children`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `vlogs` ADD CONSTRAINT `vlogs_uploadedById_users_id_fk` FOREIGN KEY (`uploadedById`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `vlogs` ADD CONSTRAINT `vlogs_moderatedById_users_id_fk` FOREIGN KEY (`moderatedById`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_tenantId_tenants_id_fk` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE no action ON UPDATE no action;