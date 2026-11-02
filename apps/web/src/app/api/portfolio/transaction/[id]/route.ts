import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { deleteTransaction } from '@borsaty/db';

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Transaction ID is required' }, { status: 400 });
    }

    await deleteTransaction(id, userId);

    return NextResponse.json({
      success: true,
      message: 'Transaction deleted successfully',
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to delete transaction';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
