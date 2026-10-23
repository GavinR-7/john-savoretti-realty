"use client";

import Script from "next/script";
import { useEffect, useId, useRef } from "react";
import { spam } from "@/content/spam";

type Turnstile = {
  render: (element: HTMLElement, options: { sitekey: string; action: string; callback: (token: string) => void; "expired-callback": () => void; "error-callback": () => void }) => string;
  reset: (id: string) => void;
  remove: (id: string) => void;
};
declare global { interface Window { turnstile?: Turnstile } }

export function readProtection(form: HTMLFormElement) {
  const fields = new FormData(form);
  return {
    companyUrl: String(fields.get("companyUrl") ?? ""),
    renderedAt: String(fields.get("renderedAt") ?? ""),
    turnstileToken: String(fields.get("turnstileToken") ?? ""),
  };
}

export function resetProtection(form: HTMLFormElement) {
  form.dispatchEvent(new Event("spam-reset"));
}

export function FormProtection() {
  const id = useId();
  const container = useRef<HTMLDivElement>(null);
  const stamp = useRef<HTMLInputElement>(null);
  const token = useRef<HTMLInputElement>(null);
  const widget = useRef<string | null>(null);
  const sitekey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  function renderWidget() {
    if (!container.current || !window.turnstile || !sitekey || widget.current !== null) return;
    const clear = () => { if (token.current) token.current.value = ""; };
    widget.current = window.turnstile.render(container.current, {
      sitekey, action: "contact",
      callback: (value) => { if (token.current) token.current.value = value; },
      "expired-callback": clear, "error-callback": clear,
    });
  }

  useEffect(() => {
    if (stamp.current) stamp.current.value = String(Date.now());
    const form = container.current?.closest("form");
    const reset = () => {
      if (token.current) token.current.value = "";
      if (widget.current !== null) window.turnstile?.reset(widget.current);
    };
    form?.addEventListener("spam-reset", reset);
    return () => {
      form?.removeEventListener("spam-reset", reset);
      if (widget.current !== null) window.turnstile?.remove(widget.current);
      widget.current = null;
    };
  }, []);

  return <>
    <div hidden aria-hidden="true">
      <label htmlFor={`${id}-company`}>{spam.honeypotLabel}</label>
      <input id={`${id}-company`} name="companyUrl" tabIndex={-1} autoComplete="off" />
    </div>
    <input type="hidden" name="renderedAt" ref={stamp} defaultValue="" />
    <input type="hidden" name="turnstileToken" ref={token} defaultValue="" />
    <div ref={container} />
    {sitekey ? <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" onReady={renderWidget} /> : null}
    <p className="text-xs">
      <a className="underline" href="/privacy">{spam.localPrivacyLabel}</a>{" · "}
      <a className="underline" href={spam.privacyUrl} target="_blank" rel="noreferrer">{spam.disclosure}</a>
    </p>
  </>;
}
