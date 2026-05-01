import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { updateTask, deleteTask } from "@/lib/sheets";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const updates = await req.json();
    const task    = await updateTask(session.user.id, params.id, updates);
    if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });
    return NextResponse.json({ task });
  } catch (err) {
    console.error("PATCH /api/tasks/[id]:", err);
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const ok = await deleteTask(session.user.id, params.id);
    if (!ok) return NextResponse.json({ error: "Task not found" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/tasks/[id]:", err);
    return NextResponse.json({ error: "Failed to delete task" }, { status: 500 });
  }
}
