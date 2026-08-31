CREATE TABLE `confessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`fromName` varchar(100) NOT NULL,
	`toName` varchar(100) NOT NULL,
	`message` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`isDeleted` int NOT NULL DEFAULT 0,
	CONSTRAINT `confessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `replies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`confessionId` int NOT NULL,
	`message` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`isDeleted` int NOT NULL DEFAULT 0,
	CONSTRAINT `replies_id` PRIMARY KEY(`id`)
);
