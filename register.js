import bcrypt from "bcryptjs";
import { getSheetsClient, SHEET_ID, parseSheet } from "./_sheets.js";
import { signToken } from "./_jwt.js";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { name, email, password } = req.body || {};

  if (!name || !email || !password)
    return res.status(400).json({ error: "Name, email and password are required." });

  if (password.length < 8)
    return res.status(400).json({ error: "Password must be at least 8 characters." });

  const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRx.test(email))
    return res.status(400).json({ error: "Please enter a valid email address." });

  try {
    const sheets = getSheetsClient();

    // Check if email already exists
    const existing = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: "users!A:E",
    });

    const users = parseSheet(existing.data.values);
    if (users.find(u => u.email?.toLowerCase() === email.toLowerCase()))
      return res.status(409).json({ error: "An account with this email already exists." });

    // Hash password and create user row
    const passwordHash = await bcrypt.hash(password, 10);
    const userId = crypto.randomUUID();
    const createdAt = new Date().toISOString();

    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: "users!A:E",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[userId, email.toLowerCase(), name.trim(), passwordHash, createdAt]],
      },
    });

    const token = signToken({ userId, email: email.toLowerCase(), name: name.trim() });

    return res.status(201).json({
      token,
      user: { userId, email: email.toLowerCase(), name: name.trim() },
    });
  } catch (err) {
    console.error("Register error:", err);
    return res.status(500).json({ error: "Something went wrong. Please try again." });
  }
}
