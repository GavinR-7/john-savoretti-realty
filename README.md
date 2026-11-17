# John Savoretti Realty

Next.js 15, React 19, TypeScript and Tailwind 4 for the brokerage's home search and inquiries. The production domain switch is pending. The current Vercel production alias can serve an older commit than the launch candidate.

## Local verification

Use Node.js 24, matching the configured Vercel runtime.

    npm ci
    npm test
    npm run typecheck
    npm run build

Copy .env.example into a private .env.local and supply service credentials through the approved provider dashboards. Feed pages query Neon on request, so withdrawn or restricted records can disappear without a rebuild. The build still needs a syntactically valid DATABASE_URL. Verification fixtures use stand-ins and make no licensed feed, Blob or email calls.

    npm run dev -- --hostname 127.0.0.1

Forms send through Resend after server-verified Turnstile. Missing keys produce a call option and unavailable state. The server logs acceptance or rejection counts without form contents. The per-instance IP limit is best effort.

## Content and data

- data/site.ts holds the approved business facts and safe content flags. Sample reviews and unsupported statistics default to hidden.
- The original crest is public/logo.png. Any replacement or recoloring needs client approval.
- lib/db/listings.ts serves all public data queries and shares the IDX permission and status gate in lib/listing-policy.ts. Address fields honor seller display permission.
- OFFICE_MLS_ID must match the actual licensed office. The earlier guessed value is rejected. Approved agent IDs belong in data/agents.ts.
- Public media URLs are re-hosted in Blob. Signed MLS photo download URLs must stay out of client code, source control and logs.
- lib/mls/sync.ts handles feed replication. Use the package sync commands, which set the required server condition.
- Deployment changes and data imports have separate review and verification steps.

## Preview and production

NEXT_PUBLIC_SITE_MODE defaults to preview. Preview pages carry noindex and an explicit preview notice, robots disallows crawling, and the sitemap is empty. Set live mode only on the approved production deployment after the license, data, domain and contact-delivery checks. Vercel Preview remains non-indexable even if the mode is set incorrectly.

Use NEXT_PUBLIC_SITE_URL for the chosen canonical HTTPS origin. Both the origin and public mode are build-time values, so redeploy after changing them.

    npm run launch:check -- --target preview
    npm run launch:check -- --target production

The checker reads the current process environment and prints variable names and fixed reasons only. Missing or unsafe configuration exits nonzero. A config-ready result still lists actual license, delivery, DNS, content and runtime checks as unknown until verified. Do not paste secret values into reports or chat.

Required settings are listed in .env.example. Confirm Preview and Production separately. Resend's shared onboarding sender can deliver only to its account owner. Production needs a verified sender and John's chosen recipient. Turnstile needs the exact allowed hostnames. The cron route fails closed without CRON_SECRET.

## Launch sequence

1. Review the combined feature candidate and keep preview indexing off.
2. Confirm John's licensed IDX scope and production token, office/agent IDs, lead inbox, contact numbers, content and current NY notices.
3. Inspect the target schema and Drizzle migration history after backup and change approval. A database originally created with drizzle-kit push needs its matching existing schema baselined through the approved migration workflow. Validate on a staging copy, drain all pre-lease sync processes, then apply 0001_sync_lease_cleanup.sql before running the new sync version.
4. Preserve the existing demo dataset and media. Use an approved staged production import. Keep one import writer and avoid enabling scheduled runs until its baseline is accepted.
5. Verify licensed display permissions, removal behavior, photos, search, attribution, successful sync age and the required MLS presentation. Obtain the approved MLS source/logo and legal notices for the final display.
6. Verify both lead forms deliver to the approved recipient and pass/reject the real Turnstile checks.
7. Merge and deploy through the normal review gate, with live mode on Production only when those checks are complete.
8. Attach the domain in this Vercel project. Use its current Domains instructions for apex/www and canonical redirects. Preserve existing MX, mail-related TXT and other service records. DNS values in old notes may be outdated.
9. Confirm HTTPS, redirects, contact delivery, licensed listings, cron success, robots and sitemap on the custom domain. Complete client sign-off, then submit the approved sitemap.

The operator's private launch packet contains the client coordination, exact release head, verified tests and remaining external decisions. Keep client payment details, raw handoffs and credentials outside this repository.

## Service operations

    npm run db:generate
    npm run db:migrate
    npm run sync

Never migrate, clear data or run a full import as part of a routine build. Inspect scripts/cleanup-media.ts and its selected store before any explicitly approved destructive cleanup. A successful local test or build does not verify provider credentials, the real license, delivered mail or a domain cutover.

Security updates stay within the existing framework major. package.json overrides pin compatible fixes for vulnerable transitive CSS, HTTP and validation packages. Recheck npm audit and the build when updating the lockfile.
