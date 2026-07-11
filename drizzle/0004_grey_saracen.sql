CREATE TABLE `feature_flags` (
	`id` int AUTO_INCREMENT NOT NULL,
	`flag_key` varchar(128) NOT NULL,
	`tenant_id` int,
	`enabled` boolean NOT NULL DEFAULT false,
	`description` text,
	`updated_by` int,
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `feature_flags_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `password_reset_tokens` (
	`id` int AUTO_INCREMENT NOT NULL,
	`account_id` int NOT NULL,
	`token` varchar(128) NOT NULL,
	`expires_at` timestamp NOT NULL,
	`used_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `password_reset_tokens_id` PRIMARY KEY(`id`),
	CONSTRAINT `password_reset_tokens_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
CREATE TABLE `platform_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`setting_key` varchar(128) NOT NULL,
	`setting_value` text,
	`category` varchar(64) NOT NULL,
	`is_secret` boolean NOT NULL DEFAULT false,
	`updated_by` int,
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `platform_settings_id` PRIMARY KEY(`id`),
	CONSTRAINT `platform_settings_setting_key_unique` UNIQUE(`setting_key`)
);
--> statement-breakpoint
ALTER TABLE `password_reset_tokens` ADD CONSTRAINT `password_reset_tokens_account_id_custom_accounts_id_fk` FOREIGN KEY (`account_id`) REFERENCES `custom_accounts`(`id`) ON DELETE no action ON UPDATE no action;