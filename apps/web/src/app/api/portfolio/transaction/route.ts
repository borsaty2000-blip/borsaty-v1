import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { addTransaction, findCompany, SEED_COMPANIES } from '@borsaty/db';

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const symbol = typeof body.symbol === 'string' ? body.symbol.trim().toUpperCase() : '';
    const type = body.type === 'SELL' ? 'SELL' : 'BUY';
    const quantity = Number(body.quantity);
    const price = Number(body.price);
    const date = body.date ? new Date(body.date) : new Date();

    if (!symbol) {
      return NextResponse.json({ error: 'Symbol is required' }, { status: 400 });
    }

    if (isNaN(quantity) || quantity <= 0) {
      return NextResponse.json({ error: 'Quantity must be greater than zero' }, { status: 400 });
    }

    if (isNaN(price) || price <= 0) {
      return NextResponse.json({ error: 'Price must be greater than zero' }, { status: 400 });
    }

    const record = await addTransaction({
      userId,
      symbol,
      type,
      quantity,
      price,
      date,
    });

    return NextResponse.json({
      success: true,
      transaction: record,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to record transaction';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
