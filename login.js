import bcrypt from "bcryptjs";
import { getSheetsClient, SHEET_ID, parseSheet } from "./_sheets.js";
import { signToken } from "./_jwt.js";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { email, password } = req.body || {};
  if (!email || !password)
    return res.status(400).json({ error: "Email and password are required." });

  try {
    const sheets = getSheetsClient();
    const { data } = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: "users!A:E",
    });

    const users = parseSheet(data.values);
    const user = users.find(u => u.email?.toLowerCase() === email.toLowerCase());

    if (!user)
      return res.status(401).json({ error: "No account found with that email." });

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match)
      return res.status(401).json({ error: "Incorrect password." });

    const token = signToken({
      userId: user.id,
      email: user.email,
      name: user.name,
    });

    return res.status(200).json({
      token,
      user: { userId: user.id, email: user.email, name: user.name },
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ error: "Something went wrong. Please try again." });
  }
}
