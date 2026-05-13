import { Router, Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import pool from "../config/db.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

function generateAccessToken(user: { id: number; email: string; role: string }) {
  return jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET!,
    { expiresIn: "15m" }
  );
}

async function generateRefreshToken(userId: number): Promise<string> {
  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  await pool.query(
    "INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)",
    [userId, token, expiresAt]
  );
  return token;
}

// Register (client only)
router.post("/register", async (req: Request, res: Response) => {
  try {
    const { email, password, fullName, phone } = req.body;
    if (!email || !password || !fullName) {
      res.status(400).json({ error: "Email, password, and full name are required" });
      return;
    }

    const existing = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
    if (existing.rows.length > 0) {
      res.status(409).json({ error: "Email already registered" });
      return;
    }

    const hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      "INSERT INTO users (email, password_hash, full_name, phone, role) VALUES ($1, $2, $3, $4, 'client') RETURNING id, email, full_name, role",
      [email, hash, fullName, phone || null]
    );

    const user = result.rows[0];
    const accessToken = generateAccessToken({ id: user.id, email: user.email, role: user.role });
    const refreshToken = await generateRefreshToken(user.id);

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({
      accessToken,
      user: { id: user.id, email: user.email, fullName: user.full_name, role: user.role },
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Login
router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required" });
      return;
    }

    const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (result.rows.length === 0) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const accessToken = generateAccessToken({ id: user.id, email: user.email, role: user.role });
    const refreshToken = await generateRefreshToken(user.id);

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      accessToken,
      user: { id: user.id, email: user.email, fullName: user.full_name, role: user.role },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Refresh
router.post("/refresh", async (req: Request, res: Response) => {
  try {
    const token = req.cookies.refreshToken;
    if (!token) {
      res.status(401).json({ error: "No refresh token" });
      return;
    }

    const result = await pool.query(
      "SELECT rt.*, u.email, u.role, u.full_name FROM refresh_tokens rt JOIN users u ON u.id = rt.user_id WHERE rt.token = $1 AND rt.expires_at > NOW()",
      [token]
    );

    if (result.rows.length === 0) {
      res.status(401).json({ error: "Invalid refresh token" });
      return;
    }

    const row = result.rows[0];

    // Rotate refresh token
    await pool.query("DELETE FROM refresh_tokens WHERE token = $1", [token]);
    const newRefreshToken = await generateRefreshToken(row.user_id);
    const accessToken = generateAccessToken({ id: row.user_id, email: row.email, role: row.role });

    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      accessToken,
      user: { id: row.user_id, email: row.email, fullName: row.full_name, role: row.role },
    });
  } catch (err) {
    console.error("Refresh error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Logout
router.post("/logout", async (req: Request, res: Response) => {
  const token = req.cookies.refreshToken;
  if (token) {
    await pool.query("DELETE FROM refresh_tokens WHERE token = $1", [token]);
  }
  res.clearCookie("refreshToken");
  res.json({ message: "Logged out" });
});

// Get current user
router.get("/me", authenticate, async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      "SELECT id, email, full_name, phone, role, created_at FROM users WHERE id = $1",
      [req.user!.userId]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    const u = result.rows[0];
    res.json({ id: u.id, email: u.email, fullName: u.full_name, phone: u.phone, role: u.role });
  } catch (err) {
    console.error("Me error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
