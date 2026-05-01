import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { auth } from "@/lib/auth";
import { getTasksForUser, createTask } from "@/lib/sheets";

const taskSchema = z.object({
  title:      z.string().min(1).max(200),
  priority:   z.enum(["high", "medium", "low"]),
  type:       z.enum(["one-time", "recurring"]),
  recurrence: z.enum(["daily", "weekly", "monthly"]).nullable().optional(),
  dueDate:    z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  category:   z.enum(["Work", "Health", "Personal", "Finance"]),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const tasks = await getTasksForUser(session.user.id);
    return NextResponse.json({ tasks }, {
      headers: { "Cache-Control": "private, s-maxage=30, stale-while-revalidate=60" },
    });
  } catch (err) {
    console.error("GET /api/tasks:", err);
    return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body   = await req.json();
    const parsed = taskSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid task data", details: parsed.error.flatten() }, { status: 400 });

    const task = await createTask(session.user.id, {
      id:         uuidv4(),
      completed:  false,
      recurrence: parsed.data.recurrence ?? null,
      ...parsed.data,
    });

    return NextResponse.json({ task }, { status: 201 });
  } catch (err) {
    console.error("POST /api/tasks:", err);
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
  }
}
