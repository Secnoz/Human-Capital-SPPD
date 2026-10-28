CREATE TABLE `audit` (
	`id` text PRIMARY KEY NOT NULL,
	`actor` text NOT NULL,
	`action` text NOT NULL,
	`target` text NOT NULL,
	`at` text NOT NULL,
	`details` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `counters` (
	`year` text PRIMARY KEY NOT NULL,
	`value` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `employees` (
	`id` text PRIMARY KEY NOT NULL,
	`employee_no` text NOT NULL,
	`name` text NOT NULL,
	`position` text NOT NULL,
	`unit` text NOT NULL,
	`criterion` integer NOT NULL,
	`credit_name` text NOT NULL,
	`bank_account` text NOT NULL,
	`active` integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `employees_employee_no_unique` ON `employees` (`employee_no`);--> statement-breakpoint
CREATE TABLE `files` (
	`id` text PRIMARY KEY NOT NULL,
	`trip_id` text NOT NULL,
	`kind` text NOT NULL,
	`r2_key` text NOT NULL,
	`sha256` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `members` (
	`email` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`name` text NOT NULL,
	`role` text DEFAULT 'staff' NOT NULL,
	`active` integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `offices` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`address` text NOT NULL,
	`lat` text,
	`lng` text,
	`place_id` text
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `tariffs` (
	`id` text PRIMARY KEY NOT NULL,
	`scenario` text NOT NULL,
	`criterion` integer NOT NULL,
	`valid_from` text NOT NULL,
	`valid_until` text,
	`daily` integer NOT NULL,
	`city_taxi` integer NOT NULL,
	`airport` integer NOT NULL,
	`note` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `trips` (
	`id` text PRIMARY KEY NOT NULL,
	`number` text,
	`status` text DEFAULT 'draft' NOT NULL,
	`data` text NOT NULL,
	`total` integer DEFAULT 0 NOT NULL,
	`departure_date` text DEFAULT '' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`created_by` text NOT NULL,
	`revision` integer DEFAULT 1 NOT NULL,
	`replaces` text,
	`cancel_reason` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `trips_number_unique` ON `trips` (`number`);