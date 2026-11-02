import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { removeFromWatchlist, isInWatchlist } from "@borsaty/db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ symbol: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ inWatchlist: false });
    }

    const { symbol } = await params;
    if (!symbol) {
      return NextResponse.json({ error: "Symbol is required" }, { status: 400 });
    }

    const inWatchlist = await isInWatchlist(userId, symbol);
    return NextResponse.json({
      symbol: symbol.toUpperCase(),
      inWatchlist,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to check watchlist status";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ symbol: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { symbol } = await params;
    if (!symbol) {
      return NextResponse.json({ error: "Symbol is required" }, { status: 400 });
    }

    const sym = symbol.toUpperCase();
    await removeFromWatchlist(userId, sym);

    return NextResponse.json({
      success: true,
      symbol: sym,
      message: `${sym} removed from watchlist`,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to remove from watchlist";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
