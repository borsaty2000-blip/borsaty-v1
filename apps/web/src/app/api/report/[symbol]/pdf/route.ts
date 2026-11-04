import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    { error: "PDF generation has moved to /stock/{symbol}/report." },
    { status: 410 }
  );
}
