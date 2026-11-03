import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { deleteAlert } from "@borsaty/db";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Alert ID is required" }, { status: 400 });
    }

    const success = await deleteAlert(id, userId);
    return NextResponse.json({ success, message: "Alert deleted" });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to delete alert";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
