import { afterEach, beforeEach, test, mock } from "node:test";
import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { existsSync } from "node:fs";

// Node's native TS stripping keeps these tests dependency-free. Resolve the
// app's existing alias and Next's extensionless server entry for route tests.
registerHooks({ resolve(specifier, context, nextResolve) {
  if (specifier.startsWith("@/")) {
    const url = new URL(`../${specifier.slice(2)}.ts`, import.meta.url);
    return nextResolve(url.href, context);
  }
  if (specifier === "next/server") return nextResolve("next/server.js", context);
  return nextResolve(specifier, context);
} });
const { checkFormSpam } = await import("../lib/formSpam.ts");
const routeName = ["audit", "quote", "lead"].find((name) => existsSync(new URL(`../app/api/${name}/route.ts`, import.meta.url)));
process.env.LEAD_TO_EMAIL = "inbox@example.com";
const { POST } = await import(`../app/api/${routeName}/route.ts`);

const request = new Request("https://example.com/api/contact");
const valid = () => ({ renderedAt: String(Date.now() - 5000), companyUrl: "", turnstileToken: "test-response" });
let logs;
let originalEnv;
beforeEach(() => {
  originalEnv = { ...process.env };
  process.env.TURNSTILE_SECRET_KEY = "test-secret";
  process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY = "test-site";
  logs = mock.method(console, "info", () => {});
  mock.method(globalThis, "fetch", async () => Response.json({ success: true, hostname: "example.com", action: "contact" }));
});
afterEach(() => { process.env = originalEnv; mock.restoreAll(); });

async function rejected(body, reason, status = 400) {
  const response = await checkFormSpam(body, request);
  assert.equal(response?.status, status);
  assert.equal((await response.json()).ok, false);
  assert.deepEqual(logs.mock.calls.map(({ arguments: args }) => JSON.parse(args[0])), [
    { event: "contact_spam_rejected", reason, count: 1 },
  ]);
}
test("honeypot: no verification and no personal data logged", async () => {
  await rejected({ ...valid(), companyUrl: "private@example.com" }, "honeypot");
  assert.equal(fetch.mock.callCount(), 0);
});
test("legacy company honeypot also rejected", async () => {
  await rejected({ ...valid(), company: "spam" }, "honeypot");
});
test("minimum fill time: immediate and future timestamps rejected", async () => {
  await rejected({ ...valid(), renderedAt: String(Date.now() + 1000) }, "too_fast");
  assert.equal(fetch.mock.callCount(), 0);
});
test("zod: missing timestamp cannot bypass time check", async () => {
  await rejected({ companyUrl: "" }, "zod");
});
test("zod: malformed payload rejected", async () => {
  await rejected(null, "zod");
});
test("missing secret fails closed even in development", async () => {
  delete process.env.TURNSTILE_SECRET_KEY;
  await rejected(valid(), "turnstile", 503);
});
test("missing public site key fails closed", async () => {
  delete process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  await rejected(valid(), "turnstile", 503);
});
test("missing token rejected", async () => {
  await rejected({ ...valid(), turnstileToken: "" }, "turnstile");
});
test("invalid / expired / replayed token rejected", async () => {
  fetch.mock.mockImplementation(async () => Response.json({ success: false, "error-codes": ["timeout-or-duplicate"] }));
  await rejected(valid(), "turnstile");
});
test("hostname mismatch rejected", async () => {
  fetch.mock.mockImplementation(async () => Response.json({ success: true, hostname: "attacker.example", action: "contact" }));
  await rejected(valid(), "turnstile");
});
test("action mismatch rejected", async () => {
  fetch.mock.mockImplementation(async () => Response.json({ success: true, hostname: "example.com", action: "login" }));
  await rejected(valid(), "turnstile");
});
test("verification outage returns server error", async () => {
  fetch.mock.mockImplementation(async () => { throw new Error("timeout"); });
  await rejected(valid(), "turnstile", 503);
});
test("malformed verification response returns server error", async () => {
  fetch.mock.mockImplementation(async () => new Response("not JSON"));
  await rejected(valid(), "turnstile", 503);
});
test("verified human continues; token sent only to siteverify", async () => {
  assert.equal(await checkFormSpam(valid(), request), null);
  assert.equal(logs.mock.callCount(), 0);
  const [url, options] = fetch.mock.calls[0].arguments;
  assert.equal(url, "https://challenges.cloudflare.com/turnstile/v0/siteverify");
  assert.equal(options.body.get("secret"), "test-secret");
  assert.equal(options.body.get("response"), "test-response");
  assert.equal(options.cache, "no-store");
});

const lead = () => ({ ...valid(), name: "Test Visitor", phone: "5550100", email: "visitor@example.com", formType: "contact", ...(routeName === "lead" ? {} : { interests: [], interested: [] }) });
const post = (data) => POST(new Request(`https://example.com/api/${routeName}`, {
  method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
}));
test("endpoint rejects honeypot before email delivery", async () => {
  assert.equal((await post({ ...lead(), companyUrl: "spam" })).status, 400);
  assert.equal(fetch.mock.callCount(), 0);
});
test("endpoint rejects fast submission before email delivery", async () => {
  assert.equal((await post({ ...lead(), renderedAt: String(Date.now()) })).status, 400);
  assert.equal(fetch.mock.callCount(), 0);
});
test("endpoint rejects Turnstile failure before email delivery", async () => {
  fetch.mock.mockImplementation(async () => Response.json({ success: false }));
  assert.equal((await post(lead())).status, 400);
  assert.equal(fetch.mock.callCount(), 1);
});
test("endpoint keeps business-field zod validation after security check", async () => {
  assert.equal((await post({ ...lead(), name: [] })).status, 400);
  assert.equal(JSON.parse(logs.mock.calls.at(-1).arguments[0]).reason, "zod");
  assert.ok(fetch.mock.calls.every(({ arguments: args }) => args[0] === "https://challenges.cloudflare.com/turnstile/v0/siteverify"));
});
test("endpoint counts malformed JSON without logging its contents", async () => {
  const response = await POST(new Request(`https://example.com/api/${routeName}`, { method: "POST", body: "{" }));
  assert.equal(response.status, 400);
  assert.deepEqual(JSON.parse(logs.mock.calls[0].arguments[0]), { event: "contact_spam_rejected", reason: "zod", count: 1 });
});
test("verified endpoint sends exactly one email without security fields", async () => {
  process.env.RESEND_API_KEY = "test-mail-key";
  process.env.AUDIT_TO_EMAIL = process.env.QUOTE_TO_EMAIL = "inbox@example.com";
  process.env.AUDIT_FROM_EMAIL = process.env.QUOTE_FROM_EMAIL = "sender@example.com";
  fetch.mock.mockImplementation(async (url) => url === "https://challenges.cloudflare.com/turnstile/v0/siteverify"
    ? Response.json({ success: true, hostname: "example.com", action: "contact" })
    : Response.json({ id: "test-email-id" }));
  assert.equal((await post(lead())).status, 200);
  assert.equal(fetch.mock.callCount(), 2);
  const delivery = fetch.mock.calls[1].arguments[1].body;
  assert.ok(!delivery.includes("test-response"));
  assert.ok(!delivery.includes("renderedAt"));
  assert.equal(logs.mock.callCount(), 0);
});
