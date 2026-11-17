#!/usr/bin/env node
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const PRESENCE_ONLY = [
  "DATABASE_URL",
  "MLSGRID_TOKEN",
  "BLOB_READ_WRITE_TOKEN",
  "CRON_SECRET",
  "RESEND_API_KEY",
  "NEXT_PUBLIC_TURNSTILE_SITE_KEY",
  "TURNSTILE_SECRET_KEY",
];
const LIVE_HOSTS = new Set(["johnsavorettirealty.com", "www.johnsavorettirealty.com"]);
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);
const text = (environment, name) => typeof environment[name] === "string" ? environment[name].trim() : "";
const row = (name, status, reason) => ({ name, status, reason });

function origin(value, target) {
  if (!value) return row("NEXT_PUBLIC_SITE_URL", "missing", "Set the absolute site origin.");
  let url;
  try { url = new URL(value); } catch { return row("NEXT_PUBLIC_SITE_URL", "blocked", "Use an absolute HTTP or HTTPS origin."); }
  if (url.username || url.password || url.search || url.hash || !["", "/"].includes(url.pathname)) {
    return row("NEXT_PUBLIC_SITE_URL", "blocked", "Use an origin without credentials, path, query or fragment.");
  }
  if (target === "production") {
    if (url.protocol !== "https:" || url.port || !LIVE_HOSTS.has(url.hostname.toLowerCase())) {
      return row("NEXT_PUBLIC_SITE_URL", "blocked", "Production requires the approved HTTPS apex or www origin.");
    }
  } else if (url.protocol !== "https:" && !(url.protocol === "http:" && LOCAL_HOSTS.has(url.hostname))) {
    return row("NEXT_PUBLIC_SITE_URL", "blocked", "Preview requires HTTPS or a local HTTP origin.");
  }
  return row("NEXT_PUBLIC_SITE_URL", "passed", "Origin matches the selected target. DNS and HTTPS still need verification.");
}

function endpoint(value, target) {
  if (!value) return row("MLSGRID_API_URL", "missing", "Set the endpoint supplied by the data license.");
  let url;
  try { url = new URL(value); } catch { return row("MLSGRID_API_URL", "blocked", "Use the licensed absolute HTTPS endpoint."); }
  if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash
      || !["/v2", "/v2/"].includes(url.pathname)) {
    return row("MLSGRID_API_URL", "blocked", "Use the HTTPS v2 endpoint without credentials, query or fragment.");
  }
  if (target === "production" && /(?:^|[.-])demo(?:[.-]|$)/i.test(url.hostname)) {
    return row("MLSGRID_API_URL", "blocked", "The demo endpoint cannot supply the production launch.");
  }
  return row("MLSGRID_API_URL", "passed", "Endpoint shape is configured. Its license, scope and actual data remain unverified.");
}

function email(value) {
  const address = value.match(/^[^<>]*<([^<>]+)>$/)?.[1] ?? value;
  return /^[^@\s<>]+@[^@\s<>]+\.[^@\s<>]+$/.test(address) ? address : null;
}

function leadSender(value, target) {
  if (!value) {
    return row("LEAD_FROM_EMAIL", target === "production" ? "missing" : "preview-only",
      "Blank uses the Resend onboarding sender, which only delivers to the account owner.");
  }
  const address = email(value);
  if (!address) return row("LEAD_FROM_EMAIL", "blocked", "Use a valid sender mailbox, optionally with a display name.");
  if (address.toLowerCase() === "onboarding@resend.dev") {
    return row("LEAD_FROM_EMAIL", target === "production" ? "blocked" : "preview-only",
      "The onboarding sender only delivers to the Resend account owner.");
  }
  return row("LEAD_FROM_EMAIL", "passed", "Sender is configured. Verify its domain and client delivery.");
}

