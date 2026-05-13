import webpush from "web-push";
import pool from "../config/db.js";

if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    process.env.VAPID_EMAIL || "mailto:Shorecrisis35@gmail.com",
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

export async function sendPushNotification(userId: number, title: string, body: string, url?: string) {
  if (!process.env.VAPID_PUBLIC_KEY) return;

  try {
    const subs = await pool.query(
      "SELECT * FROM push_subscriptions WHERE user_id = $1",
      [userId]
    );

    const payload = JSON.stringify({ title, body, url: url || "/" });

    for (const sub of subs.rows) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          payload
        );
      } catch (err: any) {
        if (err.statusCode === 410) {
          // Subscription expired, remove it
          await pool.query("DELETE FROM push_subscriptions WHERE id = $1", [sub.id]);
        } else {
          console.error("Push notification failed:", err);
        }
      }
    }
  } catch (err) {
    console.error("Push notification error:", err);
  }
}
