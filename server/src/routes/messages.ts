import { Router, Request, Response } from "express";
import pool from "../config/db.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

// Get conversations list (owner sees all clients, client sees just owner)
router.get("/conversations", authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;

    if (req.user!.role === "owner") {
      // Owner: get all unique conversations with unread counts
      const result = await pool.query(
        `SELECT
           u.id as user_id, u.full_name, u.email,
           (SELECT content FROM messages
            WHERE (sender_id = u.id AND receiver_id = $1) OR (sender_id = $1 AND receiver_id = u.id)
            ORDER BY created_at DESC LIMIT 1) as last_message,
           (SELECT created_at FROM messages
            WHERE (sender_id = u.id AND receiver_id = $1) OR (sender_id = $1 AND receiver_id = u.id)
            ORDER BY created_at DESC LIMIT 1) as last_message_at,
           COUNT(CASE WHEN m.sender_id = u.id AND m.receiver_id = $1 AND m.is_read = FALSE THEN 1 END) as unread_count
         FROM users u
         LEFT JOIN messages m ON (m.sender_id = u.id AND m.receiver_id = $1) OR (m.sender_id = $1 AND m.receiver_id = u.id)
         WHERE u.role = 'client' AND m.id IS NOT NULL
         GROUP BY u.id, u.full_name, u.email
         ORDER BY last_message_at DESC NULLS LAST`,
        [userId]
      );
      res.json(result.rows);
    } else {
      // Client: get conversation with owner
      const result = await pool.query(
        `SELECT
           u.id as user_id, u.full_name, u.email,
           (SELECT content FROM messages
            WHERE (sender_id = u.id AND receiver_id = $1) OR (sender_id = $1 AND receiver_id = u.id)
            ORDER BY created_at DESC LIMIT 1) as last_message,
           (SELECT created_at FROM messages
            WHERE (sender_id = u.id AND receiver_id = $1) OR (sender_id = $1 AND receiver_id = u.id)
            ORDER BY created_at DESC LIMIT 1) as last_message_at,
           COUNT(CASE WHEN m.sender_id = u.id AND m.receiver_id = $1 AND m.is_read = FALSE THEN 1 END) as unread_count
         FROM users u
         LEFT JOIN messages m ON (m.sender_id = u.id AND m.receiver_id = $1) OR (m.sender_id = $1 AND m.receiver_id = u.id)
         WHERE u.role = 'owner' AND m.id IS NOT NULL
         GROUP BY u.id, u.full_name, u.email`,
        [userId]
      );
      res.json(result.rows);
    }
  } catch (err) {
    console.error("Conversations error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get message history with a user
router.get("/conversations/:userId", authenticate, async (req: Request, res: Response) => {
  try {
    const myId = req.user!.userId;
    const otherId = parseInt(req.params.userId as string);
    const beforeParam = Array.isArray(req.query.before) ? req.query.before[0] : req.query.before;
    const limitParam = Array.isArray(req.query.limit) ? req.query.limit[0] : req.query.limit;
    const before = beforeParam ? parseInt(beforeParam as string) : null;
    const limit = Math.min(parseInt(limitParam as string) || 50, 100);

    let query = `
      SELECT m.*, u.full_name as sender_name
      FROM messages m
      JOIN users u ON u.id = m.sender_id
      WHERE ((m.sender_id = $1 AND m.receiver_id = $2) OR (m.sender_id = $2 AND m.receiver_id = $1))
    `;
    const params: any[] = [myId, otherId];

    if (before) {
      query += ` AND m.id < $3 ORDER BY m.created_at DESC LIMIT $4`;
      params.push(before, limit);
    } else {
      query += ` ORDER BY m.created_at DESC LIMIT $3`;
      params.push(limit);
    }

    const result = await pool.query(query, params);
    res.json(result.rows.reverse()); // Return in chronological order
  } catch (err) {
    console.error("Message history error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Send a message (REST fallback — primary path is socket)
router.post("/", authenticate, async (req: Request, res: Response) => {
  try {
    const { receiverId, content } = req.body;
    if (!receiverId || !content) {
      res.status(400).json({ error: "receiverId and content are required" });
      return;
    }

    const result = await pool.query(
      `INSERT INTO messages (sender_id, receiver_id, content)
       VALUES ($1, $2, $3) RETURNING *`,
      [req.user!.userId, receiverId, content]
    );

    const message = result.rows[0];

    const senderResult = await pool.query("SELECT full_name FROM users WHERE id = $1", [req.user!.userId]);
    message.sender_name = senderResult.rows[0].full_name;

    // Emit via socket
    const io = req.app.get("io");
    io.to(`user:${receiverId}`).emit("message:new", message);
    io.to(`user:${req.user!.userId}`).emit("message:new", message);

    res.status(201).json(message);
  } catch (err) {
    console.error("Send message error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Mark messages as read
router.patch("/read/:userId", authenticate, async (req: Request, res: Response) => {
  try {
    const myId = req.user!.userId;
    const senderId = parseInt(req.params.userId as string);

    await pool.query(
      "UPDATE messages SET is_read = TRUE WHERE sender_id = $1 AND receiver_id = $2 AND is_read = FALSE",
      [senderId, myId]
    );

    const io = req.app.get("io");
    io.to(`user:${senderId}`).emit("message:read-ack", { readerId: myId });

    res.json({ message: "Messages marked as read" });
  } catch (err) {
    console.error("Mark read error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
