import { Router, Request, Response } from "express";
import pool from "../config/db.js";
import { authenticate, requireRole } from "../middleware/auth.js";

const router = Router();

// Helper to build test mode filter
function testFilter(queryParam: string | undefined, alias: string = ""): string {
  const prefix = alias ? `${alias}.` : "";
  if (queryParam === "test") return `AND ${prefix}is_test_data = TRUE`;
  if (queryParam === "real") return `AND ${prefix}is_test_data = FALSE`;
  return ""; // "all" — no filter
}

function getMode(req: Request): string | undefined {
  const raw = req.query.mode;
  return typeof raw === "string" ? raw : undefined;
}

// Appointment analytics
router.get("/appointments", authenticate, requireRole("owner", "admin"), async (req: Request, res: Response) => {
  try {
    const mode = getMode(req);
    const f = testFilter(mode);

    const totals = await pool.query(`
      SELECT
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
        COUNT(CASE WHEN status = 'denied' THEN 1 END) as denied,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled
      FROM appointments WHERE 1=1 ${f}
    `);

    const monthly = await pool.query(`
      SELECT
        TO_CHAR(DATE_TRUNC('month', start_time), 'YYYY-MM') as month,
        COUNT(*) as total,
        COUNT(CASE WHEN status IN ('confirmed','completed') THEN 1 END) as confirmed
      FROM appointments
      WHERE start_time >= NOW() - INTERVAL '12 months' ${f}
      GROUP BY DATE_TRUNC('month', start_time)
      ORDER BY month
    `);

    const byDay = await pool.query(`
      SELECT
        EXTRACT(DOW FROM start_time) as day_of_week,
        COUNT(*) as count
      FROM appointments WHERE status IN ('confirmed','completed') ${f}
      GROUP BY EXTRACT(DOW FROM start_time)
      ORDER BY count DESC
    `);

    const byHour = await pool.query(`
      SELECT
        EXTRACT(HOUR FROM start_time) as hour,
        COUNT(*) as count
      FROM appointments WHERE status IN ('confirmed','completed') ${f}
      GROUP BY EXTRACT(HOUR FROM start_time)
      ORDER BY count DESC
    `);

    const today = await pool.query(`
      SELECT COUNT(*) as count
      FROM appointments
      WHERE DATE(start_time) = CURRENT_DATE AND status IN ('confirmed','completed') ${f}
    `);

    const thisWeek = await pool.query(`
      SELECT COUNT(*) as count
      FROM appointments
      WHERE start_time >= DATE_TRUNC('week', NOW())
        AND start_time < DATE_TRUNC('week', NOW()) + INTERVAL '7 days'
        AND status IN ('confirmed','completed') ${f}
    `);

    res.json({
      totals: totals.rows[0],
      monthly: monthly.rows,
      byDayOfWeek: byDay.rows,
      byHour: byHour.rows,
      today: today.rows[0].count,
      thisWeek: thisWeek.rows[0].count,
    });
  } catch (err) {
    console.error("Appointment report error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Client activity report
router.get("/clients", authenticate, requireRole("owner", "admin"), async (req: Request, res: Response) => {
  try {
    const mode = getMode(req);
    const uf = testFilter(mode, "u");

    const result = await pool.query(`
      SELECT
        u.id, u.full_name, u.email, u.phone, u.insurance_provider, u.created_at as member_since,
        COUNT(DISTINCT a.id) as total_appointments,
        COUNT(DISTINCT CASE WHEN a.status IN ('confirmed','completed') THEN a.id END) as confirmed,
        COUNT(DISTINCT CASE WHEN a.status = 'cancelled' THEN a.id END) as cancelled,
        COUNT(DISTINCT CASE WHEN a.status = 'denied' THEN a.id END) as no_shows,
        MIN(a.start_time) as first_visit,
        MAX(a.start_time) as last_visit,
        COUNT(DISTINCT m.id) as total_messages,
        COALESCE(SUM(DISTINCT a.fee), 0) as total_fees
      FROM users u
      LEFT JOIN appointments a ON a.client_id = u.id
      LEFT JOIN messages m ON (m.sender_id = u.id OR m.receiver_id = u.id)
      WHERE u.role = 'client' ${uf}
      GROUP BY u.id
      ORDER BY u.full_name
    `);

    res.json(result.rows);
  } catch (err) {
    console.error("Client report error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Revenue / billing report
router.get("/revenue", authenticate, requireRole("owner", "admin"), async (req: Request, res: Response) => {
  try {
    const mode = getMode(req);
    const f = testFilter(mode);

    const totals = await pool.query(`
      SELECT
        COALESCE(SUM(fee), 0) as total_revenue,
        COUNT(CASE WHEN payment_status = 'paid' THEN 1 END) as paid_count,
        COUNT(CASE WHEN payment_status = 'pending' THEN 1 END) as pending_count,
        COALESCE(SUM(CASE WHEN payment_status = 'paid' THEN fee END), 0) as paid_revenue,
        COALESCE(SUM(CASE WHEN payment_status = 'pending' THEN fee END), 0) as pending_revenue
      FROM appointments
      WHERE fee IS NOT NULL ${f}
    `);

    const monthly = await pool.query(`
      SELECT
        TO_CHAR(DATE_TRUNC('month', start_time), 'YYYY-MM') as month,
        COALESCE(SUM(fee), 0) as revenue,
        COUNT(*) as appointment_count
      FROM appointments
      WHERE fee IS NOT NULL AND start_time >= NOW() - INTERVAL '12 months' ${f}
      GROUP BY DATE_TRUNC('month', start_time)
      ORDER BY month
    `);

    const byInsurance = await pool.query(`
      SELECT
        COALESCE(insurance_billed, 'Self-Pay') as provider,
        COALESCE(SUM(fee), 0) as revenue,
        COUNT(*) as count
      FROM appointments
      WHERE fee IS NOT NULL ${f}
      GROUP BY insurance_billed
      ORDER BY revenue DESC
    `);

    res.json({
      totals: totals.rows[0],
      monthly: monthly.rows,
      byInsurance: byInsurance.rows,
    });
  } catch (err) {
    console.error("Revenue report error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
