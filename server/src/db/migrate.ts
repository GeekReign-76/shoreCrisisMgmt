import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pool from "../config/db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function runMigrations() {
  // In production (Docker), SQL files are copied alongside the compiled JS
  // In dev, they're in the source directory
  let migrationsDir = path.join(__dirname, "migrations");
  if (!fs.existsSync(migrationsDir)) {
    // Fallback: look relative to project root for compiled output
    migrationsDir = path.join(__dirname, "..", "..", "src", "db", "migrations");
  }

  const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith(".sql")).sort();

  for (const file of files) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), "utf-8");
    console.log(`Running migration: ${file}`);
    await pool.query(sql);
    console.log(`Completed: ${file}`);
  }

  console.log("All migrations complete.");
}

// When run directly as a script
const isMain = process.argv[1]?.includes("migrate");
if (isMain) {
  runMigrations()
    .then(() => pool.end())
    .catch((err) => {
      console.error("Migration failed:", err);
      process.exit(1);
    });
}
