import { Router, Request, Response } from "express";
import pool from "../config/db.js";
import { sendEmail } from "../services/email.js";

const router = Router();

// Public intake form submission
router.post("/submit", async (req: Request, res: Response) => {
  try {
    const { fullName, diagnosis, dob, insuranceProvider, contactMethod, contactValue, reason } = req.body;

    if (!fullName || !contactMethod || !contactValue) {
      res.status(400).json({ error: "Name and contact information are required" });
      return;
    }

    await pool.query(
      `INSERT INTO contact_submissions (full_name, diagnosis, dob, insurance_provider, contact_method, contact_value, reason)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [fullName, diagnosis || null, dob || null, insuranceProvider || null, contactMethod, contactValue, reason || null]
    );

    // Email the owner
    const ownerResult = await pool.query("SELECT email FROM users WHERE role = 'owner' LIMIT 1");
    if (ownerResult.rows.length > 0) {
      sendEmail(
        ownerResult.rows[0].email,
        "New Contact Form Submission",
        `<h3>New Intake Inquiry</h3>
         <p><strong>Name:</strong> ${fullName}</p>
         ${diagnosis ? `<p><strong>Diagnosis:</strong> ${diagnosis}</p>` : ""}
         ${dob ? `<p><strong>DOB:</strong> ${dob}</p>` : ""}
         ${insuranceProvider ? `<p><strong>Insurance:</strong> ${insuranceProvider}</p>` : ""}
         <p><strong>Contact (${contactMethod}):</strong> ${contactValue}</p>
         ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ""}`
      );
    }

    // Notify owner via socket
    const io = req.app.get("io");
    const ownerUser = await pool.query("SELECT id FROM users WHERE role = 'owner' LIMIT 1");
    if (ownerUser.rows.length > 0) {
      io.to(`user:${ownerUser.rows[0].id}`).emit("contact:new", { fullName, reason });
    }

    res.status(201).json({ message: "Your submission has been received. We will be in touch soon." });
  } catch (err) {
    console.error("Contact submit error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
