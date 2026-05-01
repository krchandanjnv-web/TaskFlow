import { google, sheets_v4 } from "googleapis";
import type { Task, User } from "@/types";

// ─── Auth singleton ────────────────────────────────────────────────────────
function getAuth() {
  const b64 = process.env.GOOGLE_SERVICE_ACCOUNT_B64;
  if (!b64) throw new Error("GOOGLE_SERVICE_ACCOUNT_B64 is not set");

  const key = JSON.parse(Buffer.from(b64, "base64").toString("utf-8"));

  return new google.auth.GoogleAuth({
    credentials: key,
    scopes: [
      "https://www.googleapis.com/auth/spreadsheets",
    ],
  });
}

let _sheets: sheets_v4.Sheets | null = null;
function getSheets() {
  if (!_sheets) _sheets = google.sheets({ version: "v4", auth: getAuth() });
  return _sheets;
}

export const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID!;

// ─── Low-level helpers ─────────────────────────────────────────────────────
export async function readRange(range: string): Promise<string[][]> {
  const sheets = getSheets();
  const res = await sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range });
  return (res.data.values ?? []) as string[][];
}

export async function appendRow(range: string, values: (string | boolean | number | null)[]) {
  const sheets = getSheets();
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [values] },
  });
}

export async function updateRow(range: string, values: (string | boolean | number | null)[]) {
  const sheets = getSheets();
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [values] },
  });
}

export async function deleteSheetRow(sheetId: number, rowIndex: number) {
  const sheets = getSheets();
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: {
      requests: [{
        deleteDimension: {
          range: { sheetId, dimension: "ROWS", startIndex: rowIndex, endIndex: rowIndex + 1 },
        },
      }],
    },
  });
}

/** Ensure a sheet tab exists; creates it if not. Returns numeric sheetId. */
export async function ensureSheet(title: string): Promise<number> {
  const sheets = getSheets();
  const meta = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
  const existing = meta.data.sheets?.find(s => s.properties?.title === title);
  if (existing) return existing.properties!.sheetId!;

  const res = await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: { requests: [{ addSheet: { properties: { title } } }] },
  });
  const added = res.data.replies?.[0]?.addSheet?.properties;
  return added!.sheetId!;
}

// ─── Users sheet ───────────────────────────────────────────────────────────
// Columns: id | email | name | passwordHash | createdAt
const USERS_RANGE = "Users!A:E";
const USERS_HEADER = ["id", "email", "name", "passwordHash", "createdAt"];

function rowToUser(row: string[]): User {
  return { id: row[0], email: row[1], name: row[2], passwordHash: row[3], createdAt: row[4] };
}

export async function getAllUsers(): Promise<User[]> {
  const rows = await readRange(USERS_RANGE);
  if (rows.length <= 1) return [];
  return rows.slice(1).filter(r => r[0]).map(rowToUser);
}

export async function findUserByEmail(email: string): Promise<User | null> {
  const users = await getAllUsers();
  return users.find(u => u.email.toLowerCase() === email.toLowerCase()) ?? null;
}

export async function findUserById(id: string): Promise<User | null> {
  const users = await getAllUsers();
  return users.find(u => u.id === id) ?? null;
}

export async function createUser(user: Omit<User, "createdAt">): Promise<User> {
  // Ensure Users sheet + header exist
  const rows = await readRange(USERS_RANGE);
  if (rows.length === 0) await appendRow(USERS_RANGE, USERS_HEADER);

  const now = new Date().toISOString();
  const newUser: User = { ...user, createdAt: now };
  await appendRow(USERS_RANGE, [newUser.id, newUser.email, newUser.name, newUser.passwordHash, now]);
  return newUser;
}

// ─── Tasks sheet (per-user tab) ────────────────────────────────────────────
// Columns: id | title | priority | type | recurrence | dueDate | completed | category | createdAt | updatedAt
const TASK_HEADER = ["id","title","priority","type","recurrence","dueDate","completed","category","createdAt","updatedAt"];

function taskRange(userId: string) { return `tasks_${userId}!A:J`; }

function rowToTask(row: string[]): Task {
  return {
    id:         row[0],
    title:      row[1],
    priority:   row[2] as Task["priority"],
    type:       row[3] as Task["type"],
    recurrence: (row[4] || null) as Task["recurrence"],
    dueDate:    row[5],
    completed:  row[6] === "TRUE" || row[6] === "true",
    category:   row[7] as Task["category"],
    createdAt:  row[8],
    updatedAt:  row[9],
  };
}

export async function getTasksForUser(userId: string): Promise<Task[]> {
  const range = taskRange(userId);
  try {
    const rows = await readRange(range);
    if (rows.length <= 1) return [];
    return rows.slice(1).filter(r => r[0]).map(rowToTask);
  } catch {
    // Sheet doesn't exist yet → return empty
    return [];
  }
}

export async function createTask(userId: string, task: Omit<Task, "createdAt" | "updatedAt">): Promise<Task> {
  const range = taskRange(userId);
  // Ensure sheet + header
  const rows = await readRange(range).catch(() => []);
  if (rows.length === 0) {
    await ensureSheet(`tasks_${userId}`);
    await appendRow(range, TASK_HEADER);
  }
  const now = new Date().toISOString();
  const newTask: Task = { ...task, createdAt: now, updatedAt: now };
  await appendRow(range, [
    newTask.id, newTask.title, newTask.priority, newTask.type,
    newTask.recurrence ?? "", newTask.dueDate, String(newTask.completed),
    newTask.category, now, now,
  ]);
  return newTask;
}

export async function updateTask(userId: string, taskId: string, updates: Partial<Task>): Promise<Task | null> {
  const tasks = await getTasksForUser(userId);
  const idx   = tasks.findIndex(t => t.id === taskId);
  if (idx === -1) return null;

  const merged: Task = { ...tasks[idx], ...updates, updatedAt: new Date().toISOString() };
  // Row index in sheet = idx + 2 (1-based + header row)
  const rowNum = idx + 2;
  const range  = `tasks_${userId}!A${rowNum}:J${rowNum}`;
  await updateRow(range, [
    merged.id, merged.title, merged.priority, merged.type,
    merged.recurrence ?? "", merged.dueDate, String(merged.completed),
    merged.category, merged.createdAt, merged.updatedAt,
  ]);
  return merged;
}

export async function deleteTask(userId: string, taskId: string): Promise<boolean> {
  const tasks = await getTasksForUser(userId);
  const idx   = tasks.findIndex(t => t.id === taskId);
  if (idx === -1) return false;

  const sheetTitle = `tasks_${userId}`;
  const sheets = getSheets();
  const meta = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
  const sheet = meta.data.sheets?.find(s => s.properties?.title === sheetTitle);
  if (!sheet) return false;

  await deleteSheetRow(sheet.properties!.sheetId!, idx + 1); // +1 for header
  return true;
}
