# Build notes

## T-320: contact form spam protection (2026-10-23)

`FormProtection` supplies a hidden honeypot, mount timestamp and invisible
Turnstile token. The server requires a timestamp at least three seconds old,
validates the token with Cloudflare Siteverify, and checks hostname and the
`contact` action. The timestamp is a heuristic a script can forge; it is not an
authentication claim. Business fields are independently validated with server
Zod. Zod is the only added runtime dependency in the client repos and is not
imported into the browser bundle. The shared implementation is copied into
each repo to keep deployments independent.

Missing either Turnstile key fails with a clear 503; there is no development
or production bypass. Verification failure, expiry and network errors reject
the submission before email. After every API attempt the widget resets for a
fresh one-use token. Script failure and missing tokens preserve typed values
and allow retry or direct contact. Widget IDs are scoped to the form, so two
forms on one page do not share a token. A privacy notice references Cloudflare's
Turnstile Privacy Addendum, required for Invisible mode.

Read spam counts: in retained server logs, filter `contact_spam_rejected` and
sum `count` grouped by `reason` (`honeypot`, `too_fast`, `turnstile`, `zod`) for
the same date range before/after. Every log is one increment, not an in-memory
total that resets at cold starts. Logs omit form data, IPs and tokens. Counts
include invalid user input and security misconfiguration; they are rejection
counts, not proof that every rejected visitor was a bot. Before deployment no
baseline rejection counts exist. Retention depends on the hosting plan; export
logs for comparisons longer than its retention window.

Run `npm test` with Node 24+ (native TypeScript stripping and module hooks).
Tests fake Siteverify and email delivery and cover all four rejection reasons,
missing keys, missing/expired tokens, hostname/action mismatch, outage, invalid
JSON and the verified email path. They never contact external providers.

Cloudflare setup: https://developers.cloudflare.com/turnstile/get-started/ .
Gavin creates the widget and sets `NEXT_PUBLIC_TURNSTILE_SITE_KEY` (public) and
`TURNSTILE_SECRET_KEY` (secret) separately for Preview and Production. Public
keys are compiled into the bundle, so a key change requires a new build. Add
the exact preview hostname to the widget before testing that preview; do not
disable hostname checks. No account changes, real sends, merges or production
deployments were performed for this task.
