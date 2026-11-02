/**
 * Application Configuration & Service URLs (Server-Side Only)
 * Anti-Reverse Engineering: Never expose internal Python microservice URLs to client browser.
 * All client-side requests strictly proxy through Next.js Route Handlers (/api/...).
 */

export function getPythonServiceUrl(): string {
  if (typeof window !== "undefined") {
    // In browser context, internal backend URL is intentionally hidden
    return "";
  }

  const url =
    process.env.PYTHON_SERVICE_URL ||
    process.env.ANALYSIS_ENGINE_URL ||
    "http://localhost:8000";

  return url.replace(/\/$/, "");
}
