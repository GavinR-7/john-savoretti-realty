/*
  IDX attribution required on every page that shows feed data.

  OneKey® requires the source to be named and the data qualified as "deemed
  reliable but not guaranteed". The "Last updated" stamp comes from
  sync_state.last_run_at, so it reflects when we actually pulled the feed
  rather than when the page happened to render.
*/
import { getLastSyncedAt } from "@/lib/db/listings";

export default async function IdxDisclaimer() {
  const lastSynced = await getLastSyncedAt();

  return (
    <div className="border-t border-atlantic/10 bg-fog">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <p className="text-xs leading-relaxed text-mist">
          Listing data provided by OneKey<sup>®</sup> MLS. Information is deemed
          reliable but not guaranteed and should be independently verified. All
          properties are subject to prior sale, change, or withdrawal. Neither
          the listing broker nor John Savoretti Realty shall be responsible for
          any typographical errors, misinformation, or misprints.
          {lastSynced && (
            <>
              {" "}
              <span className="whitespace-nowrap">
                Last updated{" "}
                <time dateTime={lastSynced.toISOString()}>
                  {lastSynced.toLocaleString("en-US", {
                    timeZone: "America/New_York",
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}{" "}
                  ET
                </time>
                .
              </span>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
