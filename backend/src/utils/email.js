/**
 * Email utility — production-ready Nodemailer integration.
 *
 * - Uses Gmail SMTP (or any SMTP) via env vars.
 * - Falls back to Ethereal in development (preview URL logged to console).
 * - Never crashes the application on failure.
 * - Supports retry on transient errors.
 */
const nodemailer = require("nodemailer");
const logger = require("../config/logger");

let _transporter = null;

async function getTransporter() {
  if (_transporter) return _transporter;

  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    _transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: { rejectUnauthorized: false }, // allow self-signed certs
      pool: true,
      maxConnections: 5,
    });
    logger.info("Email transport configured", { host: process.env.SMTP_HOST });
    return _transporter;
  }

  // Dev fallback — Ethereal fake SMTP
  const testAccount = await nodemailer.createTestAccount();
  _transporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    auth: { user: testAccount.user, pass: testAccount.pass },
  });
  logger.info("Using Ethereal dev email", { user: testAccount.user });
  return _transporter;
}

// ── Base HTML template ────────────────────────────────────────────────────
function htmlTemplate(title, bodyHtml) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title>
<style>
  body{font-family:Inter,system-ui,sans-serif;background:#f8fafc;margin:0;padding:20px}
  .container{max-width:560px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08)}
  .header{background:linear-gradient(135deg,#4f46e5,#8b5cf6);padding:32px 40px;text-align:center}
  .header h1{color:#fff;margin:0;font-size:24px;font-weight:700}
  .header p{color:rgba(255,255,255,.8);margin:6px 0 0;font-size:14px}
  .body{padding:32px 40px}
  .btn{display:inline-block;padding:14px 28px;background:linear-gradient(135deg,#4f46e5,#8b5cf6);color:#fff;text-decoration:none;border-radius:10px;font-weight:600;font-size:15px;margin:20px 0}
  .footer{background:#f1f5f9;padding:20px 40px;text-align:center;font-size:12px;color:#94a3b8}
  p{color:#475569;line-height:1.7;margin:0 0 16px}
  .badge{display:inline-block;padding:4px 12px;background:#eef2ff;color:#4f46e5;border-radius:20px;font-size:12px;font-weight:600}
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <h1>🎓 LearnDev</h1>
    <p>Your learning journey, elevated</p>
  </div>
  <div class="body">${bodyHtml}</div>
  <div class="footer">
    <p>© ${new Date().getFullYear()} LearnDev · You received this because you have an account with us.</p>
    <p>If you didn't request this, you can safely ignore this email.</p>
  </div>
</div>
</body>
</html>`;
}

// ── Send email (with retry) ───────────────────────────────────────────────
async function sendEmail({ to, subject, html }, retries = 2) {
  for (let attempt = 1; attempt <= retries + 1; attempt++) {
    try {
      const transporter = await getTransporter();
      const from = process.env.EMAIL_FROM || "LearnDev <noreply@learndev.io>";
      const info = await transporter.sendMail({ from, to, subject, html });

      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        logger.info("📧 Email preview (Ethereal)", { to, subject, url: previewUrl });
      } else {
        logger.info("Email sent", { to, subject, messageId: info.messageId });
      }
      return true;
    } catch (err) {
      if (attempt <= retries) {
        logger.warn(`Email attempt ${attempt} failed, retrying…`, { error: err.message });
        await new Promise((r) => setTimeout(r, 1000 * attempt));
        _transporter = null; // reset transport so next attempt creates a fresh one
      } else {
        logger.error("Email send failed after retries", { to, subject, error: err.message });
        // NEVER throw — email failure must not crash the API
      }
    }
  }
  return false;
}

// ── Pre-built email templates ─────────────────────────────────────────────

exports.sendWelcomeEmail = ({ to, name }) =>
  sendEmail({
    to,
    subject: "Welcome to LearnDev! 🎉",
    html: htmlTemplate("Welcome to LearnDev", `
      <h2 style="color:#1e293b;margin:0 0 16px">Welcome aboard, ${name}! 👋</h2>
      <p>You've just joined thousands of learners building real skills on LearnDev.</p>
      <p>Start your journey by exploring our course catalog:</p>
      <a href="${process.env.CLIENT_URL || "http://localhost:3000"}/courses" class="btn">Browse Courses →</a>
      <p>Happy learning! 🚀</p>
    `),
  });

exports.sendVerificationEmail = ({ to, name, verifyUrl }) =>
  sendEmail({
    to,
    subject: "Verify your LearnDev email",
    html: htmlTemplate("Verify Email", `
      <h2 style="color:#1e293b;margin:0 0 16px">Hi ${name}, please verify your email</h2>
      <p>Click the button below to activate your account. This link expires in <strong>24 hours</strong>.</p>
      <a href="${verifyUrl}" class="btn">Verify Email Address</a>
      <p>Or copy this link into your browser:</p>
      <p style="word-break:break-all;font-size:12px;color:#94a3b8">${verifyUrl}</p>
    `),
  });

exports.sendPasswordResetEmail = ({ to, name, resetUrl }) =>
  sendEmail({
    to,
    subject: "Reset your LearnDev password",
    html: htmlTemplate("Password Reset", `
      <h2 style="color:#1e293b;margin:0 0 16px">Password reset request</h2>
      <p>Hi ${name}, we received a request to reset your password. Click below (valid for <strong>10 minutes</strong>):</p>
      <a href="${resetUrl}" class="btn">Reset Password</a>
      <p>If you didn't request this, no action is required. Your password remains unchanged.</p>
    `),
  });

exports.sendCertificateEmail = ({ to, name, courseTitle, verificationCode }) =>
  sendEmail({
    to,
    subject: `🎓 Certificate of Completion — ${courseTitle}`,
    html: htmlTemplate("Certificate of Completion", `
      <h2 style="color:#1e293b;margin:0 0 16px">Congratulations, ${name}! 🎉</h2>
      <p>You have successfully completed <strong>${courseTitle}</strong>.</p>
      <p>Your certificate has been issued with verification code:</p>
      <p><span class="badge">${verificationCode}</span></p>
      <a href="${process.env.CLIENT_URL || "http://localhost:3000"}/dashboard" class="btn">View Certificate →</a>
      <p>Keep up the great work! Your next course awaits.</p>
    `),
  });

exports.sendComplaintUpdateEmail = ({ to, name, subject: ticketSubject, status }) =>
  sendEmail({
    to,
    subject: `Support ticket update: ${ticketSubject}`,
    html: htmlTemplate("Support Ticket Update", `
      <h2 style="color:#1e293b;margin:0 0 16px">Ticket status updated</h2>
      <p>Hi ${name}, your support ticket <strong>"${ticketSubject}"</strong> has been updated.</p>
      <p>New status: <span class="badge">${status.replace("_", " ")}</span></p>
      <a href="${process.env.CLIENT_URL || "http://localhost:3000"}/support" class="btn">View Ticket →</a>
    `),
  });

exports.sendNotificationEmail = ({ to, name, title, message }) =>
  sendEmail({
    to,
    subject: title,
    html: htmlTemplate(title, `
      <h2 style="color:#1e293b;margin:0 0 16px">${title}</h2>
      <p>Hi ${name},</p>
      <p>${message}</p>
      <a href="${process.env.CLIENT_URL || "http://localhost:3000"}/dashboard" class="btn">Go to Dashboard →</a>
    `),
  });

// ── Generic send (backward compat with existing calls) ────────────────────
exports.sendEmail = ({ to, subject, html }) => sendEmail({ to, subject, html });
