import { Router, Request, Response } from "express";
import pool from "../config/db.js";
import { authenticate, requireRole } from "../middleware/auth.js";

const router = Router();

// Get all rates
router.get("/", authenticate, requireRole("owner", "admin"), async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      "SELECT * FROM rate_settings ORDER BY is_default DESC, name",
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Get rates error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Create rate
router.post("/", authenticate, requireRole("owner", "admin"), async (req: Request, res: Response) => {
  try {
    const { name, ratePerHour, isDefault } = req.body;

    // Find owner id
    const ownerResult = await pool.query("SELECT id FROM users WHERE role = 'owner' LIMIT 1");
    const ownerId = ownerResult.rows[0]?.id || req.user!.userId;

    // If setting as default, unset existing default
    if (isDefault) {
      await pool.query("UPDATE rate_settings SET is_default = FALSE WHERE owner_id = $1", [ownerId]);
    }

    const result = await pool.query(
      "INSERT INTO rate_settings (owner_id, name, rate_per_hour, is_default) VALUES ($1, $2, $3, $4) RETURNING *",
      [ownerId, name, ratePerHour, isDefault || false]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Create rate error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update rate
router.patch("/:id", authenticate, requireRole("owner", "admin"), async (req: Request, res: Response) => {
  try {
    const { name, ratePerHour, isDefault } = req.body;

    if (isDefault) {
      await pool.query("UPDATE rate_settings SET is_default = FALSE");
    }

    const result = await pool.query(
      `UPDATE rate_settings SET
        name = COALESCE($1, name),
        rate_per_hour = COALESCE($2, rate_per_hour),
        is_default = COALESCE($3, is_default)
       WHERE id = $4 RETURNING *`,
      [name, ratePerHour, isDefault, req.params.id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Update rate error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Delete rate
router.delete("/:id", authenticate, requireRole("owner", "admin"), async (req: Request, res: Response) => {
  try {
    await pool.query("DELETE FROM rate_settings WHERE id = $1", [req.params.id]);
    res.json({ message: "Deleted" });
  } catch (err) {
    console.error("Delete rate error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
