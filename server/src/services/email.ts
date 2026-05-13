import nodemailer from "nodemailer";

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.ethereal.email",
      port: parseInt(process.env.SMTP_PORT || "587"),
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return transporter;
}

export function sendEmail(to: string, subject: string, html: string) {
  // Fire and forget — don't block the request
  const t = getTransporter();
  t.sendMail({
    from: process.env.EMAIL_FROM || "noreply@shorecrisis.com",
    to,
    subject: `Shore Crisis Management — ${subject}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #3A7CB8; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">Shore Crisis Management</h1>
          <p style="color: #C49A4A; margin: 5px 0 0;">Helping You Weather the Waves of Life</p>
        </div>
        <div style="padding: 20px; background: #F0F6FA;">
          ${html}
        </div>
        <div style="padding: 15px; text-align: center; color: #475569; font-size: 12px;">
          <p>227 W 4th St, Suite LL102, Charlotte, NC 28202</p>
        </div>
      </div>
    `,
  }).catch((err) => {
    console.error("Email send failed:", err);
  });
}
