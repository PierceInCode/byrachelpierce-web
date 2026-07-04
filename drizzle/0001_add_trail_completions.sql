CREATE TABLE `trail_completions` (
	`user_id` text PRIMARY KEY NOT NULL,
	`redemption_code` text NOT NULL,
	`completed_at` text NOT NULL,
	`redeemed_at` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `trail_completions_redemption_code_unique` ON `trail_completions` (`redemption_code`);