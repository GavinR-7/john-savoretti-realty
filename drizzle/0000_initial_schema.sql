CREATE TABLE "properties" (
	"listing_key" text PRIMARY KEY NOT NULL,
	"listing_id" text NOT NULL,
	"list_price" integer,
	"bedrooms_total" integer,
	"bathrooms_total" integer,
	"living_area" integer,
	"lot_size_square_feet" integer,
	"year_built" integer,
	"public_remarks" text,
	"property_type" text,
	"property_sub_type" text,
	"standard_status" text,
	"unparsed_address" text,
	"city" text,
	"state_or_province" text,
	"postal_code" text,
	"county_or_parish" text,
	"list_agent_full_name" text,
	"list_agent_mls_id" text,
	"list_office_name" text,
	"list_office_mls_id" text,
	"internet_entire_listing_display_yn" boolean,
	"internet_address_display_yn" boolean,
	"mlg_can_view" boolean,
	"modification_timestamp" timestamp with time zone NOT NULL,
	"raw" jsonb NOT NULL,
	"synced_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "property_media" (
	"media_key" text PRIMARY KEY NOT NULL,
	"listing_key" text NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"local_url" text,
	"source_url" text,
	"media_modification_timestamp" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "sync_state" (
	"resource" text PRIMARY KEY NOT NULL,
	"last_modification_timestamp" timestamp with time zone,
	"last_run_at" timestamp with time zone,
	"last_run_status" text,
	"records_processed" integer
);
--> statement-breakpoint
ALTER TABLE "property_media" ADD CONSTRAINT "property_media_listing_key_properties_listing_key_fk" FOREIGN KEY ("listing_key") REFERENCES "public"."properties"("listing_key") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_modification_timestamp" ON "properties" USING btree ("modification_timestamp");--> statement-breakpoint
CREATE INDEX "idx_listing_id" ON "properties" USING btree ("listing_id");--> statement-breakpoint
CREATE INDEX "idx_city" ON "properties" USING btree ("city");--> statement-breakpoint
CREATE INDEX "idx_list_office_mls_id" ON "properties" USING btree ("list_office_mls_id");--> statement-breakpoint
CREATE INDEX "idx_standard_status" ON "properties" USING btree ("standard_status");--> statement-breakpoint
CREATE INDEX "idx_media_listing_key" ON "property_media" USING btree ("listing_key");