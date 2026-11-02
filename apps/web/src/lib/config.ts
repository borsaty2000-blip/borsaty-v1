/**
 * Application Configuration & Service URLs
 * Supports Vercel, Render, local Docker, and bare-metal environments.
 */

export function getPythonServiceUrl(): string {
  const url =
    process.env.PYTHON_SERVICE_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.ANALYSIS_ENGINE_URL ||
    "http://localhost:8000";

  return url.replace(/\/$/, "");
}
