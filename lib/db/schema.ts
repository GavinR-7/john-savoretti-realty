/*
  DATABASE SCHEMA — the shape of our Postgres tables, defined in TypeScript.

  Drizzle generates both the SQL migrations AND the TypeScript types from
  this one file. Single source of truth: change a column here and both the
  database and your types follow.

  Three tables:
    properties     — one row per listing (~20 typed columns + full raw JSON)
    property_media — one row per photo, pointing back at its property
    sync_state     — bookkeeping so the sync job knows where it left off
*/

import {
  pgTable,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  index,
} from "drizzle-orm/pg-core";

export const properties = pgTable(
  "properties",
  {
    // MLS Grid's internal unique key — our primary key. Never displayed.
    listingKey: text("listing_key").primaryKey(),

    // The public MLS number (e.g. "KEYL2461951"). Prefix stripped before
    // display. This is what our URLs use: /listings/L2461951
    listingId: text("listing_id").notNull(),

    // ---- Display columns (the ~20 we actually render) ----
    listPrice: integer("list_price"),
    bedroomsTotal: integer("bedrooms_total"),
    bathroomsTotal: integer("bathrooms_total"),
    livingArea: integer("living_area"),          // square feet
    lotSizeSquareFeet: integer("lot_size_square_feet"),
    yearBuilt: integer("year_built"),
    publicRemarks: text("public_remarks"),        // → our `description`
    propertyType: text("property_type"),          // → derives dealType
    propertySubType: text("property_sub_type"),   // → our `style`
    standardStatus: text("standard_status"),      // Active / Pending / Closed
    unparsedAddress: text("unparsed_address"),
    city: text("city"),
    stateOrProvince: text("state_or_province"),
    postalCode: text("postal_code"),
    countyOrParish: text("county_or_parish"),

    // The listing agent — links to our agents data by name for now.
    listAgentFullName: text("list_agent_full_name"),
    listAgentMlsId: text("list_agent_mls_id"),
    listOfficeName: text("list_office_name"),
    // The listing brokerage's MLS id. One of the few fields MLS Grid lets you
    // filter on server-side, and what separates John's own inventory from the
    // rest of the IDX feed.
    listOfficeMlsId: text("list_office_mls_id"),

    // ---- COMPLIANCE FIELDS — legally binding, do not skip ----
    // If false, this listing may NOT be shown publicly at all.
    internetEntireListingDisplayYN: boolean("internet_entire_listing_display_yn"),
    // If false, show the listing but NOT its street address.
    internetAddressDisplayYN: boolean("internet_address_display_yn"),
    // MLS Grid's deletion flag — false means remove from our database.
    mlgCanView: boolean("mlg_can_view"),

    // ---- Sync bookkeeping ----
    // Indexed because every incremental sync queries MAX() of this.
    modificationTimestamp: timestamp("modification_timestamp", {
      withTimezone: true,
    }).notNull(),

    // The ENTIRE original record. Costs almost nothing to store and means
    // we never have to re-import to add a field we didn't anticipate.
    raw: jsonb("raw").notNull(),

    syncedAt: timestamp("synced_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    // Indexes = the columns we filter/sort on constantly.
    modificationIdx: index("idx_modification_timestamp").on(
      table.modificationTimestamp,
    ),
    listingIdIdx: index("idx_listing_id").on(table.listingId),
    cityIdx: index("idx_city").on(table.city),
    officeIdx: index("idx_list_office_mls_id").on(table.listOfficeMlsId),
    statusIdx: index("idx_standard_status").on(table.standardStatus),
  }),
);

export const propertyMedia = pgTable(
  "property_media",
  {
    mediaKey: text("media_key").primaryKey(),

    // FOREIGN KEY — the relational link. Same idea as agentSlug on a
    // listing: store a reference, not a copy.
    listingKey: text("listing_key")
      .notNull()
      .references(() => properties.listingKey, { onDelete: "cascade" }),

    // Gallery position, so we preserve the agent's intended photo order.
    order: integer("order").notNull().default(0),

    // ⚠️ Where WE re-hosted the image. MLS Grid's MediaURL expires —
    // storing theirs would mean every photo breaks within hours.
    localUrl: text("local_url"),

    // Kept only so we can tell if a photo is new (media never changes;
    // a changed photo gets a brand new MediaURL and MediaKey).
    sourceUrl: text("source_url"),

    mediaModificationTimestamp: timestamp("media_modification_timestamp", {
      withTimezone: true,
    }),
  },
  (table) => ({
    listingIdx: index("idx_media_listing_key").on(table.listingKey),
  }),
);

export const syncState = pgTable("sync_state", {
  // One row per resource: "Property", "Member", "Office", "OpenHouse"
  resource: text("resource").primaryKey(),

  // The greatest ModificationTimestamp we've RECEIVED — not just what we
  // kept. Best Practices: if you filter records out, you still track their
  // timestamps, or you'll re-request them forever.
  lastModificationTimestamp: timestamp("last_modification_timestamp", {
    withTimezone: true,
  }),

  lastRunAt: timestamp("last_run_at", { withTimezone: true }),
  lastRunStatus: text("last_run_status"),
  recordsProcessed: integer("records_processed"),
});

// Drizzle infers the TypeScript types from the schema above — no separate
// type definitions to keep in sync.
export type PropertyRow = typeof properties.$inferSelect;
export type PropertyInsert = typeof properties.$inferInsert;
export type MediaRow = typeof propertyMedia.$inferSelect;