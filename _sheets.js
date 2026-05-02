import { google } from "googleapis";

export function getSheetsClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  return google.sheets({ version: "v4", auth });
}

export const SHEET_ID = process.env.GOOGLE_SHEET_ID;

// Parse a sheet response into array of objects using first row as headers
export function parseSheet(values) {
  if (!values || values.length < 2) return [];
  const [headers, ...rows] = values;
  return rows
    .filter(r => r.some(c => c)) // skip blank rows
    .map(r => Object.fromEntries(headers.map((h, i) => [h, r[i] ?? ""])));
}
