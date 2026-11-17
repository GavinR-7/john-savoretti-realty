import assert from "node:assert/strict";
import { test } from "node:test";
import { assessLaunch, launchCheckCli } from "../scripts/launch-check.mjs";

const configured = () => ({
  DATABASE_URL: "postgresql://private-user:private-password@private-host.invalid/db",
  MLSGRID_TOKEN: "private-feed-token",
  BLOB_READ_WRITE_TOKEN: "private-blob-token",
  CRON_SECRET: "private-cron-secret",
  RESEND_API_KEY: "private-resend-key",
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: "private-widget-key",
  TURNSTILE_SECRET_KEY: "private-widget-secret",
  NEXT_PUBLIC_SITE_URL: "https://johnsavorettirealty.com",
  MLSGRID_API_URL: "https://api.mlsgrid.com/v2",
  NEXT_PUBLIC_SITE_MODE: "live",
  VERCEL_ENV: "production",
  OFFICE_MLS_ID: "confirmed-office-fixture",
  LEAD_TO_EMAIL: "private-recipient@example.com",
  LEAD_FROM_EMAIL: "Website Leads <private-sender@example.com>",
});
const check = (result, name) => result.configuration.checks.find((row) => row.name === name);

test("complete production configuration leaves all actual launch facts unknown", () => {
  const report = assessLaunch(configured());
  assert.equal(report.configuration.status, "config-ready");
  assert.equal(report.launchStatus, "manual-verification-needed");
  assert.equal(report.manualVerification.checks.every((row) => row.status === "unknown"), true);
  assert.equal(report.networkRequests, 0);
});

test("missing names are reported without environment values", () => {
  const report = assessLaunch({});
  assert.equal(check(report, "DATABASE_URL").status, "missing");
  assert.equal(check(report, "TURNSTILE_SECRET_KEY").status, "missing");
  assert.equal(check(report, "VERCEL_ENV").status, "unknown");
  assert.equal(report.configuration.status, "configuration-needed");
  const env = configured();
  const confidential = Object.entries(env).filter(([name]) => !["NEXT_PUBLIC_SITE_MODE", "VERCEL_ENV"].includes(name));
  assert.equal(confidential.some(([, value]) => JSON.stringify(assessLaunch(env)).includes(value)), false);
});

test("a live label and correct domain cannot replace actual production context", () => {
  for (const context of [undefined, "preview", "development"]) {
    const env = configured();
    if (context === undefined) delete env.VERCEL_ENV;
    else env.VERCEL_ENV = context;
    assert.equal(assessLaunch(env).configuration.status, "configuration-needed");
  }
});

test("production accepts only the actual canonical domain origins", () => {
  for (const url of [
    "https://john-savoretti-realty.vercel.app",
    "http://johnsavorettirealty.com",
    "https://johnsavorettirealty.com/buy",
    "https://johnsavorettirealty.com?token=private",
    "https://johnsavorettirealty.com#fragment",
    "https://user:secret@johnsavorettirealty.com",
    "https://johnsavorettirealty.com:8443",
    "https://johnsavorettirealty.com.evil.invalid",
  ]) {
    assert.equal(check(assessLaunch({ ...configured(), NEXT_PUBLIC_SITE_URL: url }), "NEXT_PUBLIC_SITE_URL").status,
      "blocked");
  }
  assert.equal(check(assessLaunch({ ...configured(), NEXT_PUBLIC_SITE_URL: "https://www.johnsavorettirealty.com/" }),
    "NEXT_PUBLIC_SITE_URL").status, "passed");
});

test("the demo feed is allowed for preview and rejected for production", () => {
  const env = { ...configured(), MLSGRID_API_URL: "https://api-demo.mlsgrid.com/v2" };
  assert.equal(check(assessLaunch(env), "MLSGRID_API_URL").status, "blocked");
  assert.equal(check(assessLaunch({ ...env, NEXT_PUBLIC_SITE_MODE: "preview" }, { target: "preview" }),
    "MLSGRID_API_URL").status, "passed");
});

test("unsafe endpoint shapes cannot pass and never echo their values", () => {
  for (const url of [
    "not-a-url", "http://api.mlsgrid.com/v2", "https://api.mlsgrid.com/v2?token=private",
    "https://u:private@api.mlsgrid.com/v2", "https://api.mlsgrid.com/v1",
  ]) {
    const report = assessLaunch({ ...configured(), MLSGRID_API_URL: url });
    assert.equal(check(report, "MLSGRID_API_URL").status, "blocked");
    assert.equal(JSON.stringify(report).includes(url), false);
  }
});

test("the historical office guess never passes", () => {
  for (const office of ["KEYJOSV01", "keyjosv01", " KEYJOSV01 "]) {
    assert.equal(check(assessLaunch({ ...configured(), OFFICE_MLS_ID: office }), "OFFICE_MLS_ID").status, "blocked");
  }
});

test("production requires an explicit live mode", () => {
  for (const mode of ["", "preview", "LIVE", "something"]) {
    assert.equal(assessLaunch({ ...configured(), NEXT_PUBLIC_SITE_MODE: mode }).configuration.status,
      "configuration-needed");
  }
});

test("Resend onboarding sender is preview-only and cannot pass a client production launch", () => {
  for (const sender of ["", "onboarding@resend.dev", "Website Leads <onboarding@resend.dev>"]) {
    const env = { ...configured(), LEAD_FROM_EMAIL: sender };
    assert.equal(assessLaunch(env).configuration.status, "configuration-needed");
    const preview = assessLaunch({ ...env, NEXT_PUBLIC_SITE_MODE: "preview" }, { target: "preview" });
    assert.equal(check(preview, "LEAD_FROM_EMAIL").status, "preview-only");
  }
});

test("preview checks accept a Vercel URL or local HTTP without suggesting production is ready", () => {
  for (const url of ["https://project-branch.vercel.app", "http://localhost:3000", "http://127.0.0.1:3000"]) {
    const preview = assessLaunch({
      ...configured(), VERCEL_ENV: "preview", NEXT_PUBLIC_SITE_MODE: "preview", NEXT_PUBLIC_SITE_URL: url,
    }, { target: "preview" });
    assert.equal(preview.target, "preview");
    assert.equal(preview.configuration.status, "config-ready");
    assert.equal(preview.launchStatus, "manual-verification-needed");
  }
});

test("the CLI has a bounded target contract and returns a failing configuration exit", () => {
  assert.equal(launchCheckCli([], {}).exitCode, 2);
  assert.equal(launchCheckCli(["--target", "production"], configured()).exitCode, 0);
  for (const args of [["--help"], ["--target", "live"], ["--target", "production", "--extra"]]) {
    assert.equal(launchCheckCli(args, configured()).exitCode, 2);
    assert.deepEqual(Object.keys(launchCheckCli(args, configured()).report), ["error"]);
  }
});

test("invalid environment types and recipient shapes fail closed", () => {
  assert.equal(check(assessLaunch({ ...configured(), DATABASE_URL: 42 }), "DATABASE_URL").status, "missing");
  assert.equal(check(assessLaunch({ ...configured(), LEAD_TO_EMAIL: "not-email" }), "LEAD_TO_EMAIL").status, "blocked");
  assert.equal(check(assessLaunch({ ...configured(), LEAD_FROM_EMAIL: "bad <sender>" }), "LEAD_FROM_EMAIL").status,
    "blocked");
});
