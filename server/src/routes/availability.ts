import { Router, Request, Response } from "express";
import pool from "../config/db.js";
import { authenticate, requireRole } from "../middleware/auth.js";

const router = Router();

// Get all availability slots
router.get("/", authenticate, requireRole("owner"), async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      "SELECT * FROM availability_slots WHERE owner_id = $1 ORDER BY day_of_week, start_time",
      [req.user!.userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Get availability error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Create availability slot
router.post("/", authenticate, requireRole("owner"), async (req: Request, res: Response) => {
  try {
    const { dayOfWeek, startTime, endTime, slotDurationMin } = req.body;
    const result = await pool.query(
      `INSERT INTO availability_slots (owner_id, day_of_week, start_time, end_time, slot_duration_min)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (owner_id, day_of_week, start_time)
       DO UPDATE SET end_time = $4, slot_duration_min = $5, is_active = TRUE
       RETURNING *`,
      [req.user!.userId, dayOfWeek, startTime, endTime, slotDurationMin || 60]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Create availability error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Delete availability slot
router.delete("/:id", authenticate, requireRole("owner"), async (req: Request, res: Response) => {
  try {
    await pool.query(
      "DELETE FROM availability_slots WHERE id = $1 AND owner_id = $2",
      [req.params.id, req.user!.userId]
    );
    res.json({ message: "Deleted" });
  } catch (err) {
    console.error("Delete availability error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get open slots for a date (public)
router.get("/open", async (req: Request, res: Response) => {
  try {
    const { date } = req.query;
    if (!date) {
      res.status(400).json({ error: "Date parameter required (YYYY-MM-DD)" });
      return;
    }

    const dateObj = new Date(date as string);
    const dayOfWeek = dateObj.getDay(); // 0=Sun

    // Get availability template for this day
    const slots = await pool.query(
      `SELECT * FROM availability_slots
       WHERE day_of_week = $1 AND is_active = TRUE
       ORDER BY start_time`,
      [dayOfWeek]
    );

    // Get existing confirmed appointments for this date
    const appointments = await pool.query(
      `SELECT start_time, end_time FROM appointments
       WHERE DATE(start_time) = $1 AND status = 'confirmed'`,
      [date]
    );

    const bookedTimes = appointments.rows.map((a: any) => ({
      start: new Date(a.start_time).getTime(),
      end: new Date(a.end_time).getTime(),
    }));

    // Expand slots into individual bookable time blocks
    const openSlots: { start: string; end: string }[] = [];

    for (const slot of slots.rows) {
      const [startH, startM] = slot.start_time.split(":").map(Number);
      const [endH, endM] = slot.end_time.split(":").map(Number);
      const duration = slot.slot_duration_min;

      let current = new Date(date as string);
      current.setHours(startH, startM, 0, 0);

      const endOfSlot = new Date(date as string);
      endOfSlot.setHours(endH, endM, 0, 0);

      while (current.getTime() + duration * 60000 <= endOfSlot.getTime()) {
        const blockEnd = new Date(current.getTime() + duration * 60000);

        // Check if this block overlaps any booked appointment
        const isBooked = bookedTimes.some(
          (b: any) => current.getTime() < b.end && blockEnd.getTime() > b.start
        );

        if (!isBooked) {
          openSlots.push({
            start: current.toISOString(),
            end: blockEnd.toISOString(),
          });
        }

        current = blockEnd;
      }
    }

    res.json(openSlots);
  } catch (err) {
    console.error("Open slots error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
