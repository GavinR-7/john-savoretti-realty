export const spam = {
  honeypotLabel: "Company website",
  disclosure: "This form uses Cloudflare Turnstile. Its privacy terms apply.",
  localPrivacyLabel: "Form privacy notice",
  privacyUrl: "https://www.cloudflare.com/cloudflare-customer-privacy-addendum/",
  errors: {
    invalid: "Invalid form protection fields. Please reload and try again.",
    honeypot: "Unable to accept this submission.",
    tooFast: "Please wait a few seconds and try again.",
    unconfigured: "Form security is not configured. Please contact us directly.",
    verification: "Security verification failed. Please try again.",
    unavailable: "Security verification is unavailable. Please try again or contact us directly.",
    send: "Something went wrong sending your request. Please try again or call us.",
  },
} as const;
