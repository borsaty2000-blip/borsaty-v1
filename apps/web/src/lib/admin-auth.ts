import { NextResponse } from "next/server";

export function validateAdminAuth(request: Request): { authorized: boolean; response?: NextResponse } {
  // 1. In production, hide and disable admin test endpoints unless explicitly enabled
  if (process.env.NODE_ENV === "production" && !process.env.ALLOW_ADMIN_TESTS) {
    return {
      authorized: false,
      response: new NextResponse(
        JSON.stringify({ error: "Not Found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      ),
    };
  }

  // 2. Token authentication
  const adminToken = process.env.ADMIN_TOKEN;
  const expectedToken = adminToken || (process.env.NODE_ENV !== "production" ? "borsaty_admin_dev_secret" : null);

  if (!expectedToken) {
    return {
      authorized: false,
      response: new NextResponse(
        JSON.stringify({ error: "Unauthorized: ADMIN_TOKEN is not configured on server" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      ),
    };
  }

  const headerToken = request.headers.get("x-admin-token");
  const authHeader = request.headers.get("authorization");
  const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  const provided = headerToken || bearerToken;

  if (!provided || provided !== expectedToken) {
    return {
      authorized: false,
      response: new NextResponse(
        JSON.stringify({ error: "Unauthorized: Invalid or missing admin credentials" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      ),
    };
  }

  return { authorized: true };
}
