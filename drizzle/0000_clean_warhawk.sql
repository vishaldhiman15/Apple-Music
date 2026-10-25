CREATE TABLE `music_catalog_cache` (
	`id` text PRIMARY KEY NOT NULL,
	`payload` text NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `music_playlists` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`payload` text NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `music_playlists_owner` ON `music_playlists` (`owner`);--> statement-breakpoint
CREATE TABLE `music_profiles` (
	`owner` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`payload` text DEFAULT '{}' NOT NULL,
	`version` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `music_cloud_tracks` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`payload` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `music_cloud_tracks_owner` ON `music_cloud_tracks` (`owner`);