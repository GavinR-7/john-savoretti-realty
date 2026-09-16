/*
  Prev/next pagination shared by the three search pages.

  Links must carry the active filters or paging would silently reset them,
  so the caller passes a builder that knows how to serialise its own filters.
  Page 1 intentionally omits `page` from the URL so the canonical first page
  has a single address.
*/
import Link from "next/link";

const BOX = "rounded-md border px-4 py-2.5 text-sm font-semibold";
const ACTIVE = `${BOX} border-atlantic/20 text-atlantic transition hover:border-atlantic/50`;
const DISABLED = `${BOX} border-ink/10 text-mist/50`;

export default function Pagination({
  page,
  totalPages,
  hrefForPage,
}: {
  page: number;
  totalPages: number;
  hrefForPage: (page: number) => string;
}) {
  if (totalPages <= 1) return null;

  return (
    <nav
      aria-label="Pagination"
      className="mt-10 flex items-center justify-between gap-4 border-t border-atlantic/10 pt-6"
    >
      {page > 1 ? (
        <Link href={hrefForPage(page - 1)} rel="prev" className={ACTIVE}>← Previous</Link>
      ) : (
        <span className={DISABLED}>← Previous</span>
      )}

      <span className="text-sm font-medium text-mist">
        Page {page} of {totalPages}
      </span>

      {page < totalPages ? (
        <Link href={hrefForPage(page + 1)} rel="next" className={ACTIVE}>Next →</Link>
      ) : (
        <span className={DISABLED}>Next →</span>
      )}
    </nav>
  );
}
