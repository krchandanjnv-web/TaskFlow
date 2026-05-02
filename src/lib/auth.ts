import { findUserByEmail } from "@/lib/sheets";
import bcrypt from "bcryptjs";

export async function verifyUser(email: string, password: string) {
  const user = await findUserByEmail(email);
  if (!user) return null;
  const passwordHash = user.password_hash || user.password;
  const valid = await bcrypt.compare(password, passwordHash);
  if (!valid) return null;
  return { id: user.id, email: user.email, name: user.name };
}
