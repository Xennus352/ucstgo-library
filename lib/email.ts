import nodemailer from "nodemailer";

function getTransporter() {
  const host = process.env.SMTP_HOST;
  if (!host) return null;

  return nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER || "",
      pass: process.env.SMTP_PASS || "",
    },
  });
}

export async function sendEmail(options: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}) {
  const transporter = getTransporter();
  if (!transporter) {
    console.log(`[email] SMTP not configured. Skipping email to ${options.to}`);
    console.log(`[email] Subject: ${options.subject}`);
    console.log(`[email] Body: ${options.text}`);
    return;
  }

  await transporter.sendMail({
    from: process.env.SMTP_FROM || "noreply@ucstgo.edu.mm",
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html || options.text,
  });
}
