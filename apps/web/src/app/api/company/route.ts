import { NextResponse } from "next/server";
import { findCompany, getAllCompanies } from "@borsaty/db";
import { resolveStockAlias } from "@borsaty/shared";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol");
  const market = searchParams.get("market");

  if (!symbol) {
    const list = await getAllCompanies(market || undefined);
    return NextResponse.json({
      success: true,
      count: list.length,
      companies: list,
      dataQuality: {
        provider: "Borsaty Unified Directory",
        isRealtime: true,
        verifiedAt: new Date().toISOString(),
      },
    });
  }

  // Check alias resolver
  const aliasMatch = resolveStockAlias(symbol);
  const lookupSymbol = aliasMatch ? aliasMatch.symbol : symbol;

  const company = await findCompany(lookupSymbol);
  if (!company) {
    return NextResponse.json(
      { success: false, error: "Company not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    company,
    aliasResolved: aliasMatch ? aliasMatch.nameAr : null,
    dataQuality: {
      provider: company.market === "TASI" ? "SAHMK" : "Younit/EGX_NEWS",
      isDelayed: company.market === "EGX",
      delayMinutes: company.market === "EGX" ? 15 : 0,
      verifiedAt: new Date().toISOString(),
    },
  });
}
