import bcrypt from "bcrypt";
import pool from "../config/db.js";

export async function seedOwner() {
  const email = process.env.OWNER_EMAIL;
  const password = process.env.OWNER_PASSWORD;
  const name = process.env.OWNER_NAME || "Tyrin Miller";

  if (!email || !password) {
    console.log("No OWNER_EMAIL/OWNER_PASSWORD set, skipping owner seed.");
    return;
  }

  const existing = await pool.query("SELECT id FROM users WHERE role = 'owner' LIMIT 1");
  if (existing.rows.length > 0) {
    // Still seed admin if needed
    await seedAdmin();
    return;
  }

  const hash = await bcrypt.hash(password, 10);
  await pool.query(
    "INSERT INTO users (email, password_hash, full_name, role) VALUES ($1, $2, $3, 'owner')",
    [email, hash, name]
  );
  console.log(`Owner account seeded: ${email}`);

  await seedAdmin();
}

async function seedAdmin() {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  const adminName = process.env.ADMIN_NAME || "Admin";

  if (!adminEmail || !adminPassword) return;

  const existing = await pool.query("SELECT id FROM users WHERE email = $1", [adminEmail]);
  if (existing.rows.length > 0) return;

  const hash = await bcrypt.hash(adminPassword, 10);
  await pool.query(
    "INSERT INTO users (email, password_hash, full_name, role) VALUES ($1, $2, $3, 'admin')",
    [adminEmail, hash, adminName]
  );
  console.log(`Admin account seeded: ${adminEmail}`);
}
