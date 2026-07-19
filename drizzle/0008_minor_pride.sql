CREATE TABLE `early_access_signups` (
	`id` int AUTO_INCREMENT NOT NULL,
	`firstName` varchar(100) NOT NULL,
	`email` varchar(320) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `early_access_signups_id` PRIMARY KEY(`id`),
	CONSTRAINT `early_access_signups_email_unique` UNIQUE(`email`)
);
