"use client";

/*
  Sticky header. Client component because it tracks two pieces of state:
  whether the page has scrolled (to add a shadow) and whether the mobile
  menu is open. Most nav links point at homepage section ids ("/#listings")
  so they also work from the /areas/* pages; Rentals and Commercial route
  to their own pages instead.
*/

import Link from "next/link";
import { useEffect, useState } from "react";
import { business } from "@/data/site";

const navLinks = [
  { label: "Buy", href: "/#listings" },
  { label: "Sell", href: "/#home-value" },
  { label: "Rentals", href: "/rentals" },
  { label: "Commercial", href: "/commercial" },
  { label: "Areas we serve", href: "/#areas" },
  { label: "Our agents", href: "/#agents" },
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

  return (
    <header
      className={`sticky top-0 z-50 bg-white transition-shadow ${
        scrolled ? "shadow-md shadow-ink/5" : ""
      }`}
    >
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        {/* Wordmark */}
        <Link href="/" className="flex items-center gap-3" aria-label="John Savoretti Realty — home">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-atlantic font-display text-sm font-semibold text-brass-light">
            JS
          </span>
          <span className="leading-tight">
            <span className="block font-display text-lg font-semibold text-atlantic">
              John Savoretti
            </span>
            <span className="block text-[10px] font-semibold uppercase tracking-[0.3em] text-brass-deep">
              Realty · Est. 2001
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
