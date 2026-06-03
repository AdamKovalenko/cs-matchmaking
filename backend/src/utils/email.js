import nodemailer from "nodemailer";

function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth:
      process.env.SMTP_USER && process.env.SMTP_PASS
        ? {
            user: process.env.SMTP_USER.trim(),
            pass: process.env.SMTP_PASS.replace(/\s/g, "")
          }
        : undefined
  });
}

export async function sendEmail({ to, subject, html }) {
  if (!process.env.SMTP_HOST) {
    console.log(`[email skipped] ${subject} -> ${to}`);
    return;
  }

  await createTransporter().sendMail({
    from: process.env.EMAIL_FROM || "CS Matchmaking <no-reply@example.com>",
    to,
    subject,
    html
  });
}

export function verificationEmail(username, verificationUrl) {
  return `
    <h1>Welcome, ${username}</h1>
    <p>Your CS matchmaking account is ready. Confirm your email to unlock the full experience.</p>
    <p><a href="${verificationUrl}">Verify email</a></p>
  `;
}

export function passwordResetEmail(username, resetUrl) {
  return `
    <h1>Password reset request</h1>
    <p>Hi ${username}, use the secure link below to reset your password. It expires in one hour.</p>
    <p><a href="${resetUrl}">Reset password</a></p>
  `;
}
