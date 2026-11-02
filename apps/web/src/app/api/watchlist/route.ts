import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getWatchlist, addToWatchlist, findCompany } from "@borsaty/db";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const items = await getWatchlist(userId);
    return NextResponse.json({
      success: true,
      items,
      count: items.length,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch watchlist";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
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

    if (!rawSymbol) {
      return NextResponse.json({ error: "Symbol is required" }, { status: 400 });
    }

    const company = await findCompany(rawSymbol);
    const nameEn = body.nameEn || company?.nameEn || rawSymbol;
    const nameAr = body.nameAr || company?.nameAr || rawSymbol;

    const saved = await addToWatchlist({
      userId,
      symbol: rawSymbol,
      nameEn,
      nameAr,
    });

    return NextResponse.json({
      success: true,
      item: saved,
      message: `${rawSymbol} added to watchlist`,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to add to watchlist";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
