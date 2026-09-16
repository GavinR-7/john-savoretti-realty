/*
  The filter bar shared by /buy, /rentals, and /commercial.

  A plain GET form: the browser serialises these controls into the query
  string itself, so there's no client state and no JS shipped for it. The
  page reads them back through searchParams and turns them into SQL.

  `action` is the page it submits to, so each page filters itself. Deal type
  is NOT a control here — /rentals and /commercial are pre-scoped by route,
  and /buy passes its own selector in via `extraControl`.

  There is deliberately no hidden `page` input: submitting new filters drops
  you back to page 1.
*/
import Link from "next/link";
import type { ListingSearchFilters } from "@/lib/db/listings";

export const SELECT_CLASSES =
  "w-full rounded-md border border-ink/15 bg-white px-3 py-2.5 text-sm font-medium text-ink focus:border-channel";
export const LABEL_CLASSES =
  "mb-1 block text-xs font-semibold uppercase tracking-wider text-mist";

export const BED_BATH_OPTIONS = [1, 2, 3, 4, 5];

export const PRICE_STEPS = [
  100_000, 250_000, 400_000, 500_000, 750_000, 1_000_000, 1_500_000, 2_000_000,
];

export const priceLabel = (value: number) =>
  value >= 1_000_000 ? `$${value / 1_000_000}M` : `$${value / 1_000}K`;

type Props = {
  action: string;
  cities: string[];
  filters: ListingSearchFilters;
  /** Rendered as the first control — /buy uses it for the sale/rent/commercial selector. */
  extraControl?: React.ReactNode;
};

export default function ListingFilters({ action, cities, filters, extraControl }: Props) {
  return (
    <form
      method="GET"
      action={action}
      aria-label="Filter listings"
      className="grid gap-3 rounded-xl bg-fog p-4 sm:grid-cols-2 lg:grid-cols-3"
    >
      {extraControl}

      <label className="block">
        <span className={LABEL_CLASSES}>Town</span>
        <select name="city" className={SELECT_CLASSES} defaultValue={filters.city ?? ""}>
          <option value="">All towns</option>
          {cities.map((city) => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className={LABEL_CLASSES}>Bedrooms</span>
        <select
          name="minBeds"
          className={SELECT_CLASSES}
          defaultValue={filters.minBeds !== undefined ? String(filters.minBeds) : ""}
        >
          <option value="">Any beds</option>
          {BED_BATH_OPTIONS.map((n) => (
            <option key={n} value={n}>{n}+</option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className={LABEL_CLASSES}>Bathrooms</span>
        <select
          name="minBaths"
          className={SELECT_CLASSES}
          defaultValue={filters.minBaths !== undefined ? String(filters.minBaths) : ""}
        >
          <option value="">Any baths</option>
          {BED_BATH_OPTIONS.map((n) => (
            <option key={n} value={n}>{n}+</option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className={LABEL_CLASSES}>Min price</span>
        <select
          name="minPrice"
          className={SELECT_CLASSES}
          defaultValue={filters.minPrice !== undefined ? String(filters.minPrice) : ""}
        >
          <option value="">No minimum</option>
          {PRICE_STEPS.map((p) => (
            <option key={p} value={p}>{priceLabel(p)}</option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className={LABEL_CLASSES}>Max price</span>
        <select
          name="maxPrice"
          className={SELECT_CLASSES}
          defaultValue={filters.maxPrice !== undefined ? String(filters.maxPrice) : ""}
        >
          <option value="">No maximum</option>
          {PRICE_STEPS.map((p) => (
            <option key={p} value={p}>{priceLabel(p)}</option>
          ))}
        </select>
      </label>

      <div className="flex items-end gap-3 sm:col-span-2 lg:col-span-3">
        <button
          type="submit"
          className="rounded-md bg-atlantic px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-channel"
        >
          Search
        </button>
        <Link
          href={action}
          className="text-sm font-semibold text-atlantic transition-colors hover:text-channel"
        >
          Clear filters
        </Link>
      </div>
    </form>
  );
}
