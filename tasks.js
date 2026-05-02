import { getSheetsClient, SHEET_ID, parseSheet } from "./_sheets.js";
import { authFromRequest } from "./_jwt.js";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.status(200).end();

  const auth = authFromRequest(req);
  if (!auth) return res.status(401).json({ error: "Not authenticated." });

  const sheets = getSheetsClient();

  // GET — return this user's tasks
  if (req.method === "GET") {
    try {
      const { data } = await sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range: "tasks!A:J",
      });
      const all = parseSheet(data.values);
      const mine = all.filter(t => t.user_id === auth.userId);
      return res.status(200).json(mine);
    } catch (err) {
      console.error("GET tasks error:", err);
      return res.status(500).json({ error: "Failed to fetch tasks." });
    }
  }

  // POST — create new task
  if (req.method === "POST") {
    try {
      const t = req.body;
      const id = crypto.randomUUID();
      const row = [
        id,
        auth.userId,
        t.title ?? "",
        t.priority ?? "medium",
        t.category ?? "Work",
        t.type ?? "one-time",
        t.recurrence ?? "",
        t.due_date ?? "",
        "FALSE",
        new Date().toISOString(),
      ];
      await sheets.spreadsheets.values.append({
        spreadsheetId: SHEET_ID,
        range: "tasks!A:J",
        valueInputOption: "USER_ENTERED",
        requestBody: { values: [row] },
      });
      return res.status(201).json({ ok: true, id });
    } catch (err) {
      console.error("POST task error:", err);
      return res.status(500).json({ error: "Failed to create task." });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
