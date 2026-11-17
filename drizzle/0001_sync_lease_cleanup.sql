CREATE TABLE "media_cleanup" (
	"blob_url" text PRIMARY KEY NOT NULL,
	"listing_key" text,
	"queued_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sync_state" ADD COLUMN "lease_owner" text;--> statement-breakpoint
ALTER TABLE "sync_state" ADD COLUMN "lease_expires_at" timestamp with time zone;