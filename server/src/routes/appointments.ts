import { Router, Request, Response } from "express";
import pool from "../config/db.js";
import { authenticate, requireRole } from "../middleware/auth.js";
import { sendEmail } from "../services/email.js";

const router = Router();

// Get appointments (owner sees all, client sees own)
router.get("/", authenticate, async (req: Request, res: Response) => {
  try {
    const mode = req.query.mode;
    const testFilter = mode === "test" ? "AND a.is_test_data = TRUE" :
                       mode === "real" ? "AND a.is_test_data = FALSE" : "";

    let result;
    if (req.user!.role === "owner" || req.user!.role === "admin") {
      result = await pool.query(
        `SELECT a.*, u.full_name as client_name, u.email as client_email
         FROM appointments a
         JOIN users u ON u.id = a.client_id
         WHERE 1=1 ${testFilter}
         ORDER BY a.start_time DESC`
      );
    } else {
      result = await pool.query(
        `SELECT a.*, u.full_name as owner_name
         FROM appointments a
         JOIN users u ON u.id = a.owner_id
         WHERE a.client_id = $1 ${testFilter}
         ORDER BY a.start_time DESC`,
        [req.user!.userId]
      );
    }
    res.json(result.rows);
  } catch (err) {
    console.error("Get appointments error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Book an open time slot (auto-confirms)
router.post("/book", authenticate, async (req: Request, res: Response) => {
  try {
    const { startTime, endTime, notes } = req.body;

    // Find the owner
    const ownerResult = await pool.query("SELECT id, email FROM users WHERE role = 'owner' LIMIT 1");
    if (ownerResult.rows.length === 0) {
      res.status(500).json({ error: "No owner configured" });
      return;
    }
    const owner = ownerResult.rows[0];

    // Check for conflicts within a transaction
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const conflicts = await client.query(
        `SELECT id FROM appointments
         WHERE status = 'confirmed' AND start_time < $2 AND end_time > $1`,
        [startTime, endTime]
      );

      if (conflicts.rows.length > 0) {
        await client.query("ROLLBACK");
        res.status(409).json({ error: "Time slot already booked" });
        return;
      }

      const result = await client.query(
        `INSERT INTO appointments (client_id, owner_id, start_time, end_time, status, booking_type, notes)
         VALUES ($1, $2, $3, $4, 'confirmed', 'slot', $5)
         RETURNING *`,
        [req.user!.userId, owner.id, startTime, endTime, notes || null]
      );

      await client.query("COMMIT");

      const appointment = result.rows[0];

      // Notify owner via socket
      const io = req.app.get("io");
      io.to(`user:${owner.id}`).emit("appointment:updated", { appointment });

      // Email owner
      const userResult = await pool.query("SELECT full_name FROM users WHERE id = $1", [req.user!.userId]);
      sendEmail(
        owner.email,
        "New Appointment Booked",
        `<p>${userResult.rows[0].full_name} has booked an appointment for ${new Date(startTime).toLocaleString()}.</p>`
      );

      res.status(201).json(appointment);
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("Book appointment error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Request a custom time (pending)
router.post("/request", authenticate, async (req: Request, res: Response) => {
  try {
    const { startTime, endTime, notes } = req.body;

    const ownerResult = await pool.query("SELECT id, email FROM users WHERE role = 'owner' LIMIT 1");
    if (ownerResult.rows.length === 0) {
      res.status(500).json({ error: "No owner configured" });
      return;
    }
    const owner = ownerResult.rows[0];

    const result = await pool.query(
      `INSERT INTO appointments (client_id, owner_id, start_time, end_time, status, booking_type, notes)
       VALUES ($1, $2, $3, $4, 'pending', 'request', $5)
       RETURNING *`,
      [req.user!.userId, owner.id, startTime, endTime, notes || null]
    );

    const appointment = result.rows[0];

    const io = req.app.get("io");
    io.to(`user:${owner.id}`).emit("appointment:updated", { appointment });

    const userResult = await pool.query("SELECT full_name FROM users WHERE id = $1", [req.user!.userId]);
    sendEmail(
      owner.email,
      "New Appointment Request",
      `<p>${userResult.rows[0].full_name} has requested an appointment for ${new Date(startTime).toLocaleString()}. Please review in your dashboard.</p>`
    );

    res.status(201).json(appointment);
  } catch (err) {
    console.error("Request appointment error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update appointment status (owner only)
router.patch("/:id/status", authenticate, requireRole("owner"), async (req: Request, res: Response) => {
  try {
    const { status, ownerResponse, suggestedTime } = req.body;
    if (!["confirmed", "denied", "completed"].includes(status)) {
      res.status(400).json({ error: "Status must be 'confirmed', 'denied', or 'completed'" });
      return;
    }

    let fee = null;
    let actualDuration = null;
    let insuranceBilled = null;

    // Auto-calculate revenue when completing
    if (status === "completed") {
      const apptResult = await pool.query("SELECT * FROM appointments WHERE id = $1", [req.params.id]);
      if (apptResult.rows.length > 0) {
        const appt = apptResult.rows[0];
        const startMs = new Date(appt.start_time).getTime();
        const endMs = new Date(appt.end_time).getTime();
        actualDuration = Math.round((endMs - startMs) / 60000);

        // Look up rate — first check for a default rate
        const rateResult = await pool.query(
          "SELECT rate_per_hour FROM rate_settings WHERE owner_id = $1 AND is_default = TRUE LIMIT 1",
          [req.user!.userId]
        );
        if (rateResult.rows.length > 0) {
          const hourlyRate = parseFloat(rateResult.rows[0].rate_per_hour);
          fee = ((actualDuration / 60) * hourlyRate).toFixed(2);
        }

        // Get client's insurance provider for billing field
        const clientResult = await pool.query("SELECT insurance_provider FROM users WHERE id = $1", [appt.client_id]);
        if (clientResult.rows[0]?.insurance_provider) {
          insuranceBilled = clientResult.rows[0].insurance_provider;
        }
      }
    }

    const result = await pool.query(
      `UPDATE appointments
       SET status = $1, owner_response = $2, suggested_time = $3,
           fee = COALESCE($5, fee), actual_duration_min = COALESCE($6, actual_duration_min),
           insurance_billed = COALESCE($7, insurance_billed),
           payment_status = CASE WHEN $1 = 'completed' THEN 'pending' ELSE payment_status END,
           updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [status, ownerResponse || null, suggestedTime || null, req.params.id, fee, actualDuration, insuranceBilled]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: "Appointment not found" });
      return;
    }

    const appointment = result.rows[0];

    // Notify client
    const io = req.app.get("io");
    io.to(`user:${appointment.client_id}`).emit("appointment:updated", { appointment });

    const clientResult = await pool.query("SELECT email, full_name FROM users WHERE id = $1", [appointment.client_id]);
    const clientUser = clientResult.rows[0];

    const statusText = status === "confirmed" ? "confirmed" : "declined";
    let emailBody = `<p>Your appointment request for ${new Date(appointment.start_time).toLocaleString()} has been <strong>${statusText}</strong>.</p>`;
    if (ownerResponse) emailBody += `<p>Note from provider: ${ownerResponse}</p>`;
    if (suggestedTime) emailBody += `<p>Suggested alternative time: ${new Date(suggestedTime).toLocaleString()}</p>`;

    sendEmail(clientUser.email, `Appointment ${statusText}`, emailBody);

    res.json(appointment);
  } catch (err) {
    console.error("Update status error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Cancel appointment
router.patch("/:id/cancel", authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const role = req.user!.role;

    const existing = await pool.query("SELECT * FROM appointments WHERE id = $1", [req.params.id]);
    if (existing.rows.length === 0) {
      res.status(404).json({ error: "Appointment not found" });
      return;
    }

    const appt = existing.rows[0];
    if (role !== "owner" && appt.client_id !== userId) {
      res.status(403).json({ error: "Not authorized" });
      return;
    }

    const result = await pool.query(
      "UPDATE appointments SET status = 'cancelled', updated_at = NOW() WHERE id = $1 RETURNING *",
      [req.params.id]
    );

    const appointment = result.rows[0];
    const io = req.app.get("io");

    // Notify the other party
    const notifyUserId = role === "owner" ? appointment.client_id : appointment.owner_id;
    io.to(`user:${notifyUserId}`).emit("appointment:updated", { appointment });

    res.json(appointment);
  } catch (err) {
    console.error("Cancel error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
