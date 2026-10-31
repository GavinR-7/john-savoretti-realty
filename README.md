# John Savoretti Realty — Website

A modern, mobile-first, lead-generating site for a family-run Long Island brokerage (est. 2001). Built with **Next.js 15 (App Router) + Tailwind CSS v4 + TypeScript**, deploys to **Vercel**.

## Overview

**Problem.** A brokerage with two Long Island offices (Franklin Square and Smithtown) sells sale, rental and commercial listings, and needs one site that reads as one business and stays current without someone editing code.

**What it does.** All listings at `/buy` (filterable by sale, rent or commercial), with rental (`/rentals`) and commercial (`/commercial`) pages of their own, plus listing detail pages and a page per town (`/areas/[slug]`). Listings come from an MLS Grid IDX feed that `npm run sync` loads into Postgres (Neon, via Drizzle).

**Design decisions.**
- **Content in `/data`, presentation in `/components`.** Phones, offices and stats live in `data/site.ts`; a change there updates every page.
- **One `Listing` type and one price formatter** (`data/listings.ts`) that cards and detail pages share, with `dealType` of `sale`, `rent` or `commercial`.
- **Incremental, throttled sync** (`scripts/sync.ts`): it asks the feed only for records modified after the last saved timestamp, reads pages one at a time at no more than 2 requests per second, upserts visible records and deletes ones the feed marks not viewable. Known limit: if a run fails part-way, it saves the newest timestamp it has seen, so the next run can skip the record that failed and others at or before that time. After a failed run, delete the `Property` row in `sync_state` and run a full import. The launch-prep branch reworks this.
- **One shared search, three entry points.** `/buy` is the full index with a deal-type selector (sale, rent, commercial). `/rentals` and `/commercial` reuse the same search and filter bar with the type pinned, so each has its own linkable page.

**Results.** None yet: the site has not launched, so there are no traffic or conversion numbers to report.

**Stack.** Next.js 15, React, TypeScript, Tailwind CSS v4, Drizzle ORM, Neon Postgres, Vercel Blob (listing media), Vercel.

---

## Run it locally (first time)

Requirements: **Node.js 20+** (check with `node -v`; install from nodejs.org if needed).

```bash
cd john-savoretti-realty
npm install        # downloads dependencies into node_modules (one-time, ~1-2 min)
npm run dev        # starts the dev server
```
Vercel Link: https://john-savoretti-realty.vercel.app/

Open **http://localhost:3000**. Edits to any file hot-reload instantly.

When you submit a form, the lead prints in the **terminal** running `npm run dev` — that's your "inbox" during development (see `app/api/lead/route.ts` to wire real email later).

---

## Project tour

```
app/
  layout.tsx          → wraps every page: fonts, SEO metadata, JSON-LD, Header/Footer
  page.tsx            → the homepage (just assembles sections in order)
  globals.css         → Tailwind theme tokens: colors, fonts, signature-input styles
  api/lead/route.ts   → POST /api/lead — both forms submit here
  areas/[slug]/       → ONE file that generates ELEVEN town pages (local SEO)
  sitemap.ts          → auto-served at /sitemap.xml
  robots.ts           → auto-served at /robots.txt
components/           → each homepage section is its own file
data/
  site.ts             → SINGLE SOURCE OF TRUTH: phones, offices, stats, agents
  listings.ts         → the 8 featured listings (real MLS facts, placeholder photos)
  areas.ts            → the 11 towns (add one here → a new page appears)
  testimonials.ts     → 3 SAMPLE reviews (visibly badged until replaced)
```

The pattern to internalize: **content lives in `/data`, presentation lives in `/components`**. Change a phone number once in `data/site.ts` and it updates everywhere.

---

## Launch checklist

Tracked privately, outside this public repo.

---

## Deploy to Vercel (free tier is fine)

1. Push to GitHub:
   ```bash
   git init && git add -A && git commit -m "John Savoretti Realty v1"
   gh repo create john-savoretti-realty --private --source=. --push
   ```
2. Go to **vercel.com** → Add New → Project → import the repo. Vercel auto-detects Next.js; click **Deploy**. You get a live `*.vercel.app` URL in ~2 minutes — that's your demo link for John.
3. Custom domain (after he buys one, e.g. on Namecheap): Vercel → Project → Settings → Domains → add it, then at the registrar set:
   - `A` record, host `@`, value `76.76.21.21`
   - `CNAME` record, host `www`, value `cname.vercel-dns.com`
   - DNS can take minutes to a few hours to propagate.
4. Add `RESEND_API_KEY` under Project → Settings → Environment Variables (the production version of `.env.local`).

---

## Learning exercises (do these — they're the reps)

1. **Token change**: in `app/globals.css`, change `--color-brass` and watch every accent on the site update. That's design tokens.
2. **Add a listing**: copy an object in `data/listings.ts`, change the facts, save. It appears in the grid *and* on its town page with zero component edits.
3. **Add a town**: add one object to `data/areas.ts` → a whole new SEO page exists at `/areas/your-slug`. Understand *why* (read `app/areas/[slug]/page.tsx`).
4. **Break it on purpose**: delete a `}` in `Hero.tsx`, read the error overlay top-to-bottom, fix it. Error-reading is the skill.

