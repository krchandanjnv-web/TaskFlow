import { google } from "googleapis";

const SHEET_ID = process.env.GOOGLE_SHEET_ID;

function getSheets() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  return google.sheets({ version: "v4", auth });
}

function parseSheet(values: any[][]): Record<string, string>[] {
  if (!values || values.length < 2) return [];
  const [headers, ...rows] = values;
  return rows
    .filter(r => r.some((c: any) => c))
    .map(r => Object.fromEntries(headers.map((h: string, i: number) => [h, r[i] ?? ""])));
}

export async function findUserByEmail(email: string) {
  const sheets = getSheets();
  const { data } = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: "users!A:E",
  });
  const users = parseSheet(data.values as any[][]);
  return users.find(u => u.email?.toLowerCase() === email.toLowerCase()) ?? null;
}

export async function createUser({ id, name, email, passwordHash }: {
  id: string; name: string; email: string; passwordHash: string;
}) {
  const sheets = getSheets();
  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: "users!A:E",
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [[id, email.toLowerCase(), name.trim(), passwordHash, new Date().toISOString()]],
    },
  });
}
