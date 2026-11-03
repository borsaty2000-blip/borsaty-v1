import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getAlerts, createAlert, deleteAlert, checkAndTriggerAlerts } from "@borsaty/db";

export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const check = searchParams.get("check");

    if (check === "true") {
      await checkAndTriggerAlerts(userId);
    }

    const alerts = await getAlerts(userId);
    return NextResponse.json({
      success: true,
      alerts,
      count: alerts.length,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch alerts";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const rawSymbol = typeof body.symbol === "string" ? body.symbol.trim().toUpperCase() : "";
    const threshold = Number(body.threshold);

    if (!rawSymbol) {
      return NextResponse.json({ error: "Symbol is required" }, { status: 400 });
    }

    if (isNaN(threshold) || threshold <= 0) {
      return NextResponse.json({ error: "Valid threshold number is required" }, { status: 400 });
    }

    const type = body.type || "PRICE";
    const condition = body.condition || "ABOVE";
    const note = typeof body.note === "string" ? body.note.trim() : undefined;

    const alert = await createAlert({
      userId,
      symbol: rawSymbol,
      type,
      condition,
      threshold,
      note,
    });

    return NextResponse.json({
      success: true,
      alert,
      message: `Alert set for ${rawSymbol} at ${threshold}`,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create alert";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    let alertId = searchParams.get("id");

    if (!alertId) {
      const body = await request.json().catch(() => ({}));
      alertId = body.id;
    }

    if (!alertId) {
      return NextResponse.json({ error: "Alert ID is required" }, { status: 400 });
    }

    const success = await deleteAlert(alertId, userId);
    return NextResponse.json({ success, message: "Alert deleted successfully" });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to delete alert";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
