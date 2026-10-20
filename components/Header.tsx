"use client";

/*
  Sticky header. Client component because it tracks two pieces of state:
  whether the page has scrolled (to add a shadow) and whether the mobile
  menu is open. Most nav links point at homepage section ids ("/#about")
  so they also work from the /areas/* pages; Buy, Rentals and Commercial
  route to their own pages instead.
*/

import Link from "next/link";
import { useEffect, useState } from "react";
import { business } from "@/data/site";
import BrandMark from "@/components/BrandMark";

const navLinks = [
  { label: "Buy", href: "/buy" },
  { label: "Sell", href: "/#home-value" },
  { label: "Rentals", href: "/rentals" },
  { label: "Commercial", href: "/commercial" },
  { label: "Areas we serve", href: "/#areas" },
  { label: "Our agents", href: "/agents" },
  { label: "About", href: "/#about" },
  { label: "Contact", href: "/#contact" },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /*
    Lock the page behind the mobile menu. Without this the body keeps
    scrolling under the open panel. We stash the scroll position and pin the
    body with `position: fixed` — `overflow: hidden` alone doesn't hold on
    iOS Safari — then restore the exact position on close.
  */
  useEffect(() => {
    if (!open) return;
    const { scrollY } = window;
    const { body } = document;
    const previous = {
      position: body.style.position,
      top: body.style.top,
      width: body.style.width,
      overflowY: body.style.overflowY,
    };

    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.width = "100%";
    body.style.overflowY = "scroll"; // keep the scrollbar gutter so nothing shifts

    return () => {
      body.style.position = previous.position;
      body.style.top = previous.top;
      body.style.width = previous.width;
      body.style.overflowY = previous.overflowY;
      window.scrollTo(0, scrollY);
    };
  }, [open]);

  // Close the menu on Escape, which the scroll lock makes more important.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header
      className={`sticky top-0 z-50 bg-white transition-shadow ${
        scrolled ? "shadow-md shadow-ink/5" : ""
      }`}
    >
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        {/* Wordmark */}
        <Link href="/" className="flex items-center gap-3" aria-label="John Savoretti Realty — home">
          {/*
            The crest is sized to the two-line wordmark block beside it
            (~44px on mobile, ~52px from sm up), so the two read as one lockup
            and the header stays the height it already was on phones.
          */}
          <BrandMark size={52} priority className="h-11 w-auto sm:h-13" />
          <span className="leading-tight">
            <span className="block font-display text-base font-semibold text-atlantic sm:text-lg">
              John Savoretti Realty
            </span>
            <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-brass-deep">
              Home of the Dream Team!
            </span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav aria-label="Main" className="hidden items-center gap-6 lg:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-ink transition-colors hover:text-channel"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-4 md:flex">
          <a
            href={business.phoneNassauHref}
            className="text-sm font-semibold text-atlantic transition-colors hover:text-channel"
          >
            {business.phoneNassau}
          </a>
          <Link
            href="/#home-value"
            className="rounded-md bg-atlantic px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-channel"
          >
            What&rsquo;s my home worth?
          </Link>
        </div>

        {/* Mobile menu button */}
        <button
          type="button"
          className="rounded-md p-2 text-atlantic lg:hidden"
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6">
            {open ? (
              <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
            ) : (
              <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu panel */}
      {open && (
        <nav
          id="mobile-menu"
          aria-label="Main"
          className="border-t border-ink/10 bg-white px-4 pb-6 pt-2 lg:hidden"
        >
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="block border-b border-ink/5 py-3 text-base font-medium text-ink"
            >
              {link.label}
            </Link>
          ))}
          <div className="mt-4 flex flex-col gap-3">
            <a
              href={business.phoneNassauHref}
              className="text-center text-base font-semibold text-atlantic"
            >
              Call {business.phoneNassau}
            </a>
            <Link
              href="/#home-value"
              onClick={() => setOpen(false)}
              className="rounded-md bg-atlantic px-4 py-3 text-center text-base font-semibold text-white"
            >
              What&rsquo;s my home worth?
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
