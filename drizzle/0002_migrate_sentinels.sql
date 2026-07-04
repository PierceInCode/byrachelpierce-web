-- Data migration: retire the legacy "sentinel row" redemption-code hack.
-- Moves every trail_progress row with mural_id = 0 (which carried a user's
-- redemption code in the old design) into the new trail_completions table,
-- preserving the code and using the sentinel's checked_in_at as completed_at,
-- then deletes those sentinel rows. Idempotent + re-runnable (INSERT OR IGNORE
-- on the user_id primary key; the DELETE is a no-op once none remain).
INSERT OR IGNORE INTO `trail_completions` (`user_id`, `redemption_code`, `completed_at`)
SELECT `user_id`, `redemption_code`, `checked_in_at`
FROM `trail_progress`
WHERE `mural_id` = 0 AND `redemption_code` IS NOT NULL;
--> statement-breakpoint
DELETE FROM `trail_progress` WHERE `mural_id` = 0;
