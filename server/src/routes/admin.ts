import { Router, Request, Response } from "express";
import bcrypt from "bcrypt";
import pool from "../config/db.js";
import { authenticate, requireRole } from "../middleware/auth.js";

const router = Router();

// Seed test data
router.post("/seed-test-data", authenticate, requireRole("admin"), async (_req: Request, res: Response) => {
  try {
    // Clear existing test data first
    await pool.query("DELETE FROM session_notes WHERE is_test_data = TRUE");
    await pool.query("DELETE FROM clinical_profiles WHERE is_test_data = TRUE");
    await pool.query("DELETE FROM messages WHERE is_test_data = TRUE");
    await pool.query("DELETE FROM appointments WHERE is_test_data = TRUE");
    await pool.query("DELETE FROM contact_submissions WHERE is_test_data = TRUE");
    await pool.query("DELETE FROM users WHERE is_test_data = TRUE");

    const ownerResult = await pool.query("SELECT id FROM users WHERE role = 'owner' LIMIT 1");
    const ownerId = ownerResult.rows[0]?.id;
    if (!ownerId) {
      res.status(500).json({ error: "No owner account found" });
      return;
    }

    const hash = await bcrypt.hash("testpassword123", 10);

    // ── Create test clients ──
    const testClients = [
      { name: "Sarah Johnson", email: "sarah.j@test.com", phone: "704-555-0101", insurance: "Aetna", dob: "1992-03-15" },
      { name: "Marcus Williams", email: "marcus.w@test.com", phone: "704-555-0102", insurance: "BlueCross BlueShield", dob: "1985-07-22" },
      { name: "Aisha Patel", email: "aisha.p@test.com", phone: "704-555-0103", insurance: "Carolina Complete", dob: "1998-11-08" },
      { name: "James Rodriguez", email: "james.r@test.com", phone: "704-555-0104", insurance: "Vaya Health", dob: "1979-01-30" },
      { name: "Keisha Thompson", email: "keisha.t@test.com", phone: "704-555-0105", insurance: "Alliance Health", dob: "2001-06-12" },
      { name: "David Chen", email: "david.c@test.com", phone: "704-555-0106", insurance: "Aetna", dob: "1988-09-25" },
      { name: "Maria Santos", email: "maria.s@test.com", phone: "704-555-0107", insurance: "BlueCross BlueShield", dob: "1995-04-18" },
      { name: "Tyler Brooks", email: "tyler.b@test.com", phone: "704-555-0108", insurance: null, dob: "2003-12-01" },
    ];

    const clientIds: number[] = [];
    for (const tc of testClients) {
      const result = await pool.query(
        `INSERT INTO users (email, password_hash, full_name, phone, insurance_provider, dob, role, is_test_data)
         VALUES ($1, $2, $3, $4, $5, $6, 'client', TRUE) RETURNING id`,
        [tc.email, hash, tc.name, tc.phone, tc.insurance, tc.dob]
      );
      clientIds.push(result.rows[0].id);
    }

    // ── Set up a default rate if none exists ──
    const rateCheck = await pool.query("SELECT id FROM rate_settings WHERE is_default = TRUE LIMIT 1");
    if (rateCheck.rows.length === 0) {
      await pool.query(
        "INSERT INTO rate_settings (owner_id, name, rate_per_hour, is_default) VALUES ($1, 'Standard Session', 150.00, TRUE)",
        [ownerId]
      );
    }

    // ── Create test appointments (past, today, future, various statuses) ──
    const now = new Date();
    const statuses = ["completed", "confirmed", "pending", "cancelled", "completed", "completed", "confirmed", "denied"];
    const appointmentIds: number[] = [];

    for (let i = 0; i < clientIds.length; i++) {
      const clientId = clientIds[i];
      const numAppts = 3 + Math.floor(Math.random() * 5); // 3-7 appointments per client

      for (let j = 0; j < numAppts; j++) {
        const daysOffset = -60 + j * 10 + Math.floor(Math.random() * 5); // spread over past 60 days to future
        const hour = 9 + Math.floor(Math.random() * 8); // 9am-4pm
        const startDate = new Date(now);
        startDate.setDate(startDate.getDate() + daysOffset);
        startDate.setHours(hour, 0, 0, 0);
        const endDate = new Date(startDate);
        endDate.setMinutes(endDate.getMinutes() + 60);

        const status = daysOffset < -5 ? (Math.random() > 0.15 ? "completed" : "cancelled") :
                       daysOffset < 0 ? "completed" :
                       daysOffset === 0 ? "confirmed" :
                       statuses[Math.floor(Math.random() * statuses.length)];

        const fee = status === "completed" ? (150.00).toFixed(2) : null;
        const paymentStatus = status === "completed" ? (Math.random() > 0.3 ? "paid" : "pending") : "pending";
        const insurance = testClients[i].insurance;

        const result = await pool.query(
          `INSERT INTO appointments (client_id, owner_id, start_time, end_time, status, booking_type, fee,
           actual_duration_min, insurance_billed, payment_status, is_test_data, notes)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, TRUE, $11) RETURNING id`,
          [clientId, ownerId, startDate, endDate,
           status, Math.random() > 0.7 ? "request" : "slot",
           fee, status === "completed" ? 60 : null, insurance,
           paymentStatus,
           j === 0 ? "Initial consultation" : null]
        );
        if (status === "completed") {
          appointmentIds.push(result.rows[0].id);
        }
      }
    }

    // ── Create clinical profiles ──
    const diagnoses = [
      { codes: "F41.1", notes: "Generalized Anxiety Disorder — presenting with persistent worry, sleep disruption", goals: "Reduce anxiety symptoms, develop coping strategies, improve sleep hygiene", meds: "Sertraline 50mg daily" },
      { codes: "F32.1, F41.1", notes: "Major Depressive Disorder (moderate) with comorbid anxiety", goals: "Stabilize mood, increase activity engagement, process grief", meds: "Escitalopram 10mg daily, Trazodone 50mg PRN" },
      { codes: "F43.10", notes: "Post-Traumatic Stress Disorder — related to childhood trauma", goals: "Process traumatic memories via EMDR, reduce hypervigilance, build safety", meds: "None currently" },
      { codes: "F31.1", notes: "Bipolar II Disorder — hypomanic episodes with depressive baseline", goals: "Mood stabilization, identify episode triggers, maintain routine", meds: "Lamotrigine 200mg daily" },
      { codes: "F41.0", notes: "Panic Disorder — frequent panic attacks in social settings", goals: "Reduce panic frequency, exposure therapy, cognitive restructuring", meds: "Buspirone 15mg BID" },
      { codes: "F10.20", notes: "Alcohol Use Disorder (moderate) — in early recovery", goals: "Maintain sobriety, address underlying depression, build support network", meds: "Naltrexone 50mg daily" },
      { codes: "F32.0, F51.01", notes: "Mild Depression with Primary Insomnia", goals: "Improve sleep, increase daytime functioning, behavioral activation", meds: "Melatonin 3mg, CBT-I protocol" },
      { codes: "F43.25", notes: "Adjustment Disorder with mixed anxiety and depressed mood — recent divorce", goals: "Process grief, rebuild identity, develop social support", meds: "None" },
    ];

    for (let i = 0; i < clientIds.length; i++) {
      const d = diagnoses[i];
      await pool.query(
        `INSERT INTO clinical_profiles (client_id, diagnosis_codes, diagnosis_notes, treatment_goals, medications, notes, is_test_data)
         VALUES ($1, $2, $3, $4, $5, $6, TRUE)`,
        [clientIds[i], d.codes, d.notes, d.goals, d.meds,
         `Client established ${new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toLocaleDateString()}. ${d.notes}`]
      );
    }

    // ── Create session notes for completed appointments ──
    const sessionNoteTemplates = [
      "Client presented with elevated anxiety today. Discussed triggers and practiced grounding techniques. Assigned breathing exercises for homework.",
      "Good session. Client reports improved sleep since starting sleep hygiene protocol. Mood appears slightly better. Continue current treatment plan.",
      "Explored family dynamics and their impact on current symptoms. Client showed strong emotional awareness. Plan to continue processing in next session.",
      "Client missed medication for 3 days last week — discussed importance of adherence. Adjusted coping strategy to include daily check-ins.",
      "EMDR session — processed target memory from age 12. SUD decreased from 8 to 4. Client tolerated well. Will continue next session.",
      "Client reports increased stress due to work. Reviewed cognitive distortions and challenged catastrophic thinking. Homework: thought record.",
      "Progress review — client has met 2 of 4 treatment goals. Discussed discharge planning timeline. Client expressed readiness to reduce session frequency.",
      "Crisis check-in — client experienced panic episode over weekend. Reviewed safety plan, practiced grounding. Stable at end of session.",
    ];

    for (let i = 0; i < Math.min(appointmentIds.length, 20); i++) {
      const apptId = appointmentIds[i];
      const clientId = clientIds[i % clientIds.length];
      await pool.query(
        `INSERT INTO session_notes (appointment_id, client_id, content, is_test_data)
         VALUES ($1, $2, $3, TRUE)`,
        [apptId, clientId, sessionNoteTemplates[i % sessionNoteTemplates.length]]
      );
    }

    // ── Create test messages — full conversations ──
    const conversations = [
      // Sarah Johnson — active, recent unread
      [
        { from: "client", text: "Hi, I saw your website and I'm interested in scheduling an initial consultation. I've been dealing with a lot of anxiety lately.", read: true, daysAgo: 14 },
        { from: "owner", text: "Hello Sarah! Thank you for reaching out. I'd be happy to meet with you. I have openings this week on Wednesday at 2 PM or Thursday at 10 AM. Would either work?", read: true, daysAgo: 14, minutesLater: 45 },
        { from: "client", text: "Wednesday at 2 PM works perfectly. What should I bring to the first session?", read: true, daysAgo: 14, minutesLater: 90 },
        { from: "owner", text: "Great, you're confirmed for Wednesday at 2 PM. Just bring a valid ID and your insurance card. I'll send over some intake paperwork via email. Looking forward to meeting you!", read: true, daysAgo: 14, minutesLater: 120 },
        { from: "client", text: "Thank you so much for today's session. I already feel a little more hopeful.", read: true, daysAgo: 12 },
        { from: "owner", text: "I'm glad to hear that, Sarah. You did great work today. Remember to try the breathing exercises we discussed — even just 5 minutes a day makes a difference.", read: true, daysAgo: 12, minutesLater: 60 },
        { from: "client", text: "I've been practicing the breathing exercises every morning and I think they're helping. The panic attacks have been less intense.", read: true, daysAgo: 5 },
        { from: "owner", text: "That's wonderful progress! Consistency is key. We'll build on this in our next session. Keep up the great work.", read: true, daysAgo: 5, minutesLater: 30 },
        { from: "client", text: "Hi, I had a rough day at work and I'm feeling really overwhelmed. Is there any way I could get an earlier appointment this week?", read: false, daysAgo: 0, minutesLater: 0 },
      ],
      // Marcus Williams — medication discussion
      [
        { from: "client", text: "Good morning. I wanted to check in about the medication adjustment we discussed last session.", read: true, daysAgo: 10 },
        { from: "owner", text: "Good morning Marcus. How have you been feeling since we adjusted the dosage?", read: true, daysAgo: 10, minutesLater: 25 },
        { from: "client", text: "The first few days were rough — some nausea and headaches. But this past week I've noticed my mood is more stable. Less of those really low dips.", read: true, daysAgo: 10, minutesLater: 60 },
        { from: "owner", text: "Initial side effects are common and usually subside within 1-2 weeks. I'm encouraged that you're already seeing mood improvement. Let's continue monitoring. If the nausea persists, we can discuss alternatives.", read: true, daysAgo: 10, minutesLater: 90 },
        { from: "client", text: "Update: the nausea is completely gone now. Feeling much better overall. Thank you for sticking with me through the adjustment.", read: true, daysAgo: 3 },
        { from: "owner", text: "That's great to hear! Your patience with the process really paid off. See you at your regular appointment next week.", read: true, daysAgo: 3, minutesLater: 40 },
        { from: "client", text: "Quick question — is it okay to take my medication with food? I've been taking it on an empty stomach.", read: false, daysAgo: 0, minutesLater: 0 },
      ],
      // Aisha Patel — trauma processing
      [
        { from: "client", text: "I've been having nightmares again this week. Three nights in a row.", read: true, daysAgo: 8 },
        { from: "owner", text: "I'm sorry to hear that, Aisha. Nightmares can resurface when we're processing difficult material. Are you using the grounding techniques we practiced?", read: true, daysAgo: 8, minutesLater: 20 },
        { from: "client", text: "I tried the 5-4-3-2-1 technique after waking up last night and it helped me calm down enough to fall back asleep. It took about 15 minutes though.", read: true, daysAgo: 8, minutesLater: 55 },
        { from: "owner", text: "That's actually excellent — the fact that you remembered to use it in the moment is a big step. The time it takes will decrease with practice. Would you like to schedule an extra session this week?", read: true, daysAgo: 8, minutesLater: 70 },
        { from: "client", text: "Yes please, that would help. I also wanted to say thank you for creating such a safe space. It makes the hard work feel manageable.", read: true, daysAgo: 7 },
        { from: "owner", text: "Thank you for trusting me with your story, Aisha. Your courage in this process is remarkable. I have Thursday at 3 PM open — does that work?", read: true, daysAgo: 7, minutesLater: 35 },
        { from: "client", text: "Thursday at 3 works. See you then.", read: true, daysAgo: 7, minutesLater: 50 },
      ],
      // James Rodriguez — bipolar management
      [
        { from: "client", text: "I think I might be heading into a hypomanic episode. I've been sleeping less and my thoughts are racing.", read: true, daysAgo: 6 },
        { from: "owner", text: "Thank you for recognizing the signs and reaching out, James. That self-awareness is really important. Can you tell me more about what you're experiencing? How many hours of sleep the last few nights?", read: true, daysAgo: 6, minutesLater: 15 },
        { from: "client", text: "About 4-5 hours each night, but I don't feel tired. I also spent $800 online shopping last night which isn't like me. I know these are warning signs.", read: true, daysAgo: 6, minutesLater: 40 },
        { from: "owner", text: "You're doing the right thing by identifying these patterns. Let's get you in for a session tomorrow so we can review your mood chart and discuss whether a medication adjustment is needed. Can you come at 11 AM?", read: true, daysAgo: 6, minutesLater: 55 },
        { from: "client", text: "11 AM works. I'll bring my mood tracker. Thanks for getting me in so quickly.", read: true, daysAgo: 6, minutesLater: 65 },
        { from: "owner", text: "Of course. In the meantime, try to stick to your sleep schedule even if you don't feel tired. Avoid caffeine after noon. See you tomorrow.", read: true, daysAgo: 6, minutesLater: 80 },
      ],
      // Keisha Thompson — life transitions
      [
        { from: "client", text: "Hi Dr. Miller, I got accepted to the graduate program I applied to! But now I'm feeling anxious about the changes ahead.", read: true, daysAgo: 9 },
        { from: "owner", text: "Congratulations Keisha! That's a huge accomplishment. It's completely normal to feel anxiety alongside excitement — that's your brain processing a big life transition. Let's explore these feelings in our next session.", read: true, daysAgo: 9, minutesLater: 50 },
        { from: "client", text: "Thank you! I keep going back and forth between excited and terrified. My family is proud but I can tell my mom is worried about me moving away.", read: true, daysAgo: 9, minutesLater: 80 },
        { from: "owner", text: "Family dynamics during transitions are something we can definitely work through together. This is great material for our next session. In the meantime, try journaling about what specifically excites you vs. what specifically worries you.", read: true, daysAgo: 9, minutesLater: 110 },
        { from: "client", text: "That journaling exercise was really eye-opening. I realized most of my fears are about the unknown, not about my ability to succeed.", read: true, daysAgo: 4 },
      ],
      // David Chen — addiction recovery
      [
        { from: "client", text: "Today is 90 days sober. Wanted to share that with you.", read: true, daysAgo: 7 },
        { from: "owner", text: "David, that is incredible. 90 days is a major milestone. You should be genuinely proud of the work you've put in. How are you feeling about it?", read: true, daysAgo: 7, minutesLater: 20 },
        { from: "client", text: "Grateful mostly. Some days are still hard. Had a strong craving last weekend at a friend's BBQ but I called my sponsor and got through it.", read: true, daysAgo: 7, minutesLater: 45 },
        { from: "owner", text: "The fact that you had a plan and used it — that's recovery in action. Cravings don't mean you're failing; reaching out means you're succeeding. We'll keep building on these strategies.", read: true, daysAgo: 7, minutesLater: 60 },
        { from: "client", text: "Means a lot coming from you. See you next Tuesday.", read: true, daysAgo: 7, minutesLater: 75 },
      ],
      // Maria Santos — sleep issues
      [
        { from: "client", text: "I tried the sleep restriction protocol this week. It was really hard the first two nights but I'm actually falling asleep faster now.", read: true, daysAgo: 11 },
        { from: "owner", text: "Sleep restriction is tough at first — you did great sticking with it. How many hours are you getting now compared to before?", read: true, daysAgo: 11, minutesLater: 30 },
        { from: "client", text: "Before I was in bed for 9 hours but only sleeping maybe 5. Now I'm in bed for 7 hours and sleeping about 6.5. Way less tossing and turning.", read: true, daysAgo: 11, minutesLater: 65 },
        { from: "owner", text: "That's a huge improvement in sleep efficiency! We can start gradually extending your time in bed by 15 minutes next week. Keep up the sleep diary.", read: true, daysAgo: 11, minutesLater: 80 },
        { from: "client", text: "Will do. Also wanted to ask — are there any supplements you'd recommend alongside the CBT-I work?", read: false, daysAgo: 1 },
      ],
      // Tyler Brooks — adjustment disorder
      [
        { from: "client", text: "The divorce was finalized today. I don't know how to feel.", read: true, daysAgo: 5 },
        { from: "owner", text: "Tyler, there's no right way to feel right now. Give yourself permission to experience whatever comes up — grief, relief, anger, sadness. All of it is valid. Would you like to come in for a session this week?", read: true, daysAgo: 5, minutesLater: 15 },
        { from: "client", text: "Yeah, I think I need to talk through this. I feel strangely numb actually. Like it hasn't hit me yet.", read: true, daysAgo: 5, minutesLater: 35 },
        { from: "owner", text: "Numbness is a very common response to loss — it's your mind's way of protecting you while it processes. That's not avoidance, it's pacing. Let me know what day works for you this week.", read: true, daysAgo: 5, minutesLater: 50 },
        { from: "client", text: "How about Friday afternoon? And thank you for not making me feel like something is wrong with me for not crying.", read: true, daysAgo: 5, minutesLater: 70 },
        { from: "owner", text: "Friday at 2 PM is open. And Tyler — there is nothing wrong with you. You're processing a major life event in your own way and on your own timeline. See you Friday.", read: true, daysAgo: 5, minutesLater: 85 },
      ],
    ];

    let totalMessages = 0;
    for (let i = 0; i < clientIds.length; i++) {
      const clientId = clientIds[i];
      const convo = conversations[i % conversations.length];

      for (const msg of convo) {
        const senderId = msg.from === "client" ? clientId : ownerId;
        const receiverId = msg.from === "client" ? ownerId : clientId;
        const baseTime = new Date(now.getTime() - (msg.daysAgo || 0) * 24 * 60 * 60 * 1000);
        if (msg.minutesLater) {
          baseTime.setMinutes(baseTime.getMinutes() + msg.minutesLater);
        }

        await pool.query(
          "INSERT INTO messages (sender_id, receiver_id, content, is_read, is_test_data, created_at) VALUES ($1, $2, $3, $4, TRUE, $5)",
          [senderId, receiverId, msg.text, msg.read, baseTime]
        );
        totalMessages++;
      }
    }

    // ── Create contact form submissions ──
    const contactData = [
      { name: "Alex Rivera", diagnosis: "Anxiety and depression", insurance: "Aetna", method: "phone", value: "704-555-0201", reason: "Looking for a new therapist after relocating to Charlotte" },
      { name: "Jordan Lee", diagnosis: "PTSD", insurance: "BlueCross BlueShield", method: "email", value: "jordan.l@example.com", reason: "Referred by my primary care doctor for trauma therapy" },
      { name: "Pat Morrison", diagnosis: "Bipolar disorder", insurance: "None", method: "phone", value: "704-555-0203", reason: "Need help managing mood swings, not currently in treatment" },
    ];

    for (const c of contactData) {
      await pool.query(
        `INSERT INTO contact_submissions (full_name, diagnosis, insurance_provider, contact_method, contact_value, reason, is_test_data)
         VALUES ($1, $2, $3, $4, $5, $6, TRUE)`,
        [c.name, c.diagnosis, c.insurance, c.method, c.value, c.reason]
      );
    }

    res.json({
      message: "Test data seeded successfully",
      stats: {
        clients: clientIds.length,
        appointments: appointmentIds.length + (clientIds.length * 3),
        sessionNotes: Math.min(appointmentIds.length, 20),
        messages: totalMessages,
        contactSubmissions: contactData.length,
      },
    });
  } catch (err) {
    console.error("Seed test data error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Clear test data
router.delete("/test-data", authenticate, requireRole("admin"), async (_req: Request, res: Response) => {
  try {
    await pool.query("DELETE FROM session_notes WHERE is_test_data = TRUE");
    await pool.query("DELETE FROM clinical_profiles WHERE is_test_data = TRUE");
    await pool.query("DELETE FROM messages WHERE is_test_data = TRUE");
    await pool.query("DELETE FROM appointments WHERE is_test_data = TRUE");
    await pool.query("DELETE FROM contact_submissions WHERE is_test_data = TRUE");
    await pool.query("DELETE FROM users WHERE is_test_data = TRUE");
    res.json({ message: "Test data cleared" });
  } catch (err) {
    console.error("Clear test data error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get test mode status — check if test data exists
router.get("/test-status", authenticate, requireRole("admin", "owner"), async (_req: Request, res: Response) => {
  try {
    const testUsers = await pool.query("SELECT COUNT(*) FROM users WHERE is_test_data = TRUE");
    const testAppts = await pool.query("SELECT COUNT(*) FROM appointments WHERE is_test_data = TRUE");
    res.json({
      hasTestData: parseInt(testUsers.rows[0].count) > 0,
      testUserCount: parseInt(testUsers.rows[0].count),
      testAppointmentCount: parseInt(testAppts.rows[0].count),
    });
  } catch (err) {
    console.error("Test status error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
