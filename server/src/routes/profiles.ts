import { Router, Request, Response } from "express";
import pool from "../config/db.js";
import { authenticate, requireRole } from "../middleware/auth.js";

const router = Router();

// Get client profile — owner sees any, client sees own
router.get("/:userId", authenticate, async (req: Request, res: Response) => {
  try {
    const targetId = parseInt(req.params.userId as string);

    // Clients can only view their own profile
    if (req.user!.role === "client" && req.user!.userId !== targetId) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    const userResult = await pool.query(
      `SELECT id, email, full_name, phone, dob, emergency_contact_name, emergency_contact_phone,
              insurance_provider, address, role, created_at
       FROM users WHERE id = $1`,
      [targetId]
    );

    if (userResult.rows.length === 0) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const profile: any = { ...userResult.rows[0] };

    // Owner gets clinical data too
    if (req.user!.role === "owner") {
      const clinicalResult = await pool.query(
        "SELECT * FROM clinical_profiles WHERE client_id = $1",
        [targetId]
      );
      profile.clinical = clinicalResult.rows[0] || null;

      const notesResult = await pool.query(
        `SELECT sn.*, a.start_time, a.end_time
         FROM session_notes sn
         JOIN appointments a ON a.id = sn.appointment_id
         WHERE sn.client_id = $1
         ORDER BY a.start_time DESC`,
        [targetId]
      );
      profile.sessionNotes = notesResult.rows;

      const filesResult = await pool.query(
        "SELECT id, filename, file_type, file_size, created_at FROM client_files WHERE client_id = $1 ORDER BY created_at DESC",
        [targetId]
      );
      profile.files = filesResult.rows;

      // Appointment history
      const apptResult = await pool.query(
        `SELECT id, start_time, end_time, status, booking_type, fee, insurance_billed, payment_status, notes
         FROM appointments WHERE client_id = $1 ORDER BY start_time DESC`,
        [targetId]
      );
      profile.appointments = apptResult.rows;

      // Message history with this client
      const messagesResult = await pool.query(
        `SELECT m.*, u.full_name as sender_name
         FROM messages m
         JOIN users u ON u.id = m.sender_id
         WHERE (m.sender_id = $1 OR m.receiver_id = $1)
           AND (m.sender_id = $2 OR m.receiver_id = $2)
         ORDER BY m.created_at DESC
         LIMIT 50`,
        [targetId, req.user!.userId]
      );
      profile.messages = messagesResult.rows.reverse();
    }

    // Client viewing their own profile — include their messages with the owner
    if (req.user!.role === "client" && req.user!.userId === targetId) {
      const ownerResult = await pool.query("SELECT id FROM users WHERE role = 'owner' LIMIT 1");
      if (ownerResult.rows.length > 0) {
        const ownerId = ownerResult.rows[0].id;
        const messagesResult = await pool.query(
          `SELECT m.*, u.full_name as sender_name
           FROM messages m
           JOIN users u ON u.id = m.sender_id
           WHERE (m.sender_id = $1 AND m.receiver_id = $2)
              OR (m.sender_id = $2 AND m.receiver_id = $1)
           ORDER BY m.created_at DESC
           LIMIT 50`,
          [targetId, ownerId]
        );
        profile.messages = messagesResult.rows.reverse();
      }
    }

    res.json(profile);
  } catch (err) {
    console.error("Get profile error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update basic profile — client updates own, owner updates any
router.patch("/:userId", authenticate, async (req: Request, res: Response) => {
  try {
    const targetId = parseInt(req.params.userId as string);
    if (req.user!.role === "client" && req.user!.userId !== targetId) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    const { fullName, phone, dob, emergencyContactName, emergencyContactPhone, insuranceProvider, address } = req.body;

    await pool.query(
      `UPDATE users SET
        full_name = COALESCE($1, full_name),
        phone = COALESCE($2, phone),
        dob = COALESCE($3, dob),
        emergency_contact_name = COALESCE($4, emergency_contact_name),
        emergency_contact_phone = COALESCE($5, emergency_contact_phone),
        insurance_provider = COALESCE($6, insurance_provider),
        address = COALESCE($7, address)
       WHERE id = $8`,
      [fullName, phone, dob, emergencyContactName, emergencyContactPhone, insuranceProvider, address, targetId]
    );

    res.json({ message: "Profile updated" });
  } catch (err) {
    console.error("Update profile error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get all clients (owner only) — for client list / reports
router.get("/", authenticate, requireRole("owner"), async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.email, u.full_name, u.phone, u.insurance_provider, u.created_at,
              COUNT(a.id) as total_appointments,
              COUNT(CASE WHEN a.status = 'confirmed' THEN 1 END) as confirmed_appointments,
              MAX(a.start_time) as last_appointment,
              MIN(a.start_time) as first_appointment
       FROM users u
       LEFT JOIN appointments a ON a.client_id = u.id
       WHERE u.role = 'client'
       GROUP BY u.id
       ORDER BY u.full_name`,
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Get clients error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Clinical profile (owner only) ──

// Update/create clinical profile
router.put("/:userId/clinical", authenticate, requireRole("owner"), async (req: Request, res: Response) => {
  try {
    const clientId = parseInt(req.params.userId as string);
    const { diagnosisCodes, diagnosisNotes, treatmentGoals, medications, notes } = req.body;

    await pool.query(
      `INSERT INTO clinical_profiles (client_id, diagnosis_codes, diagnosis_notes, treatment_goals, medications, notes)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (client_id)
       DO UPDATE SET diagnosis_codes = $2, diagnosis_notes = $3, treatment_goals = $4,
                     medications = $5, notes = $6, updated_at = NOW()`,
      [clientId, diagnosisCodes, diagnosisNotes, treatmentGoals, medications, notes]
    );

    res.json({ message: "Clinical profile updated" });
  } catch (err) {
    console.error("Update clinical error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Session notes (owner only) ──

router.post("/:userId/session-notes", authenticate, requireRole("owner"), async (req: Request, res: Response) => {
  try {
    const clientId = parseInt(req.params.userId as string);
    const { appointmentId, content } = req.body;

    const result = await pool.query(
      `INSERT INTO session_notes (appointment_id, client_id, content)
       VALUES ($1, $2, $3) RETURNING *`,
      [appointmentId, clientId, content]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Add session note error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/session-notes/:noteId", authenticate, requireRole("owner"), async (req: Request, res: Response) => {
  try {
    const { content } = req.body;
    await pool.query(
      "UPDATE session_notes SET content = $1, updated_at = NOW() WHERE id = $2",
      [content, req.params.noteId]
    );
    res.json({ message: "Note updated" });
  } catch (err) {
    console.error("Update session note error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Appointment billing (owner only) ──

router.patch("/appointments/:apptId/billing", authenticate, requireRole("owner"), async (req: Request, res: Response) => {
  try {
    const { fee, insuranceBilled, paymentStatus } = req.body;
    await pool.query(
      `UPDATE appointments SET fee = COALESCE($1, fee), insurance_billed = COALESCE($2, insurance_billed),
       payment_status = COALESCE($3, payment_status), updated_at = NOW()
       WHERE id = $4`,
      [fee, insuranceBilled, paymentStatus, req.params.apptId]
    );
    res.json({ message: "Billing updated" });
  } catch (err) {
    console.error("Update billing error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
