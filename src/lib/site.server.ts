/** Single source of truth for the public site address (server side). */
const FALLBACK = "https://rmxyz.lovable.app";

function clean(value?: string | null) {
  const raw = value?.trim();
  if (!raw) return "";
  const withScheme = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  return withScheme.replace(/\/+$/, "");
}

/** Absolute origin of the dashboard, e.g. https://rmxyz.lovable.app */
export function siteUrl() {
  return (
    clean(process.env["PUBLIC_SITE_URL"]) ||
    clean(process.env["DASHBOARD_URL"]) ||
    clean(process.env["VERCEL_PROJECT_PRODUCTION_URL"]) ||
    clean(process.env["VERCEL_URL"]) ||
    FALLBACK
  );
}

/** Hostname only — used as the WebAuthn relying-party id. */
export function siteHost() {
  try {
    return new URL(siteUrl()).hostname;
  } catch {
    return new URL(FALLBACK).hostname;
  }
}

/** Origin of the incoming request, falling back to the configured site URL. */
export function requestOrigin(request: Request) {
  try {
    return new URL(request.url).origin;
  } catch {
    return siteUrl();
  }
}
