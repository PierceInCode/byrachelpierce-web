-- Data migration: retire the legacy "sentinel row" redemption-code hack.
-- Each trail_progress row with mural_id = 0 carried a user's redemption code;
-- move it into trail_completions (code kept, checked_in_at → completed_at),
-- then delete the sentinel rows. Idempotent + re-runnable: INSERT OR IGNORE on
-- the user_id primary key, and the DELETE is a no-op once no sentinels remain.
INSERT OR IGNORE INTO `trail_completions` (`user_id`, `redemption_code`, `completed_at`)
SELECT `user_id`, `redemption_code`, `checked_in_at`
FROM `trail_progress`
WHERE `mural_id` = 0 AND `redemption_code` IS NOT NULL;
--> statement-breakpoint
DELETE FROM `trail_progress` WHERE `mural_id` = 0;