const MANUAL_CHECKS = [
  ["deployment-revision", "Verify the reviewed commit and environment on the actual deployment."],
  ["mls-license-and-scope", "Confirm the approved website, feed scope and production token with John and the MLS."],
  ["office-and-agent-mapping", "Match the office and agent identifiers to the approved production feed."],
  ["production-data-and-sync", "Verify the production import, display permissions and ongoing sync after preserving the existing data."],
  ["dns-and-https", "Verify the project-specific DNS, canonical redirect, certificate and existing email records."],
  ["lead-delivery", "Confirm John's recipient choice and receive a test from each form after sender verification."],
  ["turnstile", "Confirm actual widget keys and hostnames, then verify challenge and rejection behavior on the deployment."],
  ["client-content-and-sop", "Confirm contact facts, current SOP, image rights and the client-approved content."],
  ["claims-and-testimonials", "Keep sample reviews and unsupported figures hidden until their approved sources are recorded."],
  ["mobile-and-accessibility", "Check the deployed phone layouts, navigation, galleries, filters and keyboard operation."],
];

export function assessLaunch(environment = {}, { target = "production" } = {}) {
  if (!["production", "preview"].includes(target)) throw new TypeError("Unsupported launch-check target.");
  const checks = [
    ...PRESENCE_ONLY.map((name) => row(name, text(environment, name) ? "passed" : "missing",
      "Presence check only. Credential validity and service behavior require verification.")),
    origin(text(environment, "NEXT_PUBLIC_SITE_URL"), target),
    endpoint(text(environment, "MLSGRID_API_URL"), target),
  ];
  const mode = text(environment, "NEXT_PUBLIC_SITE_MODE");
  checks.push(row("NEXT_PUBLIC_SITE_MODE",
    target === "production" ? (mode === "live" ? "passed" : mode ? "blocked" : "missing")
      : (!mode || mode === "preview" ? "passed" : "blocked"),
    target === "production" ? "Production must explicitly select live mode." : "Preview must use the safe preview mode."));
  const context = text(environment, "VERCEL_ENV");
  checks.push(row("VERCEL_ENV",
    target === "production" ? (context === "production" ? "passed" : context ? "blocked" : "unknown") : "passed",
    target === "production" ? "Verify this configuration in the actual Vercel production context."
      : "The selected check targets a preview. It cannot certify production."));
  const office = text(environment, "OFFICE_MLS_ID");
  checks.push(row("OFFICE_MLS_ID", !office ? "missing" : office.toUpperCase() === "KEYJOSV01" ? "blocked" : "passed",
    "Use the office identifier confirmed from the approved feed. The previous guess is rejected."));
  const recipient = text(environment, "LEAD_TO_EMAIL");
  checks.push(row("LEAD_TO_EMAIL", !recipient ? "missing" : email(recipient) ? "passed" : "blocked",
    "Configure the confirmed lead mailbox. Actual delivery remains unverified."));
  checks.push(leadSender(text(environment, "LEAD_FROM_EMAIL"), target));
  const configReady = checks.every((check) => ["passed", "preview-only"].includes(check.status));
  return {
    schemaVersion: 1,
    target,
    configuration: {
      status: configReady ? "config-ready" : "configuration-needed",
      checks,
    },
    manualVerification: {
      status: "manual-verification-needed",
      checks: MANUAL_CHECKS.map(([name, action]) => ({ name, status: "unknown", action })),
    },
    launchStatus: configReady ? "manual-verification-needed" : "configuration-needed",
    networkRequests: 0,
  };
}

export function launchCheckCli(args, environment = process.env) {
  let target = "production";
  if (args.length) {
    if (args.length !== 2 || args[0] !== "--target" || !["production", "preview"].includes(args[1])) {
      return { exitCode: 2, report: { error: "Usage: node scripts/launch-check.mjs [--target production|preview]" } };
    }
    target = args[1];
  }
  const report = assessLaunch(environment, { target });
  return { exitCode: report.configuration.status === "config-ready" ? 0 : 2, report };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = launchCheckCli(process.argv.slice(2));
  console.log(JSON.stringify(result.report, null, 2));
  process.exitCode = result.exitCode;
}
