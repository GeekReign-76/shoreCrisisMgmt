import { Router, Request, Response } from "express";
import pool from "../config/db.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

// Subscribe to push notifications
router.post("/push/subscribe", authenticate, async (req: Request, res: Response) => {
  try {
    const { endpoint, keys } = req.body;
    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      res.status(400).json({ error: "Invalid push subscription" });
      return;
    }

    await pool.query(
      `INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, endpoint) DO UPDATE SET p256dh = $3, auth = $4`,
      [req.user!.userId, endpoint, keys.p256dh, keys.auth]
    );

    res.status(201).json({ message: "Subscribed" });
  } catch (err) {
    console.error("Push subscribe error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Unsubscribe
router.delete("/push/unsubscribe", authenticate, async (req: Request, res: Response) => {
  try {
    const { endpoint } = req.body;
    await pool.query(
      "DELETE FROM push_subscriptions WHERE user_id = $1 AND endpoint = $2",
      [req.user!.userId, endpoint]
    );
    res.json({ message: "Unsubscribed" });
  } catch (err) {
    console.error("Push unsubscribe error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
