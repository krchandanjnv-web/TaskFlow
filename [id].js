import { getSheetsClient, SHEET_ID, parseSheet } from "../_sheets.js";
import { authFromRequest } from "../_jwt.js";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "PATCH, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.status(200).end();

  const auth = authFromRequest(req);
  if (!auth) return res.status(401).json({ error: "Not authenticated." });

  const { id } = req.query;
  const sheets = getSheetsClient();

  // Find which row this task is on
  let rowIndex;
  try {
    const { data } = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: "tasks!A:B",
    });
    const rows = data.values ?? [];
    rowIndex = rows.findIndex((r, i) => i > 0 && r[0] === id && r[1] === auth.userId);
    if (rowIndex < 1) return res.status(404).json({ error: "Task not found." });
  } catch (err) {
    console.error("Find row error:", err);
    return res.status(500).json({ error: "Failed to find task." });
  }

  const sheetRow = rowIndex + 1; // 1-indexed, header is row 1

  // PATCH — toggle completed (col I = index 9, 1-based = column I)
  if (req.method === "PATCH") {
    try {
      const { completed, title, priority, category } = req.body;

      if (completed !== undefined) {
        await sheets.spreadsheets.values.update({
          spreadsheetId: SHEET_ID,
          range: `tasks!I${sheetRow}`,
          valueInputOption: "USER_ENTERED",
          requestBody: { values: [[String(completed).toUpperCase()]] },
        });
      }

      if (title !== undefined) {
        await sheets.spreadsheets.values.update({
          spreadsheetId: SHEET_ID,
          range: `tasks!C${sheetRow}:E${sheetRow}`,
          valueInputOption: "USER_ENTERED",
          requestBody: { values: [[title, priority ?? "", category ?? ""]] },
        });
      }

      return res.status(200).json({ ok: true });
    } catch (err) {
      console.error("PATCH task error:", err);
      return res.status(500).json({ error: "Failed to update task." });
    }
  }

  // DELETE — clear the row
  if (req.method === "DELETE") {
    try {
      await sheets.spreadsheets.values.clear({
        spreadsheetId: SHEET_ID,
        range: `tasks!A${sheetRow}:J${sheetRow}`,
      });
      return res.status(200).json({ ok: true });
    } catch (err) {
      console.error("DELETE task error:", err);
      return res.status(500).json({ error: "Failed to delete task." });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
