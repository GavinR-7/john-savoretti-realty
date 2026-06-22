# John Savoretti Realty — Website

A modern, mobile-first, lead-generating site for a family-run Long Island brokerage (est. 2001). Built with **Next.js 15 (App Router) + Tailwind CSS v4 + TypeScript**, deploys to **Vercel**.

---

## Run it locally (first time)

Requirements: **Node.js 20+** (check with `node -v`; install from nodejs.org if needed).

```bash
cd john-savoretti-realty
npm install        # downloads dependencies into node_modules (one-time, ~1-2 min)
npm run dev        # starts the dev server
```

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

## ⚠️ Swap-in checklist (before showing John / before launch)

**For the pitch demo:**
- [ ] Listing photos are Unsplash **placeholders** (real MLS photos are licensed — don't copy them from the old site). Get originals from John, drop them in `/public/listings/`, and point each listing's `image` in `data/listings.ts` at `/listings/filename.jpg`.
- [ ] Headshot: add John's photo per the comment in `components/AboutSection.tsx`.
- [ ] Reviews: replace the 3 samples in `data/testimonials.ts` with **real, exact quotes** from his Google/Zillow reviews (with his OK) and set `isSample: false`.
- [ ] Logo: if John has one, replace the "JS" roundel in `Header.tsx` and `Footer.tsx`.

**Before real launch:**
- [ ] **Email**: confirm with John — his old site shows `JohnSavoretti@optonline.net`, the spec says `OfficeAdmin@JohnSavorettiRealty.com`. Set the right one in `data/site.ts`.
- [ ] **SMS number**: "Text us" currently points at the office landline, which likely can't receive texts. Swap `smsHref` in `data/site.ts` to a cell or Twilio number.
- [ ] **Compliance PDFs**: the NY Fair Housing Notice / SOP / accommodations links currently point at the **old vendor's domain** (vlshomes.com). Download them, put copies in `/public/docs/`, and update `business.compliance` to `/docs/...` — if he leaves that vendor, the legally required links die otherwise.
- [ ] **Verify the 8 MLS numbers/prices** are still current (listings move).
- [ ] **Domain**: update `metadataBase` in `app/layout.tsx` and `BASE` in `app/sitemap.ts` + `app/robots.ts`.
- [ ] **Wire form email** via Resend — instructions are inline in `app/api/lead/route.ts`. Put the key in `.env.local` (never commit it; see `.env.example`).

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

## v2 roadmap (the upsell)

- `/agents` page with the full ~30-agent roster (same data-driven pattern)
- Real MLS/IDX feed instead of the static listings array
- AI chatbot trained on John's FAQs/listings (the $1,000–1,800 tier)
- Missed-call text-back + review-request automation (the $2,000+ tier)
